import crypto from 'node:crypto';
import { sendOrderEmail, emailConfigured } from '../../lib/email';

// Square calls this when something happens in your account. We only act on a
// completed payment for a catering order (reference starting "CAT-"), and
// email you the invoice (Catering) or receipt (Kids Catering) at that moment —
// so you're only emailed for orders that were actually paid.
//
// Needs SQUARE_WEBHOOK_SIGNATURE_KEY in Vercel (the key Square gives you for
// the webhook subscription). Without it every request is rejected.

// Signature checking needs the exact raw bytes Square sent.
export const config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// Square signs: HMAC-SHA256(key, notificationUrl + rawBody), base64.
function signatureValid({ key, url, rawBody, header }) {
  if (!key || !header) return false;
  const expected = crypto.createHmac('sha256', key).update(url + rawBody).digest('base64');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(header));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const money = (cents) => `$${((Number(cents) || 0) / 100).toFixed(2)}`;

async function fetchOrder(orderId) {
  const base =
    (process.env.SQUARE_ENVIRONMENT || 'production') === 'sandbox'
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com';
  const res = await fetch(`${base}/v2/orders/${encodeURIComponent(orderId)}`, {
    headers: {
      'Square-Version': '2024-08-21',
      Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
    },
  });
  if (!res.ok) throw new Error(`Square order lookup ${res.status}`);
  return (await res.json()).order;
}

function buildEmail({ order, payment }) {
  const meta = order.metadata || {};
  const isKids = meta.kind === 'kids';
  const ref = order.reference_id;
  const paid = payment.amount_money?.amount;
  const orderTotal = Math.round(parseFloat(meta.order_total_aud || '0') * 100) || paid;
  const balance = Math.max(0, orderTotal - paid);

  const lines = [
    isKids ? `KIDS CATERING RECEIPT — ${ref}` : `CATERING INVOICE — ${ref}`,
    `PAID BY CARD — confirmed by Square`,
    '',
    ...(order.line_items || []).map((li) => `${li.name} — ${money(li.total_money?.amount)}`),
    '',
    isKids ? `Paid in full: ${money(paid)}` : `Order total: ${money(orderTotal)}`,
  ];
  if (!isKids) {
    lines.push(`Deposit paid by card: ${money(paid)}`, `Balance due before the event: ${money(balance)}`);
  }

  // Event, address, contact and dietary details were put on the payment note
  // (and the first line item) at checkout, separated by " | ".
  const details = payment.note || (order.line_items || []).map((li) => li.note).find(Boolean) || '';
  lines.push('', 'ORDER DETAILS', ...String(details).split(' | ').filter(Boolean));
  if (payment.buyer_email_address) lines.push('', `Customer email: ${payment.buyer_email_address}`);
  lines.push('', `Square payment: ${payment.id}`);

  return {
    subject: isKids ? `Kids Catering receipt — ${ref} (paid)` : `Catering invoice — ${ref} (deposit paid)`,
    text: lines.join('\n'),
    replyTo: payment.buyer_email_address,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!key) return res.status(503).json({ error: 'Webhook not configured' });

  const rawBody = await readRawBody(req);
  // The URL Square posted to — signatures are computed over it.
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const url = `${proto}://${req.headers.host}${req.url}`;

  if (!signatureValid({ key, url, rawBody, header: req.headers['x-square-hmacsha256-signature'] })) {
    return res.status(403).json({ error: 'Bad signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: 'Bad JSON' });
  }

  const payment = event?.data?.object?.payment;
  if (event.type !== 'payment.updated' || !payment || payment.status !== 'COMPLETED' || !payment.order_id) {
    return res.status(200).json({ ignored: true });
  }

  try {
    const order = await fetchOrder(payment.order_id);
    if (!String(order?.reference_id || '').startsWith('CAT-')) {
      return res.status(200).json({ ignored: 'not a catering order' });
    }
    if (!emailConfigured()) {
      console.warn(`Catering order ${order.reference_id} paid, but email isn't set up (RESEND_API_KEY / ORDER_FROM_EMAIL).`);
      return res.status(200).json({ ok: true, emailed: false });
    }
    const email = buildEmail({ order, payment });
    await sendOrderEmail({ ...email, idempotencyKey: `square-payment-${payment.id}` });
    return res.status(200).json({ ok: true, emailed: true });
  } catch (err) {
    console.error('Square webhook failed:', err.message);
    // Non-2xx makes Square retry; the idempotency key prevents duplicate emails.
    return res.status(500).json({ error: 'Webhook failed' });
  }
}
