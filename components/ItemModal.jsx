import { useEffect, useMemo, useState } from 'react';
import { useCart } from './CartContext';

const money = (cents) => `$${(cents / 100).toFixed(2)}`;

export default function ItemModal({ item, onClose }) {
  const { addLine } = useCart();
  const [variationId, setVariationId] = useState(item.variations[0].id);
  const [selected, setSelected] = useState(() => {
    const init = {};
    for (const ml of item.modifierLists) init[ml.id] = new Set();
    return init;
  });
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const variation =
    item.variations.find((v) => v.id === variationId) || item.variations[0];

  const chosenModifiers = useMemo(() => {
    const out = [];
    for (const ml of item.modifierLists) {
      for (const m of ml.modifiers) {
        if (selected[ml.id]?.has(m.id)) out.push(m);
      }
    }
    return out;
  }, [selected, item.modifierLists]);

  const unitPriceCents =
    (variation.priceCents ?? 0) +
    chosenModifiers.reduce((sum, m) => sum + (m.priceCents || 0), 0);

  const missing = item.modifierLists.filter(
    (ml) => (selected[ml.id]?.size || 0) < (ml.minSelected || 0),
  );

  function toggle(ml, modId) {
    setSelected((prev) => {
      const set = new Set(prev[ml.id]);
      if (ml.selectionType === 'SINGLE') {
        return { ...prev, [ml.id]: new Set([modId]) };
      }
      if (set.has(modId)) {
        set.delete(modId);
      } else {
        if (ml.maxSelected && set.size >= ml.maxSelected) return prev;
        set.add(modId);
      }
      return { ...prev, [ml.id]: set };
    });
  }

  function add() {
    if (missing.length) return;
    const modifiers = chosenModifiers.map((m) => ({
      id: m.id,
      name: m.name,
      priceCents: m.priceCents || 0,
    }));
    addLine({
      key: variationId + '|' + modifiers.map((m) => m.id).sort().join(','),
      variationId,
      itemName: item.name,
      variationLabel: item.variations.length > 1 ? variation.name : '',
      modifiers,
      unitPriceCents,
      quantity: qty,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink/60" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        className="relative bg-paper text-ink w-full sm:max-w-[440px] max-h-[86vh] overflow-y-auto rounded-t-[6px] sm:rounded-[4px] p-6 shadow-[0_-8px_30px_rgba(0,0,0,0.25)]"
      >
        <div className="flex justify-between items-start gap-4">
          <h3 className="font-sans font-bold text-lg">{item.name}</h3>
          <button
            onClick={onClose}
            className="font-mono text-xs tracking-wide uppercase text-[#6b6552] hover:text-ink shrink-0"
          >
            Close ✕
          </button>
        </div>
        {item.description && (
          <p className="text-[13px] text-[#5c5744] mt-1 mb-4">{item.description}</p>
        )}

        {item.variations.length > 1 && (
          <fieldset className="mb-5">
            <legend className="font-mono text-[11px] tracking-wide uppercase text-[#948d76] mb-2">
              Choose one
            </legend>
            {item.variations.map((v) => (
              <label
                key={v.id}
                className="flex justify-between items-center gap-3 py-2 border-b border-dashed border-paper-line last:border-b-0 cursor-pointer text-[14px]"
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="variation"
                    checked={variationId === v.id}
                    onChange={() => setVariationId(v.id)}
                    className="accent-chili"
                  />
                  {v.name}
                </span>
                <span className="font-mono text-[13px] text-chili-dark whitespace-nowrap">
                  {v.priceCents != null ? money(v.priceCents) : 'POA'}
                </span>
              </label>
            ))}
          </fieldset>
        )}

        {item.modifierLists.map((ml) => (
          <fieldset key={ml.id} className="mb-5">
            <legend className="font-mono text-[11px] tracking-wide uppercase text-[#948d76] mb-2">
              {ml.name}
              <span className="text-[#b7ad8f]">
                {ml.minSelected > 0
                  ? ' · required'
                  : ml.selectionType === 'MULTIPLE'
                  ? ` · up to ${ml.maxSelected}`
                  : ' · optional'}
              </span>
            </legend>
            {ml.modifiers.map((m) => (
              <label
                key={m.id}
                className="flex justify-between items-center gap-3 py-2 border-b border-dashed border-paper-line last:border-b-0 cursor-pointer text-[14px]"
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type={ml.selectionType === 'SINGLE' ? 'radio' : 'checkbox'}
                    name={ml.id}
                    checked={!!selected[ml.id]?.has(m.id)}
                    onChange={() => toggle(ml, m.id)}
                    className="accent-chili"
                  />
                  {m.name}
                </span>
                {m.priceCents > 0 && (
                  <span className="font-mono text-[13px] text-chili-dark whitespace-nowrap">
                    +{money(m.priceCents)}
                  </span>
                )}
              </label>
            ))}
          </fieldset>
        ))}

        <div className="flex items-center gap-4 mt-5">
          <div className="flex items-center gap-3 font-mono text-sm">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-7 h-7 flex items-center justify-center border border-ink rounded-[2px] hover:bg-ink hover:text-paper"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span aria-live="polite">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              className="w-7 h-7 flex items-center justify-center border border-ink rounded-[2px] hover:bg-ink hover:text-paper"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={add}
            disabled={missing.length > 0}
            className="flex-1 bg-chili text-paper font-mono font-bold text-sm tracking-wide uppercase py-3 rounded-[2px] hover:bg-chili-dark transition-colors disabled:opacity-50"
          >
            {missing.length
              ? `Choose ${missing[0].name}`
              : `Add — ${money(unitPriceCents * qty)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
