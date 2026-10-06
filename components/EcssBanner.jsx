import { useEffect, useState } from 'react';
import { ecssDeliveryOptions } from '../lib/ecssDelivery';
import { ECSS_CAMP } from '../lib/catering';

// Temporary notice on the menu page for the soccer camp coaches. Worked out in
// the browser (pages are cached), and gone once the delivery days have passed.
export default function EcssBanner() {
  const [options, setOptions] = useState([]);
  useEffect(() => setOptions(ecssDeliveryOptions()), []);
  if (options.length === 0) return null;

  const days = options.map((o) => o.label).join(' or ');
  return (
    <div className="mt-5 max-w-[640px] flex items-center gap-4 rounded-2xl bg-[#141414] border border-[#DEB663] px-4 py-3">
      <img src={ECSS_CAMP.logo} alt={`${ECSS_CAMP.school} logo`} width="56" height="56" className="w-14 h-14 shrink-0" />
      <p className="font-mono text-[12px] leading-relaxed text-white">
        <strong className="block text-[#DEB663] tracking-[1.5px] uppercase text-[11px]">
          {ECSS_CAMP.title} coaches
        </strong>
        Order lunch for delivery at {options[0].timeLabel} on {days}. Add your items, then choose
        &ldquo;{ECSS_CAMP.school} coaches&rdquo; in your cart.
      </p>
    </div>
  );
}
