import Head from 'next/head';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function CateringConfirmed() {
  const [ref, setRef] = useState(null);
  useEffect(() => {
    setRef(new URLSearchParams(window.location.search).get('ref'));
  }, []);

  return (
    <>
      <Head>
        <title>Catering order confirmed — Lunch Bar Woy Woy</title>
      </Head>

      <Header />

      <section className="max-w-[600px] mx-auto px-8 py-24 text-center">
        <div className="font-mono text-xs tracking-[2px] uppercase text-mustard mb-4">Fired ✓</div>
        <h1 className="font-mono font-bold text-[32px] text-paper mb-4">Catering order confirmed</h1>
        {ref && <p className="font-mono text-sm text-paper/60 mb-4">Ref {ref}</p>}
        <p className="text-paper/60 mb-8">
          Thanks — your payment is in and we&apos;ve got your order. Check your email for a receipt
          from Square. We&apos;ll be in touch within one business day to confirm the date, numbers
          and menu. Any changes? Email{' '}
          <a href="mailto:hello@lunchbarbakehouse.com.au" className="text-mustard">hello@lunchbarbakehouse.com.au</a>.
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
