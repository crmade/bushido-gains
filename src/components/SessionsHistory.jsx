import { useState, useMemo } from 'react';
import { C, FONT_DISPLAY } from '../lib/theme';
import { fmtDate } from '../lib/utils';
import { kgToDisplay, weightUnit } from '../lib/units';
import { useLang } from '../lib/i18n.jsx';
import { BJJ_BELTS, beltName } from '../data/bjj';
import Btn from './Btn';
import Card from './Card';

export default function SessionsHistory({ data, deleteSession, deleteAllSessions, units = 'kg' }) {
  const { t, lang } = useLang();
  const [confirmDel, setConfirmDel] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [filterDay, setFilterDay] = useState(null);

  const sessionsList = useMemo(() => {
    const obj = data.sessions || {};
    return Object.values(obj)
      .filter((s) => {
        if (!s) return false;
        const hasWeights = s.exercises && Object.values(s.exercises).some((ex) => ex?.weight != null && ex.weight !== '');
        const hasNotes = s.notes && s.notes.trim();
        return hasWeights || hasNotes;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [data.sessions]);

  const dayById = useMemo(() => {
    const m = {};
    (data.routine?.days || []).forEach((d, i) => { m[d.id] = { ...d, index: i }; });
    return m;
  }, [data.routine]);

  const exerciseById = useMemo(() => {
    const m = {};
    (data.routine?.days || []).forEach((d) => {
      (d.exercises || []).forEach((e) => { m[e.id] = { ...e, dayId: d.id }; });
    });
    return m;
  }, [data.routine]);

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
        const entries = Object.entries(s.exercises || {})
          .map(([exId, val]) => ({ exId, weight: val?.weight, ex: exerciseById[exId] }))
          .filter((e) => e.weight != null && e.weight !== '');

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
                {entries.map(({ exId, weight, ex }) => (
                  <div key={exId} className="flex justify-between gap-2 text-sm">
                    <span className="flex-1" style={{ color: C.text }}>{ex ? ex.name : t('sessions.exerciseMissing')}</span>
                    <span className="font-semibold" style={{ color: dayColor }}>{kgToDisplay(weight, units)} {weightUnit(units)}</span>
                  </div>
                ))}
              </div>
            )}

            {s.notes && s.notes.trim() && (
              <p className="text-sm mt-3 whitespace-pre-wrap" style={{ color: C.dim, borderTop: '1px solid ' + C.line, paddingTop: 8 }}>
                {s.notes}
              </p>
            )}
          </Card>
        );
      })}
    </>
  );
}
