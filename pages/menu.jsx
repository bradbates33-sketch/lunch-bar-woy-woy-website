import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MenuCard from '../components/MenuCard';
import { fetchMenu } from '../lib/square';

export async function getStaticProps() {
  const { categories } = await fetchMenu();

  return {
    props: { categories },
    // Re-check Square at most every 5 minutes.
    revalidate: 300,
  };
}

export default function Menu({ categories }) {
  return (
    <>
      <Head>
        <title>Menu — Lunch Bar Woy Woy</title>
        <meta
          name="description"
          content="Full menu for Lunch Bar Woy Woy — order pickup online."
        />
      </Head>

      <Header />

      <section className="max-w-[1120px] mx-auto px-8 pt-14 pb-8">
        <div className="font-mono text-xs tracking-[2px] uppercase text-mustard mb-2.5">
          Full menu
        </div>
        <h1 className="font-mono font-bold text-[32px] text-paper mb-3">
          Everything on the board
        </h1>
        <p className="text-paper/60 max-w-[520px]">
          Browse the full menu and add items to your order. Checkout is handled securely
          through Square.
        </p>
      </section>

      {categories.length === 0 ? (
        <section className="max-w-[1120px] mx-auto px-8 pb-24">
          <div className="bg-bg-panel border border-dashed border-paper/20 rounded-[3px] px-8 py-12 text-center">
            <p className="font-mono text-sm text-paper/60">
              Menu is loading from Square — check SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID
              in Vercel if this persists.
            </p>
          </div>
        </section>
      ) : (
        categories.map((category) => (
          <section key={category.id} className="max-w-[1120px] mx-auto px-8 pb-16">
            <h2 className="font-mono font-bold text-xl text-paper mb-6 pb-3 border-b border-paper/10">
              {category.name}
            </h2>
            <div className="grid md:grid-cols-3 gap-[22px]">
              {category.items.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))
      )}

      <Footer />
    </>
  );
}
