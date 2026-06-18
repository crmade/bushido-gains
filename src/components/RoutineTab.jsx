import { useState, useEffect, useRef } from 'react';
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

function WeightInput({ kgValue, exUnit, onSaveKg, onUnitChange, lastKg, lastDate }) {
  const { t } = useLang();
  const displayedKg = kgValue == null || kgValue === '' ? '' : String(kgToDisplay(kgValue, exUnit));
  const [local, setLocal] = useState(displayedKg);

  useEffect(() => {
    const d = kgValue == null || kgValue === '' ? '' : String(kgToDisplay(kgValue, exUnit));
    setLocal(d);
  }, [kgValue, exUnit]);

  function commit() {
    const newKg = inputToKg(local, exUnit);
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
        placeholder={weightUnit(exUnit)}
        style={{ ...inputStyle, width: 100, padding: '6px 10px', fontSize: 14 }}
      />
      {onUnitChange && (
        <div className="flex" style={{ border: '1px solid ' + C.line, borderRadius: 6, overflow: 'hidden' }}>
          {['kg', 'lbs'].map((u) => {
            const on = exUnit === u;
            return (
              <button
                key={u}
                type="button"
                onClick={() => { if (!on) onUnitChange(u); }}
                style={{
                  background: on ? C.gold : 'transparent',
                  color: on ? C.ink : C.dim,
                  border: 'none',
                  cursor: on ? 'default' : 'pointer',
                  padding: '4px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >{u}</button>
            );
          })}
        </div>
      )}
      {lastKg != null && (
        <span className="text-xs" style={{ color: C.dim }}>
          {t('routine.lastWeight', { value: kgToDisplay(lastKg, exUnit) + ' ' + weightUnit(exUnit) })}
          {lastDate ? ' · ' + fmtDate(lastDate) : ''}
        </span>
      )}
    </div>
  );
}

function SessionNotes({ value, onSave }) {
  const { t } = useLang();
  const [local, setLocal] = useState(value || '');
  const timerRef = useRef(null);
  const valueRef = useRef(value || '');
  valueRef.current = value || '';

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function scheduleSave(next) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (next !== valueRef.current) onSave(next);
    }, 700);
  }

  function commit() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (local !== valueRef.current) onSave(local);
  }

  return (
    <Card style={{ background: C.surface2 }}>
      <Field label={t('routine.sessionNotes')}>
        <textarea
          style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontSize: 14 }}
          value={local}
          onChange={(e) => { setLocal(e.target.value); scheduleSave(e.target.value); }}
          onBlur={commit}
          placeholder={t('routine.sessionPlaceholder')}
        />
      </Field>
    </Card>
  );
}

export default function RoutineTab({ data, routine, routines, activeRoutineId, setActiveRoutine, renameRoutine, deleteRoutine, duplicateRoutine, addRoutine, addEmptyRoutine, goToGenerator, dayIdx, setDayIdx, editMode, setEditMode, patchExercise, addExercise, removeExercise, moveExercise, resetRoutine, toggleDone, sessions, setExerciseWeight, setExerciseUnit, setSessionNotes, units }) {
  const { t, lang } = useLang();
  const [confirmReset, setConfirmReset] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');
  const [confirmDeleteRoutine, setConfirmDeleteRoutine] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [showNewRoutine, setShowNewRoutine] = useState(false);
  const [emptyNameDraft, setEmptyNameDraft] = useState('');
  const [showEmptyForm, setShowEmptyForm] = useState(false);

  if (!routine) {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 26, textTransform: 'uppercase' }}>{t('routine.emptyTitle')}</h3>
          <p className="text-sm mt-2" style={{ color: C.dim }}>{t('routine.emptyBody')}</p>
          <div className="mt-4 flex flex-col gap-2">
            {goToGenerator && (
              <Btn full color={C.gold} onClick={goToGenerator}>{t('routine.emptyGenerate')}</Btn>
            )}
            {addEmptyRoutine && !showEmptyForm && (
              <Btn full ghost onClick={() => setShowEmptyForm(true)}>{t('routine.emptyCreate')}</Btn>
            )}
            {showEmptyForm && (
              <div className="flex gap-2">
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder={t('routine.newPlaceholder')}
                  value={emptyNameDraft}
                  onChange={(e) => setEmptyNameDraft(e.target.value)}
                  autoFocus
                />
                <Btn small color={C.gold} onClick={() => { addEmptyRoutine(emptyNameDraft.trim() || null); setEmptyNameDraft(''); setShowEmptyForm(false); }}>{t('common.create')}</Btn>
                <Btn small ghost onClick={() => { setShowEmptyForm(false); setEmptyNameDraft(''); }}>{t('common.cancel')}</Btn>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const day = routine.days[Math.min(dayIdx, routine.days.length - 1)];
  const today = todayStr();
  const doneToday = data.done[today] || {};
  const doneCount = day.exercises.filter((e) => doneToday[e.id]).length;
  const todaySession = (sessions || {})[today] || { exercises: {}, notes: '' };
  const belt = BJJ_BELTS[Math.min(dayIdx, BJJ_BELTS.length - 1)];
  const beltLabel = beltName(belt, lang);
  const everyN = day.exercises.length > 0 ? Math.max(1, Math.ceil(day.exercises.length / 4)) : 0;
  const canManage = routines && routines.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <Card style={{ background: C.surface2, padding: 12 }}>
          <div className="flex items-center gap-2">
            <select
              value={activeRoutineId || ''}
              onChange={(e) => setActiveRoutine && setActiveRoutine(e.target.value)}
              style={{ ...inputStyle, flex: 1, padding: '8px 10px', fontSize: 14 }}
            >
              {routines.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <button
              onClick={() => { setManageOpen(!manageOpen); setRenameDraft(routine.name); setConfirmDeleteRoutine(false); setShowNewRoutine(false); }}
              aria-label={t('routine.manage')}
              style={{ background: 'transparent', border: '1px solid ' + C.line, color: C.text, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 16 }}
            >⚙</button>
          </div>
          {manageOpen && (
            <div className="mt-3 flex flex-col gap-2">
              <Field label={t('routine.renameLabel')}>
                <div className="flex gap-2">
                  <input style={{ ...inputStyle, flex: 1 }} value={renameDraft} onChange={(e) => setRenameDraft(e.target.value)} />
                  <Btn small color={C.gold} onClick={() => { if (renameDraft.trim() && renameRoutine) { renameRoutine(activeRoutineId, renameDraft.trim()); } }}>{t('common.save')}</Btn>
                </div>
              </Field>
              <div className="flex gap-2 flex-wrap">
                {duplicateRoutine && (
                  <Btn small ghost onClick={() => duplicateRoutine(activeRoutineId)}>{t('routine.duplicate')}</Btn>
                )}
                {!showNewRoutine && addRoutine && (
                  <Btn small ghost color={C.gold} onClick={() => setShowNewRoutine(true)}>{t('routine.createNew')}</Btn>
                )}
                {deleteRoutine && routines.length > 1 && (
                  confirmDeleteRoutine ? (
                    <Btn small color={C.red} onClick={() => { deleteRoutine(activeRoutineId); setConfirmDeleteRoutine(false); setManageOpen(false); }}>{t('routine.deleteConfirm')}</Btn>
                  ) : (
                    <Btn small ghost color={C.red} onClick={() => setConfirmDeleteRoutine(true)}>{t('routine.deleteRoutine')}</Btn>
                  )
                )}
              </div>
              {showNewRoutine && addRoutine && (
                <div className="flex gap-2">
                  <input style={{ ...inputStyle, flex: 1 }} placeholder={t('routine.newPlaceholder')} value={newRoutineName} onChange={(e) => setNewRoutineName(e.target.value)} />
                  <Btn small color={C.gold} onClick={() => { addRoutine(newRoutineName.trim() || null); setNewRoutineName(''); setShowNewRoutine(false); setManageOpen(false); }}>{t('common.create')}</Btn>
                  <Btn small ghost onClick={() => { setShowNewRoutine(false); setNewRoutineName(''); }}>{t('common.cancel')}</Btn>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-3 gap-2">
        {routine.days.map((d, i) => (
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

      <WarmupCard warmup={routine.warmup || []} doneToday={doneToday} toggleDone={toggleDone} />

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
                      exUnit={e.unit || units}
                      onSaveKg={(kg) => setExerciseWeight(e.id, kg, { name: e.name, unit: e.unit || units })}
                      onUnitChange={setExerciseUnit ? (u) => setExerciseUnit(day.id, e.id, u) : null}
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
        <SessionNotes key={today} value={todaySession.notes || ''} onSave={setSessionNotes} />
      )}

      <WhenToChange />
    </div>
  );
}
