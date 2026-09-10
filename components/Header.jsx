import { useCart } from './CartContext';

export default function Header() {
  const { count, setIsOpen } = useCart();

  return (
    <header className="sticky top-0 z-30 bg-bg-dark border-b border-ink/10">
      <div className="max-w-[1120px] mx-auto flex items-center justify-between px-8 py-[18px]">
        <a href="/" className="flex items-center gap-3 font-mono font-bold text-[15px] tracking-wide uppercase text-ink">
          <img src="/logo.svg" alt="Lunch Bar Woy Woy" className="w-16 h-16" />
          Lunch Bar Woy Woy
        </a>
        <nav className="flex items-center gap-9 text-sm font-medium">
          <a href="/menu" className="hidden sm:inline text-ink/60 hover:text-ink transition-colors">
            Menu
          </a>
          <a href="/catering" className="hidden sm:inline text-ink/60 hover:text-ink transition-colors">
            Catering
          </a>
          <a href="/#about" className="hidden sm:inline text-ink/60 hover:text-ink transition-colors">
            About
          </a>
          <a href="/#location" className="hidden sm:inline text-ink/60 hover:text-ink transition-colors">
            Location
          </a>
          <button
            onClick={() => setIsOpen(true)}
            className="font-mono text-xs tracking-wide uppercase border border-ink text-ink px-4 py-[9px] rounded-[3px] hover:bg-ink hover:text-paper transition-colors"
          >
            Cart{count > 0 ? ` (${count})` : ''}
          </button>
        </nav>
      </div>
    </header>
  );
}
