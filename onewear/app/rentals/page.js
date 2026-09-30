'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Swatch from '@/components/Swatch';
import { getRequests, cancelRequest, localTodayIso } from '@/lib/storage';
import { api, getStatus } from '@/lib/api';
import { describeSms } from '@/lib/smsSummary';
import { impactFor } from '@/lib/impact';
import { getArea } from '@/lib/areas';
import { formatDate, isIsoDate } from '@/lib/dates';

const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const isValid = (r) => r && r.id && r.listing && typeof r.listing.price === 'number' && isIsoDate(r.eventDate);
const ACTIVE = ['pending', 'accepted'];

function statusText(r, past) {
  if (r.status === 'declined') return { text: 'Declined by lender. Try another outfit.', cls: 'status-done' };
  if (r.status === 'cancelled') return { text: 'You cancelled this', cls: 'status-done' };
  if (past) return { text: 'Occasion passed', cls: 'status-done' };
  if (r.status === 'accepted') {
    const name = r.listing.lender?.name || 'The lender';
    return {
      text: r.lenderContact ? `Accepted. Call ${name} on ${r.lenderContact} to arrange pickup.` : `Accepted. ${name} will call you to arrange pickup.`,
      cls: 'status-ok',
    };
  }
  return { text: 'Waiting for lender to accept', cls: '' };
}

export default function RentalsPage() {
  const [requests, setRequests] = useState(null);
  const [mode, setMode] = useState('local');
  const [today, setToday] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load(m) {
    setError('');
    if (m === 'db') {
      try {
        const { requests: rows } = await api('/api/requests');
        setRequests(rows.filter(isValid));
      } catch (e) {
        setError(e.message);
        setRequests([]);
      }
    } else {
      setRequests(getRequests().filter(isValid).map((r) => ({ status: 'pending', ...r })));
    }
  }

  useEffect(() => {
    setToday(localTodayIso());
    getStatus().then((s) => {
      const m = s.db ? 'db' : 'local';
      setMode(m);
      load(m);
    });
  }, []);

  async function onCancel(id) {
    if (mode === 'db') {
      try {
        const res = await api(`/api/requests/${id}`, { method: 'PATCH', body: { action: 'cancel' } });
        setNotice(`Request cancelled. ${describeSms(res.sms)}`.trim());
      } catch (e) {
        setError(e.message);
        return;
      }
    } else {
      cancelRequest(id);
    }
    load(mode);
  }

  if (requests === null) return <div className="wrap page"><div className="skeleton" style={{ height: 180 }} /></div>;

  const active = requests.filter((r) => ACTIVE.includes(r.status));
  const totals = active.reduce(
    (t, r) => {
      const i = impactFor(r.listing.category);
      return { water: t.water + i.water, co2: t.co2 + i.co2, saved: t.saved + Math.max(0, r.listing.retailPrice - r.listing.price) };
    },
    { water: 0, co2: 0, saved: 0 },
  );
  const sorted = [...requests].sort((a, b) => a.eventDate.localeCompare(b.eventDate));

  return (
    <div className="wrap page">
      <h1>My rentals</h1>
      <p className="lead">Every outfit you rent is one that didn&apos;t have to be made.</p>
      {error && <div className="state error" role="alert">{error}</div>}
      {notice && <div className="success" role="status">{notice}</div>}

      {requests.length === 0 ? (
        <div className="state">
          <h2>No rental requests yet</h2>
          <p>Describe your next occasion and request an outfit. Your savings will add up here.</p>
          <Link className="btn" href="/" style={{ display: 'inline-block', textDecoration: 'none' }}>Find an outfit</Link>
        </div>
      ) : (
        <>
          <section className="impact-strip" aria-label="Your impact">
            <div><strong>{active.length}</strong><span>{active.length === 1 ? 'outfit' : 'outfits'} rented, not bought</span></div>
            <div><strong>{totals.water.toLocaleString('en-IN')} L</strong><span>water saved</span></div>
            <div><strong>{totals.co2} kg</strong><span>CO₂ avoided</span></div>
            <div><strong>{inr(totals.saved)}</strong><span>kept in your pocket</span></div>
          </section>
          <p className="meta">Water and CO₂ are rough estimates against buying the same garment new. Declined and cancelled requests don&apos;t count.</p>

          <ul className="rental-list">
            {sorted.map((r) => {
              const past = today && r.eventDate < today;
              const s = statusText(r, past);
              const canCancel = !past && ACTIVE.includes(r.status);
              return (
                <li key={r.id} className="rental">
                  <div className="rental-swatch"><Swatch listing={{ ...r.listing, source: 'seed' }} /></div>
                  <div className="rental-info">
                    <h3>{r.listing.title}</h3>
                    <p className="meta">For {formatDate(r.eventDate)} | from {r.listing.lender?.name}, {getArea(r.listing.areaId)?.name}</p>
                    <p className="meta">{inr(r.listing.price)} rental + {inr(r.listing.deposit)} refundable deposit</p>
                    <span className={`status ${s.cls}`}>{s.text}</span>
                  </div>
                  {canCancel && <button className="btn btn-ghost" onClick={() => onCancel(r.id)}>Cancel request</button>}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
