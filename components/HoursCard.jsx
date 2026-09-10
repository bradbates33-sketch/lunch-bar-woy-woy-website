export default function HoursCard() {
  return (
    <div className="bg-paper text-ink border border-paper-line rounded-[3px] pt-[30px] px-[30px] pb-[26px]">
      <h3 className="font-mono text-[13px] tracking-wide uppercase mb-[18px] flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-chili shadow-[0_0_0_3px_rgba(76,112,49,0.22)]" />
        Open today until 2:00pm
      </h3>

      <div className="flex justify-between text-[13.5px] py-[9px] border-b border-dashed border-paper-line font-bold text-chili-dark">
        <span>Mon – Fri</span>
        <span>6:00am – 2:00pm</span>
      </div>
      <div className="flex justify-between text-[13.5px] py-[9px] border-b border-dashed border-paper-line">
        <span>Saturday</span>
        <span>8:00am – 1:00pm</span>
      </div>
      <div className="flex justify-between text-[13.5px] py-[9px]">
        <span>Sunday</span>
        <span>8:00am – 12:00pm</span>
      </div>

      <div className="mt-5 pt-[18px] border-t border-paper-line font-mono text-[13px] flex flex-col gap-1.5 text-[#4a4636]">
        <span>35 Blackwall Rd, Woy Woy NSW 2256</span>
        <span>0422 430 033</span>
      </div>
      <a
        href="tel:0422430033"
        className="mt-[18px] block text-center w-full bg-ink text-paper font-mono text-xs tracking-wide uppercase py-3 rounded-[2px] hover:bg-chili transition-colors"
      >
        Call the shop
      </a>
    </div>
  );
}
