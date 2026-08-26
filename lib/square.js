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

async function squareGet(path) {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    console.warn('SQUARE_ACCESS_TOKEN is not set.');
    return null;
  }

  try {
    const response = await fetch(`${getBaseUrl()}${path}`, {
      headers: {
        'Square-Version': SQUARE_VERSION,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Square API ${path} returned ${response.status}`);
      return null;
    }

    return response.json();
  } catch (err) {
    console.error('Square API request failed:', err.message);
    return null;
  }
}

// Returns { categories: [{ id, name, items: [...] }], flatItems: [...] }.
// Each item's `id` is its VARIATION id — that's what Square's ordering and
// checkout APIs expect, not the parent item id.
export async function fetchMenu() {
  const data = await squareGet('/v2/catalog/list?types=ITEM,CATEGORY');

  if (!data) {
    return { categories: [], flatItems: [] };
  }

  const objects = data.objects || [];

  const categoryNames = {};
  objects
    .filter((obj) => obj.type === 'CATEGORY')
    .forEach((obj) => {
      categoryNames[obj.id] = obj.category_data?.name || 'Menu';
    });

  const categoryMap = new Map();
  const flatItems = [];

  objects
    .filter((obj) => obj.type === 'ITEM' && obj.item_data)
    .forEach((obj) => {
      const variation = obj.item_data.variations?.[0];
      const priceMoney = variation?.item_variation_data?.price_money;
      const categoryId = obj.item_data.category_id || 'uncategorized';
      const categoryName = categoryNames[categoryId] || 'Menu';

      const item = {
        id: variation?.id || obj.id,
        name: obj.item_data.name,
        description: obj.item_data.description || '',
        price: centsToDollars(priceMoney?.amount),
        categoryId,
        categoryName,
      };

      flatItems.push(item);

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, { id: categoryId, name: categoryName, items: [] });
      }
      categoryMap.get(categoryId).items.push(item);
    });

  // Number items within each category for the "No. 01" ticket styling.
  categoryMap.forEach((category) => {
    category.items.forEach((item, index) => {
      item.number = String(index + 1).padStart(2, '0');
    });
  });

  return {
    categories: Array.from(categoryMap.values()),
    flatItems,
  };
}

// Kept for the homepage's featured-items section.
export async function fetchMenuItems() {
  const { flatItems } = await fetchMenu();
  return flatItems;
}
