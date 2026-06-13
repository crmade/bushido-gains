import { useState } from 'react';
import { C, FONT_DISPLAY, inputStyle } from '../lib/theme';
import { todayStr } from '../lib/utils';
import Btn from './Btn';
import Card from './Card';
import Field from './Field';
import Belt from './Belt';
import VideoEmbed from './VideoEmbed';
import WarmupCard from './WarmupCard';
import WhenToChange from './WhenToChange';

export default function RoutineTab({ data, dayIdx, setDayIdx, editMode, setEditMode, patchExercise, addExercise, removeExercise, moveExercise, resetRoutine, toggleDone }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const day = data.routine.days[Math.min(dayIdx, data.routine.days.length - 1)];
  const doneToday = data.done[todayStr()] || {};
  const doneCount = day.exercises.filter((e) => doneToday[e.id]).length;

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
            <span className="text-xs" style={{ color: C.dim }}>{d.exercises.length} ejercicios</span>
          </button>
        ))}
      </div>

      <WarmupCard warmup={data.routine.warmup || []} doneToday={doneToday} toggleDone={toggleDone} />

      <div>
        <Belt color={day.color} total={day.exercises.length} done={doneCount} />
        <div className="flex justify-between mt-1">
          <span className="text-xs" style={{ color: C.dim }}>Cada raya blanca = un ejercicio completado hoy</span>
          <span className="text-xs font-semibold" style={{ color: day.color }}>{doneCount}/{day.exercises.length}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Btn small ghost color={editMode ? C.gold : C.text} onClick={() => { setEditMode(!editMode); setConfirmReset(false); }}>
          {editMode ? '✓ Terminar edición' : '✎ Editar rutina'}
        </Btn>
        {editMode && !confirmReset && (
          <Btn small ghost color={C.red} onClick={() => setConfirmReset(true)}>Restaurar original</Btn>
        )}
        {editMode && confirmReset && (
          <Btn small color={C.red} onClick={resetRoutine}>¿Seguro? Sí, restaurar</Btn>
        )}
      </div>

      {day.exercises.map((e, i) => (
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
                  {e.tip && <p className="mt-1 text-sm" style={{ color: C.dim }}>{e.tip}</p>}
                </div>
                <button onClick={() => toggleDone(e.id)} aria-label="Marcar completado" className="rounded-full flex items-center justify-center" style={{
                  width: 34, height: 34, flexShrink: 0, cursor: 'pointer',
                  background: doneToday[e.id] ? day.color : 'transparent',
                  border: '2px solid ' + (doneToday[e.id] ? day.color : C.line),
                  color: doneToday[e.id] ? C.ink : C.dim, fontWeight: 700,
                }}>✓</button>
              </div>
              <VideoEmbed video={e.video} dayColor={day.color} />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Field label="Ejercicio">
                <input style={inputStyle} value={e.name} onChange={(ev) => patchExercise(day.id, e.id, { name: ev.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Series">
                  <input style={inputStyle} type="number" inputMode="numeric" value={e.sets} onChange={(ev) => patchExercise(day.id, e.id, { sets: ev.target.value === '' ? '' : Number(ev.target.value) })} />
                </Field>
                <Field label="Reps">
                  <input style={inputStyle} value={e.reps} onChange={(ev) => patchExercise(day.id, e.id, { reps: ev.target.value })} />
                </Field>
              </div>
              <Field label="Músculo / etiqueta">
                <input style={inputStyle} value={e.muscle} onChange={(ev) => patchExercise(day.id, e.id, { muscle: ev.target.value })} />
              </Field>
              <Field label="Nota técnica">
                <input style={inputStyle} value={e.tip} onChange={(ev) => patchExercise(day.id, e.id, { tip: ev.target.value })} />
              </Field>
              <Field label="Link de YouTube (técnica)">
                <input style={inputStyle} value={e.video} onChange={(ev) => patchExercise(day.id, e.id, { video: ev.target.value })} placeholder="https://youtube.com/watch?v=…" />
              </Field>
              <div className="flex gap-2 flex-wrap">
                <Btn small ghost onClick={() => moveExercise(day.id, e.id, -1)} style={{ opacity: i === 0 ? 0.4 : 1 }}>↑ Subir</Btn>
                <Btn small ghost onClick={() => moveExercise(day.id, e.id, 1)} style={{ opacity: i === day.exercises.length - 1 ? 0.4 : 1 }}>↓ Bajar</Btn>
                <Btn small ghost color={C.red} onClick={() => removeExercise(day.id, e.id)}>Eliminar</Btn>
              </div>
            </div>
          )}
        </Card>
      ))}

      {editMode && (
        <Btn full ghost color={day.color} onClick={() => addExercise(day.id)}>+ Agregar ejercicio al {day.name}</Btn>
      )}

      <WhenToChange />
    </div>
  );
}
