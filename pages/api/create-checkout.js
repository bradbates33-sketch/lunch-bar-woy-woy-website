export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { items } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
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

  const lineItems = items.map((item) => ({
    catalog_object_id: item.id,
    quantity: String(item.quantity),
  }));

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
