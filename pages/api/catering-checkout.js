import { fetchMenu } from '../../lib/square';
import {
  splitCateringMenu,
  priceCateringOrder,
  dollarsToCents,
  formatMoney,
  CATERING,
} from '../../lib/catering';

const SQUARE_VERSION = '2024-08-21';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    kind,
    itemId,
    headcount,
    deliveryMethod,
    address,
    eventDate,
    eventTime,
    customer = {},
    dietary,
    notes,
    timingNote,
  } = req.body || {};

  if (kind !== 'platters' && kind !== 'kids') {
    return res.status(400).json({ error: 'Unknown catering type' });
  }
  if (!customer.name || !customer.email) {
    return res.status(422).json({ error: 'Name and email are required.' });
  }

  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const environment = process.env.SQUARE_ENVIRONMENT || 'production';
  if (!token || !locationId) {
    // Pages fall back to an emailed enquiry when this happens.
    return res.status(503).json({ error: 'Online catering payment is not set up yet.' });
  }

  // Authoritative price straight from the Square catalog.
  const { categories } = await fetchMenu();
  const groups = splitCateringMenu(categories);
  const list = kind === 'kids' ? groups.kids : groups.platters;
  const item = list.find((i) => i.id === itemId);
  if (!item) {
    return res.status(422).json({ error: 'That package is no longer available — please reselect.' });
  }
  const unitPriceCents = dollarsToCents(item.price);

  let quote;
  try {
    quote = priceCateringOrder({ unitPriceCents, headcount, kind, deliveryMethod });
  } catch (err) {
    return res.status(422).json({ error: err.message });
  }

  const isKids = kind === 'kids';
  const ref =
    'CAT-' +
    String(eventDate || '').replace(/-/g, '').slice(2) +
    '-' +
    Math.random().toString(36).slice(2, 6).toUpperCase();

  // Ad-hoc line items so the charged amount is fully controlled server-side.
  const lineItems = [];
  if (isKids) {
    lineItems.push({
      name: `${item.name} — ${quote.heads} children`,
      quantity: '1',
      base_price_money: { amount: quote.foodCents, currency: 'AUD' },
    });
    if (quote.deliveryCents > 0) {
      lineItems.push({
        name: 'Delivery',
        quantity: '1',
        base_price_money: { amount: quote.deliveryCents, currency: 'AUD' },
      });
    }
  } else {
    lineItems.push({
      name:
        `${item.name} deposit — ${CATERING.depositPercent}% of ` +
        `${formatMoney(quote.orderTotalCents)} (${quote.heads} guests` +
        `${quote.deliveryCents > 0 ? ' incl. delivery' : ''}) — ${ref}`,
      quantity: '1',
      base_price_money: { amount: quote.chargeCents, currency: 'AUD' },
    });
  }

  const noteParts = [
    ref,
    `${eventDate || '?'} ${eventTime || ''}`.trim(),
    deliveryMethod === 'Delivery' ? `Deliver: ${address || '(address to follow)'}` : 'Pickup',
    `${item.name} x ${quote.heads}`,
    customer.name,
    customer.org,
    customer.phone,
    timingNote ? `Timing: ${timingNote}` : '',
    dietary ? `Dietary: ${dietary}` : '',
    notes ? `Notes: ${notes}` : '',
    isKids
      ? `Paid in full ${formatMoney(quote.orderTotalCents)}`
      : `Order ${formatMoney(quote.orderTotalCents)} — deposit ${formatMoney(quote.chargeCents)}, ` +
        `balance ${formatMoney(quote.orderTotalCents - quote.chargeCents)} on invoice`,
  ].filter(Boolean);
  const note = noteParts.join(' | ').slice(0, 500);

  const origin = req.headers.origin || `https://${req.headers.host}`;
  const baseUrl =
    environment === 'sandbox'
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com';

  try {
    const response = await fetch(`${baseUrl}/v2/online-checkout/payment-links`, {
      method: 'POST',
      headers: {
        'Square-Version': SQUARE_VERSION,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idempotency_key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        order: {
          location_id: locationId,
          reference_id: ref,
          line_items: lineItems,
          note,
          metadata: {
            ref,
            kind,
            event_date: String(eventDate || ''),
            event_time: String(eventTime || ''),
            method: String(deliveryMethod || ''),
            headcount: String(quote.heads),
            order_total_aud: (quote.orderTotalCents / 100).toFixed(2),
            charge_aud: (quote.chargeCents / 100).toFixed(2),
          },
        },
        checkout_options: {
          redirect_url: `${origin}/catering-confirmed?ref=${encodeURIComponent(ref)}`,
          merchant_support_email: CATERING.contactEmail,
          ask_for_shipping_address: false,
        },
        pre_populated_data: {
          buyer_email: customer.email,
          buyer_phone_number: customer.phone || undefined,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.payment_link?.url) {
      console.error('Square catering checkout error:', JSON.stringify(data));
      return res.status(502).json({ error: 'Could not start checkout' });
    }

    // Best-effort internal copy with the full details (Square's note is capped).
    notifyKitchen({ ref, note, quote, item, customer, kind }).catch((err) =>
      console.error('Catering notify failed:', err.message),
    );

    return res.status(200).json({
      url: data.payment_link.url,
      ref,
      chargeAud: (quote.chargeCents / 100).toFixed(2),
      orderTotalAud: (quote.orderTotalCents / 100).toFixed(2),
    });
  } catch (err) {
    console.error('Catering checkout request failed:', err.message);
    return res.status(500).json({ error: 'Checkout request failed' });
  }
}

async function notifyKitchen({ ref, note, quote, item, customer, kind }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_FROM_EMAIL;
  const to = process.env.ORDER_NOTIFY_EMAIL || CATERING.contactEmail;
  if (!key || !from) return;

  const text = [
    `Catering order ${ref} — customer sent to Square checkout.`,
    `(PENDING until Square confirms the payment.)`,
    '',
    `${kind === 'kids' ? 'Kids & camps' : 'Catering'}: ${item.name} x ${quote.heads}`,
    `Order total: ${formatMoney(quote.orderTotalCents)}`,
    `Collecting now: ${formatMoney(quote.chargeCents)}`,
    '',
    note.replace(/ \| /g, '\n'),
    '',
    `Contact: ${customer.name} — ${customer.email}${customer.phone ? ' — ' + customer.phone : ''}`,
  ].join('\n');

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to,
      reply_to: customer.email,
      subject: `New catering order ${ref}`,
      text,
    }),
  });
}
