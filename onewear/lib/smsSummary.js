// Turns the server's SMS results into one short sentence for the screen,
// e.g. "SMS sent to the lender (••••••3210) and to you (••••••4567)."
export function describeSms(results) {
  if (!Array.isArray(results) || results.length === 0) return '';
  if (results.every((r) => r.reason === 'SMS not configured')) return '';
  const who = (r) => (r.role === 'you' ? 'you' : `the ${r.role}`);
  const sent = results.filter((r) => r.status === 'sent').map((r) => `${who(r)} (${r.to})`);
  const failed = results.filter((r) => r.status === 'failed').map((r) => `${who(r)}: ${r.reason}`);
  const parts = [];
  if (sent.length) parts.push(`SMS sent to ${sent.join(' and ')}.`);
  if (failed.length) parts.push(`SMS not delivered to ${failed.join('; ')}.`);
  return parts.join(' ');
}
