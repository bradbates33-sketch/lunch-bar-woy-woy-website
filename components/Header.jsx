export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-bg-dark border-b border-paper/10">
      <div className="max-w-[1120px] mx-auto flex items-center justify-between px-8 py-[18px]">
        <div className="flex items-center gap-2.5 font-mono font-bold text-[15px] tracking-wide uppercase">
          <span className="w-[30px] h-[30px] rounded-full border border-[1.5px] border-paper flex items-center justify-center text-[13px]">
            🥪
          </span>
          Lunch Bar Woy Woy
        </div>
        <nav className="flex items-center gap-9 text-sm font-medium">
          <a href="#menu" className="hidden sm:inline text-paper/60 hover:text-paper transition-colors">
            Menu
          </a>
          <a href="#about" className="hidden sm:inline text-paper/60 hover:text-paper transition-colors">
            About
          </a>
          <a href="#location" className="hidden sm:inline text-paper/60 hover:text-paper transition-colors">
            Location
          </a>
          <a
            href="#menu"
            className="font-mono text-xs tracking-wide uppercase border border-paper text-paper px-4 py-[9px] rounded-[3px] hover:bg-paper hover:text-ink transition-colors"
          >
            Order pickup
          </a>
        </nav>
      </div>
    </header>
  );
}
