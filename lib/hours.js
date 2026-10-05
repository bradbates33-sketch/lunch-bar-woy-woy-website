// Trading hours + "are we open / what pickup times are valid" logic.
// Shared by the browser (cart, open badge) and the server (checkout checks),
// so both always agree. All times are Australia/Sydney, whatever the
// visitor's or the server's own timezone is.

export const TIMEZONE = 'Australia/Sydney';

// Minutes after midnight: [opens, closes]. Keys are weekdays, 0 = Sunday.
const WEEKDAY = [6 * 60, 14 * 60];
export const HOURS = {
  0: [8 * 60, 12 * 60],
  1: WEEKDAY,
  2: WEEKDAY,
  3: WEEKDAY,
  4: WEEKDAY,
  5: WEEKDAY,
  6: [8 * 60, 13 * 60],
};

// How long an ASAP order takes. ASAP is only offered while there is still
// this much time before closing.
export const PICKUP_LEAD_MIN = 15;
// Server-side slack when checking a chosen time against "now + lead", to
// absorb clock differences and the time it takes to reach checkout.
const SERVER_SLACK_MIN = 5;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmt = new Intl.DateTimeFormat('en-AU', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
  weekday: 'short',
});

// Current wall-clock time in Sydney.
export function sydneyNow(date = new Date()) {
  const parts = {};
  for (const p of fmt.formatToParts(date)) parts[p.type] = p.value;
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const hour = Number(parts.hour) % 24;
  const minute = Number(parts.minute);
  // Weekday from the calendar date itself (timezone-independent).
  const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { year, month, day, dow, minutes: hour * 60 + minute, dateISO: toISO(year, month, day) };
}

function toISO(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// ISO date + n days, returned as a {year, month, day, dow, dateISO} record.
export function addDays(dateISO, n) {
  const [y, m, d] = dateISO.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  const year = t.getUTCFullYear();
  const month = t.getUTCMonth() + 1;
  const day = t.getUTCDate();
  return { year, month, day, dow: t.getUTCDay(), dateISO: toISO(year, month, day) };
}

export function formatMinutes(total) {
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const h12 = ((h24 + 11) % 12) + 1;
  const suffix = h24 >= 12 ? 'pm' : 'am';
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`;
}

export function minutesToTimeValue(total) {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function timeValueToMinutes(value) {
  const m = String(value || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function dayLabel(rec) {
  return `${DAY_SHORT[rec.dow]} ${rec.day} ${MONTH_SHORT[rec.month - 1]}`;
}

// What is happening right now, and what pickup choices are valid.
//
//   open          - inside trading hours
//   canAsap       - open AND at least PICKUP_LEAD_MIN before closing
//   pickupDay     - 'today' while orders for today are still possible,
//                   otherwise 'tomorrow'
//   window        - the [from, to] pickup times (minutes) on pickupDay
//   headline      - short text for the "open now / closed" badge
export function getStatus(date = new Date()) {
  const now = sydneyNow(date);
  const [open, close] = HOURS[now.dow];
  const isOpen = now.minutes >= open && now.minutes < close;
  const canAsap = now.minutes >= open && now.minutes <= close - PICKUP_LEAD_MIN;
  const ordersLeftToday = now.minutes <= close - PICKUP_LEAD_MIN;

  const pickupDay = ordersLeftToday ? 'today' : 'tomorrow';
  const dayRec = pickupDay === 'today' ? now : addDays(now.dateISO, 1);
  const [dayOpen, dayClose] = HOURS[dayRec.dow];
  // Today, the earliest time is also bounded by "now + lead".
  const from = pickupDay === 'today' ? Math.max(dayOpen, now.minutes + PICKUP_LEAD_MIN) : dayOpen;

  let headline;
  if (isOpen) {
    headline = `Open now · until ${formatMinutes(close)}`;
  } else if (now.minutes < open) {
    headline = `Closed · opens ${formatMinutes(open)} today`;
  } else {
    const next = addDays(now.dateISO, 1);
    headline = `Closed · opens ${formatMinutes(HOURS[next.dow][0])} ${DAY_NAMES[next.dow]}`;
  }

  return {
    now,
    open: isOpen,
    canAsap,
    pickupDay,
    pickupDate: dayRec.dateISO,
    pickupDateLabel: dayLabel(dayRec),
    window: { from, to: dayClose, open: dayOpen, close: dayClose },
    todayClosesLabel: formatMinutes(close),
    headline,
  };
}

// The pickup line stored on the Square order ("note"), e.g.
//   "Pickup: ASAP (ready in ~15 min)"
//   "Pickup: Today (Mon 5 Oct) 10:30am"
export function pickupNote({ asap, dateISO, minutes, todayISO }) {
  if (asap) return 'Pickup: ASAP (ready in ~15 min)';
  const [y, m, d] = dateISO.split('-').map(Number);
  const rec = addDays(toISO(y, m, d), 0);
  const when = dateISO === todayISO ? 'Today' : 'Tomorrow';
  return `Pickup: ${when} (${dayLabel(rec)}) ${formatMinutes(minutes)}`;
}

// Short label for the order ticket in Square (max 30 chars), e.g.
//   "Pickup ASAP"  /  "Pickup Tomorrow 6:30am"
export function pickupTicketName({ asap, dateISO, minutes, todayISO }) {
  if (asap) return 'Pickup ASAP';
  return `Pickup ${dateISO === todayISO ? 'Today' : 'Tomorrow'} ${formatMinutes(minutes)}`;
}

// Server-side check of what the customer asked for.
//   input: { pickupTime: 'asap' | 'HH:MM', pickupDate?: 'YYYY-MM-DD' }
// Returns { ok: true, note, ticketName } or { ok: false, error }.
export function validatePickup(input = {}, date = new Date()) {
  const status = getStatus(date);
  const { now } = status;
  const requested = input.pickupTime;

  if (!requested || requested === 'asap') {
    if (!status.canAsap) {
      return {
        ok: false,
        error: status.open
          ? 'We’re too close to closing for an ASAP order — please choose a pickup time for tomorrow.'
          : `We’re closed right now (${status.headline.replace('Closed · ', '')}). Please choose a pickup time.`,
      };
    }
    return { ok: true, note: pickupNote({ asap: true }), ticketName: pickupTicketName({ asap: true }) };
  }

  const minutes = timeValueToMinutes(requested);
  if (minutes === null) return { ok: false, error: 'That pickup time isn’t valid.' };

  const tomorrow = addDays(now.dateISO, 1).dateISO;
  const dateISO = input.pickupDate || status.pickupDate;
  if (dateISO !== now.dateISO && dateISO !== tomorrow) {
    return { ok: false, error: 'Pickup must be today or tomorrow.' };
  }

  const dow = dateISO === now.dateISO ? now.dow : addDays(now.dateISO, 1).dow;
  const [open, close] = HOURS[dow];
  if (minutes < open || minutes > close) {
    return {
      ok: false,
      error: `Pickup times on ${DAY_NAMES[dow]} are between ${formatMinutes(open)} and ${formatMinutes(close)}.`,
    };
  }
  if (dateISO === now.dateISO && minutes < now.minutes + PICKUP_LEAD_MIN - SERVER_SLACK_MIN) {
    return { ok: false, error: `Please allow at least ${PICKUP_LEAD_MIN} minutes — choose a later pickup time.` };
  }

  const args = { asap: false, dateISO, minutes, todayISO: now.dateISO };
  return { ok: true, note: pickupNote(args), ticketName: pickupTicketName(args) };
}

// "Mon–Fri 6am–2pm · Sat 8am–1pm · Sun 8am–12pm"
export function hoursSummary() {
  const span = ([o, c]) => `${formatMinutes(o)}–${formatMinutes(c)}`;
  return `Mon–Fri ${span(HOURS[1])} · Sat ${span(HOURS[6])} · Sun ${span(HOURS[0])}`;
}
