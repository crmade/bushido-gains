import { useState } from 'react';
import { C, FONT_DISPLAY } from '../lib/theme';
import Card from './Card';

export default function WarmupCard({ warmup, doneToday, toggleDone }) {
  const [open, setOpen] = useState(false);
  const done = warmup.filter((w) => doneToday[w.id]).length;
  const complete = done === warmup.length && warmup.length > 0;

  return (
    <Card style={{ border: '1px solid ' + (complete ? C.green : C.line) }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text }}
      >
        <span className="flex items-center gap-2">
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, textTransform: 'uppercase' }}>Calentamiento</span>
          <span className="text-xs" style={{ color: C.dim }}>~10 min</span>
        </span>
        <span className="text-sm font-semibold" style={{ color: complete ? C.green : C.gold }}>
          {done}/{warmup.length} {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-3">
          {warmup.map((w) => (
            <div key={w.id} className="flex items-start gap-3">
              <button
                onClick={() => toggleDone(w.id)}
                aria-label="Marcar paso de calentamiento"
                className="rounded-full flex items-center justify-center"
                style={{
                  width: 26, height: 26, flexShrink: 0, cursor: 'pointer', marginTop: 2,
                  background: doneToday[w.id] ? C.gold : 'transparent',
                  border: '2px solid ' + (doneToday[w.id] ? C.gold : C.line),
                  color: doneToday[w.id] ? C.ink : C.dim, fontWeight: 700, fontSize: 12,
                }}
              >✓</button>
              <div>
                <p className="font-semibold text-sm" style={{ textDecoration: doneToday[w.id] ? 'line-through' : 'none', opacity: doneToday[w.id] ? 0.6 : 1 }}>{w.name}</p>
                <p className="text-xs" style={{ color: C.dim }}>{w.detail}</p>
              </div>
            </div>
          ))}
          <p className="text-xs mt-1" style={{ color: C.dim }}>
            Las series de aproximación son la parte más importante: nunca pases directo al peso de trabajo en sentadilla, peso muerto o press.
          </p>
        </div>
      )}
    </Card>
  );
}
