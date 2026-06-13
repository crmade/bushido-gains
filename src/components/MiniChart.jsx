import { C } from '../lib/theme';

export default function MiniChart({ data, color, unit }) {
  const W = 340, H = 210, P = { t: 14, r: 14, b: 26, l: 40 };
  const vals = data.map((d) => d.v);
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.12;
  min -= pad; max += pad;
  const x = (i) => P.l + (i * (W - P.l - P.r)) / Math.max(1, data.length - 1);
  const y = (v) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
  const pts = data.map((d, i) => x(i) + ',' + y(d.v)).join(' ');
  const ticks = [min, (min + max) / 2, max];
  const r1 = (v) => Math.round(v * 10) / 10;

  return (
    <svg viewBox={'0 0 ' + W + ' ' + H} className="w-full" style={{ height: 220, display: 'block' }} role="img" aria-label="Grafica de progreso">
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke={C.line} strokeDasharray="3 3" />
          <text x={P.l - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill={C.dim}>{r1(t)}</text>
        </g>
      ))}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.v)} r="3.5" fill={color}>
          <title>{d.label + ': ' + d.v + (unit ? ' ' + unit : '')}</title>
        </circle>
      ))}
      <text x={P.l} y={H - 8} fontSize="10" fill={C.dim}>{data[0].label}</text>
      <text x={W - P.r} y={H - 8} fontSize="10" fill={C.dim} textAnchor="end">{data[data.length - 1].label}</text>
    </svg>
  );
}
