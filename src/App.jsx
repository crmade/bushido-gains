import { useState, useEffect, useRef } from 'react';
import { C, FONT_DISPLAY } from './lib/theme';
import { uid, todayStr } from './lib/utils';
import { sb, hasStorage, store, cloudLoad, cloudSave, normalizeData } from './lib/supabase';
import { defaultRoutine, defaultWarmup } from './data/exercises';
import { useLang } from './lib/i18n.jsx';
import Shell from './components/Shell';
import Onboard from './components/Onboard';
import RoutineTab from './components/RoutineTab';
import GeneratorTab from './components/GeneratorTab';
import ProgressTab from './components/ProgressTab';
import ProfileTab from './components/ProfileTab';
import CloudProfileTab from './components/CloudProfileTab';
import JournalTab from './components/JournalTab';

export default function App() {
  const { t, lang, setLang } = useLang();
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
    if (!d) d = (await store.get('gymapp:cloudcache:' + sess.user.id)) || {};
    d = normalizeData(d, lang);
    if (d.profile?.lang && d.profile.lang !== lang) setLang(d.profile.lang);
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
    if (d) await persistData(normalizeData(d, lang));
  }

  async function loadUser(id, list) {
    const raw = await store.get('gymapp:data:' + id);
    const d = normalizeData(raw, lang);
    if (d.profile?.lang && d.profile.lang !== lang) setLang(d.profile.lang);
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
    const d = normalizeData({}, lang);
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
    if (patch.lang || patch.units) {
      await persistData({ ...data, profile: { ...(data.profile || {}), ...patch } });
    }
    const userPatch = { ...patch };
    delete userPatch.lang;
    delete userPatch.units;
    if (Object.keys(userPatch).length) {
      const list = users.map((u) => (u.id === activeId ? { ...u, ...userPatch } : u));
      setUsers(list);
      await store.set('gymapp:users', { list, activeId });
    }
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
    ? { id: 'cloud', name: meta.full_name || meta.name || session.user.email || t('profile.active'), height: data && data.profile ? data.profile.height : null, createdAt: (session.user.created_at || '').slice(0, 10), email: session.user.email || '', avatar: meta.avatar_url || meta.picture || null }
    : (users.find((u) => u.id === activeId) || null);

  // ---- Rutinas (multi) ----
  const activeRoutine = data && data.routines ? (data.routines.find((r) => r.id === data.profile?.activeRoutineId) || data.routines[0]) : null;
  const activeRoutineId = activeRoutine ? activeRoutine.id : null;

  function patchActiveRoutine(patch) {
    const routines = data.routines.map((r) => (r.id === activeRoutineId ? { ...r, ...patch } : r));
    persistData({ ...data, routines });
  }

  function setActiveRoutine(id) {
    if (!data.routines.some((r) => r.id === id)) return;
    persistData({ ...data, profile: { ...(data.profile || {}), activeRoutineId: id } });
    setDayIdx(0);
    setEditMode(false);
  }

  function addRoutine(name, source) {
    const id = uid();
    const baseDays = (source && Array.isArray(source.days)) ? source.days : defaultRoutine(lang).days;
    const baseWarmup = (source && Array.isArray(source.warmup)) ? source.warmup : defaultWarmup(lang);
    const newRoutine = {
      id,
      name: name || (lang === 'en' ? 'New routine' : 'Nueva rutina'),
      createdAt: todayStr(),
      warmup: baseWarmup,
      days: baseDays,
    };
    persistData({
      ...data,
      routines: [...data.routines, newRoutine],
      profile: { ...(data.profile || {}), activeRoutineId: id },
    });
    setDayIdx(0);
    setEditMode(false);
  }

  function renameRoutine(id, name) {
    const routines = data.routines.map((r) => (r.id === id ? { ...r, name: name || r.name } : r));
    persistData({ ...data, routines });
  }

  function deleteRoutine(id) {
    if (data.routines.length <= 1) return;
    const routines = data.routines.filter((r) => r.id !== id);
    const nextActive = data.profile?.activeRoutineId === id ? routines[0].id : data.profile?.activeRoutineId;
    persistData({ ...data, routines, profile: { ...(data.profile || {}), activeRoutineId: nextActive } });
    setDayIdx(0);
    setEditMode(false);
  }

  function duplicateRoutine(id) {
    const src = data.routines.find((r) => r.id === id);
    if (!src) return;
    addRoutine(`${src.name} ${lang === 'en' ? '(copy)' : '(copia)'}`, src);
  }

  // ---- Mutaciones de rutina activa ----
  function patchExercise(dayId, exId, patch) {
    if (!activeRoutine) return;
    patchActiveRoutine({
      days: activeRoutine.days.map((d) => d.id !== dayId ? d : { ...d, exercises: d.exercises.map((e) => (e.id === exId ? { ...e, ...patch } : e)) }),
    });
  }
  function addExercise(dayId) {
    if (!activeRoutine) return;
    const ne = { id: uid(), name: lang === 'en' ? 'New exercise' : 'Nuevo ejercicio', sets: 3, reps: '10', video: '', muscle: '', tip: '' };
    patchActiveRoutine({
      days: activeRoutine.days.map((d) => (d.id !== dayId ? d : { ...d, exercises: [...d.exercises, ne] })),
    });
  }
  function removeExercise(dayId, exId) {
    if (!activeRoutine) return;
    patchActiveRoutine({
      days: activeRoutine.days.map((d) => (d.id !== dayId ? d : { ...d, exercises: d.exercises.filter((e) => e.id !== exId) })),
    });
  }
  function moveExercise(dayId, exId, dir) {
    if (!activeRoutine) return;
    patchActiveRoutine({
      days: activeRoutine.days.map((d) => {
        if (d.id !== dayId) return d;
        const arr = [...d.exercises];
        const i = arr.findIndex((e) => e.id === exId);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= arr.length) return d;
        const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        return { ...d, exercises: arr };
      }),
    });
  }
  function resetRoutine() {
    if (!activeRoutine) return;
    const def = defaultRoutine(lang);
    patchActiveRoutine({ days: def.days, warmup: defaultWarmup(lang) });
    setEditMode(false);
  }
  function applyGeneratedDays(days, opts = {}) {
    if (opts.asNew) {
      addRoutine(opts.name, { days, warmup: activeRoutine?.warmup || defaultWarmup(lang) });
    } else {
      if (!activeRoutine) return;
      patchActiveRoutine({ days, warmup: activeRoutine.warmup || defaultWarmup(lang) });
    }
    setDayIdx(0);
    setEditMode(false);
    setTab('rutina');
  }
  function toggleDone(exId) {
    const tDate = todayStr();
    const day = { ...(data.done[tDate] || {}) };
    if (day[exId]) delete day[exId]; else day[exId] = true;
    persistData({ ...data, done: { ...data.done, [tDate]: day } });
  }

  function setExerciseUnit(dayId, exId, unit) {
    if (!activeRoutine) return;
    patchActiveRoutine({
      days: activeRoutine.days.map((d) => (d.id !== dayId ? d : {
        ...d,
        exercises: d.exercises.map((e) => (e.id === exId ? { ...e, unit } : e)),
      })),
    });
  }

  // ---- Sesiones de entrenamiento ----
  function setExerciseWeight(exId, weightKg, meta = {}) {
    if (!activeRoutine) return;
    const tDate = todayStr();
    const dayId = activeRoutine.days[Math.min(dayIdx, activeRoutine.days.length - 1)].id;
    const sessions = { ...(data.sessions || {}) };
    const cur = sessions[tDate] || { date: tDate, dayId, notes: '', exercises: {} };
    const prev = cur.exercises[exId] || {};
    sessions[tDate] = {
      ...cur,
      dayId,
      routineId: cur.routineId || activeRoutineId,
      exercises: {
        ...cur.exercises,
        [exId]: {
          ...prev,
          weight: weightKg,
          name: meta.name ?? prev.name,
          unit: meta.unit ?? prev.unit,
        },
      },
    };
    persistData({ ...data, sessions });
  }

  function setSessionNotes(notes) {
    if (!activeRoutine) return;
    const tDate = todayStr();
    const dayId = activeRoutine.days[Math.min(dayIdx, activeRoutine.days.length - 1)].id;
    const sessions = { ...(data.sessions || {}) };
    const cur = sessions[tDate] || { date: tDate, dayId, notes: '', exercises: {} };
    sessions[tDate] = { ...cur, dayId, routineId: cur.routineId || activeRoutineId, notes: notes || '' };
    persistData({ ...data, sessions });
  }

  function updateSessionNotes(date, notes) {
    const sessions = { ...(data.sessions || {}) };
    const cur = sessions[date];
    if (!cur) return;
    sessions[date] = { ...cur, notes: notes || '' };
    persistData({ ...data, sessions });
  }

  function deleteSession(date) {
    const sessions = { ...(data.sessions || {}) };
    delete sessions[date];
    const done = { ...(data.done || {}) };
    delete done[date];
    persistData({ ...data, sessions, done });
  }

  function deleteAllSessions() {
    persistData({ ...data, sessions: {}, done: {} });
  }

  function updateSessionWeight(date, exId, weightKg, meta = {}) {
    const sessions = { ...(data.sessions || {}) };
    const cur = sessions[date] || { date, dayId: null, notes: '', exercises: {} };
    const prev = cur.exercises[exId] || {};
    sessions[date] = {
      ...cur,
      exercises: {
        ...cur.exercises,
        [exId]: {
          ...prev,
          weight: weightKg,
          name: meta.name ?? prev.name,
          unit: meta.unit ?? prev.unit,
        },
      },
    };
    persistData({ ...data, sessions });
  }

  // ---- Diario BJJ ----
  function saveNote(note) {
    const journal = [...(data.journal || [])];
    const idx = journal.findIndex((n) => n.id === note.id);
    if (idx >= 0) journal[idx] = note;
    else journal.push(note);
    persistData({ ...data, journal });
  }
  function deleteNote(id) {
    persistData({ ...data, journal: (data.journal || []).filter((n) => n.id !== id) });
  }

  // ---- Medidas ----
  function addMetric(m) {
    const metrics = [...data.metrics, { id: uid(), ...m }].sort((a, b) => (a.date < b.date ? -1 : 1));
    persistData({ ...data, metrics });
  }
  function deleteMetric(id) {
    persistData({ ...data, metrics: data.metrics.filter((m) => m.id !== id) });
  }
  function editMetric(id, patch) {
    const metrics = data.metrics
      .map((m) => (m.id === id ? { ...m, ...patch } : m))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    persistData({ ...data, metrics });
  }
  function deleteAllMetrics() {
    persistData({ ...data, metrics: [] });
  }

  function setLangAndPersist(newLang) {
    setLang(newLang);
    if (data) persistData({ ...data, profile: { ...(data.profile || {}), lang: newLang } });
  }
  function setUnitsAndPersist(units) {
    if (data) persistData({ ...data, profile: { ...(data.profile || {}), units } });
  }

  if (phase === 'loading') {
    return (
      <Shell>
        <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <p style={{ color: C.dim }}>{t('app.loading')}</p>
        </div>
      </Shell>
    );
  }

  if (phase === 'onboard') {
    return (
      <Shell>
        <Onboard onCreate={createUser} saveWarn={saveWarn} sbReady={!!sb} onSignIn={signInGoogle} units={'kg'} />
      </Shell>
    );
  }

  const units = data?.profile?.units || 'kg';

  return (
    <Shell>
      <header className="pt-5 pb-3 px-4" style={{ borderBottom: '1px solid ' + C.line }}>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="leading-none" style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 34, letterSpacing: 1, textTransform: 'uppercase' }}>
              Bushido <span style={{ color: C.gold }}>Gains</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: C.dim }}>{t('app.subtitle')}</p>
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
          {t('app.storageBlocked')}
        </div>
      )}

      {cloudErr && session && (
        <div className="mx-4 mt-3 rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(224,96,96,0.12)', border: '1px solid ' + C.red, color: C.text }}>
          {t('app.cloudErr')}
        </div>
      )}

      <main className="px-4 pb-28 pt-4">
        {tab === 'rutina' && data && (
          <RoutineTab
            data={data}
            routine={activeRoutine}
            routines={data.routines}
            activeRoutineId={activeRoutineId}
            setActiveRoutine={setActiveRoutine}
            renameRoutine={renameRoutine}
            deleteRoutine={deleteRoutine}
            duplicateRoutine={duplicateRoutine}
            addRoutine={addRoutine}
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
            sessions={data.sessions || {}}
            setExerciseWeight={setExerciseWeight}
            setExerciseUnit={setExerciseUnit}
            setSessionNotes={setSessionNotes}
            units={units}
          />
        )}
        {tab === 'generar' && data && (
          <GeneratorTab applyDays={applyGeneratedDays} activeRoutineName={activeRoutine?.name || ''} />
        )}
        {tab === 'progreso' && data && (
          <ProgressTab
            data={data}
            user={activeUser}
            addMetric={addMetric}
            deleteMetric={deleteMetric}
            editMetric={editMetric}
            deleteAllMetrics={deleteAllMetrics}
            updateUser={updateUser}
            deleteSession={deleteSession}
            deleteAllSessions={deleteAllSessions}
            updateSessionNotes={updateSessionNotes}
            updateSessionWeight={updateSessionWeight}
            units={units}
          />
        )}
        {tab === 'diario' && data && (
          <JournalTab journal={data.journal || []} saveNote={saveNote} deleteNote={deleteNote} />
        )}
        {tab === 'perfil' && (
          session ? (
            <CloudProfileTab
              user={activeUser}
              data={data}
              users={users}
              updateUser={updateUser}
              importLocal={importLocalToCloud}
              onSignOut={signOutGoogle}
              cloudErr={cloudErr}
              units={units}
              setLang={setLangAndPersist}
              setUnits={setUnitsAndPersist}
            />
          ) : (
            <ProfileTab
              users={users}
              activeUser={activeUser}
              data={data}
              loadUser={(id) => loadUser(id)}
              createUser={createUser}
              updateUser={updateUser}
              deleteUser={deleteUser}
              sbReady={!!sb}
              onSignIn={signInGoogle}
              units={units}
              setLang={setLangAndPersist}
              setUnits={setUnitsAndPersist}
            />
          )
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 flex" style={{ background: C.surface, borderTop: '1px solid ' + C.line }}>
        {[
          { id: 'rutina', label: t('nav.routine'), icon: '▣' },
          { id: 'generar', label: t('nav.generator'), icon: '✦' },
          { id: 'progreso', label: t('nav.progress'), icon: '↗' },
          { id: 'diario', label: t('nav.journal'), icon: '✎' },
          { id: 'perfil', label: t('nav.profile'), icon: '◉' },
        ].map((tt) => (
          <button key={tt.id} onClick={() => setTab(tt.id)} className="flex-1 py-3 flex flex-col items-center gap-1" style={{ background: 'none', border: 'none', cursor: 'pointer', color: tab === tt.id ? C.gold : C.dim }}>
            <span style={{ fontSize: 16 }}>{tt.icon}</span>
            <span className="text-xs font-semibold uppercase tracking-wide">{tt.label}</span>
          </button>
        ))}
      </nav>
    </Shell>
  );
}
