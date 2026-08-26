// Server-side only. Never import this from a component that runs in the browser —
// it reads SQUARE_ACCESS_TOKEN, which must stay secret.

const SQUARE_VERSION = '2024-08-21';

function getBaseUrl() {
  const environment = process.env.SQUARE_ENVIRONMENT || 'production';
  return environment === 'sandbox'
    ? 'https://connect.squareupsandbox.com'
    : 'https://connect.squareup.com';
}

function centsToDollars(amountCents) {
  if (typeof amountCents !== 'number') return null;
  return (amountCents / 100).toFixed(2);
}

// Fetches all catalog items for the configured location.
// Returns [] (never throws to the caller) if credentials are missing or the
// request fails, so a page render never breaks just because Square is down.
export async function fetchMenuItems() {
  const token = process.env.SQUARE_ACCESS_TOKEN;

  if (!token) {
    console.warn('SQUARE_ACCESS_TOKEN is not set — returning no menu items.');
    return [];
  }

  try {
    const response = await fetch(`${getBaseUrl()}/v2/catalog/list?types=ITEM`, {
      headers: {
        'Square-Version': SQUARE_VERSION,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Square API returned ${response.status}`);
      return [];
    }

    const data = await response.json();

    return (data.objects || [])
      .filter((obj) => obj.type === 'ITEM' && obj.item_data)
      .map((obj, index) => {
        const variation = obj.item_data.variations?.[0];
        const priceMoney = variation?.item_variation_data?.price_money;

        return {
          id: obj.id,
          number: String(index + 1).padStart(2, '0'),
          name: obj.item_data.name,
          description: obj.item_data.description || '',
          price: centsToDollars(priceMoney?.amount),
        };
      });
  } catch (err) {
    console.error('Failed to fetch Square catalog:', err.message);
    return [];
  }
}
