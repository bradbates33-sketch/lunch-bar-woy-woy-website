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
   - `Catering` — for platter packages (Morning Tea, Working Lunch, Grazing
     Table, …). Price each item **per guest**.
   - `Kids Catering` — for the packed kids' lunches (Kickoff Lunch, Fuel
     Lunch). Price each item **per child**.
2. Add the items with descriptions. `fetchMenu()` picks them up automatically
   (cached 5 min via ISR).
3. Until the categories exist / Square is connected, the pages show the
   indicative list in `lib/catering.js` (`FALLBACK`) and orders fall back to
   an emailed enquiry to `hello@lunchbarbakehouse.com.au`.

### How catering payment works

- **Platters:** customer pays a **30% deposit** by card now (Square hosted
  checkout). Full order total + all event details are stored on the Square
  order note/metadata. Invoice the balance from Square before the event.
- **Kids Catering:** customer pays the **full amount** by card now.
- The charged amount is always recomputed server-side in `lib/catering.js`
  from the Square price × headcount — a tampered browser request can't change
  it. If the checkout call fails, the page falls back to the email enquiry.
- Rules (deposit %, `$15` delivery fee, free over `$200`, 10-guest platter
  minimum, 48 hr notice) live in `CATERING` in `lib/catering.js`.

### Recommended follow-up

Add a Square **webhook** (`payment.updated`) for a confirmed-payment
notification instead of relying on the "order started" email.
