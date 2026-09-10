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
  minPlatterGuests: 10, // no minimum for kids catering
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

// Shown on the pages before Square is connected (or if the category is empty),
// clearly marked as indicative. Real orders always price against Square.
export const FALLBACK = {
  platters: [
    { id: 'sample-morning', number: '01', name: 'Morning Tea', price: '12.50', description: 'Mini muffins, warm scones with jam & cream, fruit skewers, filter coffee & leaf tea.' },
    { id: 'sample-lunch', number: '02', name: 'Working Lunch', price: '22.00', description: 'Gourmet sandwiches & wraps, a seasonal salad, whole fruit, a sweet slice and bottled juice.' },
    { id: 'sample-afternoon', number: '03', name: 'Afternoon Tea', price: '14.50', description: 'Assorted pastries, mini quiches, brownie and lemon-slice bites, coffee & tea.' },
    { id: 'sample-grazing', number: '04', name: 'Grazing Table', price: '28.00', description: 'Cured meats, local cheeses, dips, house bread & crackers, marinated veg, fresh & dried fruit.' },
    { id: 'sample-breakfast', number: '05', name: 'Breakfast Box', price: '16.50', description: 'Bircher or yoghurt & granola pot, a bakehouse pastry, whole fruit and a mini juice.' },
  ],
  kids: [
    { id: 'sample-kickoff', number: '01', name: 'Kickoff Lunch', price: '12.00', description: 'Ham & cheese or cheese & tomato sandwich, apple slices or orange segments, a mini cookie or fruit muesli bar, and apple juice or water.' },
    { id: 'sample-fuel', number: '02', name: 'Fuel Lunch', price: '15.00', description: 'Grilled chicken, avocado & spinach on wholegrain, a banana, an oat & date energy ball, and chocolate milk.' },
    { id: 'sample-partybox', number: '03', name: 'Party Box', price: '12.00', description: "Mini sandwiches or wraps (ham & cheese, chicken, vegemite), chips or a small savoury snack, a piece of fruit or fruit cup, a cupcake or small sweet treat, and a nut-free juice box." },
    { id: 'sample-deluxepartybox', number: '04', name: 'Deluxe Party Box', price: '15.00', description: "Everything in the Party Box, plus a party bag with lollies and a small toy or trinket." },
  ],
};

export function dollarsToCents(value) {
  const n = Math.round(parseFloat(value) * 100);
  return Number.isFinite(n) ? n : null;
}

export function formatMoney(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

// The one pricing function. Used by the checkout API (authoritative) and
// mirrored on the page for the live docket. Throws on invalid input.
export function priceCateringOrder({ unitPriceCents, headcount, kind, deliveryMethod }) {
  const heads = Math.floor(Number(headcount));
  const min = kind === 'kids' ? 1 : CATERING.minPlatterGuests;

  if (!Number.isFinite(unitPriceCents) || unitPriceCents <= 0) {
    throw new Error('That package does not have a price set in Square yet.');
  }
  if (!Number.isFinite(heads) || heads < min) {
    throw new Error(
      kind === 'kids'
        ? 'Enter the number of children.'
        : `Platter orders have a ${min}-guest minimum.`,
    );
  }

  const foodCents = unitPriceCents * heads;

  let deliveryCents = 0;
  if (deliveryMethod === 'Delivery' && foodCents < CATERING.delivery.freeOverCents) {
    deliveryCents = CATERING.delivery.flatFeeCents;
  }

  const orderTotalCents = foodCents + deliveryCents;
  const chargeCents =
    kind === 'kids'
      ? orderTotalCents
      : Math.round((orderTotalCents * CATERING.depositPercent) / 100);

  return { heads, foodCents, deliveryCents, orderTotalCents, chargeCents };
}
