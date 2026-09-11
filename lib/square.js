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

// catalog/list is paginated — follow the cursor.
async function squareListAll(types) {
  const objects = [];
  let cursor;
  do {
    const qs = new URLSearchParams({ types });
    if (cursor) qs.set('cursor', cursor);
    const data = await squareGet(`/v2/catalog/list?${qs.toString()}`);
    if (!data) return null;
    if (Array.isArray(data.objects)) objects.push(...data.objects);
    cursor = data.cursor;
  } while (cursor);
  return objects;
}

// Returns { categories: [{ id, name, items: [...] }], flatItems: [...] }.
//
// Each item carries:
//   variations:    [{ id, name, priceCents }]           always >= 1
//   modifierLists: [{ id, name, selectionType, minSelected, maxSelected,
//                     modifiers: [{ id, name, priceCents }] }]
//   priceFrom / priceTo:  cheapest / dearest variation, for "from $X" display
//   hasOptions:    true when the customer needs to choose (multi-variation or
//                  has modifiers) — MenuCard opens ItemModal in that case
//   id / price / priceCents / variationId:  first variation, kept for the
//                  catering pages which don't use the options UI
export async function fetchMenu() {
  const objects = await squareListAll('ITEM,CATEGORY,MODIFIER_LIST,MODIFIER');
  if (!objects) {
    return { categories: [], flatItems: [] };
  }

  const categoryNames = {};
  objects
    .filter((o) => o.type === 'CATEGORY' && !o.is_deleted)
    .forEach((o) => {
      categoryNames[o.id] = o.category_data?.name || 'Menu';
    });

  // Standalone MODIFIER objects, in case a list doesn't inline them.
  const modifiersByListId = {};
  objects
    .filter((o) => o.type === 'MODIFIER' && o.modifier_data && !o.is_deleted)
    .forEach((o) => {
      const listId = o.modifier_data.modifier_list_id;
      if (!listId) return;
      (modifiersByListId[listId] = modifiersByListId[listId] || []).push(o);
    });

  const mapModifier = (o) => ({
    id: o.id,
    name: o.modifier_data?.name || '',
    priceCents: o.modifier_data?.price_money?.amount ?? 0,
    ordinal: o.modifier_data?.ordinal ?? 0,
  });

  const modifierListsById = {};
  objects
    .filter((o) => o.type === 'MODIFIER_LIST' && o.modifier_list_data && !o.is_deleted)
    .forEach((o) => {
      const d = o.modifier_list_data;
      let mods = (d.modifiers || []).filter((m) => m.type === 'MODIFIER' && !m.is_deleted);
      if (mods.length === 0 && modifiersByListId[o.id]) mods = modifiersByListId[o.id];
      modifierListsById[o.id] = {
        id: o.id,
        name: d.name || 'Options',
        selectionType: d.selection_type === 'MULTIPLE' ? 'MULTIPLE' : 'SINGLE',
        modifiers: mods.map(mapModifier).sort((a, b) => a.ordinal - b.ordinal),
      };
    });

  const categoryMap = new Map();
  const flatItems = [];

  objects
    .filter((o) => o.type === 'ITEM' && o.item_data && !o.is_deleted)
    .forEach((o) => {
      const d = o.item_data;

      const variations = (d.variations || [])
        .filter((v) => v.type === 'ITEM_VARIATION' && !v.is_deleted)
        .map((v) => ({
          id: v.id,
          name: v.item_variation_data?.name || 'Regular',
          priceCents: v.item_variation_data?.price_money?.amount ?? null,
          ordinal: v.item_variation_data?.ordinal ?? 0,
        }))
        .sort((a, b) => a.ordinal - b.ordinal);

      if (variations.length === 0) return;

      const modifierLists = (d.modifier_list_info || [])
        .filter((info) => info.enabled !== false)
        .map((info) => {
          const list = modifierListsById[info.modifier_list_id];
          if (!list || list.modifiers.length === 0) return null;
          const min = info.min_selected_modifiers;
          const max = info.max_selected_modifiers;
          const singleDefault = list.selectionType === 'SINGLE';
          return {
            id: list.id,
            name: list.name,
            selectionType: list.selectionType,
            minSelected:
              typeof min === 'number' && min >= 0 ? min : singleDefault ? 1 : 0,
            maxSelected:
              typeof max === 'number' && max >= 0
                ? max
                : singleDefault
                ? 1
                : list.modifiers.length,
            modifiers: list.modifiers,
          };
        })
        .filter(Boolean);

      const prices = variations
        .map((v) => v.priceCents)
        .filter((p) => typeof p === 'number');
      const priceFrom = prices.length ? Math.min(...prices) : null;
      const priceTo = prices.length ? Math.max(...prices) : null;

      const categoryId =
        d.category_id || d.reporting_category?.id || d.categories?.[0]?.id || 'uncategorized';
      const categoryName = categoryNames[categoryId] || 'Menu';

      const item = {
        id: o.id,
        name: d.name,
        description: d.description_plaintext || d.description || '',
        categoryId,
        categoryName,
        variations,
        modifierLists,
        priceFrom,
        priceTo,
        hasOptions: variations.length > 1 || modifierLists.length > 0,
        // first-variation shortcuts (catering pages, cart back-compat)
        variationId: variations[0].id,
        priceCents: variations[0].priceCents,
        price: centsToDollars(variations[0].priceCents),
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
