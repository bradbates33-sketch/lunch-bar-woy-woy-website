// Black-and-white stencil-style illustrations for the menu, drawn as SVG.
//
// Style: solid black shapes with white cut-outs and gaps, like a cut stencil.
// Every drawing lives on a 200 x 150 canvas, black = #111, white = #fff.
//
// To change which drawing an item uses, edit RULES at the bottom (matched
// against the item's name, first match wins). To add a drawing, add an entry
// to ART and point a rule at it.

const K = '#111';
const W = '#fff';

// ---- tiny drawing helpers -------------------------------------------------
const line = (d, w = 4, c = W) =>
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const blk = (d) => `<path d="${d}" fill="${K}"/>`;
const wht = (d, w = 4) => `<path d="${d}" fill="${W}" stroke="${K}" stroke-width="${w}" stroke-linejoin="round"/>`;
const dot = (x, y, r, c = K) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
const ell = (cx, cy, rx, ry, fill = K, stroke = 'none', sw = 0, rot = 0) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${
    rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''
  }/>`;
const rect = (x, y, w, h, r = 0, fill = K, stroke = 'none', sw = 0, rot = 0) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${
    rot ? ` transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"` : ''
  }/>`;
const steam = (x, y) => line(`M${x} ${y}q-7-7 0-14t0-14`, 5, K);
const star = (cx, cy, n, ro, ri, fill = K) => {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? ro : ri;
    const a = (Math.PI * i) / n - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}"/>`;
};
// scale a group about the bottom-centre of the canvas
const scaled = (s, inner, ox = 100, oy = 134) =>
  `<g transform="translate(${ox} ${oy}) scale(${s}) translate(${-ox} ${-oy})">${inner}</g>`;

// ---- shared builders ------------------------------------------------------
function cup({ s = 1, art = 'heart', steams = true } = {}) {
  let out = '';
  out += ell(100, 126, 56, 10); // saucer
  out += line('M62 126Q100 135 138 126', 3);
  out += line('M138 78Q168 72 162 98Q156 114 128 108', 10, K); // handle
  out += blk('M60 64H140Q140 120 100 122Q60 120 60 64Z'); // body
  out += line('M72 80Q73 100 84 112', 4); // highlight
  out += ell(100, 64, 40, 8, W, K, 3); // rim
  out += ell(100, 65, 32, 5.5); // coffee
  if (art === 'heart') out += `<path d="M100 69q-9-7-4-11q3-2 4 1q1-3 4-1q5 4-4 11z" fill="${W}"/>`;
  if (art === 'froth') {
    out += ell(100, 62, 32, 6, W, K, 3);
    out += wht('M72 60Q70 44 86 46Q92 34 108 40Q124 38 126 52Q132 62 120 62H80Q70 64 72 60Z');
    out += dot(88, 56, 2) + dot(102, 50, 2) + dot(114, 57, 2) + dot(96, 58, 1.6);
    out += rect(104, 40, 14, 12, 4, W, K, 3, 12); // marshmallow
  }
  if (steams) out += steam(86, 50) + steam(104, 44) + steam(120, 50);
  return scaled(s, out);
}

function mug({ s = 1, topping = 'coffee' } = {}) {
  let out = '';
  out += line('M140 62H154Q172 62 172 84Q172 106 152 106H140', 11, K); // handle
  out += blk('M52 50H140V108Q140 132 116 132H76Q52 132 52 108Z'); // body
  out += line('M52 84H140M52 96H140', 4); // bands
  out += line('M64 60V110', 5); // highlight
  out += ell(96, 50, 42, 8, W, K, 3); // rim
  out += ell(96, 51, 36, 5.5); // drink
  if (topping === 'marshmallow') {
    out += rect(70, 34, 20, 18, 5, W, K, 4, -8);
    out += rect(94, 30, 22, 20, 5, W, K, 4, 6);
    out += rect(116, 36, 18, 16, 5, W, K, 4, -4);
  } else {
    out += steam(82, 38) + steam(100, 32) + steam(116, 38);
  }
  return scaled(s, out);
}

function takeaway() {
  let out = '';
  out += blk('M70 54L76 130Q77 134 82 134H118Q123 134 124 130L130 54Z'); // cup
  out += rect(68, 76, 64, 34, 3, W, K, 4); // sleeve
  out += line('M76 88H124M76 98H124', 3, K);
  out += rect(62, 44, 76, 12, 5); // lid
  out += blk('M78 44Q78 30 100 30Q122 30 122 44Z');
  out += line('M92 37H108', 4);
  out += steam(90, 24).replace('stroke-width="5"', 'stroke-width="4"');
  return out;
}

// tumbler: top y=40 (half-width 32), bottom y=132 (half-width 22)
const gl = (y) => 68 + ((y - 40) * 10) / 92;
const gr = (y) => 200 - gl(y);
function glass({ level = 60, ice = 0, straw = false, topping = '', dots = false, layer = null } = {}) {
  let out = '';
  out += `<path d="M68 40L78 128Q79 132 84 132H116Q121 132 122 128L132 40Z" fill="${W}" stroke="${K}" stroke-width="5" stroke-linejoin="round"/>`;
  const x1 = gl(level) + 3;
  const x2 = gr(level) - 3;
  out += blk(`M${x1} ${level}H${x2}L119 126Q119 128 116 128H84Q81 128 81 126Z`);
  if (layer) {
    // white band inside the liquid (milk / cream)
    out += `<path d="M${gl(layer) + 3} ${layer}Q100 ${layer - 8} ${gr(layer) - 3} ${layer}" fill="none" stroke="${W}" stroke-width="5" stroke-linecap="round"/>`;
  }
  if (dots) {
    for (let i = 0; i < 9; i++) out += dot(86 + ((i * 17) % 28), level + 12 + ((i * 13) % 52), 2, W);
  }
  for (let i = 0; i < ice; i++) {
    const cx = 88 + i * 13 + (i % 2) * 3;
    const cy = level + 6 + (i % 2) * 14;
    out += rect(cx - 7, cy - 7, 14, 14, 3, W, 'none', 0, 18 * (i % 2 ? 1 : -1) + i * 7);
  }
  if (straw) {
    out += line('M104 78L124 8', 8, K);
    out += line('M104 78L108 64', 3.2, W);
    out += line('M114 44L117 32', 3, W);
  }
  out += topping;
  return out;
}

function bottle({ label = 'drop', cap = 'plain' } = {}) {
  let out = '';
  out += blk('M90 20H110V32Q110 44 122 58Q128 66 128 82V124Q128 134 118 134H82Q72 134 72 124V82Q72 66 78 58Q90 44 90 32Z');
  out += rect(88, 8, 24, 12, 3);
  if (cap === 'swing') out += line('M112 14Q134 12 134 34', 4, K);
  out += rect(72, 84, 56, 32, 0, W);
  if (label === 'drop') out += blk('M100 90Q88 104 100 112Q112 104 100 90Z');
  if (label === 'leaf') out += blk('M92 112Q84 96 106 90Q112 106 92 112Z') + line('M92 112L104 96', 2.5, W);
  if (label === 'stars') out += star(100, 100, 4, 11, 4);
  if (label === 'bubbles') {
    out += dot(86, 70, 3, W) + dot(114, 66, 2.5, W) + dot(100, 74, 3.5, W) + dot(112, 76, 2, W) + dot(90, 62, 2, W);
    out += star(100, 100, 4, 11, 4);
  }
  return out;
}

function can({ zero = false } = {}) {
  let out = '';
  out += blk('M74 38Q74 30 82 30H118Q126 30 126 38V124Q126 132 118 132H82Q74 132 74 124Z');
  out += line('M74 42H126M74 120H126', 3);
  out += wht('M74 68Q100 52 126 74V94Q100 74 74 88Z', 0).replace(`stroke="${K}" stroke-width="0"`, 'stroke="none"');
  out += ell(100, 34, 9, 3.5, W);
  if (zero) out += `<ellipse cx="100" cy="108" rx="7" ry="9" fill="none" stroke="${W}" stroke-width="4"/>`;
  else out += star(100, 108, 5, 9, 4, W);
  return out;
}

// A croissant is five overlapping lobes with white gaps between them.
function croissantBody() {
  const lobe = (cx, cy, rx, ry, rot) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${K}" stroke="${W}" stroke-width="4" transform="rotate(${rot} ${cx} ${cy})"/>`;
  return (
    lobe(36, 104, 18, 11, -62) +
    lobe(164, 104, 18, 11, 62) +
    lobe(58, 80, 25, 18, -32) +
    lobe(142, 80, 25, 18, 32) +
    lobe(100, 66, 31, 23, 0) +
    line('M82 56Q100 46 118 56', 3.5) +
    line('M60 74Q52 80 50 90', 3)
  );
}

const ART = {
  // ---- hot drinks
  espresso: cup({ s: 0.78, art: 'none' }),
  latte: cup({ s: 1 }),
  takeaway: takeaway(),
  mug: mug({ s: 1 }),
  hotChoc: mug({ s: 0.92, topping: 'marshmallow' }),
  babyccino: cup({ s: 0.8, art: 'froth', steams: false }),
  chai: (() => {
    let out = cup({ s: 1, art: 'none', steams: false });
    out += rect(94, 12, 9, 64, 4, K, 'none', 0, 12) + line('M96 24L102 22M95 38L101 36M94 52L100 50', 2.5, W);
    out += rect(104, 8, 9, 64, 4, K, 'none', 0, 22);
    out += star(158, 128, 8, 11, 5) + dot(158, 128, 3, W);
    return out;
  })(),
  teapot:
    line('M56 80Q22 76 26 106Q30 130 62 118', 11, K) +
    blk('M126 98Q152 98 154 66L168 62Q172 112 130 122Z') +
    ell(92, 92, 40, 38) +
    blk('M64 58Q92 30 120 58Z') +
    line('M60 62Q92 50 124 62', 4) +
    dot(92, 34, 7) +
    line('M56 94Q92 112 128 94', 4) +
    star(92, 100, 5, 8, 3.4, W) +
    rect(62, 126, 60, 9, 4.5),
  matcha:
    scaled(
      0.92,
      blk('M44 70H156Q156 124 100 128Q44 124 44 70Z') +
        ell(100, 70, 56, 10, W, K, 4) +
        ell(100, 71, 48, 7) +
        line('M78 70Q88 66 98 70T118 70', 2.5, W) +
        blk('M100 112Q76 100 84 82Q106 86 100 112Z').replace(`fill="${K}"`, `fill="${W}"`) +
        line('M88 98L98 108', 2.5, K) +
        rect(166, 58, 10, 38, 3) +
        line('M171 62V92', 2, W) +
        blk('M160 98Q171 136 182 98Z') +
        line('M167 104L169 126M175 104L173 126', 2, W),
      100,
      134,
    ),

  // ---- cold drinks
  iced: glass({ level: 64, ice: 3, straw: true, layer: 90 }),
  coldBrew: glass({ level: 54, ice: 5 }),
  frappe: glass({
    level: 78,
    straw: true,
    layer: 100,
    topping:
      // whipped cream cloud + drizzle
      `<g>${[84, 100, 116].map((x, i) => `<circle cx="${x}" cy="${34 - (i === 1 ? 6 : 0)}" r="${i === 1 ? 17 : 14}" fill="none" stroke="${K}" stroke-width="4"/>`).join('')}${[84, 100, 116]
        .map((x, i) => `<circle cx="${x}" cy="${34 - (i === 1 ? 6 : 0)}" r="${(i === 1 ? 17 : 14) - 2}" fill="${W}"/>`)
        .join('')}</g>` +
      line('M78 38Q90 30 100 36T122 36', 3, K) +
      line('M92 18Q100 10 108 18', 3, K),
  }),
  juice: glass({
    level: 52,
    dots: true,
    straw: true,
    topping:
      `<circle cx="132" cy="44" r="22" fill="${W}" stroke="${K}" stroke-width="5"/>` +
      `<circle cx="132" cy="44" r="14" fill="${K}"/>` +
      [0, 1, 2, 3, 4, 5].map((i) => line(`M132 44L${(132 + 14 * Math.cos((i * Math.PI) / 3)).toFixed(1)} ${(44 + 14 * Math.sin((i * Math.PI) / 3)).toFixed(1)}`, 2.5, W)).join(''),
  }),
  smoothie: glass({
    level: 50,
    straw: true,
    layer: 78,
    topping:
      blk('M132 38Q116 34 116 54Q118 74 132 82Q146 74 148 54Q148 34 132 38Z') +
      [[126, 52], [138, 52], [132, 62], [126, 70], [138, 70], [132, 46]].map(([x, y]) => dot(x, y, 2, W)).join('') +
      blk('M122 36L132 24L142 36Z'),
  }),
  milkshake: glass({
    level: 70,
    dots: true,
    straw: true,
    topping:
      [82, 100, 118].map((x, i) => `<circle cx="${x}" cy="${36 - (i === 1 ? 6 : 0)}" r="${i === 1 ? 17 : 14}" fill="none" stroke="${K}" stroke-width="4"/>`).join('') +
      [82, 100, 118].map((x, i) => `<circle cx="${x}" cy="${36 - (i === 1 ? 6 : 0)}" r="${(i === 1 ? 17 : 14) - 2}" fill="${W}"/>`).join('') +
      dot(100, 14, 8) +
      line('M100 8Q104 0 112 2', 2.5, K),
  }),
  water: bottle({ label: 'drop' }),
  sparkling: bottle({ label: 'bubbles' }),
  kombucha: bottle({ label: 'leaf', cap: 'swing' }),
  can: can(),
  canZero: can({ zero: true }),

  // ---- baked goods + breakfast
  croissant: `<g transform="translate(0 14)">${croissantBody()}</g>`,
  hamCroissant:
    wht('M58 84H142V104Q130 116 118 106T94 106T70 108Q60 108 58 100Z', 5) +
    line('M72 96Q86 104 100 96T128 96', 3, K) +
    `<g transform="translate(0 -6)">${croissantBody()}</g>`,
  toast:
    blk('M56 64Q52 38 84 40Q100 30 116 40Q148 38 144 64Q150 74 140 82V122Q140 128 134 128H66Q60 128 60 122V82Q50 74 56 64Z') +
    `<path d="M72 68Q70 54 88 54Q100 48 112 54Q130 54 128 68Q132 76 126 82V116H74V82Q68 76 72 68Z" fill="${W}"/>` +
    dot(86, 72, 2) + dot(104, 66, 2) + dot(118, 78, 2) + dot(92, 92, 2) + dot(112, 100, 2) + dot(84, 106, 2) +
    rect(88, 80, 28, 18, 4, K, 'none', 0, -8) +
    line('M92 86L108 83', 2.5, W),
  avoToast:
    blk('M56 64Q52 38 84 40Q100 30 116 40Q148 38 144 64Q150 74 140 82V122Q140 128 134 128H66Q60 128 60 122V82Q50 74 56 64Z') +
    `<path d="M72 68Q70 54 88 54Q100 48 112 54Q130 54 128 68Q132 76 126 82V116H74V82Q68 76 72 68Z" fill="${W}"/>` +
    blk('M68 78Q66 64 84 66Q98 58 114 66Q132 64 130 80Q136 94 124 104Q112 114 92 110Q70 110 70 96Q60 88 68 78Z') +
    line('M80 78Q92 72 104 78', 3) +
    ell(88, 94, 3.4, 2, W, 'none', 0, -20) + ell(110, 90, 3.4, 2, W, 'none', 0, 25) + ell(100, 102, 3.4, 2, W, 'none', 0, 5) +
    dot(118, 76, 2.2, W) + dot(80, 88, 2.2, W),
  eggRoll:
    blk('M30 76Q30 38 100 38Q170 38 170 76Z') +
    [[70, 54], [92, 48], [114, 52], [136, 58], [100, 62], [78, 66]].map(([x, y], i) => ell(x, y, 4.5, 2.4, W, 'none', 0, i * 25)).join('') +
    line('M24 90q11-10 22 0t22 0t22 0t22 0t22 0t22 0t20 0', 9, K) +
    wht('M56 82Q72 70 100 78Q128 72 146 84Q152 98 130 100Q108 108 86 100Q58 102 56 90Z') +
    dot(84, 90, 6) + dot(82, 88, 1.8, W) +
    blk('M30 106Q30 134 100 134Q170 134 170 106Z'),
  wrap:
    `<g transform="rotate(-16 100 78)">` +
    `<path d="M70 48H138Q152 48 152 76Q152 104 138 104H70Z" fill="${W}" stroke="${K}" stroke-width="5" stroke-linejoin="round"/>` +
    `<ellipse cx="152" cy="76" rx="13" ry="28" fill="${W}" stroke="${K}" stroke-width="5"/>` +
    dot(150, 62, 7) + dot(155, 80, 8) + dot(148, 92, 4.5) +
    blk('M26 52Q26 44 34 44H92V108H34Q26 108 26 100Z') +
    line('M44 44L36 108M60 44L52 108M76 44L68 108', 4) +
    `</g>`,
  muffin:
    blk('M44 64Q44 34 100 34Q156 34 156 64Z') +
    dot(78, 48, 2.6, W) + dot(96, 42, 2.6, W) + dot(116, 46, 2.6, W) + dot(90, 56, 2.6, W) + dot(112, 57, 2.6, W) + dot(132, 54, 2.6, W) +
    ell(100, 78, 54, 9, W, K, 4) +
    dot(118, 78, 7) + dot(116, 76, 1.8, W) +
    blk('M48 90H152L142 106L128 94H72L58 106Z') +
    blk('M44 112H156Q158 134 100 134Q42 134 44 112Z') +
    dot(74, 122, 2.6, W) + dot(100, 126, 2.6, W) + dot(128, 122, 2.6, W),
  burger:
    blk('M42 62Q42 26 100 26Q158 26 158 62Z') +
    [[78, 42], [100, 36], [122, 42], [90, 52], [112, 52]].map(([x, y], i) => ell(x, y, 4.2, 2.3, W, 'none', 0, i * 35)).join('') +
    blk('M36 70q9 9 18 0t18 0t18 0t18 0t18 0t18 0t18 0v8H36Z') +
    rect(44, 86, 112, 20, 10) +
    line('M60 96H74M92 96H108M126 96H140', 3) +
    blk('M46 84H154V90L146 100L138 90H62L54 100L46 90Z') +
    line('M46 93H154', 3) +
    blk('M44 112H156Q156 134 134 134H66Q44 134 44 112Z'),
  blt:
    line('M100 6V36', 3, K) +
    blk('M100 6L116 12L100 18Z') +
    rect(46, 36, 108, 26, 9) +
    line('M60 49H140', 3) +
    blk('M40 68q9 9 18 0t18 0t18 0t18 0t18 0t18 0t18 0v8H40Z') +
    ell(74, 90, 24, 8) + ell(126, 90, 24, 8) +
    line('M58 90H90M110 90H142', 3) +
    line('M44 104q11-9 22 0t22 0t22 0t22 0t22 0t22 0', 9, K) +
    rect(46, 114, 108, 22, 9) +
    line('M60 125H140', 3),
  benny:
    blk('M48 112H152Q154 132 100 132Q46 132 48 112Z') +
    dot(72, 122, 2.6, W) + dot(100, 126, 2.6, W) + dot(128, 122, 2.6, W) +
    blk('M44 96q14 8 28 0t28 0t28 0t28 0V108H44Z') +
    `<path d="M56 92Q52 52 100 48Q148 52 144 92Q120 102 100 96Q76 102 56 92Z" fill="${W}" stroke="${K}" stroke-width="5" stroke-linejoin="round"/>` +
    dot(100, 70, 15) + dot(95, 65, 3.4, W) +
    dot(76, 84, 2) + dot(124, 82, 2) + dot(110, 90, 2),
  friedEggs:
    ell(88, 78, 58, 58) +
    rect(138, 72, 52, 14, 7) +
    `<circle cx="88" cy="78" r="50" fill="none" stroke="${W}" stroke-width="3"/>` +
    `<path d="M56 62Q60 42 84 46Q106 42 106 64Q110 84 88 88Q62 92 56 62Z" fill="${W}"/>` +
    dot(80, 66, 12) + dot(76, 62, 3.4, W) +
    `<path d="M100 86Q104 72 120 74Q138 74 136 90Q134 104 114 104Q98 102 100 86Z" fill="${W}"/>` +
    dot(118, 88, 8) + dot(115, 85, 2.4, W),
  pancakes:
    rect(46, 98, 108, 26, 13, W, K, 5) +
    rect(50, 74, 100, 24, 12, W, K, 5) +
    rect(54, 52, 92, 22, 11, W, K, 5) +
    blk('M54 58Q56 44 100 44Q144 44 146 58H134V74Q134 82 127 74V60H108V68Q108 76 100 68V60H80V80Q80 88 72 80V60H54Z') +
    rect(88, 26, 24, 16, 3, W, K, 4, -6) +
    line('M64 112H90M104 112H138', 3, K),

  // ---- lunch
  gyros:
    // fillings first, so the folded pita sits in front of them
    blk('M34 84Q44 40 78 52Q74 76 52 90Z') +
    blk('M74 74Q86 26 118 38Q114 68 92 78Z') +
    blk('M116 72Q132 34 164 56Q154 80 134 82Z') +
    wht('M44 82q6-14 15-5q6-14 16-4q8-12 15-2q8-10 14 3q8-8 12 4q8-4 10 8Q100 92 44 82Z', 4) +
    `<path d="M26 88H174Q168 136 100 138Q32 136 26 88Z" fill="${W}" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>` +
    line('M42 104Q100 120 158 104', 4, K) +
    dot(70, 122, 2.6) + dot(100, 128, 2.6) + dot(130, 122, 2.6) +
    `<circle cx="126" cy="70" r="9" fill="${W}" stroke="${K}" stroke-width="4"/>` +
    `<circle cx="70" cy="66" r="7" fill="${W}" stroke="${K}" stroke-width="4"/>`,
  fries:
    [[66, 34, 60], [80, 22, 72], [94, 30, 64], [108, 18, 76], [122, 28, 66], [136, 38, 56]]
      .map(([x, y, h]) => rect(x - 6, y, 13, h, 5, W, K, 4))
      .join('') +
    blk('M56 88H144L134 136H66Z') +
    line('M62 108H138', 6) +
    star(100, 122, 5, 9, 4),
  toastie:
    blk('M22 112L96 38V112Z') + blk('M178 112L104 38V112Z') +
    line('M44 90L66 68M44 104L80 68M60 106L84 82', 4) +
    line('M156 90L134 68M156 104L120 68M140 106L116 82', 4) +
    wht('M22 116H96V132H22Z', 4).replace('L', 'L') +
    wht('M104 116H178V132H104Z', 4) +
    line('M34 124H84M116 124H166', 3, K),
  salad:
    wht('M70 86Q50 56 76 38Q98 54 70 86Z') + line('M72 80L78 48', 2.5, K) +
    wht('M96 82Q84 48 112 32Q128 54 96 82Z') + line('M100 76L110 40', 2.5, K) +
    wht('M126 86Q124 54 152 46Q160 72 126 86Z') + line('M132 80L148 56', 2.5, K) +
    dot(66, 82, 11) + dot(62, 78, 3, W) +
    dot(144, 84, 10) + dot(140, 80, 3, W) +
    `<circle cx="108" cy="88" r="9" fill="${W}" stroke="${K}" stroke-width="4"/>` +
    blk('M32 90H168Q160 134 100 136Q40 134 32 90Z') +
    line('M44 106Q100 118 156 106', 4),
  kidsBox:
    line('M70 56V44Q70 34 82 34H118Q130 34 130 44V56', 9, K) +
    rect(36, 54, 128, 76, 14) +
    line('M36 84H164', 4) +
    rect(88, 76, 24, 16, 4, W) +
    dot(76, 108, 5.5, W) + dot(124, 108, 5.5, W) +
    line('M84 117Q100 130 116 117', 4.5) +
    star(52, 68, 4, 8, 3, W) + star(148, 68, 4, 8, 3, W),
  sandwich:
    rect(48, 30, 104, 26, 10) +
    line('M62 43H138', 3) +
    blk('M42 62q9 9 18 0t18 0t18 0t18 0t18 0t18 0t18 0v8H42Z') +
    rect(50, 78, 100, 12, 3, K, 'none', 0, -2) +
    line('M44 100q14 10 28 0t28 0t28 0t28 0', 10, K) +
    ell(100, 114, 54, 7) +
    rect(48, 122, 104, 16, 8) +
    line('M62 130H138', 3),
  cake:
    ell(104, 132, 80, 8) +
    blk('M44 78H140V124H44Z') + blk('M140 78L168 58V104L140 124Z') +
    line('M44 94H140M44 110H140M140 94L168 74M140 110L168 90', 4) +
    wht('M44 78L72 58H168L140 78Z') +
    `<path d="M56 74Q64 84 72 74T88 74T104 74T120 74T136 74" fill="none" stroke="${K}" stroke-width="3" stroke-linecap="round"/>` +
    dot(112, 52, 9) + dot(109, 49, 2.6, W) + line('M112 44Q116 34 124 34', 2.5, K),
  plate:
    ell(100, 78, 56, 56) +
    `<circle cx="100" cy="78" r="40" fill="none" stroke="${W}" stroke-width="4"/>` +
    rect(14, 32, 8, 90, 4) + line('M18 32V56', 2, W) +
    rect(172, 32, 12, 90, 5) + ell(178, 44, 8, 14),
};

// ---- which drawing each item gets ------------------------------------------
// [pattern tested against the item name (lower case), drawing key]. First match wins.
const RULES = [
  [/ham.*croissant/, 'hamCroissant'],
  [/croissant/, 'croissant'],
  [/pancake/, 'pancakes'],
  [/avocado|avo\b/, 'avoToast'],
  [/benny|benedict/, 'benny'],
  [/mcmuffin|muffin/, 'muffin'],
  [/\bwrap\b/, 'wrap'],
  [/egg.*roll|bacon.*roll|\broll\b/, 'eggRoll'],
  [/\bblt\b/, 'blt'],
  [/burger/, 'burger'],
  [/^eggs\b|fried egg/, 'friedEggs'],
  [/toast(?!ed)/, 'toast'],
  [/toasted|toastie|jaffle/, 'toastie'],
  [/gyro|souvlaki|kebab/, 'gyros'],
  [/fries|chips/, 'fries'],
  [/salad/, 'salad'],
  [/^kids$/, 'kidsBox'],
  [/sandwich|sanga/, 'sandwich'],
  [/cake|slice|brownie|muffin/, 'cake'],
  [/jumbo/, 'mug'],
  [/iced|ice coffee|affogato/, 'iced'],
  [/cold brew/, 'coldBrew'],
  [/frappe/, 'frappe'],
  [/matcha/, 'matcha'],
  [/large coffee|large flat|latte|cappuccino|flat white|long black|mocha/, 'takeaway'],
  [/small coffee|espresso|short black|macchiato/, 'espresso'],
  [/minis|babyccino|baby/, 'babyccino'],
  [/hot choc|chocolate/, 'hotChoc'],
  [/chai/, 'chai'],
  [/\btea\b/, 'teapot'],
  [/kombucha/, 'kombucha'],
  [/sparkling|\bspk\b|soda water/, 'sparkling'],
  [/no sugar|zero|diet/, 'canZero'],
  [/coca|cola|coke|fanta|sprite|lemonade|soft drink|can\b/, 'can'],
  [/water/, 'water'],
  [/smoothie/, 'smoothie'],
  [/shake|milkshake/, 'milkshake'],
  [/juice/, 'juice'],
];

// By category, when no name rule matches.
const CATEGORY_FALLBACK = [
  [/toasted/, 'toastie'],
  [/burger/, 'burger'],
  [/breakfast/, 'friedEggs'],
  [/lunch/, 'sandwich'],
  [/hot/, 'latte'],
  [/cold|drink/, 'iced'],
  [/juice|smooth|shake/, 'milkshake'],
];

export function illustrationKeyFor(item) {
  const name = String(item?.name || '').toLowerCase();
  for (const [re, key] of RULES) if (re.test(name)) return key;
  const cat = String(item?.categoryName || '').toLowerCase();
  for (const [re, key] of CATEGORY_FALLBACK) if (re.test(cat)) return key;
  return 'plate';
}

export function illustrationMarkup(key) {
  return ART[key] || ART.plate;
}

export const ILLUSTRATION_KEYS = Object.keys(ART);
