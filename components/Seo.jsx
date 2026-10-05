import Head from 'next/head';
import { SITE } from '../lib/site';
import { HOURS, minutesToTimeValue } from '../lib/hours';

const abs = (pathOrUrl) => (pathOrUrl.startsWith('http') ? pathOrUrl : `${SITE.url}${pathOrUrl}`);

// Per-page <head>: title, description, canonical URL and the tags that control
// how the page looks when shared (Facebook, iMessage, Instagram bio links...).
export default function Seo({ title, description, path = '/', image = SITE.ogImage, noindex = false, jsonLd }) {
  const url = abs(path);
  const img = abs(image);

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex" />}

      <meta property="og:type" content="website" />
      <meta property="og:locale" content="en_AU" />
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />

      {jsonLd && (
        <script
          key="jsonld"
          type="application/ld+json"
          // "<" escaped so nothing in the data can close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
    </Head>
  );
}

// schema.org description of the business — this is what lets Google show the
// address, opening hours, phone number and an "order" button in search results.
export function localBusinessJsonLd() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const openingHoursSpecification = [
    { dayOfWeek: [1, 2, 3, 4, 5], hours: HOURS[1] },
    { dayOfWeek: [6], hours: HOURS[6] },
    { dayOfWeek: [0], hours: HOURS[0] },
  ].map(({ dayOfWeek, hours }) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: dayOfWeek.map((d) => days[d]),
    opens: minutesToTimeValue(hours[0]),
    closes: minutesToTimeValue(hours[1]),
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    name: SITE.name,
    url: SITE.url,
    image: [abs(SITE.ogImage)],
    description: SITE.defaultDescription,
    telephone: `+61${SITE.phone.replace(/\D/g, '').slice(1)}`,
    email: SITE.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.locality,
      addressRegion: SITE.address.region,
      postalCode: SITE.address.postcode,
      addressCountry: SITE.address.country,
    },
    openingHoursSpecification,
    hasMenu: abs('/menu'),
    sameAs: [SITE.social.facebook, SITE.social.instagram],
    potentialAction: {
      '@type': 'OrderAction',
      target: { '@type': 'EntryPoint', urlTemplate: abs('/menu') },
      deliveryMethod: 'http://purl.org/goodrelations/v1#DeliveryModePickUp',
    },
  };
}
