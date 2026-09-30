'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Swatch from '@/components/Swatch';
import { api, getStatus } from '@/lib/api';
import { describeSms } from '@/lib/smsSummary';
import { formatDate } from '@/lib/dates';
import { localTodayIso } from '@/lib/storage';

const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

export default function InboxPage() {
  const [mode, setMode] = useState(null);
  const [requests, setRequests] = useState(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [today, setToday] = useState('');

  async function load() {
    try {
      const { requests: rows } = await api('/api/inbox');
      setRequests(rows);
    } catch (e) {
      setError(e.message);
      setRequests([]);
    }
  }

  useEffect(() => {
    setToday(localTodayIso());
    getStatus().then((s) => {
      setMode(s.db ? 'db' : 'local');
      if (s.db) load();
    });
  }, []);

  async function respond(id, action) {
    setBusy(id);
    setError('');
    setMessage('');
    try {
      const res = await api(`/api/requests/${id}`, { method: 'PATCH', body: { action } });
      await load();
      if (action === 'accept') {
        setMessage(`Accepted. Call ${res.request.borrowerName} on ${res.request.borrowerContact} to arrange pickup.${res.autoDeclined ? ` ${res.autoDeclined} clashing request(s) were declined automatically.` : ''} ${describeSms(res.sms)}`.trim());
      } else {
        setMessage(`Declined. The borrower sees this in My rentals. ${describeSms(res.sms)}`.trim());
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  if (mode === null) return <div className="wrap page"><div className="skeleton" style={{ height: 180 }} /></div>;

  return (
    <div className="wrap page">
      <h1>Lender inbox</h1>
      <p className="lead">People asking to rent your outfits. You see their number once you accept.</p>

      {mode === 'local' && (
        <div className="state">
          <h2>The inbox needs the shared database</h2>
          <p>Right now listings and requests are saved only in each person&apos;s browser, so requests can&apos;t reach you. Once the shared database is connected, requests for your outfits appear here.</p>
        </div>
      )}

      {message && <div className="success" role="status">{message}</div>}
      {error && <div className="state error" role="alert">{error}</div>}

      {mode === 'db' && requests === null && <div className="skeleton" style={{ height: 180 }} />}

      {mode === 'db' && requests?.length === 0 && (
        <div className="state">
          <h2>No requests yet</h2>
          <p>When someone asks to rent one of your outfits, it shows up here. <Link href="/list">List another outfit</Link> to get more requests.</p>
        </div>
      )}

      {mode === 'db' && requests?.length > 0 && (
        <ul className="rental-list">
          {requests.map((r) => {
            const past = today && r.eventDate < today;
            return (
              <li key={r.id} className="rental">
                <div className="rental-swatch"><Swatch listing={{ ...r.listing, source: 'seed' }} /></div>
                <div className="rental-info">
                  <h3>{r.listing.title}</h3>
                  <p className="meta">{r.borrowerName} wants it for {formatDate(r.eventDate)}</p>
                  <p className="meta">You earn {inr(r.listing.price)} and hold a {inr(r.listing.deposit)} deposit</p>
                  {r.status === 'accepted' && <span className="status status-ok">Accepted. Call {r.borrowerContact} to arrange pickup.</span>}
                  {r.status === 'declined' && <span className="status status-done">Declined</span>}
                  {r.status === 'pending' && past && <span className="status status-done">Date passed</span>}
                  {r.status === 'pending' && !past && <span className="status">Waiting for your answer</span>}
                </div>
                {r.status === 'pending' && !past && (
                  <div className="dialog-actions">
                    <button className="btn btn-ghost" disabled={busy === r.id} onClick={() => respond(r.id, 'decline')}>Decline</button>
                    <button className="btn" disabled={busy === r.id} onClick={() => respond(r.id, 'accept')}>Accept</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
