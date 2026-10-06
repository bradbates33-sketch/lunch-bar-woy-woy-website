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

// Dates (YYYY-MM-DD, Sydney) the shop is shut — public holidays, a day off.
// These days can't be picked for pickup and show as closed.
export const CLOSED_DATES = [
  // '2026-12-25',
  // '2026-12-26',
];

// How far ahead a customer can book a pickup (days from today).
export const MAX_ADVANCE_DAYS = 7;

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

// "Today" / "Tomorrow" / "Fri 9 Oct"
function relativeDayName(dateISO, todayISO) {
  if (dateISO === todayISO) return 'Today';
  if (dateISO === addDays(todayISO, 1).dateISO) return 'Tomorrow';
  return dayLabel(addDays(dateISO, 0));
}

// What is happening right now, and what pickup choices are valid.
//
//   open     - inside trading hours
//   canAsap  - open AND at least PICKUP_LEAD_MIN before closing
//   days     - every day a pickup can be booked, soonest first:
//              { dateISO, label ("Today"/"Tomorrow"/"Fri 9 Oct"), fullLabel,
//                isToday, window: { from, to, open, close } }
//              (today only appears while there's still time to order)
//   headline - short text for the "open now / closed" badge
export function getStatus(date = new Date()) {
  const now = sydneyNow(date);
  const closedToday = CLOSED_DATES.includes(now.dateISO);
  const [open, close] = HOURS[now.dow];
  const isOpen = !closedToday && now.minutes >= open && now.minutes < close;
  const canAsap = !closedToday && now.minutes >= open && now.minutes <= close - PICKUP_LEAD_MIN;
  const ordersLeftToday = !closedToday && now.minutes <= close - PICKUP_LEAD_MIN;

  const days = [];
  for (let i = 0; i <= MAX_ADVANCE_DAYS; i++) {
    const rec = i === 0 ? now : addDays(now.dateISO, i);
    if (CLOSED_DATES.includes(rec.dateISO)) continue;
    if (i === 0 && !ordersLeftToday) continue;
    const [dayOpen, dayClose] = HOURS[rec.dow];
    days.push({
      dateISO: rec.dateISO,
      label: relativeDayName(rec.dateISO, now.dateISO),
      fullLabel: dayLabel(rec),
      isToday: i === 0,
      window: {
        // Today, the earliest time is also bounded by "now + lead".
        from: i === 0 ? Math.max(dayOpen, now.minutes + PICKUP_LEAD_MIN) : dayOpen,
        to: dayClose,
        open: dayOpen,
        close: dayClose,
      },
    });
  }

  let headline;
  if (isOpen) {
    headline = `Open now · until ${formatMinutes(close)}`;
  } else if (!closedToday && now.minutes < open) {
    headline = `Closed · opens ${formatMinutes(open)} today`;
  } else {
    let next = null;
    for (let i = 1; i <= 14 && !next; i++) {
      const rec = addDays(now.dateISO, i);
      if (!CLOSED_DATES.includes(rec.dateISO)) next = rec;
    }
    headline = next
      ? `Closed · opens ${formatMinutes(HOURS[next.dow][0])} ${DAY_NAMES[next.dow]}`
      : 'Closed';
  }

  return { now, open: isOpen, canAsap, days, todayClosesLabel: formatMinutes(close), headline };
}

// The pickup line stored on the Square payment note, e.g.
//   "Pickup: ASAP (ready in ~15 min)"
//   "Pickup: Today (Mon 5 Oct) 10:30am"   /   "Pickup: Fri 9 Oct 10:30am"
export function pickupNote({ asap, dateISO, minutes, todayISO }) {
  if (asap) return 'Pickup: ASAP (ready in ~15 min)';
  const name = relativeDayName(dateISO, todayISO);
  const full = dayLabel(addDays(dateISO, 0));
  const when = name === full ? full : `${name} (${full})`;
  return `Pickup: ${when} ${formatMinutes(minutes)}`;
}

// Short label for the order ticket in Square (max 30 chars), e.g.
//   "Pickup ASAP"  /  "Pickup Tomorrow 6:30am"  /  "Pickup Fri 9 Oct 10:30am"
export function pickupTicketName({ asap, dateISO, minutes, todayISO }) {
  if (asap) return 'Pickup ASAP';
  return `Pickup ${relativeDayName(dateISO, todayISO)} ${formatMinutes(minutes)}`;
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
          ? 'We’re too close to closing for an ASAP order — please choose a pickup day and time.'
          : `We’re closed right now (${status.headline.replace('Closed · ', '')}). Please choose a pickup day and time.`,
      };
    }
    return { ok: true, note: pickupNote({ asap: true }), ticketName: pickupTicketName({ asap: true }) };
  }

  const minutes = timeValueToMinutes(requested);
  if (minutes === null) return { ok: false, error: 'That pickup time isn’t valid.' };

  const dateISO = input.pickupDate || (status.days[0] && status.days[0].dateISO);
  const day = status.days.find((d) => d.dateISO === dateISO);
  if (!day) {
    return { ok: false, error: 'We can’t take pickup orders for that day — please choose another day.' };
  }

  const dayName = DAY_NAMES[addDays(day.dateISO, 0).dow];
  if (minutes < day.window.open || minutes > day.window.close) {
    return {
      ok: false,
      error: `Pickup times on ${dayName} are between ${formatMinutes(day.window.open)} and ${formatMinutes(day.window.close)}.`,
    };
  }
  if (day.isToday && minutes < now.minutes + PICKUP_LEAD_MIN - SERVER_SLACK_MIN) {
    return { ok: false, error: `Please allow at least ${PICKUP_LEAD_MIN} minutes — choose a later pickup time.` };
  }

  const args = { asap: false, dateISO: day.dateISO, minutes, todayISO: now.dateISO };
  return { ok: true, note: pickupNote(args), ticketName: pickupTicketName(args) };
}

// "Mon–Fri 6am–2pm · Sat 8am–1pm · Sun 8am–12pm"
export function hoursSummary() {
  const span = ([o, c]) => `${formatMinutes(o)}–${formatMinutes(c)}`;
  return `Mon–Fri ${span(HOURS[1])} · Sat ${span(HOURS[6])} · Sun ${span(HOURS[0])}`;
}
