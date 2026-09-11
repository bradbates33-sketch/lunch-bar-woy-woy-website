import { useState } from 'react';
import { useCart } from './CartContext';

const NAV_LINKS = [
  { href: '/menu', label: 'Menu' },
  { href: '/catering', label: 'Catering' },
  { href: '/kids-catering', label: 'Kids Catering' },
  { href: '/#about', label: 'About' },
  { href: '/#location', label: 'Location' },
];

export default function Header() {
  const { count, setIsOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-bg-dark border-b border-ink/10">
      <div className="max-w-[1120px] mx-auto flex items-center justify-between px-6 sm:px-8 py-[18px]">
        <a href="/" className="flex items-center gap-3 font-mono font-bold text-[15px] tracking-wide uppercase text-ink">
          <img src="/logo.svg" alt="Lunch Bar Woy Woy" className="w-16 h-16" />
          Lunch Bar Woy Woy
        </a>
        <nav className="flex items-center gap-6 md:gap-8 text-sm font-medium">
          <a href="/menu" className="hidden sm:inline text-ink/60 hover:text-ink transition-colors">
            Menu
          </a>
          <a href="/catering" className="hidden sm:inline text-ink/60 hover:text-ink transition-colors">
            Catering
          </a>
          <a href="/kids-catering" className="hidden sm:inline text-ink/60 hover:text-ink transition-colors">
            Kids Catering
          </a>
          <a href="/#about" className="hidden lg:inline text-ink/60 hover:text-ink transition-colors">
            About
          </a>
          <a href="/#location" className="hidden md:inline text-ink/60 hover:text-ink transition-colors">
            Location
          </a>
          <button
            onClick={() => setIsOpen(true)}
            className="font-mono text-xs tracking-wide uppercase border border-ink text-ink px-4 py-[9px] rounded-[3px] hover:bg-ink hover:text-paper transition-colors"
          >
            Cart{count > 0 ? ` (${count})` : ''}
          </button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="sm:hidden flex flex-col justify-center gap-[5px] w-8 h-8 shrink-0"
          >
            <span className={`block h-[2px] w-6 bg-ink transition-transform ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
            <span className={`block h-[2px] w-6 bg-ink transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-[2px] w-6 bg-ink transition-transform ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
          </button>
        </nav>
      </div>

      {menuOpen && (
        <nav className="sm:hidden border-t border-ink/10 px-6 py-2 flex flex-col text-sm font-medium">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="text-ink/80 hover:text-ink py-3 border-b border-ink/10 last:border-b-0"
            >
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
