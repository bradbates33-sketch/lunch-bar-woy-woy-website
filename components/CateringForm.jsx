import { useMemo, useState } from 'react';
import {
  CATERING,
  CATERING_ADDONS,
  priceCateringOrder,
  dollarsToCents,
  formatMoney,
  unitForItem,
  minQtyForItem,
} from '../lib/catering';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function minDateISO() {
  return new Date(Date.now() + CATERING.noticeHours * 3600 * 1000)
    .toISOString()
    .slice(0, 10);
}

function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// kind: "platters" | "kids"
export default function CateringForm({ kind, packages, usingFallback }) {
  const isKids = kind === 'kids';
  const [selectedId, setSelectedId] = useState('');
  const [headcount, setHeadcount] = useState('');
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  const [method, setMethod] = useState('Delivery');
  const [form, setForm] = useState({
    address: '',
    eventDate: '',
    eventTime: '',
    name: '',
    org: '',
    email: '',
    phone: '',
    dietary: '',
    notes: '',
    timingNote: '',
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null); // { type: "info"|"error", message }
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null); // { mode: "redirect"|"email", ref }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggleAddon = (id) =>
    setSelectedAddonIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const selected = packages.find((p) => p.id === selectedId) || null;
  const unit = selected ? unitForItem(selected) : 'guest';
  const minQty = selected ? minQtyForItem(selected, kind) : isKids ? 1 : CATERING.minPlatterGuests;
  // Per-guest extras only make sense alongside a per-guest package.
  const showAddons = !isKids && unit !== 'bowl';
  const activeAddons = showAddons ? CATERING_ADDONS.filter((a) => selectedAddonIds.includes(a.id)) : [];

  const quote = useMemo(() => {
    if (!selected || !headcount) return null;
    try {
      return priceCateringOrder({
        unitPriceCents: dollarsToCents(selected.price),
        headcount,
        kind,
        deliveryMethod: method,
        addonUnitCentsList: activeAddons.map((a) => dollarsToCents(a.price)),
        minQty,
        unit,
      });
    } catch {
      return null;
    }
  }, [selected, headcount, kind, method, activeAddons, minQty, unit]);

  function validate() {
    const next = {};
    if (!selected) next.package = 'Choose a package.';
    const heads = Math.floor(Number(headcount));
    if (!Number.isFinite(heads) || heads < minQty) {
      next.headcount = isKids ? 'Enter the number of children.' : `Enter ${minQty} or more.`;
    }
    if (!form.eventDate) next.eventDate = 'Choose a date.';
    if (!form.eventTime) next.eventTime = 'Choose a time.';
    if (!form.name.trim()) next.name = 'Tell us who to contact.';
    if (!EMAIL_RE.test(form.email)) next.email = 'Enter a valid email.';
    if (!form.phone.trim()) next.phone = 'Enter a contact number.';
    if (method === 'Delivery' && !form.address.trim()) next.address = 'Enter a delivery address, or choose pickup.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function buildEmail(ref) {
    const o = quote;
    const unitWord = isKids ? 'child' : unit === 'bowl' ? 'bowl' : 'guest';
    const lines = [
      `CATERING ENQUIRY — Lunch Bar`,
      `Ref: ${ref}`,
      '',
      `Date:      ${fmtDate(form.eventDate)}  at  ${form.eventTime || '-'}`,
      `${isKids ? 'Children:' : unit === 'bowl' ? 'Bowls:   ' : 'Guests:  '}  ${Math.floor(Number(headcount)) || '?'}`,
      `Fulfilment: ${method}${method === 'Delivery' ? ` — ${form.address || '(address to follow)'}` : ''}`,
      '',
      `Package:   ${selected ? selected.name : '(none selected)'}${selected?.price ? ` — $${selected.price}/${unitWord}` : ''}`,
      ...(activeAddons.length
        ? ['', 'Extras:', ...activeAddons.map((a) => `  ${a.name} — $${a.price}/guest`)]
        : []),
      o ? `Estimated total: ${formatMoney(o.orderTotalCents)}${!isKids ? ` (deposit ${formatMoney(o.chargeCents)})` : ''}` : '',
      '',
      `Contact:   ${form.name}${form.org ? ` — ${form.org}` : ''}`,
      `           ${form.email}  /  ${form.phone}`,
      form.dietary ? `Dietary:   ${form.dietary}` : '',
      form.notes ? `Notes:     ${form.notes}` : '',
      form.timingNote ? `Timing:    ${form.timingNote}` : '',
    ].filter(Boolean);
    return lines.join('\n');
  }

  function fallbackToEmail(ref, reason) {
    const subject = `Catering enquiry ${ref} — ${fmtDate(form.eventDate)} — ${form.name}`;
    const href = `mailto:${CATERING.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildEmail(ref))}`;
    if (reason) setStatus({ type: 'error', message: `${reason} — sending your enquiry by email instead.` });
    window.location.href = href;
    setDone({ mode: 'email', ref });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    if (!validate()) {
      setStatus({ type: 'error', message: 'Check the highlighted fields.' });
      return;
    }

    const ref =
      'CAT-' +
      form.eventDate.replace(/-/g, '').slice(2) +
      '-' +
      Math.random().toString(36).slice(2, 6).toUpperCase();

    // No live Square catalog yet -> straight to the email enquiry.
    if (usingFallback || selected.id.startsWith('sample-')) {
      fallbackToEmail(ref);
      return;
    }

    setSubmitting(true);
    setStatus({ type: 'info', message: 'Taking you to Square to pay…' });

    try {
      const res = await fetch('/api/catering-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          itemId: selected.id,
          headcount: Math.floor(Number(headcount)),
          addonIds: activeAddons.map((a) => a.id),
          deliveryMethod: method,
          address: form.address.trim(),
          eventDate: form.eventDate,
          eventTime: form.eventTime,
          customer: {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            org: form.org.trim(),
          },
          dietary: form.dietary.trim(),
          notes: form.notes.trim(),
          timingNote: form.timingNote.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        setDone({ mode: 'redirect', ref: data.ref || ref });
        window.location.href = data.url;
        return;
      }
      setSubmitting(false);
      fallbackToEmail(ref, data.error || "Couldn't start card checkout");
    } catch {
      setSubmitting(false);
      fallbackToEmail(ref, "Couldn't reach card checkout");
    }
  }

  const money = (v) => (v ? `$${v}` : 'POA');
  const unitWord = isKids ? 'child' : unit === 'bowl' ? 'bowl' : 'guest';
  const headLabel = isKids ? 'Number of children' : unit === 'bowl' ? 'Number of bowls' : 'Number of guests';
  const headHint = isKids
    ? 'Priced per child. No minimum.'
    : unit === 'bowl'
    ? 'Each bowl serves approx. 4 people. No minimum.'
    : `Per guest. Minimum ${minQty}.`;

  let step = 0;
  const stepNum = () => String(++step).padStart(2, '0');

  if (done) {
    return (
      <div className="bg-paper text-ink border border-paper-line rounded-[3px] p-8">
        <div className="inline-block font-mono text-[11px] font-bold tracking-[2px] uppercase text-chili border-[1.5px] border-chili px-2.5 py-1 rounded-[2px] -rotate-[3deg] mb-5">
          {done.mode === 'redirect' ? 'Redirecting to payment' : 'Enquiry sent'}
        </div>
        <h2 className="font-mono font-bold text-2xl mb-2">Thanks, {form.name.split(/\s+/)[0] || 'there'}.</h2>
        <p className="font-mono text-sm text-[#6b6552] mb-4">Ref {done.ref}</p>
        {done.mode === 'redirect' ? (
          <ol className="list-decimal pl-5 text-[15px] text-[#5c5744] leading-relaxed space-y-2">
            <li>You&apos;re being taken to <strong className="text-ink">Square</strong> to pay {isKids ? 'in full' : `the ${CATERING.depositPercent}% deposit`} by card.</li>
            <li>Your receipt is emailed automatically.</li>
            <li>We confirm date &amp; numbers within one business day{isKids ? '' : '; the balance is invoiced before your event'}.</li>
          </ol>
        ) : (
          <ol className="list-decimal pl-5 text-[15px] text-[#5c5744] leading-relaxed space-y-2">
            <li>Your email app just opened with the enquiry — <strong className="text-ink">hit send</strong> so it reaches us.</li>
            <li>We reply within one business day with a quote and a card-payment link.</li>
          </ol>
        )}
        <button
          type="button"
          onClick={() => { setDone(null); setStatus(null); setSubmitting(false); }}
          className="mt-6 font-mono text-[11px] tracking-wide uppercase border border-ink px-4 py-2 rounded-[2px] hover:bg-ink hover:text-paper transition-colors"
        >
          Change the order
        </button>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
      <form onSubmit={handleSubmit} noValidate className={`bg-paper text-ink border border-paper-line p-6 sm:p-8 space-y-9 ${isKids ? 'rounded-2xl' : 'rounded-[3px]'}`}>
        {usingFallback && (
          <p className="font-mono text-[12px] text-[#6b6552] bg-paper-dim border border-dashed border-paper-line rounded-[2px] px-3 py-2">
            Indicative pricing — final prices are confirmed on your quote.
          </p>
        )}

        {/* package */}
        <fieldset className="space-y-3">
          <legend className="font-mono text-[11px] tracking-[2px] uppercase text-[#948d76] mb-1">
            {stepNum()} — Choose a package
          </legend>
          <div className="space-y-2.5" role="radiogroup" aria-label="Package">
            {packages.map((p) => {
              const active = p.id === selectedId;
              const pUnit = unitForItem(p);
              return (
                <label
                  key={p.id}
                  className={`relative block cursor-pointer border px-4 py-3.5 transition-all ${
                    isKids ? 'rounded-2xl' : 'rounded-[3px]'
                  } ${
                    active
                      ? `border-chili bg-[#EEF3E3] shadow-[inset_3px_0_0_#4C7031] ${isKids ? '-translate-y-0.5' : ''}`
                      : `border-paper-line hover:border-[#8B8578] ${isKids ? 'hover:-translate-y-0.5 hover:rotate-[0.4deg]' : ''}`
                  }`}
                >
                  <input
                    type="radio"
                    name="package"
                    value={p.id}
                    checked={active}
                    onChange={() => setSelectedId(p.id)}
                    className="sr-only"
                  />
                  {isKids && active && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-mustard text-paper flex items-center justify-center shadow-[0_2px_4px_rgba(39,52,24,0.3)] rotate-[8deg]"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                        <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" />
                      </svg>
                    </span>
                  )}
                  <span className="flex justify-between items-baseline gap-3">
                    <span className="font-sans font-bold text-[15px]">{p.name}</span>
                    <span className="font-mono text-[13px] text-chili-dark whitespace-nowrap">
                      {money(p.price)} <span className="text-[#948d76]">/ {isKids ? 'child' : pUnit}</span>
                    </span>
                  </span>
                  {p.description && (
                    <span className="block mt-1 text-[13px] text-[#5c5744]">{p.description}</span>
                  )}
                </label>
              );
            })}
          </div>
          {errors.package && <p className="font-mono text-[12px] text-chili-dark font-bold">{errors.package}</p>}
        </fieldset>

        {/* headcount + date */}
        <fieldset className="space-y-4">
          <legend className="font-mono text-[11px] tracking-[2px] uppercase text-[#948d76] mb-1">
            {stepNum()} — Headcount &amp; date
          </legend>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={headLabel} error={errors.headcount} hint={headHint}>
              <input type="number" inputMode="numeric" min={minQty} step="1"
                value={headcount} onChange={(e) => setHeadcount(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Event date" error={errors.eventDate} hint={`At least ${CATERING.noticeHours} hours ahead.`}>
              <input type="date" min={minDateISO()} value={form.eventDate} onChange={set('eventDate')} className={inputCls} />
            </Field>
            <Field label="Delivery / ready time" error={errors.eventTime}>
              <input type="time" value={form.eventTime} onChange={set('eventTime')} className={inputCls} />
            </Field>
            <Field label="Short on time? (optional)">
              <input type="text" value={form.timingNote} onChange={set('timingNote')} placeholder="e.g. event is tomorrow — can you help?" className={inputCls} />
            </Field>
          </div>
        </fieldset>

        {/* extras */}
        {showAddons && (
          <fieldset className="space-y-2">
            <legend className="font-mono text-[11px] tracking-[2px] uppercase text-[#948d76] mb-1">
              {stepNum()} — Extras <span className="text-[#b7ad8f]">(optional)</span>
            </legend>
            <div className="space-y-2">
              {CATERING_ADDONS.map((a) => {
                const on = selectedAddonIds.includes(a.id);
                return (
                  <label
                    key={a.id}
                    className={`flex items-start gap-3 rounded-[3px] border px-4 py-3 cursor-pointer transition-colors ${
                      on ? 'border-chili bg-[#EEF3E3]' : 'border-paper-line hover:border-[#8B8578]'
                    }`}
                  >
                    <input type="checkbox" checked={on} onChange={() => toggleAddon(a.id)} className="accent-chili mt-1" />
                    <span className="flex-1">
                      <span className="flex justify-between items-baseline gap-3">
                        <span className="font-sans font-bold text-[14px]">{a.name}</span>
                        <span className="font-mono text-[13px] text-chili-dark whitespace-nowrap">{money(a.price)} / guest</span>
                      </span>
                      <span className="block text-[13px] text-[#5c5744] mt-0.5">{a.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* delivery */}
        <fieldset className="space-y-3">
          <legend className="font-mono text-[11px] tracking-[2px] uppercase text-[#948d76] mb-1">
            {stepNum()} — Delivery
          </legend>
          <div className="flex gap-5 font-mono text-[13px]">
            {['Delivery', 'Pickup'].map((m) => (
              <label key={m} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="method" value={m} checked={method === m}
                  onChange={() => setMethod(m)} className="accent-chili" />
                {m === 'Delivery' ? `Delivery (within ${CATERING.delivery.radiusKm} km)` : 'Pickup from the bakehouse'}
              </label>
            ))}
          </div>
          {method === 'Delivery' && (
            <Field label="Delivery address" error={errors.address}
              hint={isKids
                ? `Free delivery within ${CATERING.delivery.radiusKm} km.`
                : `Free over ${formatMoney(CATERING.delivery.freeOverCents)}, otherwise a ${formatMoney(CATERING.delivery.flatFeeCents)} flat fee.`}>
              <input type="text" value={form.address} onChange={set('address')} autoComplete="street-address"
                placeholder="Venue / street, suburb, postcode" className={inputCls} />
            </Field>
          )}
        </fieldset>

        {/* contact */}
        <fieldset className="space-y-4">
          <legend className="font-mono text-[11px] tracking-[2px] uppercase text-[#948d76] mb-1">
            {stepNum()} — Your details
          </legend>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Contact name" error={errors.name}>
              <input type="text" value={form.name} onChange={set('name')} autoComplete="name" className={inputCls} />
            </Field>
            <Field label={isKids ? 'Camp / club / school (optional)' : 'Company / organisation (optional)'}>
              <input type="text" value={form.org} onChange={set('org')} autoComplete="organization" className={inputCls} />
            </Field>
            <Field label="Email" error={errors.email}>
              <input type="email" value={form.email} onChange={set('email')} autoComplete="email" className={inputCls} />
            </Field>
            <Field label="Phone" error={errors.phone}>
              <input type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" className={inputCls} />
            </Field>
          </div>
          <Field label="Allergies & dietary needs (optional)">
            <textarea value={form.dietary} onChange={set('dietary')} rows={2}
              placeholder="e.g. 2 gluten-free, 1 dairy-free, no nuts" className={`${inputCls} resize-y`} />
          </Field>
          <Field label="Anything else (optional)">
            <textarea value={form.notes} onChange={set('notes')} rows={2}
              placeholder="Access, where to drop, contact on the day…" className={`${inputCls} resize-y`} />
          </Field>
        </fieldset>
      </form>

      {/* docket */}
      <aside className={`relative bg-paper text-ink border border-paper-line p-6 lg:sticky lg:top-24 ${isKids ? 'rounded-2xl overflow-hidden' : 'rounded-[3px]'}`}>
        {isKids && (
          <div
            aria-hidden="true"
            className="absolute top-0 left-0 right-0 h-1.5 bg-[repeating-linear-gradient(45deg,#4C7031_0_10px,#C9992F_10px_20px)]"
          />
        )}
        <div className={`font-mono font-bold text-[13px] tracking-wide uppercase pb-3 border-b-2 border-ink mb-4 ${isKids ? 'pt-1.5' : ''}`}>
          Your docket
        </div>
        {!selected || !headcount || !quote ? (
          <p className="font-mono text-[12px] text-[#6b6552]">
            {!selected ? 'No package chosen yet.' : 'Add your headcount to see the total.'}
          </p>
        ) : (
          <div className="font-mono text-[13px] space-y-2">
            <Row label={`${selected.name}`} sub={`${money(selected.price)} x ${quote.heads} ${isKids ? 'children' : unit === 'bowl' ? 'bowls' : 'guests'}`} val={formatMoney(quote.foodCents)} />
            {activeAddons.map((a) => (
              <Row key={a.id} label={a.name} sub={`${money(a.price)} x ${quote.heads} guests`} val={formatMoney(dollarsToCents(a.price) * quote.heads)} />
            ))}
            <Row label={method === 'Delivery' ? (quote.deliveryCents ? 'Delivery' : 'Delivery (free)') : 'Pickup'} val={quote.deliveryCents ? formatMoney(quote.deliveryCents) : '$0.00'} muted={!quote.deliveryCents} />
            <div className="h-px bg-paper-line my-1" />
            <Row label="Total" val={formatMoney(quote.orderTotalCents)} strong />
            <Row label="incl. GST" val={formatMoney(Math.round(quote.orderTotalCents / 11))} muted />
            {!isKids && <Row label={`Deposit today (${CATERING.depositPercent}%)`} val={formatMoney(quote.chargeCents)} accent />}
          </div>
        )}

        <p className="mt-4 pt-3 border-t border-dashed border-paper-line text-[12px] leading-relaxed text-[#6b6552]">
          {isKids
            ? 'Pay in full by card on the next screen (Square). We email a receipt and pack every order to your headcount.'
            : `Pay the ${CATERING.depositPercent}% deposit by card on the next screen (Square). We confirm date & numbers; the balance is invoiced before your event.`}
        </p>

        {status && (
          <p className={`mt-3 font-mono text-[12px] ${status.type === 'error' ? 'text-chili-dark' : 'text-chili'}`}>
            {status.message}
          </p>
        )}

        <button type="button" onClick={handleSubmit} disabled={submitting}
          className={`mt-4 w-full bg-chili text-paper font-mono font-bold text-sm tracking-wide uppercase py-3 transition-all disabled:opacity-60 ${
            isKids
              ? 'rounded-full hover:bg-chili-dark hover:scale-[1.03] active:scale-[0.98]'
              : 'rounded-[2px] hover:bg-chili-dark'
          }`}>
          {submitting ? 'Starting checkout…' : isKids ? 'Pay & send order' : 'Pay deposit & send order'}
        </button>
      </aside>
    </div>
  );
}

const inputCls =
  'w-full font-sans text-[14px] text-ink bg-[#FBF4DE] border border-paper-line rounded-[2px] px-3 py-2 outline-none focus:border-chili focus:ring-1 focus:ring-chili';

function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className="block font-mono text-[11px] tracking-wide uppercase text-[#6b6552] mb-1">{label}</span>
      {children}
      {error ? (
        <span className="block font-mono text-[11px] text-chili-dark font-bold mt-1">{error}</span>
      ) : hint ? (
        <span className="block text-[11px] text-[#948d76] mt-1">{hint}</span>
      ) : null}
    </label>
  );
}

function Row({ label, sub, val, muted, strong, accent }) {
  return (
    <div className="flex justify-between items-baseline gap-3">
      <span className={muted ? 'text-[#948d76]' : ''}>
        {label}
        {sub && <span className="block text-[11px] text-[#948d76]">{sub}</span>}
      </span>
      <span className={`whitespace-nowrap tabular-nums ${strong ? 'font-bold text-[15px]' : ''} ${accent ? 'text-chili-dark font-bold' : ''} ${muted ? 'text-[#948d76]' : ''}`}>
        {val}
      </span>
    </div>
  );
}
