// Minimal sparkline: pass an array of numbers (0..1 or any positive).
// It auto-scales and draws a smooth-ish line. No libs.
export default function Sparkline({ points = [], className = '' }) {
  const w = 140, h = 60, p = 4; // width/height/padding
  const xs = points.length ? points : [0, 0.4, 0.2, 0.8, 0.6, 1, 0.7];
  const min = Math.min(...xs), max = Math.max(...xs);
  const norm = (v) => (max === min ? 0.5 : (v - min) / (max - min));

  // Build a simple path
  const step = (w - p * 2) / Math.max(xs.length - 1, 1);
  const d = xs.map((v, i) => {
    const x = p + i * step;
    const y = p + (h - p * 2) * (1 - norm(v));
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`block ${className}`}>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
