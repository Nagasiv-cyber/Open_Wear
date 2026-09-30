// The text of every SMS OneWear sends, in one place so wording stays
// consistent and short (ideally one 160-character SMS each).
import { formatDate, addDays } from './dates.js';
import { BUFFER } from './scoring.js';

const short = (t) => (t.length > 38 ? t.slice(0, 36) + '…' : t);

export const sms = {
  newRequestToLender: ({ title, borrowerName, eventDate }) =>
    `OneWear: ${borrowerName} wants to rent your "${short(title)}" for ${formatDate(eventDate)}. Open your Lender inbox to accept or decline.`,

  requestSentToBorrower: ({ title, lenderName, eventDate }) =>
    `OneWear: Request sent for "${short(title)}" on ${formatDate(eventDate)}. We'll text you when ${lenderName} replies.`,

  acceptedToBorrower: ({ title, lenderName, lenderPhone, eventDate }) =>
    `OneWear: ${lenderName} accepted! "${short(title)}" is yours for ${formatDate(eventDate)}.` +
    (lenderPhone ? ` Call ${lenderPhone} to arrange pickup on ${formatDate(addDays(eventDate, -BUFFER.before))}.` : ''),

  declinedToBorrower: ({ title, eventDate }) =>
    `OneWear: Sorry, "${short(title)}" isn't available for ${formatDate(eventDate)}. Search OneWear for another outfit.`,

  cancelledToLender: ({ title, borrowerName, eventDate }) =>
    `OneWear: ${borrowerName} cancelled their booking of "${short(title)}" for ${formatDate(eventDate)}. The dates are free again.`,
};
