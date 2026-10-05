// Single source of truth for business details used across the site (SEO tags,
// structured data, footer links, notices). Edit here, not in individual pages.

export const SITE = {
  name: 'Lunch Bar Woy Woy',
  url: 'https://www.lunchbarbakehouse.com.au',
  phone: '0422 430 033',
  phoneHref: 'tel:0422430033',
  email: 'hello@lunchbarbakehouse.com.au',
  address: {
    street: '35 Blackwall Road',
    locality: 'Woy Woy',
    region: 'NSW',
    postcode: '2256',
    country: 'AU',
  },
  social: {
    facebook: 'https://www.facebook.com/lunchbarbakehouse',
    instagram: 'https://www.instagram.com/lunchbar_woy_woy',
  },
  ogImage: '/og-image.jpg',
  defaultDescription:
    'Toasted sandwiches, Greek gyros, coffee & more, made to order in the heart of Woy Woy. Order ahead and skip the queue.',
};

// Shown on the menu pages. Worded generally — adjust if your kitchen's
// allergen practice is different.
export const ALLERGEN_NOTE =
  `Allergies or dietary needs? Tell us when you order or call the shop on ${SITE.phone}. ` +
  'Our food is prepared in a kitchen that handles common allergens, so we can’t guarantee any item is allergen-free.';
