import { WEIGHTS, BUFFER } from '@/lib/scoring';

export const metadata = { title: 'How matching works | OneWear' };

const ROWS = [
  ['occasion', 'Occasion', 'Full marks if the lender tagged it for your occasion, half if it suits a related one (a festival outfit for a wedding).'],
  ['size', 'Size', 'Full marks for your size, partial for one size away (alteration may help), zero otherwise.'],
  ['distance', 'Distance', 'Falls from full marks at your door to zero at 25 km, so pickup and return stay easy.'],
  ['budget', 'Budget', 'Full marks within budget, dropping to zero at 25% over.'],
  ['style', 'Style', 'How many of the looks you asked for (subtle, bold, traditional…) and whether it is the garment type you named.'],
];

export default function HowPage() {
  return (
    <div className="wrap page prose">
      <h1>How matching works</h1>
      <p className="lead">
        Every result shows a match score, and every score can be explained. No black box decides what you see.
      </p>

      <h2>Reading your description</h2>
      <p>
        Your sentence goes through a built-in parser that picks out the occasion, size, budget, date, area, and the look you want. When an AI key is configured, an AI model reads it too, and its answer is checked against the same allowed values before it is used. If the AI is slow, down, or unsure, the built-in parser&apos;s result is used, so search always works.
      </p>

      <h2>Hard rules first</h2>
      <p>
        Outfits that are already booked near your date are removed. Each booking blocks the outfit from {BUFFER.before} day before the event (pickup) to {BUFFER.after} days after (return and dry-cleaning), so two events less than {BUFFER.before + BUFFER.after + 1} days apart can&apos;t share an outfit. If you said who it&apos;s for, outfits for others are removed too.
      </p>

      <h2>Then a weighted score</h2>
      <div className="formula">
        score = {Object.entries(WEIGHTS).map(([k, w]) => `${w} × ${k}`).join(' + ')}
      </div>
      <div className="table-scroll">
        <table className="weights">
          <thead><tr><th>Factor</th><th>Weight</th><th>How it scores</th></tr></thead>
          <tbody>
            {ROWS.map(([k, label, text]) => (
              <tr key={k}><td>{label}</td><td>{Math.round(WEIGHTS[k] * 100)}%</td><td>{text}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Anything you didn&apos;t mention gets a neutral 70%, so it neither helps nor hurts an outfit much. Ties go to the closer outfit, then the cheaper one.
      </p>

      <h2>Why these weights</h2>
      <p>
        The wrong occasion or the wrong size makes an outfit useless, so those carry the most weight. Distance comes next because every rental needs a pickup and a return. Budget and style matter, but people will stretch on both for the right outfit.
      </p>
    </div>
  );
}
