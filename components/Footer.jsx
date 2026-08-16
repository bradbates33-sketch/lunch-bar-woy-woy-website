export default function Footer() {
  return (
    <footer className="bg-ink px-8 pt-12 pb-7">
      <div className="max-w-[1120px] mx-auto flex flex-wrap justify-between gap-8 pb-7 border-b border-paper/10">
        <div>
          <h4 className="font-mono text-[11px] tracking-[1.5px] uppercase text-mustard mb-3.5">
            Lunch Bar Woy Woy
          </h4>
          <p className="text-[13.5px] text-paper/60 leading-relaxed">
            12 Blackwall Rd
            <br />
            Woy Woy NSW 2256
          </p>
        </div>
        <div>
          <h4 className="font-mono text-[11px] tracking-[1.5px] uppercase text-mustard mb-3.5">Menu</h4>
          <a href="#menu" className="block text-[13.5px] text-paper/60 hover:text-paper mb-2">
            Rolls &amp; sandwiches
          </a>
          <a href="#menu" className="block text-[13.5px] text-paper/60 hover:text-paper mb-2">
            Coffee
          </a>
          <a href="#menu" className="block text-[13.5px] text-paper/60 hover:text-paper mb-2">
            Specials
          </a>
        </div>
        <div>
          <h4 className="font-mono text-[11px] tracking-[1.5px] uppercase text-mustard mb-3.5">Shop</h4>
          <a href="#about" className="block text-[13.5px] text-paper/60 hover:text-paper mb-2">
            Our story
          </a>
          <a href="#location" className="block text-[13.5px] text-paper/60 hover:text-paper mb-2">
            Location &amp; hours
          </a>
          <a href="#menu" className="block text-[13.5px] text-paper/60 hover:text-paper mb-2">
            Order pickup
          </a>
        </div>
        <div>
          <h4 className="font-mono text-[11px] tracking-[1.5px] uppercase text-mustard mb-3.5">Follow</h4>
          <a href="#" className="block text-[13.5px] text-paper/60 hover:text-paper mb-2">
            Instagram
          </a>
          <a href="#" className="block text-[13.5px] text-paper/60 hover:text-paper mb-2">
            Facebook
          </a>
        </div>
      </div>
      <div className="max-w-[1120px] mx-auto pt-5 flex flex-wrap justify-between gap-2.5 font-mono text-[11px] text-paper/60 tracking-wide">
        <span>© 2026 Lunch Bar Woy Woy</span>
        <span>Woy Woy, NSW, Australia</span>
      </div>
    </footer>
  );
}
