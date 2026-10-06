import Seo from '../components/Seo';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MenuCard from '../components/MenuCard';
import EcssBanner from '../components/EcssBanner';
import { fetchMenu } from '../lib/square';
import { curateMenu } from '../lib/menuConfig';
import { ALLERGEN_NOTE } from '../lib/site';

export async function getStaticProps() {
  const { categories } = await fetchMenu();

  return {
    props: { categories: curateMenu(categories) },
    // Re-check Square at most every 5 minutes.
    revalidate: 300,
  };
}

export default function Menu({ categories }) {
  // Legend only lists the dietary badges actually in use on the menu.
  const legendMap = new Map();
  categories.forEach((c) => c.items.forEach((i) => (i.dietary || []).forEach((d) => legendMap.set(d.code, d))));
  const legend = Array.from(legendMap.values());

  return (
    <>
      <Seo
        title="Menu — Lunch Bar Woy Woy"
        description="Full menu for Lunch Bar Woy Woy — toasted sandwiches, breakfast, burgers, coffee, juices and shakes. Order pickup online."
        path="/menu"
      />

      <Header />

      <section className="max-w-[1120px] mx-auto px-8 pt-14 pb-8">
        <div className="font-mono text-xs tracking-[2px] uppercase text-chili mb-2.5">
          Full menu
        </div>
        <h1 className="font-mono font-bold text-[32px] text-ink mb-3">
          Everything on the board
        </h1>
        <p className="text-ink/70 max-w-[520px]">
          Browse the full menu and add items to your order. Checkout is handled securely
          through Square.
        </p>
        <EcssBanner />
        <p className="mt-5 max-w-[640px] border border-dashed border-ink/25 rounded-[3px] px-4 py-3 text-[13px] text-ink/70">
          {ALLERGEN_NOTE}
          {legend.length > 0 && (
            <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-ink/60">
              {legend.map((d) => (
                <span key={d.code}>
                  <strong className="text-chili-dark">{d.code}</strong> {d.label.toLowerCase()}
                </span>
              ))}
            </span>
          )}
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
            <h2 className="font-mono font-bold text-xl text-ink mb-6 pb-3 border-b border-ink/15">
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
