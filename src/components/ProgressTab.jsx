import { useState, useMemo } from 'react';
import { C, FONT_DISPLAY, inputStyle } from '../lib/theme';
import { todayStr, fmtDate } from '../lib/utils';
import { kgToDisplay, inputToKg, weightUnit, cmToDisplay, inputToCm, heightUnit } from '../lib/units';
import { useLang } from '../lib/i18n.jsx';
import Btn from './Btn';
import Card from './Card';
import Field from './Field';
import MiniChart from './MiniChart';
import SessionsHistory from './SessionsHistory';

function bmiOf(weight, heightCm) {
  if (!weight || !heightCm) return null;
  const h = heightCm / 100;
  return Math.round((weight / (h * h)) * 10) / 10;
}

export default function ProgressTab({ data, user, addMetric, deleteMetric, editMetric, deleteAllMetrics, updateUser, deleteSession, deleteAllSessions, updateSessionNotes, units = 'kg' }) {
  const { t } = useLang();
  const [date, setDate] = useState(todayStr());
  const [weight, setWeight] = useState('');
  const [fat, setFat] = useState('');
  const [muscle, setMuscle] = useState('');
  const [hEdit, setHEdit] = useState('');
  const [metric, setMetric] = useState('weight');
  const [err, setErr] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ date: '', weight: '', fat: '', muscle: '' });
  const [editErr, setEditErr] = useState('');

  function startEdit(m) {
    setEditingId(m.id);
    setEditDraft({
      date: m.date,
      weight: m.weight != null ? String(kgToDisplay(m.weight, units)) : '',
      fat: m.fat != null ? String(m.fat) : '',
      muscle: m.muscle != null ? String(m.muscle) : '',
    });
    setEditErr('');
    setConfirmDel(null);
  }

  function saveEdit() {
    const wKg = inputToKg(editDraft.weight, units);
    if (!editDraft.date) { setEditErr(t('progress.errDate')); return; }
    if (!wKg || !Number.isFinite(wKg)) { setEditErr(t('progress.errWeight')); return; }
    editMetric(editingId, {
      date: editDraft.date,
      weight: wKg,
      fat: editDraft.fat === '' ? null : parseFloat(editDraft.fat),
      muscle: editDraft.muscle === '' ? null : parseFloat(editDraft.muscle),
    });
    setEditingId(null);
    setEditErr('');
  }

  const METRIC_DEFS = {
    weight: { label: t('progress.metricWeight'), unit: weightUnit(units), color: C.gold },
    fat: { label: t('progress.metricFat'), unit: '%', color: C.red },
    muscle: { label: t('progress.metricMuscle'), unit: '%', color: C.green },
    bmi: { label: t('progress.metricBmi'), unit: '', color: C.blue },
  };

  function bmiLabel(b) {
    if (b == null) return '';
    if (b < 18.5) return t('progress.bmiUnderweight');
    if (b < 25) return t('progress.bmiNormal');
    if (b < 30) return t('progress.bmiOverweight');
    return t('progress.bmiObese');
  }

  const heightCm = user && user.height ? user.height : null;
  const metricsAsc = useMemo(() => [...data.metrics].sort((a, b) => (a.date < b.date ? -1 : 1)), [data.metrics]);
  const last = metricsAsc[metricsAsc.length - 1] || null;
  const first = metricsAsc[0] || null;
  const weightKgInput = inputToKg(weight, units);
  const previewBmi = bmiOf(weightKgInput, heightCm);

  const chartData = metricsAsc
    .map((m) => {
      let v = null;
      if (metric === 'bmi') v = bmiOf(m.weight, heightCm);
      else if (metric === 'weight') v = m.weight != null ? kgToDisplay(m.weight, units) : null;
      else v = m[metric] != null && m[metric] !== '' ? Number(m[metric]) : null;
      return { label: fmtDate(m.date), v };
    })
    .filter((d) => d.v != null && !Number.isNaN(d.v));

  const def = METRIC_DEFS[metric];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        <Card style={{ padding: 12 }}>
          <p className="text-xs uppercase" style={{ color: C.dim }}>{t('progress.currentWeight')}</p>
          <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22 }}>{last && last.weight ? kgToDisplay(last.weight, units) + ' ' + weightUnit(units) : '—'}</p>
        </Card>
        <Card style={{ padding: 12 }}>
          <p className="text-xs uppercase" style={{ color: C.dim }}>{t('progress.bmi')}</p>
          <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22 }}>{last && heightCm ? bmiOf(last.weight, heightCm) : '—'}</p>
          <p className="text-xs" style={{ color: C.dim }}>{last && heightCm ? bmiLabel(bmiOf(last.weight, heightCm)) : ''}</p>
        </Card>
        <Card style={{ padding: 12 }}>
          <p className="text-xs uppercase" style={{ color: C.dim }}>{t('progress.change')}</p>
          <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.green }}>
            {first && last && first.id !== last.id && first.weight && last.weight
              ? ((last.weight - first.weight > 0 ? '+' : '') + kgToDisplay(last.weight - first.weight, units) + ' ' + weightUnit(units))
              : '—'}
          </p>
        </Card>
      </div>

      {!heightCm && (
        <Card>
          <p className="text-sm mb-2" style={{ color: C.dim }}>{t('progress.needHeight')}</p>
          <div className="flex gap-2">
            <input style={{ ...inputStyle, flex: 1 }} type="number" inputMode="decimal" placeholder={t('progress.heightPlaceholder', { unit: heightUnit(units) })} value={hEdit} onChange={(e) => setHEdit(e.target.value)} />
            <Btn color={C.gold} onClick={() => { const cm = inputToCm(hEdit, units); if (cm) updateUser({ height: cm }); }}>{t('common.save')}</Btn>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="mb-3" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, textTransform: 'uppercase' }}>{t('progress.newMetric')}</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('progress.date')}>
            <input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label={t('progress.weight', { unit: weightUnit(units) })}>
            <input style={inputStyle} type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={units === 'lbs' ? '172.5' : '78.5'} />
          </Field>
          <Field label={t('progress.fat')}>
            <input style={inputStyle} type="number" inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="18" />
          </Field>
          <Field label={t('progress.muscle')}>
            <input style={inputStyle} type="number" inputMode="decimal" value={muscle} onChange={(e) => setMuscle(e.target.value)} placeholder="42" />
          </Field>
        </div>
        {previewBmi != null && (
          <p className="text-sm mt-2" style={{ color: C.dim }}>{t('progress.bmiCalc')}<b style={{ color: C.text }}>{previewBmi}</b> ({bmiLabel(previewBmi)})</p>
        )}
        {err && <p className="text-sm mt-2" style={{ color: C.red }}>{err}</p>}
        <div className="mt-3">
          <Btn full color={C.gold} onClick={() => {
            const wKg = inputToKg(weight, units);
            if (!date) { setErr(t('progress.errDate')); return; }
            if (!wKg || !Number.isFinite(wKg)) { setErr(t('progress.errWeight')); return; }
            setErr('');
            addMetric({ date, weight: wKg, fat: fat === '' ? null : parseFloat(fat), muscle: muscle === '' ? null : parseFloat(muscle) });
            setWeight(''); setFat(''); setMuscle('');
          }}>{t('progress.saveMetric')}</Btn>
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
          <p className="text-sm" style={{ color: C.dim }}>{t('progress.needMore', { metric: def.label.toLowerCase() })}</p>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-2">
          <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, textTransform: 'uppercase' }}>{t('progress.history')}</h3>
          {metricsAsc.length > 1 && deleteAllMetrics && (
            confirmClear ? (
              <div className="flex gap-2">
                <Btn small color={C.red} onClick={() => { deleteAllMetrics(); setConfirmClear(false); }}>{t('progress.clearConfirm')}</Btn>
                <Btn small ghost onClick={() => setConfirmClear(false)}>{t('common.cancel')}</Btn>
              </div>
            ) : (
              <Btn small ghost color={C.red} onClick={() => setConfirmClear(true)}>{t('progress.clearAll')}</Btn>
            )
          )}
        </div>
        {metricsAsc.length === 0 && <p className="text-sm" style={{ color: C.dim }}>{t('progress.empty')}</p>}
        <div className="flex flex-col">
          {[...metricsAsc].reverse().map((m) => (
            <div key={m.id} className="py-2" style={{ borderBottom: '1px solid ' + C.line }}>
              {editingId === m.id ? (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Field label={t('progress.date')}>
                      <input style={inputStyle} type="date" value={editDraft.date} onChange={(e) => setEditDraft({ ...editDraft, date: e.target.value })} />
                    </Field>
                    <Field label={t('progress.weight', { unit: weightUnit(units) })}>
                      <input style={inputStyle} type="number" inputMode="decimal" value={editDraft.weight} onChange={(e) => setEditDraft({ ...editDraft, weight: e.target.value })} />
                    </Field>
                    <Field label={t('progress.fat')}>
                      <input style={inputStyle} type="number" inputMode="decimal" value={editDraft.fat} onChange={(e) => setEditDraft({ ...editDraft, fat: e.target.value })} />
                    </Field>
                    <Field label={t('progress.muscle')}>
                      <input style={inputStyle} type="number" inputMode="decimal" value={editDraft.muscle} onChange={(e) => setEditDraft({ ...editDraft, muscle: e.target.value })} />
                    </Field>
                  </div>
                  {editErr && <p className="text-sm" style={{ color: C.red }}>{editErr}</p>}
                  <div className="flex gap-2">
                    <Btn small color={C.gold} onClick={saveEdit}>{t('common.save')}</Btn>
                    <Btn small ghost onClick={() => { setEditingId(null); setEditErr(''); }}>{t('common.cancel')}</Btn>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{fmtDate(m.date)} · {kgToDisplay(m.weight, units)} {weightUnit(units)}{heightCm ? ' · ' + t('progress.bmi') + ' ' + bmiOf(m.weight, heightCm) : ''}</p>
                    <p className="text-xs" style={{ color: C.dim }}>
                      {m.fat != null ? t('progress.fatLabel', { n: m.fat }) : ''}{m.fat != null && m.muscle != null ? ' · ' : ''}{m.muscle != null ? t('progress.muscleLabel', { n: m.muscle }) : ''}
                      {m.fat == null && m.muscle == null ? t('progress.weightOnly') : ''}
                    </p>
                  </div>
                  {confirmDel === m.id ? (
                    <div className="flex gap-1">
                      <Btn small color={C.red} onClick={() => { deleteMetric(m.id); setConfirmDel(null); }}>{t('common.delete')}</Btn>
                      <Btn small ghost onClick={() => setConfirmDel(null)}>{t('common.cancel')}</Btn>
                    </div>
                  ) : (
                    <div className="flex gap-1 items-center">
                      {editMetric && (
                        <button
                          onClick={() => startEdit(m)}
                          aria-label={t('common.edit')}
                          className="text-xs hover:underline"
                          style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer' }}
                        >{t('common.edit')}</button>
                      )}
                      <button
                        onClick={() => { setConfirmDel(m.id); setEditingId(null); }}
                        aria-label={t('common.delete')}
                        className="rounded-full"
                        style={{ background: 'transparent', border: '1px solid ' + C.line, color: C.dim, cursor: 'pointer', fontSize: 14, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >×</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <SessionsHistory data={data} deleteSession={deleteSession} deleteAllSessions={deleteAllSessions} updateSessionNotes={updateSessionNotes} units={units} />
    </div>
  );
}
