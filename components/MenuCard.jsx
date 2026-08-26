export default function MenuCard({ item }) {
  return (
    <div
      className="group relative bg-paper text-ink rounded-[3px] pt-[22px] px-[22px] pb-6
        transition-transform hover:-translate-y-1 hover:shadow-[0_10px_0_rgba(0,0,0,0.18)]
        before:content-[''] before:absolute before:-top-1.5 before:left-0 before:right-0 before:h-3
        before:bg-[radial-gradient(circle,_#232B1D_3px,_transparent_3.2px)]
        before:[background-size:18px_12px] before:[background-position:9px_0] before:bg-repeat-x"
    >
      <div className="font-mono text-[11px] text-[#948d76] tracking-wide mb-2.5">No. {item.number}</div>
      <h3 className="font-sans font-bold text-[17px] mb-2">{item.name}</h3>
      <p className="text-[13.5px] text-[#5c5744] mb-[18px]">{item.description}</p>
      <div className="flex justify-between items-center border-t border-dashed border-paper-line pt-3.5">
        <span className="font-mono font-bold text-[15px] text-chili-dark">
          {item.price ? `$${item.price}` : 'POA'}
        </span>
        <span className="font-mono text-[11px] tracking-wide uppercase bg-ink text-paper px-3 py-2 rounded-[2px] transition-colors group-hover:bg-chili">
          Add +
        </span>
      </div>
    </div>
  );
}

