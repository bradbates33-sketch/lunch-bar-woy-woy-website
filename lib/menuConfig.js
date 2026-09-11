// ---------------------------------------------------------------------------
// What shows on the website menu.
//
// Everything here is matched against Square category / item names,
// case-insensitively. Change these lists and redeploy — no other code changes.
// (Catering pages are separate and use the "Catering" / "Kids Catering"
// categories regardless of what's here.)
// ---------------------------------------------------------------------------

// Square categories to show on /menu, in this order. Anything not listed is
// hidden from the website (it still sells in-store). Categories in Square that
// share a name (e.g. several "Lunch" categories) are merged into one section.
export const MENU_CATEGORIES = [
  'Toasted Sandwich',
  'Breakfast',
  'Burgers',
  'Lunch',
  'Drinks - Hot',
  'Drinks - Cold',
  'Drinks',
];

// Items to hide even when their category is shown — e.g. the ingredient /
// add-on lists Square stores as "items".
export const HIDDEN_ITEM_NAMES = ['EXTRAS', 'Extras'];

// Homepage "Today's favourites" — item names, in order. Leave empty to just
// use the first few items from the menu.
export const FEATURED_ITEMS = [];

const norm = (s) => String(s || '').trim().toLowerCase();

// Filter + merge + order the raw categories from fetchMenu() for the website.
export function curateMenu(rawCategories = []) {
  const wanted = MENU_CATEGORIES.map(norm);
  const wantedSet = new Set(wanted);
  const hiddenSet = new Set(HIDDEN_ITEM_NAMES.map(norm));

  const byName = new Map();
  for (const cat of rawCategories) {
    const key = norm(cat.name);
    if (!wantedSet.has(key)) continue;
    const items = (cat.items || []).filter((it) => !hiddenSet.has(norm(it.name)));
    if (items.length === 0) continue;
    if (!byName.has(key)) byName.set(key, { id: cat.id, name: cat.name, items: [] });
    byName.get(key).items.push(...items);
  }

  const ordered = [];
  for (const name of MENU_CATEGORIES) {
    const cat = byName.get(norm(name));
    if (!cat) continue;
    cat.items.forEach((it, i) => {
      it.number = String(i + 1).padStart(2, '0');
    });
    ordered.push(cat);
  }
  return ordered;
}

export function pickFeatured(curatedCategories = [], count = 3) {
  const all = curatedCategories.flatMap((c) => c.items);
  if (FEATURED_ITEMS.length) {
    const chosen = FEATURED_ITEMS.map((name) =>
      all.find((it) => norm(it.name) === norm(name)),
    ).filter(Boolean);
    if (chosen.length) return chosen.slice(0, count);
  }
  return all.slice(0, count);
}
