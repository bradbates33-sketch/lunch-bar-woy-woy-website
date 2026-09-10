import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CateringForm from '../components/CateringForm';
import { fetchMenu } from '../lib/square';
import { splitCateringMenu, FALLBACK, CATERING } from '../lib/catering';

export async function getStaticProps() {
  const { categories } = await fetchMenu();
  const { platters } = splitCateringMenu(categories);
  const usingFallback = platters.length === 0;

  return {
    props: {
      packages: usingFallback ? FALLBACK.platters : platters,
      usingFallback,
    },
    revalidate: 300,
  };
}

export default function Catering({ packages, usingFallback }) {
  return (
    <>
      <Head>
        <title>Catering — Lunch Bar Woy Woy</title>
        <meta
          name="description"
          content="Morning teas, working lunches and grazing tables for offices and gatherings. Order online, pay the deposit by card."
        />
      </Head>

      <Header />

      <section className="max-w-[1120px] mx-auto px-8 pt-14 pb-8">
        <div className="font-mono text-xs tracking-[2px] uppercase text-chili mb-2.5">Catering</div>
        <h1 className="font-mono font-bold text-[32px] text-ink mb-3">Order catering by the docket</h1>
        <p className="text-ink/70 max-w-[540px]">
          Morning teas, working lunches and grazing tables for offices, workshops and gatherings.
          Fill in the docket, pay the {CATERING.depositPercent}% deposit by card, and we confirm the rest.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5 font-mono text-[11px] text-ink/70">
          {[`Min. ${CATERING.minPlatterGuests} guests`, `${CATERING.noticeHours} hrs notice`, `Delivery within ${CATERING.delivery.radiusKm} km`, `${CATERING.depositPercent}% deposit confirms`].map((t) => (
            <span key={t} className="border border-ink/20 rounded-full px-3 py-1">{t}</span>
          ))}
        </div>
        <p className="mt-4 font-mono text-[12px] text-ink/60">
          Ordering lunches for a kids&apos; sport camp or school group?{' '}
          <a href="/kids-camps" className="text-chili border-b border-chili/40 hover:border-chili">Kids &amp; Camps page →</a>
        </p>
      </section>

      <section className="max-w-[1120px] mx-auto px-8 pb-24">
        <CateringForm kind="platters" packages={packages} usingFallback={usingFallback} />
      </section>

      <Footer />
    </>
  );
}
