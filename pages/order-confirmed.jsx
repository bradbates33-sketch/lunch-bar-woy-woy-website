import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function OrderConfirmed() {
  return (
    <>
      <Head>
        <title>Order confirmed — Lunch Bar Woy Woy</title>
      </Head>

      <Header />

      <section className="max-w-[600px] mx-auto px-8 py-24 text-center">
        <div className="font-mono text-xs tracking-[2px] uppercase text-mustard mb-4">Fired ✓</div>
        <h1 className="font-mono font-bold text-[32px] text-paper mb-4">Order confirmed</h1>
        <p className="text-paper/60 mb-8">
          Thanks for your order — we&apos;ll have it ready for pickup shortly. Check your email
          for a receipt from Square.
        </p>
        <a
          href="/"
          className="inline-block font-mono font-bold text-sm tracking-[1.5px] uppercase text-paper bg-chili border-2 border-chili px-7 py-[15px] rounded-[2px] hover:bg-chili-dark transition-all"
        >
          Back to homepage
        </a>
      </section>

      <Footer />
    </>
  );
}
