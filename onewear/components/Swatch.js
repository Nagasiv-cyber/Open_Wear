import { CATEGORIES } from '@/lib/catalog';

// Shows the outfit's photo when there is one; otherwise a CSS-drawn fabric
// swatch in the outfit's colours, so every card still looks distinct.
export default function Swatch({ listing }) {
  const cat = CATEGORIES[listing.category] || { label: 'Outfit', pattern: 'sheen' };
  const [a, b] = listing.colors || ['#1F1D47', '#E9A21B'];
  const badge = (listing.mine || listing.source === 'local') && <span className="swatch-label swatch-new">Your listing</span>;
  if (listing.photoUrl) {
    return (
      <div className="swatch swatch-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={listing.photoUrl} alt={`${cat.label}: ${listing.title}`} loading="lazy" />
        <span className="swatch-label">{cat.label}</span>
        {badge}
      </div>
    );
  }
  return (
    <div className={`swatch swatch-${cat.pattern}`} style={{ '--a': a, '--b': b }} role="img" aria-label={`${cat.label} in ${listing.title}`}>
      <span className="swatch-label">{cat.label}</span>
      {badge}
    </div>
  );
}
