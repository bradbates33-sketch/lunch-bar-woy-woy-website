import { useState } from 'react';
import { useCart } from './CartContext';
import { getStatus, formatMinutes, minutesToTimeValue, timeValueToMinutes } from '../lib/hours';

const money = (cents) => `$${(cents / 100).toFixed(2)}`;

export default function CartDrawer() {
  const { items, updateQuantity, removeItem, subtotal, isOpen, setIsOpen } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');
  const [pickupChoice, setPickupChoice] = useState('asap'); // "asap" | "time"
  const [pickupTimeValue, setPickupTimeValue] = useState('');
  const [pickupDateValue, setPickupDateValue] = useState(''); // YYYY-MM-DD, '' = soonest day

  // Trading hours decide what's offered. Only worked out while the drawer is
  // showing a non-empty cart, i.e. always after hydration.
  const status = isOpen && items.length > 0 ? getStatus() : null;
  const effectiveChoice = status && !status.canAsap ? 'time' : pickupChoice;
  const selectedDay = status
    ? status.days.find((d) => d.dateISO === pickupDateValue) || status.days[0]
    : null;
  const dayPhrase = (d) => (d.isToday ? 'today' : d.label === 'Tomorrow' ? 'tomorrow' : `on ${d.fullLabel}`);
  const dayOptionLabel = (d) => (d.label === d.fullLabel ? d.label : `${d.label} (${d.fullLabel})`);

  async function handleCheckout() {
    setError('');
    const current = getStatus();
    const choice = current.canAsap ? pickupChoice : 'time';
    let day = null;
    if (choice === 'time') {
      day = current.days.find((d) => d.dateISO === pickupDateValue) || current.days[0];
      if (!day) {
        setError('Sorry, we can’t take pickup orders right now.');
        return;
      }
      const mins = timeValueToMinutes(pickupTimeValue);
      if (mins === null) {
        setError('Choose a pickup time.');
        return;
      }
      if (mins < day.window.from || mins > day.window.to) {
        setError(
          `Pickup times ${dayPhrase(day)} are between ` +
            `${formatMinutes(day.window.from)} and ${formatMinutes(day.window.to)}.`,
        );
        return;
      }
    }
    setCheckingOut(true);
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((l) => ({
            variationId: l.variationId,
            quantity: l.quantity,
            modifierIds: (l.modifiers || []).map((m) => m.id),
          })),
          pickupTime: choice === 'asap' ? 'asap' : pickupTimeValue,
          pickupDate: day ? day.dateISO : undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) {
        // 4xx errors carry a customer-readable reason (e.g. outside trading hours).
        if (response.status === 400 && data.error) {
          setError(data.error);
          setCheckingOut(false);
          return;
        }
        throw new Error('Checkout failed');
      }
      window.location.href = data.url;
    } catch (err) {
      setError('Something went wrong starting checkout. Please try again.');
      setCheckingOut(false);
    }
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[380px] bg-paper text-ink z-50 shadow-[-8px_0_24px_rgba(0,0,0,0.3)] transition-transform duration-200 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-dashed border-paper-line">
          <h3 className="font-mono font-bold text-sm tracking-wide uppercase">Your order</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="font-mono text-xs tracking-wide uppercase text-[#6b6552] hover:text-ink"
          >
            Close ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <p className="font-mono text-sm text-[#6b6552] text-center mt-10">
              Your docket is empty.
            </p>
          ) : (
            items.map((line) => {
              const detail = [line.variationLabel, ...(line.modifiers || []).map((m) => m.name)]
                .filter(Boolean)
                .join(' · ');
              return (
                <div
                  key={line.key}
                  className="flex justify-between items-start mb-5 pb-5 border-b border-dashed border-paper-line last:border-b-0"
                >
                  <div className="flex-1">
                    <div className="font-sans font-bold text-sm mb-0.5">{line.itemName}</div>
                    {detail && (
                      <div className="text-[11px] text-[#6b6552] mb-1.5 leading-snug">{detail}</div>
                    )}
                    <div className="font-mono text-xs text-chili-dark mb-2">
                      {money(line.unitPriceCents || 0)}
                    </div>
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <button
                        onClick={() => updateQuantity(line.key, line.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center border border-ink rounded-[2px] hover:bg-ink hover:text-paper"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span>{line.quantity}</span>
                      <button
                        onClick={() => updateQuantity(line.key, line.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center border border-ink rounded-[2px] hover:bg-ink hover:text-paper"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(line.key)}
                    className="font-mono text-[11px] text-[#948d76] hover:text-chili-dark ml-3"
                  >
                    Remove
                  </button>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-dashed border-paper-line">
            <div className="mb-4">
              <div className="font-mono text-[11px] tracking-wide uppercase text-[#6b6552] mb-2">
                Pickup time
              </div>
              {status && !status.open && (
                <p className="font-mono text-[12px] text-chili-dark mb-2">
                  {status.days[0] && status.days[0].isToday
                    ? 'We’re not open yet — choose a pickup time once we open.'
                    : 'We’re closed for today — choose a day and time below.'}
                </p>
              )}
              {status && status.open && !status.canAsap && (
                <p className="font-mono text-[12px] text-chili-dark mb-2">
                  We&apos;re about to close &mdash; choose another day and time below.
                </p>
              )}
              <div className="flex flex-col gap-2 font-mono text-[13px]">
                <label
                  className={`flex items-center gap-2 ${
                    status && !status.canAsap ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <input
                    type="radio"
                    name="pickup-time"
                    checked={effectiveChoice === 'asap'}
                    disabled={!!status && !status.canAsap}
                    onChange={() => setPickupChoice('asap')}
                    className="accent-chili"
                  />
                  ASAP (ready in ~15 min)
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pickup-time"
                    checked={effectiveChoice === 'time'}
                    onChange={() => setPickupChoice('time')}
                    className="accent-chili"
                  />
                  Choose a day &amp; time
                </label>
              </div>
              {effectiveChoice === 'time' && status && selectedDay && (
                <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                  <select
                    aria-label="Pickup day"
                    value={selectedDay.dateISO}
                    onChange={(e) => setPickupDateValue(e.target.value)}
                    className="w-full font-sans text-sm text-ink bg-[#FBF4DE] border border-paper-line rounded-[2px] px-3 py-2 outline-none focus:border-chili focus:ring-1 focus:ring-chili"
                  >
                    {status.days.map((d) => (
                      <option key={d.dateISO} value={d.dateISO}>
                        {dayOptionLabel(d)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    aria-label="Pickup time"
                    min={minutesToTimeValue(selectedDay.window.from)}
                    max={minutesToTimeValue(selectedDay.window.to)}
                    value={pickupTimeValue}
                    onChange={(e) => setPickupTimeValue(e.target.value)}
                    className="font-sans text-sm text-ink bg-[#FBF4DE] border border-paper-line rounded-[2px] px-3 py-2 outline-none focus:border-chili focus:ring-1 focus:ring-chili"
                  />
                  <p className="col-span-2 font-mono text-[11px] text-[#6b6552]">
                    Pickup {dayPhrase(selectedDay)} between {formatMinutes(selectedDay.window.from)} and{' '}
                    {formatMinutes(selectedDay.window.to)}.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between font-mono font-bold text-sm mb-4">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {error && <p className="text-xs text-chili-dark font-mono mb-3">{error}</p>}
            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="w-full bg-chili text-paper font-mono font-bold text-sm tracking-wide uppercase py-3 rounded-[2px] hover:bg-chili-dark transition-colors disabled:opacity-60"
            >
              {checkingOut ? 'Starting checkout…' : 'Checkout with Square →'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
