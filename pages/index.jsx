import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import OrderDocket from '../components/OrderDocket';
import MenuCard from '../components/MenuCard';
import HoursCard from '../components/HoursCard';
import { fetchMenuItems } from '../lib/square';

export async function getStaticProps() {
  const allItems = await fetchMenuItems();

  return {
    props: {
      items: allItems.slice(0, 3),
    },
    // Re-fetch from Square at most every 5 minutes, so pricing/availability
    // stays current without hitting the API on every single page view.
    revalidate: 300,
  };
}

export default function Home({ items }) {
  return (
    <>
      <Head>
        <title>Lunch Bar Woy Woy</title>
        <meta
          name="description"
          content="Fresh sandwiches, rolls and coffee made to order. Order pickup online in Woy Woy."
        />
      </Head>

      <Header />

      {/* Hero */}
      <section className="max-w-[1120px] mx-auto grid md:grid-cols-[1.05fr_0.95fr] gap-14 items-center px-8 pt-10 md:pt-[72px] pb-14 md:pb-24">
        <div>
          <div className="flex items-center gap-2.5 font-mono text-xs tracking-[2px] uppercase text-mustard mb-5">
            <span className="w-[7px] h-[7px] rounded-full bg-[#6E9B4A] shadow-[0_0_0_3px_rgba(110,155,74,0.2)]" />
            Open now &middot; Pickup ready in 15 min
          </div>
          <h1 className="font-mono font-bold text-[36px] sm:text-[44px] leading-[1.15] tracking-tight text-paper mb-[22px]">
            Fresh, fast,
            <br />
            <span className="text-chili">local.</span>
          </h1>
          <p className="text-[17px] text-paper/60 max-w-[460px] mb-[34px]">
            Sandwiches, rolls and coffee made to order on the waterfront side of Woy Woy. Order
            ahead and skip the queue.
          </p>
          <div className="flex items-center gap-[18px] flex-wrap">
            <a
              href="#menu"
              className="inline-block font-mono font-bold text-sm tracking-[1.5px] uppercase text-paper bg-chili border-2 border-chili px-7 py-[15px] rounded-[2px] -rotate-2 hover:rotate-0 hover:-translate-y-0.5 hover:bg-chili-dark transition-all"
            >
              Order pickup →
            </a>
            <a
              href="#menu"
              className="font-mono text-[13px] tracking-wide uppercase text-paper border-b border-paper-line pb-[3px] hover:border-mustard hover:text-mustard transition-colors"
            >
              View menu
            </a>
          </div>
        </div>
        <OrderDocket />
      </section>

      {/* Info strip */}
      <div className="bg-bg-panel border-y border-paper/10">
        <div className="max-w-[1120px] mx-auto px-8 py-5 flex flex-wrap gap-7 justify-between items-center font-mono text-[13px] text-paper/60">
          <div>
            <strong className="text-paper font-bold">Open today</strong>&nbsp;7:00am – 3:00pm
          </div>
          <div>12 Blackwall Rd, Woy Woy NSW</div>
          <div>(02) 4341 0000</div>
          <a
            href="#location"
            className="border-b border-paper-line pb-[3px] hover:border-mustard hover:text-mustard transition-colors"
          >
            Get directions
          </a>
        </div>
      </div>

      {/* Menu */}
      <section className="max-w-[1120px] mx-auto px-8 py-16 md:py-[88px]" id="menu">
        <div className="flex justify-between items-end flex-wrap gap-4 mb-11">
          <div>
            <div className="font-mono text-xs tracking-[2px] uppercase text-mustard mb-2.5">On the board</div>
            <h2 className="font-mono font-bold text-[28px] text-paper">Today&apos;s favourites</h2>
          </div>
          <a
            href="#"
            className="font-mono text-[13px] tracking-wide uppercase text-paper border-b border-paper-line pb-[3px] hover:border-mustard hover:text-mustard transition-colors"
          >
            Full menu →
          </a>
        </div>

        {items.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-[22px]">
            {items.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="bg-bg-panel border border-dashed border-paper/20 rounded-[3px] px-8 py-12 text-center">
            <p className="font-mono text-sm text-paper/60">
              Menu is loading from Square — add SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID in
              Vercel to bring this section live.
            </p>
          </div>
        )}

        <div className="mt-10 text-center">
          <a
            href="#menu"
            className="inline-block font-mono font-bold text-sm tracking-[1.5px] uppercase text-paper bg-chili border-2 border-chili px-7 py-[15px] rounded-[2px] -rotate-2 hover:rotate-0 hover:-translate-y-0.5 hover:bg-chili-dark transition-all"
          >
            Order pickup →
          </a>
        </div>
      </section>

      {/* About */}
      <section className="bg-bg-panel px-8 py-16 md:py-[88px]" id="about">
        <div className="max-w-[1120px] mx-auto grid md:grid-cols-[0.9fr_1.1fr] gap-10 md:gap-16 items-center">
          <div className="aspect-[4/5] bg-bg-panel-2 rounded-[3px] flex items-center justify-center font-mono text-xs text-paper/60 tracking-wide uppercase border border-dashed border-paper/20">
            Shopfront photo
          </div>
          <div>
            <p className="text-lg text-paper mb-[18px]">Woy Woy born, family run since day one.</p>
            <p className="text-base text-paper/60 max-w-[480px] mb-[18px]">
              We&apos;ve been slinging rolls and coffee to commuters, tradies and locals for
              years — no drive-thru, no shortcuts, just a proper lunch bar on Blackwall Road.
            </p>
            <p className="text-base text-paper/60 max-w-[480px] mb-[18px]">
              Order ahead on your way past the station and it&apos;ll be ready when you walk in.
            </p>
            <div className="flex gap-10 mt-8 font-mono">
              <div>
                <div className="text-[26px] font-bold text-mustard">7am</div>
                <div className="text-[11px] tracking-wide uppercase text-paper/60 mt-1">First roll out</div>
              </div>
              <div>
                <div className="text-[26px] font-bold text-mustard">15 min</div>
                <div className="text-[11px] tracking-wide uppercase text-paper/60 mt-1">Avg. pickup time</div>
              </div>
              <div>
                <div className="text-[26px] font-bold text-mustard">100%</div>
                <div className="text-[11px] tracking-wide uppercase text-paper/60 mt-1">Locally owned</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location */}
      <section
        className="max-w-[1120px] mx-auto px-8 py-16 md:py-[88px] grid md:grid-cols-2 gap-10"
        id="location"
      >
        <div className="aspect-[4/3] bg-bg-panel rounded-[3px] flex items-center justify-center font-mono text-xs text-paper/60 tracking-wide uppercase border border-dashed border-paper/15">
          Map — 12 Blackwall Rd, Woy Woy
        </div>
        <HoursCard />
      </section>

      <Footer />
    </>
  );
}

