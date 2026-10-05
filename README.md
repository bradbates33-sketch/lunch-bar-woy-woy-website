# Lunch Bar Woy Woy Website

Next.js (Pages Router) + TailwindCSS + Square.

## Local dev

```
npm install
cp .env.example .env.local   # fill in Square sandbox values
npm run dev
```

## Environment variables

See `.env.example`. `SQUARE_ACCESS_TOKEN` + `SQUARE_LOCATION_ID` power the
live menu (`lib/square.js`) and every checkout. Set them in Vercel too.

## Ordering

- **Pickup menu** (`/menu`): items come from the Square catalog, added to a
  cart (`components/CartContext.jsx`), checked out via
  `pages/api/create-checkout.js` -> Square payment link -> `/order-confirmed`.
- **Catering** (`/catering`, `/kids-catering`): see below.

## Catering

Two order pages, one shared form (`components/CateringForm.jsx`), rules in
`lib/catering.js`, checkout in `pages/api/catering-checkout.js`.

### Set up the catering menu in Square

1. In the Square Dashboard, create two catalog **categories**:
   - `Catering` — sandwich packages (Basic, Gourmet, Premium) priced **per
     guest**, plus `Salad Bowls` priced **per bowl** (matched by name in
     `lib/catering.js` — `unitForItem()` — since it serves ~4 people, not 1).
   - `Kids Catering` — for the packed kids' lunches (Kickoff Lunch, Fuel
     Lunch, Party Box, Deluxe Party Box). Price each item **per child**.
2. Add the items with descriptions. `fetchMenu()` picks them up automatically
   (cached 5 min via ISR).
3. Until the categories exist / Square is connected, the pages show the
   indicative list in `lib/catering.js` (`FALLBACK`) and orders fall back to
   an emailed enquiry to `hello@lunchbarbakehouse.com.au`.
4. The four "Sweet & Light" extras (muffins, Danish pastries, croissants,
   fruit salad) are **not** in Square at all — they're a fixed add-on list in
   `CATERING_ADDONS` in `lib/catering.js`, priced per guest, offered
   alongside the per-guest sandwich packages (not Salad Bowls or Kids
   Catering). Edit that array to change them.

### How catering payment works

- **Platters:** customer pays a **30% deposit** by card now (Square hosted
  checkout). The full event/contact details are stored on the order's first
  line item and the payment note, the totals in the order metadata. (Square
  orders have no order-level note field — only those.) Invoice the balance
  from Square before the event.
- **Kids Catering:** customer pays the **full amount** by card now.
- The charged amount is always recomputed server-side in `lib/catering.js`
  from the Square price × headcount — a tampered browser request can't change
  it. If the checkout call fails, the page falls back to the email enquiry.
- Rules (deposit %, `$15` delivery fee, free over `$200`, 10-guest platter
  minimum, 48 hr notice) live in `CATERING` in `lib/catering.js`.

### Paid-order emails (webhook)

`pages/api/square-webhook.js` receives Square's `payment.updated` event, and
when a **catering** payment is `COMPLETED` emails the invoice/receipt (so you
are only emailed for orders that were actually paid). It needs, in Vercel:

- `SQUARE_WEBHOOK_SIGNATURE_KEY` — the subscription's signing key
- `RESEND_API_KEY` and `ORDER_FROM_EMAIL` — see `.env.example`

If `SQUARE_WEBHOOK_SIGNATURE_KEY` isn't set, the old behaviour applies: the
email is sent when checkout *starts*.

## Site settings

- **Trading hours / pickup rules:** `lib/hours.js` (Australia/Sydney time).
  Drives the live "Open now / Closed" badge, the hours card, and which pickup
  times the cart offers; `create-checkout.js` enforces the same rules.
- **Business details** (phone, address, socials, allergen note): `lib/site.js`.
- **Menu illustrations:** each item gets a black-and-white stencil drawing
  (`lib/illustrations.js`), chosen by matching the item's name. To change
  which drawing an item uses, edit `RULES` there; to add a new drawing, add
  it to `ART` and point a rule at it. Photos in Square are not used.
- **Dietary badges (GF, V, VG, DF, NF...):** tick them on the item in Square
  (Items > item > food & beverage details); they appear on the menu.
- **Item names on the site:** `lib/displayNames.js` tidies ALL CAPS and fixes
  known typos for display only. Square itself is never changed.
- **ECSS soccer camp group** (Kids Catering page): `ECSS_CAMP` in
  `lib/catering.js` sets the camp name, dates, which packages are in the group
  and the last day it shows (`until`). After that date the packages return to
  the normal list on their own. Logo: `public/ecss-logo.png`.
- **Visitor stats:** Vercel Analytics (`pages/_app.jsx`) — switch it on under
  the project's Analytics tab.
