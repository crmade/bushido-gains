import { createClient } from '@supabase/supabase-js';
import { uid } from './utils';
import { C } from './theme';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const sb =
  SUPABASE_URL.includes('supabase.co') && SUPABASE_ANON_KEY.length > 30
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// ---------- localStorage wrapper ----------
export const hasStorage = (() => {
  try {
    const k = '__hyt_test__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch (e) {
    return false;
  }
})();

export const store = {
  async get(key) {
    if (!hasStorage) return null;
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch (e) {
      return null;
    }
  },
  async set(key, val) {
    if (!hasStorage) return false;
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (e) {
      return false;
    }
  },
  async del(key) {
    if (!hasStorage) return;
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  },
};

// ---------- Cloud sync ----------
export async function cloudLoad(userId) {
  if (!sb) return null;
  const { data, error } = await sb
    .from('user_data')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? data.data : null;
}

export async function cloudSave(userId, payload) {
  if (!sb) return false;
  const { error } = await sb.from('user_data').upsert({
    user_id: userId,
    data: payload,
    updated_at: new Date().toISOString(),
  });
  return !error;
}

// ---------- Data normalization ----------
import { defaultRoutine, defaultWarmup } from '../data/exercises';
import { BJJ_BELTS } from '../data/bjj';
import { todayStr } from './utils';

function defaultRoutineName(lang) {
  return lang === 'en' ? 'My routine' : 'Mi rutina';
}

function normalizeRoutine(r, lang) {
  const days = Array.isArray(r?.days) ? r.days.map((day, i) => {
    const belt = BJJ_BELTS[i % BJJ_BELTS.length];
    const { beltName, ...rest } = day;
    return { ...rest, color: belt.color, stripeColor: belt.stripeColor };
  }) : defaultRoutine(lang).days;
  return {
    id: r?.id || uid(),
    name: r?.name || defaultRoutineName(lang),
    createdAt: r?.createdAt || todayStr(),
    warmup: Array.isArray(r?.warmup) ? r.warmup : defaultWarmup(lang),
    days,
  };
}

export function normalizeData(d, lang = 'es') {
  const n = d && typeof d === 'object' ? d : {};
  if (!n.metrics) n.metrics = [];
  if (!n.done) n.done = {};
  if (!n.profile) n.profile = {};
  if (!n.profile.units) n.profile.units = 'kg';
  if (!n.profile.lang) n.profile.lang = lang;
  if (!Array.isArray(n.journal)) n.journal = [];
  if (!n.sessions || typeof n.sessions !== 'object' || Array.isArray(n.sessions)) n.sessions = {};

  // Migrate single `routine` to `routines[]`
  if (n.routine && !Array.isArray(n.routines)) {
    n.routines = [normalizeRoutine(n.routine, lang)];
    delete n.routine;
  }
  if (!Array.isArray(n.routines) || n.routines.length === 0) {
    const def = defaultRoutine(lang);
    n.routines = [normalizeRoutine({ ...def, warmup: defaultWarmup(lang) }, lang)];
  } else {
    n.routines = n.routines.map((r) => normalizeRoutine(r, lang));
  }
  if (!n.profile.activeRoutineId || !n.routines.some((r) => r.id === n.profile.activeRoutineId)) {
    n.profile.activeRoutineId = n.routines[0].id;
  }
  return n;
}
