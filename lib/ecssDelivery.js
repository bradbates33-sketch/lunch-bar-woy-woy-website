// Temporary "ECSS coach delivery" ordering (see ECSS_CAMP.coachDelivery in
// lib/catering.js). Shared by the cart (browser) and create-checkout (server).

import { ECSS_CAMP } from './catering';
import { sydneyNow, addDays, dayLabel, formatMinutes } from './hours';

// Delivery days still open for ordering right now (today only until the cutoff).
export function ecssDeliveryOptions(date = new Date()) {
  const cfg = ECSS_CAMP.coachDelivery;
  const now = sydneyNow(date);
  return cfg.days
    .filter((d) => d > now.dateISO || (d === now.dateISO && now.minutes < cfg.cutoffMinutes))
    .map((dateISO) => {
      const rec = addDays(dateISO, 0);
      return {
        dateISO,
        label: dayLabel(rec), // "Thu 8 Oct"
        dayShort: dayLabel(rec).slice(0, 3), // "Thu"
        timeLabel: formatMinutes(cfg.timeMinutes), // "12pm"
      };
    });
}

// Validates the coach's details and builds everything we stamp on the Square
// order so the cafe can spot it.
export function validateEcssDelivery(input = {}, date = new Date()) {
  const options = ecssDeliveryOptions(date);
  const opt = options.find((o) => o.dateISO === input.date);
  if (!opt) {
    return {
      ok: false,
      error: options.length
        ? 'Please choose Thursday or Friday for the ECSS delivery.'
        : 'ECSS coach delivery is no longer available.',
    };
  }
  const name = String(input.name || '').trim().slice(0, 60);
  if (!name) return { ok: false, error: 'Enter your name so we know who the delivery is for.' };
  const phone = String(input.phone || '').trim().slice(0, 30);
  if (phone.replace(/\D/g, '').length < 8) return { ok: false, error: 'Enter a mobile number we can reach on the day.' };
  const notes = String(input.notes || '').trim().slice(0, 200);

  const first = name.split(/\s+/)[0];
  const when = `${opt.label} ${opt.timeLabel}`; // "Thu 8 Oct 12pm"
  return {
    ok: true,
    opt,
    name,
    phone,
    notes,
    when,
    // Square's order "ticket name" (30 chars max) and a note on every line
    // item, so each station's printed ticket carries the marker.
    ticketName: `ECSS ${opt.dayShort} ${opt.timeLabel} ${first}`.slice(0, 30),
    lineNote: `ECSS COACH DELIVERY ${opt.dayShort} ${opt.timeLabel} - ${first}`.slice(0, 120),
    paymentNote: [
      'ECSS CAMP DELIVERY',
      when,
      `Coach: ${name}`,
      `Phone: ${phone}`,
      notes ? `Notes: ${notes}` : '',
    ]
      .filter(Boolean)
      .join(' | ')
      .slice(0, 500),
  };
}
