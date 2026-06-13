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

export function normalizeData(d) {
  const n = d && typeof d === 'object' ? d : {};
  if (!n.routine || !n.routine.days) n.routine = defaultRoutine();
  if (!n.routine.warmup) n.routine.warmup = defaultWarmup();
  if (!n.metrics) n.metrics = [];
  if (!n.done) n.done = {};
  if (!n.profile) n.profile = {};
  return n;
}
