import { useState, useEffect } from 'react';
import { C, FONT_DISPLAY, inputStyle } from '../lib/theme';
import { todayStr, fmtDate } from '../lib/utils';
import { kgToDisplay, inputToKg, weightUnit } from '../lib/units';
import { useLang } from '../lib/i18n.jsx';
import { BJJ_BELTS, beltName } from '../data/bjj';
import Btn from './Btn';
import Card from './Card';
import Field from './Field';
import Belt from './Belt';
import VideoEmbed from './VideoEmbed';
import WarmupCard from './WarmupCard';
import WhenToChange from './WhenToChange';

function lastKgFor(sessions, exId, excludeDate) {
  const dates = Object.keys(sessions || {}).filter((d) => d !== excludeDate).sort().reverse();
  for (const d of dates) {
    const w = sessions[d]?.exercises?.[exId]?.weight;
    if (w != null && w !== '') return { kg: Number(w), date: d };
  }
  return null;
}

function WeightInput({ kgValue, units, onSaveKg, lastKg, lastDate }) {
  const { t } = useLang();
  const displayedKg = kgValue == null || kgValue === '' ? '' : String(kgToDisplay(kgValue, units));
  const [local, setLocal] = useState(displayedKg);

  useEffect(() => {
    const d = kgValue == null || kgValue === '' ? '' : String(kgToDisplay(kgValue, units));
    setLocal(d);
  }, [kgValue, units]);

  function commit() {
    const newKg = inputToKg(local, units);
    const oldKg = kgValue == null || kgValue === '' ? null : Number(kgValue);
    const newRounded = newKg == null ? null : Math.round(newKg * 100) / 100;
    const oldRounded = oldKg == null ? null : Math.round(oldKg * 100) / 100;
    if (newRounded !== oldRounded) onSaveKg(newKg);
  }

  return (
    <div className="mt-2 flex items-center gap-2 flex-wrap">
      <input
        type="text"
        inputMode="decimal"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } }}
        placeholder={weightUnit(units)}
        style={{ ...inputStyle, width: 100, padding: '6px 10px', fontSize: 14 }}
      />
      {lastKg != null && (
        <span className="text-xs" style={{ color: C.dim }}>
          {t('routine.lastWeight', { value: kgToDisplay(lastKg, units) + ' ' + weightUnit(units) })}
          {lastDate ? ' · ' + fmtDate(lastDate) : ''}
        </span>
      )}
    </div>
  );
}

function SessionNotes({ value, onSave }) {
  const { t } = useLang();
  const [local, setLocal] = useState(value || '');
  useEffect(() => { setLocal(value || ''); }, [value]);

  function commit() {
    if (local !== (value || '')) onSave(local);
  }

  return (
    <Card style={{ background: C.surface2 }}>
      <Field label={t('routine.sessionNotes')}>
        <textarea
          style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontSize: 14 }}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={commit}
          placeholder={t('routine.sessionPlaceholder')}
        />
      </Field>
    </Card>
  );
}

export default function RoutineTab({ data, dayIdx, setDayIdx, editMode, setEditMode, patchExercise, addExercise, removeExercise, moveExercise, resetRoutine, toggleDone, sessions, setExerciseWeight, setSessionNotes, units }) {
  const { t, lang } = useLang();
  const [confirmReset, setConfirmReset] = useState(false);
  const day = data.routine.days[Math.min(dayIdx, data.routine.days.length - 1)];
  const today = todayStr();
  const doneToday = data.done[today] || {};
  const doneCount = day.exercises.filter((e) => doneToday[e.id]).length;
  const todaySession = (sessions || {})[today] || { exercises: {}, notes: '' };
  const belt = BJJ_BELTS[Math.min(dayIdx, BJJ_BELTS.length - 1)];
  const beltLabel = beltName(belt, lang);
  const everyN = day.exercises.length > 0 ? Math.max(1, Math.ceil(day.exercises.length / 4)) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        {data.routine.days.map((d, i) => (
          <button key={d.id} onClick={() => setDayIdx(i)} className="rounded-lg py-2 flex flex-col items-center gap-1" style={{
            background: i === dayIdx ? C.surface2 : 'transparent',
            border: '1px solid ' + (i === dayIdx ? d.color : C.line),
            cursor: 'pointer',
          }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: i === dayIdx ? d.color : C.dim, textTransform: 'uppercase', lineHeight: 1 }}>{d.id}</span>
            <span className="text-xs" style={{ color: C.dim }}>{t('routine.exercises', { n: d.exercises.length })}</span>
          </button>
        ))}
      </div>

      <WarmupCard warmup={data.routine.warmup || []} doneToday={doneToday} toggleDone={toggleDone} />

      <div>
        <Belt color={day.color} stripeColor={day.stripeColor} total={day.exercises.length} done={doneCount} />
        <div className="flex justify-between mt-1">
          <span className="text-xs" style={{ color: C.dim }}>
            {everyN > 0
              ? (beltLabel
                  ? t('routine.beltHint', { belt: beltLabel, n: everyN })
                  : t('routine.beltHintNoBelt', { n: everyN }))
              : ''}
          </span>
          <span className="text-xs font-semibold" style={{ color: day.color }}>{doneCount}/{day.exercises.length}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Btn small ghost color={editMode ? C.gold : C.text} onClick={() => { setEditMode(!editMode); setConfirmReset(false); }}>
          {editMode ? t('routine.editEnd') : t('routine.editStart')}
        </Btn>
        {editMode && !confirmReset && (
          <Btn small ghost color={C.red} onClick={() => setConfirmReset(true)}>{t('routine.restoreOriginal')}</Btn>
        )}
        {editMode && confirmReset && (
          <Btn small color={C.red} onClick={resetRoutine}>{t('routine.restoreConfirm')}</Btn>
        )}
      </div>

      {day.exercises.map((e, i) => {
        const last = lastKgFor(sessions, e.id, today);
        const currentKg = todaySession.exercises?.[e.id]?.weight;
        return (
          <Card key={e.id}>
            {!editMode ? (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    {e.muscle && (
                      <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: day.color }}>{e.muscle}</span>
                    )}
                    <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 22, lineHeight: 1.1, textTransform: 'uppercase' }}>{e.name}</h3>
                    <p className="mt-1 text-sm font-semibold">{e.sets} × {e.reps}</p>
                    <WeightInput
                      kgValue={currentKg}
                      units={units}
                      onSaveKg={(kg) => setExerciseWeight(e.id, kg)}
                      lastKg={last?.kg}
                      lastDate={last?.date}
                    />
                    {e.tip && <p className="mt-2 text-sm" style={{ color: C.dim }}>{e.tip}</p>}
                  </div>
                  <button onClick={() => toggleDone(e.id)} aria-label={t('routine.markDone')} className="rounded-full flex items-center justify-center" style={{
                    width: 34, height: 34, flexShrink: 0, cursor: 'pointer',
                    background: doneToday[e.id] ? day.color : 'transparent',
                    border: '2px solid ' + (doneToday[e.id] ? day.color : C.line),
                    color: doneToday[e.id] ? C.ink : C.dim, fontWeight: 700,
                  }}>✓</button>
                </div>
                <VideoEmbed video={e.video} dayColor={day.color} name={e.name} />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Field label={t('routine.fieldExercise')}>
                  <input style={inputStyle} value={e.name} onChange={(ev) => patchExercise(day.id, e.id, { name: ev.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t('routine.fieldSets')}>
                    <input style={inputStyle} type="number" inputMode="numeric" value={e.sets} onChange={(ev) => patchExercise(day.id, e.id, { sets: ev.target.value === '' ? '' : Number(ev.target.value) })} />
                  </Field>
                  <Field label={t('routine.fieldReps')}>
                    <input style={inputStyle} value={e.reps} onChange={(ev) => patchExercise(day.id, e.id, { reps: ev.target.value })} />
                  </Field>
                </div>
                <Field label={t('routine.fieldMuscle')}>
                  <input style={inputStyle} value={e.muscle} onChange={(ev) => patchExercise(day.id, e.id, { muscle: ev.target.value })} />
                </Field>
                <Field label={t('routine.fieldTip')}>
                  <input style={inputStyle} value={e.tip} onChange={(ev) => patchExercise(day.id, e.id, { tip: ev.target.value })} />
                </Field>
                <Field label={t('routine.fieldVideo')}>
                  <input style={inputStyle} value={e.video} onChange={(ev) => patchExercise(day.id, e.id, { video: ev.target.value })} placeholder="https://youtube.com/watch?v=…" />
                </Field>
                <div className="flex gap-2 flex-wrap">
                  <Btn small ghost onClick={() => moveExercise(day.id, e.id, -1)} style={{ opacity: i === 0 ? 0.4 : 1 }}>{t('routine.moveUp')}</Btn>
                  <Btn small ghost onClick={() => moveExercise(day.id, e.id, 1)} style={{ opacity: i === day.exercises.length - 1 ? 0.4 : 1 }}>{t('routine.moveDown')}</Btn>
                  <Btn small ghost color={C.red} onClick={() => removeExercise(day.id, e.id)}>{t('common.delete')}</Btn>
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {editMode && (
        <Btn full ghost color={day.color} onClick={() => addExercise(day.id)}>{t('routine.addExercise', { day: day.name })}</Btn>
      )}

      {!editMode && setSessionNotes && (
        <SessionNotes value={todaySession.notes || ''} onSave={setSessionNotes} />
      )}

      <WhenToChange />
    </div>
  );
}
