import Seo from '../components/Seo';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HoursCard from '../components/HoursCard';
import { SITE } from '../lib/site';

const linkCls = 'text-chili border-b border-chili/40 hover:border-chili transition-colors';

export default function Contact() {
  return (
    <>
      <Seo
        title="Contact — Lunch Bar Woy Woy"
        description={`Find Lunch Bar Woy Woy at ${SITE.address.street}, ${SITE.address.locality}. Opening hours, phone and directions.`}
        path="/contact"
      />
      <Header />

      <section className="max-w-[1120px] mx-auto px-8 pt-14 pb-24 grid md:grid-cols-[1fr_360px] gap-12 items-start">
        <div>
          <div className="font-mono text-xs tracking-[2px] uppercase text-chili mb-2.5">Contact</div>
          <h1 className="font-mono font-bold text-[32px] text-ink mb-6">Come say hello</h1>

          <dl className="space-y-5 text-ink/80">
            <div>
              <dt className="font-mono text-[11px] tracking-wide uppercase text-ink/50 mb-1">Address</dt>
              <dd>
                {SITE.address.street}, {SITE.address.locality} {SITE.address.region} {SITE.address.postcode}
                <br />
                <a
                  className={linkCls}
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${SITE.address.street}, ${SITE.address.locality} ${SITE.address.region} ${SITE.address.postcode}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get directions
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] tracking-wide uppercase text-ink/50 mb-1">Phone</dt>
              <dd>
                <a className={linkCls} href={SITE.phoneHref}>{SITE.phone}</a>
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] tracking-wide uppercase text-ink/50 mb-1">Email</dt>
              <dd>
                <a className={linkCls} href={`mailto:${SITE.email}`}>{SITE.email}</a>
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] tracking-wide uppercase text-ink/50 mb-1">Follow us</dt>
              <dd className="flex gap-5">
                <a className={linkCls} href={SITE.social.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
                <a className={linkCls} href={SITE.social.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>
              </dd>
            </div>
          </dl>

          <p className="mt-8 text-ink/70 max-w-[480px]">
            Planning a function or school event? See our{' '}
            <a className={linkCls} href="/catering">catering</a> and{' '}
            <a className={linkCls} href="/kids-catering">kids catering</a> options.
          </p>
        </div>

        <HoursCard />
      </section>

      <Footer />
    </>
  );
}
