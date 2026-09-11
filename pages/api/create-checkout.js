function formatPickupNote(pickupTime) {
  if (!pickupTime || pickupTime === 'asap') return 'Pickup: ASAP (ready in ~15 min)';
  const m = String(pickupTime).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return 'Pickup: ASAP (ready in ~15 min)';
  const h = Number(m[1]);
  const min = m[2];
  const period = h >= 12 ? 'pm' : 'am';
  const h12 = ((h + 11) % 12) + 1;
  return `Pickup: ${h12}:${min}${period}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { items, pickupTime } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const pickupNote = formatPickupNote(pickupTime);

  const lineItems = [];
  for (const item of items) {
    const catalogObjectId = String(item.variationId || item.id || '');
    const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
    if (!catalogObjectId) {
      return res.status(400).json({ error: 'Cart contains an invalid item' });
    }
    const line = { catalog_object_id: catalogObjectId, quantity: String(quantity) };
    const modifierIds = Array.isArray(item.modifierIds)
      ? item.modifierIds.filter(Boolean).map(String)
      : [];
    if (modifierIds.length) {
      line.modifiers = modifierIds.map((id) => ({ catalog_object_id: id }));
    }
    lineItems.push(line);
  }

  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const environment = process.env.SQUARE_ENVIRONMENT || 'production';

  if (!token || !locationId) {
    return res.status(500).json({ error: 'Square is not configured on the server.' });
  }

  const baseUrl = environment === 'sandbox'
    ? 'https://connect.squareupsandbox.com'
    : 'https://connect.squareup.com';

  const origin = req.headers.origin || `https://${req.headers.host}`;

  try {
    const response = await fetch(`${baseUrl}/v2/online-checkout/payment-links`, {
      method: 'POST',
      headers: {
        'Square-Version': '2024-08-21',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idempotency_key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        order: {
          location_id: locationId,
          line_items: lineItems,
          note: pickupNote,
        },
        checkout_options: {
          redirect_url: `${origin}/order-confirmed`,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Square checkout error:', data);
      return res.status(response.status).json({ error: 'Could not start checkout' });
    }

    res.status(200).json({ url: data.payment_link.url });
  } catch (err) {
    console.error('Checkout request failed:', err.message);
    res.status(500).json({ error: 'Checkout request failed' });
  }
}
