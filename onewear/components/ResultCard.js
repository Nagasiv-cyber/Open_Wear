import Swatch from './Swatch';
import { getArea } from '@/lib/areas';

const FACTOR_LABELS = { occasion: 'Occasion', size: 'Size', distance: 'Distance', budget: 'Budget', style: 'Style' };
const inr = (n) => '₹' + n.toLocaleString('en-IN');

export default function ResultCard({ result, requested, onRent }) {
  const { listing, score, breakdown, reasons, distanceKm } = result;
  const area = getArea(listing.areaId);
  const tone = score >= 80 ? 'high' : score >= 60 ? 'mid' : 'low';
  return (
    <article className="card">
      <Swatch listing={listing} />
      <div className="card-body">
        <div className="card-top">
          <div>
            <h3>{listing.title}</h3>
            <p className="meta">
              {area?.name}
              {distanceKm != null && `, ${distanceKm} km`} | Sizes {listing.sizes.join(', ')}
            </p>
          </div>
          <div className={`score ${tone}`} aria-label={`${score} percent match`}>
            <strong>{score}%</strong>
            <small>match</small>
          </div>
        </div>

        {reasons.length > 0 && (
          <ul className="reasons">
            {reasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
        )}

        <details className="why">
          <summary>Why this score</summary>
          <div className="bars">
            {Object.entries(breakdown).map(([k, v]) => (
              <div className="bar" key={k}>
                <span>{FACTOR_LABELS[k]}</span>
                <span className="bar-track"><span className="bar-fill" style={{ width: `${v}%`, display: 'block' }} /></span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </details>

        <p className="meta">
          Lent by {listing.lender.name}
          {listing.lender.verified && <span className="verified"> | Verified</span>}
        </p>

        <div className="price-row">
          <div>
            <div className="price">{inr(listing.price)} <small>per occasion</small></div>
            <div className="deposit">{inr(listing.deposit)} refundable deposit</div>
          </div>
          <button className="btn" onClick={() => onRent(result)} disabled={requested || listing.mine}>
            {listing.mine ? 'Your listing' : requested ? 'Requested' : 'Request to rent'}
          </button>
        </div>
      </div>
    </article>
  );
}
