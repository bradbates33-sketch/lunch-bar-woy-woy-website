import useOpenStatus from './useOpenStatus';
import { HOURS, formatMinutes } from '../lib/hours';
import { SITE } from '../lib/site';

const span = ([open, close]) => `${formatMinutes(open)} – ${formatMinutes(close)}`;

export default function HoursCard() {
  const status = useOpenStatus();
  const closed = status && !status.open;
  const today = status ? status.now.dow : null;
  const rowCls = (days) =>
    `flex justify-between text-[13.5px] py-[9px] ${days.includes(today) ? 'font-bold text-chili-dark' : ''}`;

  return (
    <div className="bg-paper text-ink border border-paper-line rounded-[3px] pt-[30px] px-[30px] pb-[26px]">
      <h3 className="font-mono text-[13px] tracking-wide uppercase mb-[18px] flex items-center gap-2.5">
        <span
          className={`w-2 h-2 rounded-full ${
            closed
              ? 'bg-ink/40 shadow-[0_0_0_3px_rgba(39,52,24,0.12)]'
              : 'bg-chili shadow-[0_0_0_3px_rgba(76,112,49,0.22)]'
          }`}
        />
        {status ? status.headline : 'Opening hours'}
      </h3>

      <div className={`${rowCls([1, 2, 3, 4, 5])} border-b border-dashed border-paper-line`}>
        <span>Mon &ndash; Fri</span>
        <span>{span(HOURS[1])}</span>
      </div>
      <div className={`${rowCls([6])} border-b border-dashed border-paper-line`}>
        <span>Saturday</span>
        <span>{span(HOURS[6])}</span>
      </div>
      <div className={rowCls([0])}>
        <span>Sunday</span>
        <span>{span(HOURS[0])}</span>
      </div>

      <div className="mt-5 pt-[18px] border-t border-paper-line font-mono text-[13px] flex flex-col gap-1.5 text-[#4a4636]">
        <span>
          {SITE.address.street.replace('Road', 'Rd')}, {SITE.address.locality} {SITE.address.region}{' '}
          {SITE.address.postcode}
        </span>
        <span>{SITE.phone}</span>
      </div>
      <a
        href={SITE.phoneHref}
        className="mt-[18px] block text-center w-full bg-ink text-paper font-mono text-xs tracking-wide uppercase py-3 rounded-[2px] hover:bg-chili transition-colors"
      >
        Call the shop
      </a>
    </div>
  );
}
