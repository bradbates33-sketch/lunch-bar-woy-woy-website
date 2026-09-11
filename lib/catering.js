// Catering rules + helpers.
//
// Prices and package names come from your SQUARE CATALOG, same as the rest of
// the menu (see lib/square.js -> fetchMenu). Put catering packages in a
// category called "Catering" and the packed kids' lunches in one called
// "Kids Catering". This file only holds the rules Square can't express:
// the deposit percentage, delivery fee, minimum headcount and notice period.

export const CATERING = {
  contactEmail: 'hello@lunchbarbakehouse.com.au',
  depositPercent: 30, // platters: customer pays this much by card now, balance on invoice
  minPlatterGuests: 10, // no minimum for kids catering, or for bowl-priced items
  noticeHours: 48,
  delivery: {
    flatFeeCents: 1500, // $15 flat delivery fee...
    freeOverCents: 20000, // ...waived once the food subtotal passes $200
    radiusKm: 15,
  },
};

// Square category names we recognise (compared lower-cased; `includes` match).
const KIDS_CATEGORY_MATCHES = ['kids catering', 'kids & camps', 'kids and camps', 'kids camps', 'kids'];
const PLATTER_CATEGORY_MATCHES = ['catering'];

// Split the full Square menu into the two catering groups.
// `categories` is the array from fetchMenu().
export function splitCateringMenu(categories = []) {
  const platters = [];
  const kids = [];

  for (const category of categories) {
    const name = String(category.name || '').trim().toLowerCase();
    if (KIDS_CATEGORY_MATCHES.some((m) => name === m || name.includes(m))) {
      kids.push(...category.items);
    } else if (PLATTER_CATEGORY_MATCHES.some((m) => name === m || name.includes(m))) {
      platters.push(...category.items);
    }
  }

  return { platters, kids };
}

// A few catering items are priced per unit-that-serves-several (e.g. a salad
// bowl serving ~4) rather than per guest. Matched by name, not a data field,
// so this keeps working once these move from the fallback list to Square
// (Square items don't carry site-specific metadata like this).
const BOWL_UNIT_NAMES = ['salad bowls', 'salad bowl'];

export function unitForItem(item) {
  const name = String(item?.name || '').trim().toLowerCase();
  return BOWL_UNIT_NAMES.includes(name) ? 'bowl' : 'guest';
}

export function minQtyForItem(item, kind) {
  if (kind === 'kids') return 1;
  return unitForItem(item) === 'bowl' ? 1 : CATERING.minPlatterGuests;
}

// Shown on the pages before Square is connected (or if the category is empty),
// clearly marked as indicative. Real orders always price against Square.
export const FALLBACK = {
  platters: [
    { id: 'sample-basic', number: '01', name: 'Basic', price: '8.00',
      description: '1 sandwich per person on rustic bakery loaves — cheese & tomato, garden salad, curried egg, Vegemite. GF available.' },
    { id: 'sample-gourmet', number: '02', name: 'Gourmet', price: '10.00',
      description: '1 sandwich per person, elevated fillings — Mediterranean chicken, tuna salad, leg ham & Swiss, falafel. GF available.' },
    { id: 'sample-premium', number: '03', name: 'Premium', price: '15.00',
      description: 'Our Muffaletta baguette — cured meats, cheeses and crisp salad in a crusty baguette, 1 per person. Vegetarian version available.' },
    { id: 'sample-saladbowls', number: '04', name: 'Salad Bowls', price: '15.00',
      description: 'Maple roast pumpkin (gf), classic chicken Caesar (gf), or pesto penne — each bowl serves approx. 4 people.' },
  ],
  kids: [
    { id: 'sample-kickoff', number: '01', name: 'Kickoff Lunch', price: '12.00', description: 'Ham & cheese or cheese & tomato sandwich, fruit cup, a mini cookie, and apple juice.' },
    { id: 'sample-fuel', number: '02', name: 'Fuel Lunch', price: '15.00', description: 'Grilled chicken, avocado & spinach on wholegrain, a banana, an oat & date energy ball, and chocolate milk.' },
    { id: 'sample-partybox', number: '03', name: 'Party Box', price: '12.00', description: "Mini sandwiches or wraps (ham & cheese, chicken, vegemite), chips or a small savoury snack, a piece of fruit or fruit cup, a cupcake or small sweet treat, and a nut-free juice box." },
    { id: 'sample-deluxepartybox', number: '04', name: 'Deluxe Party Box', price: '15.00', description: "Everything in the Party Box, plus a party bag with lollies and a small toy or trinket." },
  ],
};

// Optional add-ons for the platter (sandwich package) flow — priced per
// guest, on top of the chosen package. Not offered for Kids Catering or for
// bowl-priced items (mixing "per guest" add-ons with "per bowl" pricing
// doesn't make sense).
export const CATERING_ADDONS = [
  { id: 'addon-muffins', name: 'Freshly baked muffins', price: '4.00', description: 'Soft, moist muffins baked in-house — blueberry, chocolate chip, banana.' },
  { id: 'addon-danish', name: 'Danish pastries', price: '5.00', description: 'Flaky pastries filled with custard, fruit or sweet jam.' },
  { id: 'addon-croissants', name: 'Croissants', price: '6.00', description: 'Golden buttery croissants — plain, or ham & cheese / spinach & feta on request.' },
  { id: 'addon-fruit', name: 'Seasonal fruit salad', price: '3.00', description: 'A refreshing mix of fresh, seasonal fruit.' },
];

export function dollarsToCents(value) {
  const n = Math.round(parseFloat(value) * 100);
  return Number.isFinite(n) ? n : null;
}

export function formatMoney(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

// The one pricing function. Used by the checkout API (authoritative) and
// mirrored on the page for the live docket. Throws on invalid input.
export function priceCateringOrder({
  unitPriceCents,
  headcount,
  kind,
  deliveryMethod,
  addonUnitCentsList = [],
  minQty,
  unit = 'guest',
}) {
  const heads = Math.floor(Number(headcount));
  const min = minQty ?? (kind === 'kids' ? 1 : CATERING.minPlatterGuests);

  if (!Number.isFinite(unitPriceCents) || unitPriceCents <= 0) {
    throw new Error('That package does not have a price set in Square yet.');
  }
  if (!Number.isFinite(heads) || heads < min) {
    throw new Error(
      kind === 'kids'
        ? 'Enter the number of children.'
        : `Minimum ${min} ${unit}${min === 1 ? '' : 's'}.`,
    );
  }

  const foodCents = unitPriceCents * heads;
  const addonsCents = addonUnitCentsList.reduce((sum, c) => sum + c * heads, 0);
  const subtotalCents = foodCents + addonsCents;

  // Kids catering is always delivered free. Platters: flat fee unless the
  // food subtotal clears the free-delivery threshold.
  let deliveryCents = 0;
  if (
    kind !== 'kids' &&
    deliveryMethod === 'Delivery' &&
    subtotalCents < CATERING.delivery.freeOverCents
  ) {
    deliveryCents = CATERING.delivery.flatFeeCents;
  }

  const orderTotalCents = subtotalCents + deliveryCents;
  const chargeCents =
    kind === 'kids'
      ? orderTotalCents
      : Math.round((orderTotalCents * CATERING.depositPercent) / 100);

  return { heads, foodCents, addonsCents, deliveryCents, orderTotalCents, chargeCents };
}
