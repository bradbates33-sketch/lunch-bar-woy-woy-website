import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CateringForm from '../components/CateringForm';
import { fetchMenu } from '../lib/square';
import { splitCateringMenu, FALLBACK, CATERING } from '../lib/catering';

export async function getStaticProps() {
  const { categories } = await fetchMenu();
  const { kids } = splitCateringMenu(categories);
  const usingFallback = kids.length === 0;

  return {
    props: {
      packages: usingFallback ? FALLBACK.kids : kids,
      usingFallback,
    },
    revalidate: 300,
  };
}

export default function KidsCamps({ packages, usingFallback }) {
  return (
    <>
      <Head>
        <title>Kids &amp; Camps Lunches — Lunch Bar Woy Woy</title>
        <meta
          name="description"
          content="Individually packed, labelled lunches for junior sport camps, school groups and kids' parties. Pay by card."
        />
      </Head>

      <Header />

      <section className="max-w-[1120px] mx-auto px-8 pt-14 pb-8">
        <div className="font-mono text-xs tracking-[2px] uppercase text-mustard mb-2.5">Kids &amp; Camps</div>
        <h1 className="font-mono font-bold text-[32px] text-paper mb-3">Lunch, handled for camp day</h1>
        <p className="text-paper/60 max-w-[540px]">
          Individually packed, labelled lunches for junior sport camps, school groups and kids&apos;
          parties. Pick a lunch, tell us the headcount, pay by card.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5 font-mono text-[11px] text-paper/60">
          {['No minimum order', `${CATERING.noticeHours} hrs notice`, 'Nut-free as standard', 'Delivered chilled', 'Pay by card'].map((t) => (
            <span key={t} className="border border-paper/20 rounded-full px-3 py-1">{t}</span>
          ))}
        </div>
        <p className="mt-4 font-mono text-[12px] text-paper/50">
          Platters and office catering?{' '}
          <a href="/catering" className="text-mustard border-b border-mustard/40 hover:border-mustard">Catering page →</a>
        </p>
      </section>

      <section className="max-w-[1120px] mx-auto px-8 pb-24">
        <CateringForm kind="kids" packages={packages} usingFallback={usingFallback} />
      </section>

      <Footer />
    </>
  );
}
