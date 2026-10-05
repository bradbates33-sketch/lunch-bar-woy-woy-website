// How item names are *shown on the website*. This never changes anything in
// Square — your POS, kitchen dockets and receipts keep using Square's names.
//
// 1. Names typed in ALL CAPS (BACON & EGG ROLL) become Title Case.
// 2. Names with inconsistent casing (Jumbo coffee) get Title Case too.
// 3. Known typos / abbreviations are corrected via NAME_FIXES below.
//
// To fix a name on the website, add a line to NAME_FIXES (key = the Square
// name in lower case). To fix it everywhere, rename it in Square instead.

const NAME_FIXES = {
  'toasted sandwhiches': 'Toasted Sandwiches',
  'toast w condiment': 'Toast with Condiment',
  'lrg milkshake': 'Large Milkshake',
  'spk water 500ml': 'Sparkling Water 500ml',
  'hazlenut': 'Hazelnut',
  'chilli ailoi': 'Chilli Aioli',
  'siracha': 'Sriracha',
  'add hasbrown': 'Add Hash Brown',
};

// Stay lower-case unless first word.
const SMALL_WORDS = new Set(['a', 'an', 'and', 'or', 'of', 'the', 'with', 'in', 'on', 'to', 'for', 'than', 'w']);
// Stay UPPER-CASE.
const ACRONYMS = new Set(['BLT', 'BBQ', 'GF', 'DF', 'VG', 'HP', 'PB', 'NY']);

function titleWord(word, isFirst) {
  const letters = word.replace(/[^A-Za-z]/g, '');
  if (!letters) return word; // numbers / symbols: "&", "500ml", "1/2"
  if (ACRONYMS.has(word.toUpperCase().replace(/[^A-Z]/g, ''))) return word.toUpperCase();

  const hasLower = /[a-z]/.test(word);
  const hasUpper = /[A-Z]/.test(word);
  // Mixed-case inside a word (McMuffin, iPhone) is deliberate: leave it alone.
  if (hasLower && hasUpper && !/^[A-Z][a-z]+$/.test(word)) return word;

  const lower = word.toLowerCase();
  if (!isFirst && SMALL_WORDS.has(lower)) return lower;
  // Capitalise the first letter, including after a hyphen or slash.
  return lower.replace(/(^|[-/(])([a-z])/g, (_, p, c) => p + c.toUpperCase());
}

export function displayName(raw) {
  const name = String(raw || '').trim();
  if (!name) return name;
  const fix = NAME_FIXES[name.toLowerCase()];
  if (fix) return fix;
  return name
    .split(/\s+/)
    .map((w, i) => titleWord(w, i === 0))
    .join(' ');
}
