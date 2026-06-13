import { useState, useEffect, useRef } from 'react';
import { C, FONT_DISPLAY, FONT_BODY } from './lib/theme';
import { uid, todayStr } from './lib/utils';
import { sb, hasStorage, store, cloudLoad, cloudSave, normalizeData } from './lib/supabase';
import { defaultRoutine, defaultWarmup } from './data/exercises';
import Shell from './components/Shell';
import Onboard from './components/Onboard';
import RoutineTab from './components/RoutineTab';
import GeneratorTab from './components/GeneratorTab';
import ProgressTab from './components/ProgressTab';
import ProfileTab from './components/ProfileTab';
import CloudProfileTab from './components/CloudProfileTab';

export default function App() {
  const [phase, setPhase] = useState('loading');
  const [users, setUsers] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('rutina');
  const [dayIdx, setDayIdx] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [saveWarn, setSaveWarn] = useState(false);
  const [session, setSession] = useState(null);
  const [cloudErr, setCloudErr] = useState(false);
  const lastUid = useRef(null);

  useEffect(() => { init(); }, []);

  async function init() {
    if (!hasStorage) setSaveWarn(true);
    if (sb) {
      sb.auth.onAuthStateChange((event, sess) => {
        if (sess && lastUid.current !== sess.user.id) onLogin(sess);
        if (event === 'SIGNED_OUT') window.location.reload();
      });
      const { data: s } = await sb.auth.getSession();
      if (s && s.session) { await onLogin(s.session); return; }
    }
    const reg = await store.get('gymapp:users');
    if (!reg || !reg.list || reg.list.length === 0) {
      setPhase('onboard');
      return;
    }
    setUsers(reg.list);
    const id = reg.activeId && reg.list.some((u) => u.id === reg.activeId) ? reg.activeId : reg.list[0].id;
    await loadUser(id, reg.list);
  }

  async function onLogin(sess) {
    if (lastUid.current === sess.user.id) { setSession(sess); return; }
    lastUid.current = sess.user.id;
    setSession(sess);
    setPhase('loading');
    const reg = await store.get('gymapp:users');
    setUsers(reg && reg.list ? reg.list : []);
    let d = null;
    try {
      d = await cloudLoad(sess.user.id);
    } catch (e) {
      setCloudErr(true);
    }
    if (!d) d = (await store.get('gymapp:cloudcache:' + sess.user.id)) || { metrics: [], routine: defaultRoutine(), done: {}, profile: {} };
    d = normalizeData(d);
    setActiveId('cloud:' + sess.user.id);
    setData(d);
    setPhase('ready');
    store.set('gymapp:cloudcache:' + sess.user.id, d);
    cloudSave(sess.user.id, d).then((ok) => setCloudErr(!ok));
  }

  async function signInGoogle() {
    if (!sb) return;
    await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } });
  }

  async function signOutGoogle() {
    if (!sb) return;
    lastUid.current = null;
    await sb.auth.signOut();
  }

  async function importLocalToCloud(localId) {
    const d = await store.get('gymapp:data:' + localId);
    if (d) await persistData(normalizeData(d));
  }

  async function loadUser(id, list) {
    let d = await store.get('gymapp:data:' + id);
    if (!d) d = { metrics: [], routine: defaultRoutine(), done: {} };
    if (!d.routine || !d.routine.days) d.routine = defaultRoutine();
    if (!d.routine.warmup) { d.routine.warmup = defaultWarmup(); await store.set('gymapp:data:' + id, d); }
    if (!d.metrics) d.metrics = [];
    if (!d.done) d.done = {};
    setActiveId(id);
    setData(d);
    setPhase('ready');
    await store.set('gymapp:users', { list: list || users, activeId: id });
  }

  async function persistData(next) {
    setData(next);
    if (session && sb) {
      store.set('gymapp:cloudcache:' + session.user.id, next);
      const ok = await cloudSave(session.user.id, next);
      setCloudErr(!ok);
      return;
    }
    const ok = await store.set('gymapp:data:' + activeId, next);
    if (!ok && hasStorage) setSaveWarn(true);
  }

  async function createUser(name, height, weight) {
    const user = { id: uid(), name: name.trim(), height: height ? Number(height) : null, createdAt: todayStr() };
    const list = [...users, user];
    setUsers(list);
    const d = { metrics: [], routine: defaultRoutine(), done: {} };
    if (weight) {
      d.metrics.push({ id: uid(), date: todayStr(), weight: Number(weight), fat: null, muscle: null });
    }
    await store.set('gymapp:data:' + user.id, d);
    setActiveId(user.id);
    setData(d);
    setPhase('ready');
    setTab('rutina');
    await store.set('gymapp:users', { list, activeId: user.id });
  }

  async function updateUser(patch) {
    if (session) {
      await persistData({ ...data, profile: { ...(data.profile || {}), ...patch } });
      return;
    }
    const list = users.map((u) => (u.id === activeId ? { ...u, ...patch } : u));
    setUsers(list);
    await store.set('gymapp:users', { list, activeId });
  }

  async function deleteUser(id) {
    const list = users.filter((u) => u.id !== id);
    setUsers(list);
    await store.del('gymapp:data:' + id);
    if (list.length === 0) {
      await store.del('gymapp:users');
      setActiveId(null);
      setData(null);
      setPhase('onboard');
    } else if (id === activeId) {
      await loadUser(list[0].id, list);
    } else {
      await store.set('gymapp:users', { list, activeId });
    }
  }

  const meta = session && session.user.user_metadata ? session.user.user_metadata : {};
  const activeUser = session
    ? { id: 'cloud', name: meta.full_name || meta.name || session.user.email || 'Mi cuenta', height: data && data.profile ? data.profile.height : null, createdAt: (session.user.created_at || '').slice(0, 10), email: session.user.email || '', avatar: meta.avatar_url || meta.picture || null }
    : (users.find((u) => u.id === activeId) || null);

  // ---- Mutaciones de rutina ----
  function patchExercise(dayId, exId, patch) {
    const next = { ...data, routine: { ...data.routine, days: data.routine.days.map((d) => d.id !== dayId ? d : { ...d, exercises: d.exercises.map((e) => (e.id === exId ? { ...e, ...patch } : e)) }) } };
    persistData(next);
  }
  function addExercise(dayId) {
    const ne = { id: uid(), name: 'Nuevo ejercicio', sets: 3, reps: '10', video: '', muscle: '', tip: '' };
    const next = { ...data, routine: { ...data.routine, days: data.routine.days.map((d) => (d.id !== dayId ? d : { ...d, exercises: [...d.exercises, ne] })) } };
    persistData(next);
  }
  function removeExercise(dayId, exId) {
    const next = { ...data, routine: { ...data.routine, days: data.routine.days.map((d) => (d.id !== dayId ? d : { ...d, exercises: d.exercises.filter((e) => e.id !== exId) })) } };
    persistData(next);
  }
  function moveExercise(dayId, exId, dir) {
    const next = {
      ...data,
      routine: {
        ...data.routine,
        days: data.routine.days.map((d) => {
          if (d.id !== dayId) return d;
          const arr = [...d.exercises];
          const i = arr.findIndex((e) => e.id === exId);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= arr.length) return d;
          const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
          return { ...d, exercises: arr };
        }),
      },
    };
    persistData(next);
  }
  function resetRoutine() {
    persistData({ ...data, routine: defaultRoutine() });
    setEditMode(false);
  }
  function applyGeneratedDays(days) {
    persistData({ ...data, routine: { warmup: (data.routine && data.routine.warmup) || defaultWarmup(), days } });
    setDayIdx(0);
    setEditMode(false);
    setTab('rutina');
  }
  function toggleDone(exId) {
    const t = todayStr();
    const day = { ...(data.done[t] || {}) };
    if (day[exId]) delete day[exId]; else day[exId] = true;
    persistData({ ...data, done: { ...data.done, [t]: day } });
  }

  // ---- Medidas ----
  function addMetric(m) {
    const metrics = [...data.metrics, { id: uid(), ...m }].sort((a, b) => (a.date < b.date ? -1 : 1));
    persistData({ ...data, metrics });
  }
  function deleteMetric(id) {
    persistData({ ...data, metrics: data.metrics.filter((m) => m.id !== id) });
  }

  if (phase === 'loading') {
    return (
      <Shell>
        <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <p style={{ color: C.dim }}>Cargando tu plan…</p>
        </div>
      </Shell>
    );
  }

  if (phase === 'onboard') {
    return (
      <Shell>
        <Onboard onCreate={createUser} saveWarn={saveWarn} sbReady={!!sb} onSignIn={signInGoogle} />
      </Shell>
    );
  }

  return (
    <Shell>
      <header className="pt-5 pb-3 px-4" style={{ borderBottom: '1px solid ' + C.line }}>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="leading-none" style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 34, letterSpacing: 1, textTransform: 'uppercase' }}>
              Bushido <span style={{ color: C.gold }}>Gains</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: C.dim }}>Full body 3×/semana · hipertrofia para BJJ</p>
          </div>
          {activeUser && (
            <button onClick={() => setTab('perfil')} className="rounded-full px-3 py-1 text-sm font-semibold" style={{ background: C.surface2, border: '1px solid ' + C.line, color: C.text }}>
              {activeUser.name.split(' ')[0]}
            </button>
          )}
        </div>
      </header>

      {saveWarn && (
        <div className="mx-4 mt-3 rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(224,96,96,0.12)', border: '1px solid ' + C.red, color: C.text }}>
          Tu navegador tiene bloqueado el almacenamiento local: los cambios no se guardarán entre sesiones.
        </div>
      )}

      {cloudErr && session && (
        <div className="mx-4 mt-3 rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(224,96,96,0.12)', border: '1px solid ' + C.red, color: C.text }}>
          No se pudo sincronizar con la nube. Tus cambios quedaron guardados en este dispositivo y se reintentará al guardar de nuevo.
        </div>
      )}

      <main className="px-4 pb-28 pt-4">
        {tab === 'rutina' && data && (
          <RoutineTab
            data={data}
            dayIdx={dayIdx}
            setDayIdx={setDayIdx}
            editMode={editMode}
            setEditMode={setEditMode}
            patchExercise={patchExercise}
            addExercise={addExercise}
            removeExercise={removeExercise}
            moveExercise={moveExercise}
            resetRoutine={resetRoutine}
            toggleDone={toggleDone}
          />
        )}
        {tab === 'generar' && data && (
          <GeneratorTab applyDays={applyGeneratedDays} />
        )}
        {tab === 'progreso' && data && (
          <ProgressTab data={data} user={activeUser} addMetric={addMetric} deleteMetric={deleteMetric} updateUser={updateUser} />
        )}
        {tab === 'perfil' && (
          session ? (
            <CloudProfileTab user={activeUser} data={data} users={users} updateUser={updateUser} importLocal={importLocalToCloud} onSignOut={signOutGoogle} cloudErr={cloudErr} />
          ) : (
            <ProfileTab users={users} activeUser={activeUser} data={data} loadUser={(id) => loadUser(id)} createUser={createUser} updateUser={updateUser} deleteUser={deleteUser} sbReady={!!sb} onSignIn={signInGoogle} />
          )
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 flex" style={{ background: C.surface, borderTop: '1px solid ' + C.line }}>
        {[
          { id: 'rutina', label: 'Rutina', icon: '▣' },
          { id: 'generar', label: 'Generar', icon: '✦' },
          { id: 'progreso', label: 'Progreso', icon: '↗' },
          { id: 'perfil', label: 'Perfil', icon: '◉' },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="flex-1 py-3 flex flex-col items-center gap-1" style={{ background: 'none', border: 'none', cursor: 'pointer', color: tab === t.id ? C.gold : C.dim }}>
            <span style={{ fontSize: 16 }}>{t.icon}</span>
            <span className="text-xs font-semibold uppercase tracking-wide">{t.label}</span>
          </button>
        ))}
      </nav>
    </Shell>
  );
}
