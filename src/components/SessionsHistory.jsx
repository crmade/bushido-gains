import { useState, useMemo } from 'react';
import { C, FONT_DISPLAY, inputStyle } from '../lib/theme';
import { fmtDate } from '../lib/utils';
import { kgToDisplay, inputToKg, weightUnit } from '../lib/units';
import { useLang } from '../lib/i18n.jsx';
import { BJJ_BELTS, beltName } from '../data/bjj';
import Btn from './Btn';
import Card from './Card';

export default function SessionsHistory({ data, deleteSession, deleteAllSessions, updateSessionNotes, updateSessionWeight, units = 'kg' }) {
  const { t, lang } = useLang();
  const [confirmDel, setConfirmDel] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [filterDay, setFilterDay] = useState(null);
  const [editingNotes, setEditingNotes] = useState(null);
  const [draftNotes, setDraftNotes] = useState('');
  const [editingWeight, setEditingWeight] = useState(null);
  const [weightDraft, setWeightDraft] = useState('');
  const [weightDraftUnit, setWeightDraftUnit] = useState('kg');

  const allRoutines = data.routines || [];

  const exerciseById = useMemo(() => {
    const m = {};
    allRoutines.forEach((r) => {
      (r.days || []).forEach((d) => {
        (d.exercises || []).forEach((e) => { if (!m[e.id]) m[e.id] = { ...e, dayId: d.id, routineId: r.id }; });
      });
    });
    return m;
  }, [allRoutines]);

  const dayById = useMemo(() => {
    const m = {};
    allRoutines.forEach((r) => {
      (r.days || []).forEach((d, i) => { if (!m[d.id]) m[d.id] = { ...d, index: i, routineId: r.id }; });
    });
    return m;
  }, [allRoutines]);

  const sessionsList = useMemo(() => {
    const sessions = data.sessions || {};
    const done = data.done || {};
    const allDates = new Set([...Object.keys(sessions), ...Object.keys(done)]);
    const list = [...allDates].map((date) => {
      const s = sessions[date] || {};
      const checks = done[date] || {};
      const checkedIds = Object.keys(checks).filter((id) => checks[id]);
      let dayId = s.dayId;
      if (!dayId) {
        for (const id of checkedIds) {
          if (exerciseById[id]?.dayId) { dayId = exerciseById[id].dayId; break; }
        }
      }
      return {
        date,
        dayId: dayId || null,
        notes: s.notes || '',
        exercises: s.exercises || {},
        checkedIds,
      };
    });
    return list
      .filter((s) => {
        const hasWeights = Object.values(s.exercises).some((ex) => ex?.weight != null && ex.weight !== '');
        const hasNotes = s.notes && s.notes.trim();
        const hasDayChecks = s.checkedIds.some((id) => exerciseById[id]);
        return hasWeights || hasNotes || hasDayChecks;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [data.sessions, data.done, exerciseById]);

  const dayIdsInSessions = useMemo(() => {
    const s = new Set();
    sessionsList.forEach((sess) => sess.dayId && s.add(sess.dayId));
    return [...s];
  }, [sessionsList]);

  const filtered = filterDay ? sessionsList.filter((s) => s.dayId === filterDay) : sessionsList;

  if (sessionsList.length === 0) {
    return (
      <Card style={{ background: C.surface2 }}>
        <h3 className="mb-2" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, textTransform: 'uppercase' }}>{t('sessions.title')}</h3>
        <p className="text-sm" style={{ color: C.dim }}>{t('sessions.empty')}</p>
      </Card>
    );
  }

  const countLabel = sessionsList.length === 1 ? t('sessions.countOne') : t('sessions.count', { n: sessionsList.length });
  const visibleLabel = filterDay ? (filtered.length === 1 ? t('sessions.visibleOne') : t('sessions.visible', { n: filtered.length })) : '';

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, textTransform: 'uppercase' }}>{t('sessions.title')}</h3>
            <p className="text-xs" style={{ color: C.dim }}>{countLabel}{visibleLabel ? ' · ' + visibleLabel : ''}</p>
          </div>
          {sessionsList.length > 1 && deleteAllSessions && (
            confirmClear ? (
              <div className="flex gap-2">
                <Btn small color={C.red} onClick={() => { deleteAllSessions(); setConfirmClear(false); }}>{t('sessions.clearConfirm')}</Btn>
                <Btn small ghost onClick={() => setConfirmClear(false)}>{t('common.cancel')}</Btn>
              </div>
            ) : (
              <Btn small ghost color={C.red} onClick={() => setConfirmClear(true)}>{t('common.clearAll')}</Btn>
            )
          )}
        </div>
        {dayIdsInSessions.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilterDay(null)} className="rounded-full px-3 py-1 text-xs font-semibold" style={{
              background: !filterDay ? C.surface2 : 'transparent',
              color: !filterDay ? C.text : C.dim,
              border: '1px solid ' + (!filterDay ? C.gold : C.line),
              cursor: 'pointer',
            }}>{t('common.all')}</button>
            {dayIdsInSessions.sort().map((id) => {
              const d = dayById[id];
              const on = filterDay === id;
              const color = d?.color || C.gold;
              return (
                <button key={id} onClick={() => setFilterDay(id)} className="rounded-full px-3 py-1 text-xs font-semibold" style={{
                  background: on ? C.surface2 : 'transparent',
                  color: on ? C.text : C.dim,
                  border: '1px solid ' + (on ? color : C.line),
                  cursor: 'pointer',
                }}>{t('common.day')} {id}</button>
              );
            })}
          </div>
        )}
      </Card>

      {filtered.map((s) => {
        const day = dayById[s.dayId];
        const dayColor = day?.color || C.gold;
        const belt = day ? BJJ_BELTS[Math.min(day.index, BJJ_BELTS.length - 1)] : null;
        const beltLabel = belt ? beltName(belt, lang) : '';
        const exIds = new Set([
          ...Object.keys(s.exercises || {}).filter((id) => {
            const ent = s.exercises[id];
            return (ent?.weight != null && ent.weight !== '') || ent?.name;
          }),
          ...s.checkedIds.filter((id) => exerciseById[id]),
        ]);
        const entries = [...exIds].map((exId) => {
          const val = s.exercises?.[exId] || {};
          return { exId, weight: val.weight, snapName: val.name, snapUnit: val.unit, ex: exerciseById[exId] };
        });

        return (
          <Card key={s.date}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs" style={{ color: C.gold }}>{fmtDate(s.date)}</p>
                {day && (
                  <h4 className="mt-0.5" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, lineHeight: 1.15, textTransform: 'uppercase', color: dayColor }}>
                    {day.name}{beltLabel ? ' · ' + t('common.belt') + ' ' + beltLabel : ''}
                  </h4>
                )}
                {!day && s.dayId && (
                  <p className="text-xs mt-0.5" style={{ color: C.dim }}>{t('sessions.dayMissing', { id: s.dayId })}</p>
                )}
              </div>
              {confirmDel === s.date ? (
                <div className="flex gap-1">
                  <Btn small color={C.red} onClick={() => { deleteSession(s.date); setConfirmDel(null); }}>{t('common.delete')}</Btn>
                  <Btn small ghost onClick={() => setConfirmDel(null)}>{t('common.cancel')}</Btn>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDel(s.date)}
                  aria-label={t('common.delete')}
                  className="rounded-full"
                  style={{ background: 'transparent', border: '1px solid ' + C.line, color: C.dim, cursor: 'pointer', fontSize: 14, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >×</button>
              )}
            </div>

            {entries.length > 0 && (
              <div className="mt-3 flex flex-col gap-1">
                {entries.map(({ exId, weight, snapName, snapUnit, ex }) => {
                  const name = snapName || ex?.name || t('sessions.exerciseMissing');
                  const u = snapUnit || ex?.unit || units;
                  const hasWeight = weight != null && weight !== '';
                  const isEditing = editingWeight && editingWeight.date === s.date && editingWeight.exId === exId;

                  function saveWeight() {
                    const trimmed = (weightDraft || '').trim();
                    const kg = trimmed === '' ? null : inputToKg(trimmed, weightDraftUnit);
                    const oldKg = hasWeight ? Math.round(Number(weight) * 100) / 100 : null;
                    const newKg = kg == null ? null : Math.round(kg * 100) / 100;
                    const unitChanged = kg != null && weightDraftUnit !== u;
                    if (newKg !== oldKg || unitChanged) {
                      updateSessionWeight(s.date, exId, kg, { name, unit: kg != null ? weightDraftUnit : u });
                    }
                    setEditingWeight(null);
                  }

                  return (
                    <div key={exId} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex-1" style={{ color: C.text }}>{name}</span>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            inputMode="decimal"
                            autoFocus
                            value={weightDraft}
                            onChange={(e) => setWeightDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); saveWeight(); }
                              if (e.key === 'Escape') { e.preventDefault(); setEditingWeight(null); }
                            }}
                            placeholder={weightUnit(weightDraftUnit)}
                            style={{ ...inputStyle, width: 65, padding: '4px 8px', fontSize: 13 }}
                          />
                          <div className="flex" style={{ border: '1px solid ' + C.line, borderRadius: 6, overflow: 'hidden' }}>
                            {['kg', 'lbs'].map((uu) => {
                              const on = weightDraftUnit === uu;
                              return (
                                <button
                                  key={uu}
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    if (on) return;
                                    const trimmed = (weightDraft || '').trim();
                                    if (trimmed !== '') {
                                      const kg = inputToKg(trimmed, weightDraftUnit);
                                      if (kg != null) setWeightDraft(String(kgToDisplay(kg, uu)));
                                    }
                                    setWeightDraftUnit(uu);
                                  }}
                                  style={{
                                    background: on ? C.gold : 'transparent',
                                    color: on ? C.ink : C.dim,
                                    border: 'none',
                                    cursor: on ? 'default' : 'pointer',
                                    padding: '3px 7px',
                                    fontSize: 11,
                                    fontWeight: 700,
                                  }}
                                >{uu}</button>
                              );
                            })}
                          </div>
                          <button
                            type="button"
                            onClick={saveWeight}
                            style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', fontSize: 16, padding: '0 4px' }}
                            aria-label={t('common.save')}
                          >✓</button>
                          <button
                            type="button"
                            onClick={() => setEditingWeight(null)}
                            style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 16, padding: '0 4px' }}
                            aria-label={t('common.cancel')}
                          >×</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold" style={{ color: hasWeight ? dayColor : C.dim }}>
                            {hasWeight ? (kgToDisplay(weight, u) + ' ' + weightUnit(u)) : '—'}
                          </span>
                          {updateSessionWeight && (
                            <button
                              onClick={() => {
                                setEditingWeight({ date: s.date, exId });
                                setWeightDraftUnit(u);
                                setWeightDraft(hasWeight ? String(kgToDisplay(weight, u)) : '');
                              }}
                              aria-label={t('common.edit')}
                              style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 12, padding: 0 }}
                            >✎</button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {editingNotes === s.date ? (
              <div className="mt-3 flex flex-col gap-2" style={{ borderTop: '1px solid ' + C.line, paddingTop: 8 }}>
                <textarea
                  style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontSize: 14 }}
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder={t('routine.sessionPlaceholder')}
                />
                <div className="flex gap-2">
                  <Btn small color={C.gold} onClick={() => { updateSessionNotes(s.date, draftNotes); setEditingNotes(null); }}>{t('common.save')}</Btn>
                  <Btn small ghost onClick={() => setEditingNotes(null)}>{t('common.cancel')}</Btn>
                </div>
              </div>
            ) : (s.notes && s.notes.trim()) ? (
              <div className="mt-3 flex items-start justify-between gap-2" style={{ borderTop: '1px solid ' + C.line, paddingTop: 8 }}>
                <p className="text-sm flex-1 whitespace-pre-wrap" style={{ color: C.dim }}>{s.notes}</p>
                {updateSessionNotes && (
                  <button onClick={() => { setEditingNotes(s.date); setDraftNotes(s.notes || ''); }} className="text-xs hover:underline" style={{ color: C.dim, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>{t('common.edit')}</button>
                )}
              </div>
            ) : updateSessionNotes ? (
              <div className="mt-3 flex items-center justify-between gap-2" style={{ borderTop: '1px solid ' + C.line, paddingTop: 8 }}>
                <p className="text-xs italic" style={{ color: C.dim }}>{t('sessions.noNotes')}</p>
                <button onClick={() => { setEditingNotes(s.date); setDraftNotes(''); }} className="text-xs hover:underline" style={{ color: C.dim, background: 'none', border: 'none', cursor: 'pointer' }}>{t('sessions.addNotes')}</button>
              </div>
            ) : null}
          </Card>
        );
      })}
    </>
  );
}
