// Server-side only. Sends plain-text business emails through Resend.
//
// Needs two env vars in Vercel (otherwise sending is skipped, not an error):
//   RESEND_API_KEY    - from resend.com
//   ORDER_FROM_EMAIL  - a sender on a domain verified in Resend,
//                       e.g.  Lunch Bar <orders@lunchbarbakehouse.com.au>
// Optional:
//   ORDER_NOTIFY_EMAIL - where order emails go (defaults to the contact email)

import { CATERING } from './catering';

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.ORDER_FROM_EMAIL);
}

// `idempotencyKey` makes a repeated send (e.g. Square re-delivering a webhook)
// a no-op on Resend's side for 24 hours.
export async function sendOrderEmail({ subject, text, replyTo, idempotencyKey }) {
  if (!emailConfigured()) return { sent: false, reason: 'RESEND_API_KEY / ORDER_FROM_EMAIL not set' };

  const headers = {
    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      from: process.env.ORDER_FROM_EMAIL,
      to: process.env.ORDER_NOTIFY_EMAIL || CATERING.contactEmail,
      reply_to: replyTo || undefined,
      subject,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${body.slice(0, 300)}`);
  }
  return { sent: true };
}
