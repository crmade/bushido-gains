import { useState } from 'react';
import { C, FONT_DISPLAY } from '../lib/theme';
import Card from './Card';

export default function WhenToChange() {
  const [open, setOpen] = useState(false);
  return (
    <Card style={{ background: C.surface2 }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text }}
      >
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, textTransform: 'uppercase' }}>¿Cuándo cambiar la rutina?</span>
        <span style={{ color: C.gold }}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="mt-3 text-sm flex flex-col gap-2" style={{ color: C.dim }}>
          <p><b style={{ color: C.text }}>Mantén la estructura 8-12 semanas.</b> El músculo crece con progresión (más peso o más reps en los mismos ejercicios), no con variedad constante.</p>
          <p><b style={{ color: C.text }}>Cambia un ejercicio si:</b> llevas 2-3 semanas estancado en peso y reps a pesar de comer y dormir bien, te genera molestia articular persistente, o el aburrimiento está afectando tu constancia.</p>
          <p><b style={{ color: C.text }}>Cambio pequeño antes que cambio total:</b> sustituye por un ejercicio análogo (ej. remo con barra → remo en polea) o mueve el rango de reps (6-8 → 10-12) antes de rehacer todo el plan.</p>
          <p><b style={{ color: C.text }}>Pesas antes de BJJ:</b> deja el fallo muscular solo para la última serie, y los días de peso muerto o sentadilla pesada evita rolling muy intenso justo después. Hidrátate y come algo entre sesiones.</p>
          <p><b style={{ color: C.text }}>Para crecer:</b> superávit calórico ligero y 1.6-2 g de proteína por kg de peso al día. Sin eso, ninguna rutina funciona.</p>
        </div>
      )}
    </Card>
  );
}
