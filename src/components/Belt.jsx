import { C } from '../lib/theme';

const STRIPES = 4;

export default function Belt({ color, stripeColor, total, done }) {
  const filled = total > 0 ? Math.min(STRIPES, Math.floor((STRIPES * done) / total)) : 0;
  const fillColor = stripeColor || '#F6F2E7';

  return (
    <div className="w-full flex items-center rounded-sm overflow-hidden" style={{ height: 16, background: C.ink, border: '1px solid ' + C.line }}>
      <div className="flex-1 h-full" style={{ background: color }} />
      <div className="h-full flex items-center justify-center gap-1.5 px-2" style={{ background: C.ink, minWidth: '32%' }}>
        {Array.from({ length: STRIPES }).map((_, i) => (
          <div
            key={i}
            className="h-full"
            style={{
              width: 5,
              background: i < filled ? fillColor : 'rgba(246,242,231,0.18)',
              transition: 'background 0.25s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}
