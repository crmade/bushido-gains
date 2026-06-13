import { useState, useMemo } from 'react';
import { C, FONT_DISPLAY, inputStyle } from '../lib/theme';
import { uid, todayStr, fmtDate } from '../lib/utils';
import Btn from './Btn';
import Card from './Card';
import Field from './Field';
import MiniChart from './MiniChart';

const METRIC_DEFS = {
  weight: { label: 'Peso', unit: 'kg', color: C.gold },
  fat: { label: '% Grasa', unit: '%', color: C.red },
  muscle: { label: '% Músculo', unit: '%', color: C.green },
  bmi: { label: 'IMC', unit: '', color: C.blue },
};

function bmiOf(weight, heightCm) {
  if (!weight || !heightCm) return null;
  const h = heightCm / 100;
  return Math.round((weight / (h * h)) * 10) / 10;
}

function bmiLabel(b) {
  if (b == null) return '';
  if (b < 18.5) return 'Bajo peso';
  if (b < 25) return 'Normal';
  if (b < 30) return 'Sobrepeso';
  return 'Obesidad';
}

export default function ProgressTab({ data, user, addMetric, deleteMetric, updateUser }) {
  const [date, setDate] = useState(todayStr());
  const [weight, setWeight] = useState('');
  const [fat, setFat] = useState('');
  const [muscle, setMuscle] = useState('');
  const [hEdit, setHEdit] = useState('');
  const [metric, setMetric] = useState('weight');
  const [err, setErr] = useState('');

  const height = user && user.height ? user.height : null;
  const metricsAsc = useMemo(() => [...data.metrics].sort((a, b) => (a.date < b.date ? -1 : 1)), [data.metrics]);
  const last = metricsAsc[metricsAsc.length - 1] || null;
  const first = metricsAsc[0] || null;
  const previewBmi = bmiOf(parseFloat(weight), height);

  const chartData = metricsAsc
    .map((m) => {
      let v = null;
      if (metric === 'bmi') v = bmiOf(m.weight, height);
      else v = m[metric] != null && m[metric] !== '' ? Number(m[metric]) : null;
      return { label: fmtDate(m.date), v };
    })
    .filter((d) => d.v != null && !Number.isNaN(d.v));

  const def = METRIC_DEFS[metric];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        <Card style={{ padding: 12 }}>
          <p className="text-xs uppercase" style={{ color: C.dim }}>Peso actual</p>
          <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 26 }}>{last && last.weight ? last.weight + ' kg' : '—'}</p>
        </Card>
        <Card style={{ padding: 12 }}>
          <p className="text-xs uppercase" style={{ color: C.dim }}>IMC</p>
          <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 26 }}>{last && height ? bmiOf(last.weight, height) : '—'}</p>
          <p className="text-xs" style={{ color: C.dim }}>{last && height ? bmiLabel(bmiOf(last.weight, height)) : ''}</p>
        </Card>
        <Card style={{ padding: 12 }}>
          <p className="text-xs uppercase" style={{ color: C.dim }}>Cambio</p>
          <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 26, color: C.green }}>
            {first && last && first.id !== last.id && first.weight && last.weight
              ? (last.weight - first.weight > 0 ? '+' : '') + Math.round((last.weight - first.weight) * 10) / 10 + ' kg'
              : '—'}
          </p>
        </Card>
      </div>

      {!height && (
        <Card>
          <p className="text-sm mb-2" style={{ color: C.dim }}>Registra tu estatura para calcular el IMC automáticamente.</p>
          <div className="flex gap-2">
            <input style={{ ...inputStyle, flex: 1 }} type="number" inputMode="decimal" placeholder="Estatura en cm" value={hEdit} onChange={(e) => setHEdit(e.target.value)} />
            <Btn color={C.gold} onClick={() => { if (hEdit) updateUser({ height: Number(hEdit) }); }}>Guardar</Btn>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="mb-3" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, textTransform: 'uppercase' }}>Nueva medida</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha">
            <input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Peso (kg)">
            <input style={inputStyle} type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="78.5" />
          </Field>
          <Field label="% Grasa (opcional)">
            <input style={inputStyle} type="number" inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="18" />
          </Field>
          <Field label="% Músculo (opcional)">
            <input style={inputStyle} type="number" inputMode="decimal" value={muscle} onChange={(e) => setMuscle(e.target.value)} placeholder="42" />
          </Field>
        </div>
        {previewBmi != null && (
          <p className="text-sm mt-2" style={{ color: C.dim }}>IMC calculado: <b style={{ color: C.text }}>{previewBmi}</b> ({bmiLabel(previewBmi)})</p>
        )}
        {err && <p className="text-sm mt-2" style={{ color: C.red }}>{err}</p>}
        <div className="mt-3">
          <Btn full color={C.gold} onClick={() => {
            const w = parseFloat(weight);
            if (!date) { setErr('Falta la fecha.'); return; }
            if (!w || Number.isNaN(w)) { setErr('Escribe un peso válido.'); return; }
            setErr('');
            addMetric({ date, weight: w, fat: fat === '' ? null : parseFloat(fat), muscle: muscle === '' ? null : parseFloat(muscle) });
            setWeight(''); setFat(''); setMuscle('');
          }}>Guardar medida</Btn>
        </div>
      </Card>

      <Card>
        <div className="flex gap-2 mb-3 flex-wrap">
          {Object.keys(METRIC_DEFS).map((k) => (
            <button key={k} onClick={() => setMetric(k)} className="rounded-full px-3 py-1 text-sm font-semibold" style={{
              background: metric === k ? METRIC_DEFS[k].color : 'transparent',
              color: metric === k ? C.ink : C.dim,
              border: '1px solid ' + (metric === k ? METRIC_DEFS[k].color : C.line),
              cursor: 'pointer',
            }}>{METRIC_DEFS[k].label}</button>
          ))}
        </div>
        {chartData.length >= 2 ? (
          <MiniChart data={chartData} color={def.color} unit={def.unit} />
        ) : (
          <p className="text-sm" style={{ color: C.dim }}>Registra al menos 2 medidas de {def.label.toLowerCase()} para ver la tendencia.</p>
        )}
      </Card>

      <Card>
        <h3 className="mb-2" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, textTransform: 'uppercase' }}>Historial</h3>
        {metricsAsc.length === 0 && <p className="text-sm" style={{ color: C.dim }}>Aún no hay medidas registradas.</p>}
        <div className="flex flex-col">
          {[...metricsAsc].reverse().map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid ' + C.line }}>
              <div>
                <p className="font-semibold text-sm">{fmtDate(m.date)} · {m.weight} kg{height ? ' · IMC ' + bmiOf(m.weight, height) : ''}</p>
                <p className="text-xs" style={{ color: C.dim }}>
                  {m.fat != null ? 'Grasa ' + m.fat + '%' : ''}{m.fat != null && m.muscle != null ? ' · ' : ''}{m.muscle != null ? 'Músculo ' + m.muscle + '%' : ''}
                  {m.fat == null && m.muscle == null ? 'Solo peso' : ''}
                </p>
              </div>
              <button onClick={() => deleteMetric(m.id)} aria-label="Eliminar medida" style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
