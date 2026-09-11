import { useState } from 'react';
import { useCart } from './CartContext';

const money = (cents) => `$${(cents / 100).toFixed(2)}`;

export default function CartDrawer() {
  const { items, updateQuantity, removeItem, subtotal, isOpen, setIsOpen } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');

  async function handleCheckout() {
    setError('');
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
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
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
