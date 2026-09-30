'use client';
import { useEffect, useRef, useState } from 'react';
import { addDays, formatDate } from '@/lib/dates';
import { BUFFER, isAvailable } from '@/lib/scoring';
import { impactFor } from '@/lib/impact';
import { getArea } from '@/lib/areas';
import { getProfile, saveProfile } from '@/lib/storage';

const inr = (n) => '₹' + n.toLocaleString('en-IN');
const PHONE = /^(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/;

export default function BookingDialog({ result, date, today, onClose, onConfirm }) {
  const ref = useRef(null);
  const [eventDate, setEventDate] = useState(date || addDays(today, 3));
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    const p = getProfile();
    setName(p.name);
    setPhone(p.phone);
  }, []);

  if (!result) return null;
  const { listing } = result;
  const impact = impactFor(listing.category);
  const blocked = eventDate ? !isAvailable(listing, eventDate) : false;
  const minDate = addDays(today, BUFFER.before);

  async function send() {
    setError('');
    if (name.trim().length < 2) return setError('Enter your name so the lender knows who is asking.');
    if (!PHONE.test(phone.trim())) return setError('Enter a valid 10-digit mobile number. The lender sees it only if they accept.');
    setSending(true);
    try {
      saveProfile({ name: name.trim(), phone: phone.trim() });
      await onConfirm(result, eventDate, { borrowerName: name.trim(), borrowerContact: phone.trim() });
    } catch (e) {
      setError(e.message || 'Could not send the request. Try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="booking-title">
      <div className="dialog-body">
        <h2 id="booking-title">{listing.title}</h2>
        <p className="meta">From {listing.lender.name}, {getArea(listing.areaId)?.name}</p>

        <label className="field" style={{ marginTop: 14 }}>
          Event date
          <input type="date" value={eventDate} min={minDate} onChange={(e) => setEventDate(e.target.value)} />
        </label>

        {blocked ? (
          <p className="field-error" role="alert">
            This outfit is already booked around that date. Pick another date or another outfit.
          </p>
        ) : (
          <ol className="timeline">
            <li><strong>{formatDate(addDays(eventDate, -BUFFER.before))}</strong>Pick up from the lender</li>
            <li className="event"><strong>{formatDate(eventDate)}</strong>Your occasion</li>
            <li><strong>{formatDate(addDays(eventDate, 1))}</strong>Return the outfit</li>
            <li><strong>{formatDate(addDays(eventDate, BUFFER.after))}</strong>Lender has it cleaned for the next person</li>
          </ol>
        )}

        <div className="form-row" style={{ marginBottom: 14 }}>
          <label className="field">Your name
            <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <label className="field">Mobile number
            <input value={phone} maxLength={16} inputMode="tel" onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="98765 43210" />
          </label>
        </div>

        <div className="totals">
          <div><span>Rental</span><span>{inr(listing.price)}</span></div>
          <div><span>Refundable deposit</span><span>{inr(listing.deposit)}</span></div>
          <div><strong>Pay at pickup</strong><strong>{inr(listing.price + listing.deposit)}</strong></div>
        </div>

        <p className="impact">
          Renting instead of buying new saves roughly {impact.water.toLocaleString('en-IN')} litres of water and {impact.co2} kg of CO₂ (rough estimate). You also keep {inr(Math.max(0, listing.retailPrice - listing.price))} in your pocket.
        </p>

        {error && <p className="field-error" role="alert" style={{ marginTop: 0 }}>{error}</p>}

        <div className="dialog-actions">
          <button className="btn btn-ghost" onClick={() => ref.current?.close()}>Cancel</button>
          <button className="btn" disabled={sending || blocked || !eventDate || eventDate < minDate} onClick={send}>
            {sending ? 'Sending…' : 'Send request'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
