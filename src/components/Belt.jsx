import { C } from '../lib/theme';

export default function Belt({ color, total, done }) {
  return (
    <div className="w-full flex items-center rounded-sm overflow-hidden" style={{ height: 14, background: C.ink, border: '1px solid ' + C.line }}>
      <div className="flex-1" />
      <div className="h-full flex items-center justify-center gap-1 px-2" style={{ background: color, minWidth: '46%' }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="h-full" style={{ width: 5, background: i < done ? '#F6F2E7' : 'rgba(0,0,0,0.30)' }} />
        ))}
      </div>
      <div className="h-full" style={{ width: '10%' }} />
    </div>
  );
}
