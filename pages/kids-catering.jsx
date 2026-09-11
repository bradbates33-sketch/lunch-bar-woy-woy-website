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

// A little sparkle/confetti piece — reused at a few sizes, colours and
// rotations to decorate the hero without introducing any new brand colours
// (just the chili green and the mustard gold, both already in the palette).
function Sparkle({ className, color = 'chili' }) {
  // Tailwind's scanner needs the full class name written out literally —
  // it can't see through a template-string interpolation like `text-${color}`.
  const colorClass = color === 'mustard' ? 'text-mustard' : 'text-chili';
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`absolute fill-current ${colorClass} ${className}`}
    >
      <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" />
    </svg>
  );
}

// Bunting flags strung along a dashed line — pure CSS triangles, no image
// assets, alternating the two brand colours. A party-table motif for the
// kids' page.
function Bunting() {
  const flags = Array.from({ length: 15 });
  return (
    <div className="max-w-[1120px] mx-auto px-8" aria-hidden="true">
      <div className="relative border-t-2 border-dashed border-paper-line max-w-[640px] mx-auto">
        <div className="absolute -top-[9px] left-0 right-0 flex justify-between px-1">
          {flags.map((_, i) => (
            <span
              key={i}
              className={`block w-0 h-0 border-l-[6px] border-r-[6px] border-t-[11px] border-l-transparent border-r-transparent ${
                i % 2 === 0 ? 'border-t-chili' : 'border-t-mustard'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function KidsCatering({ packages, usingFallback }) {
  return (
    <>
      <Head>
        <title>Kids Catering — Lunch Bar Woy Woy</title>
        <meta
          name="description"
          content="Individually packed, labelled lunches for junior sport camps, school groups and kids' parties. Order online, pay by card."
        />
      </Head>

      <Header />

      <section className="relative max-w-[1120px] mx-auto px-8 pt-14 pb-10 overflow-hidden">
        <Sparkle className="w-6 h-6 top-4 right-10 rotate-[12deg] opacity-80" color="mustard" />
        <Sparkle className="w-3.5 h-3.5 top-16 right-28 -rotate-[10deg] opacity-70" color="chili" />
        <Sparkle className="w-4 h-4 top-2 right-[38%] rotate-[20deg] opacity-60 hidden sm:block" color="chili" />
        <Sparkle className="w-5 h-5 bottom-2 right-4 -rotate-[16deg] opacity-70 hidden sm:block" color="mustard" />

        <div className="inline-flex items-center gap-2 font-mono text-xs tracking-[2px] uppercase text-chili mb-2.5">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
            <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" />
          </svg>
          Kids Catering
        </div>
        <h1 className="font-mono font-bold text-[32px] text-ink mb-3">Order kids&apos; catering by the docket</h1>
        <p className="text-ink/70 max-w-[540px]">
          Individually packed, labelled options for junior sport camps, school groups and kids&apos;
          parties. Pick a package, tell us the headcount, pay by card.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5 font-mono text-[11px] text-ink/70">
          {['No minimum order', `${CATERING.noticeHours} hrs notice`, 'Nut-free as standard', 'Delivered chilled', 'Pay by card'].map((t) => (
            <span key={t} className="border border-ink/20 rounded-full px-3 py-1">{t}</span>
          ))}
        </div>
        <p className="mt-4 font-mono text-[12px] text-ink/60">
          Platters and office catering?{' '}
          <a href="/catering" className="text-chili border-b border-chili/40 hover:border-chili">Catering page →</a>
        </p>
      </section>

      <Bunting />

      <section className="max-w-[1120px] mx-auto px-8 pt-10 pb-24">
        <CateringForm kind="kids" packages={packages} usingFallback={usingFallback} />
      </section>

      <Footer />
    </>
  );
}
