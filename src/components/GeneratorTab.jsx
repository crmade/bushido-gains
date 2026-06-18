import { useState, useEffect } from 'react';
import { C, FONT_DISPLAY, inputStyle } from '../lib/theme';
import { uid } from '../lib/utils';
import { EQUIPMENT, LIBRARY, INJURIES, libraryFor, equipmentLabel, injuryLabel, pickLang } from '../data/exercises';
import { BJJ_BELTS } from '../data/bjj';
import { store } from '../lib/supabase';
import { PROVIDERS, callAI } from '../lib/aiProviders';
import { useLang } from '../lib/i18n.jsx';
import Btn from './Btn';
import Card from './Card';
import Field from './Field';

const EMPTY_KEYS = { anthropic: '', openai: '', gemini: '', ollama: '' };

function formatDuration(min, lang) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const hLabel = lang === 'en' ? 'h' : 'h';
  const mLabel = lang === 'en' ? 'min' : 'min';
  if (h === 0) return m + ' ' + mLabel;
  if (m === 0) return h + ' ' + hLabel;
  return h + ' ' + hLabel + ' ' + m + ' ' + mLabel;
}

export default function GeneratorTab({ applyDays, activeRoutineName }) {
  const { t, lang } = useLang();
  const [goal, setGoal] = useState('');
  const [nDays, setNDays] = useState(3);
  const [minutes, setMinutes] = useState(60);
  const [sel, setSel] = useState(() => new Set(EQUIPMENT.map((e) => e.key)));
  const [injuries, setInjuries] = useState(() => new Set());
  const [injuryNotes, setInjuryNotes] = useState('');
  const [provider, setProvider] = useState('anthropic');
  const [keys, setKeys] = useState(EMPTY_KEYS);
  const [showKeyCfg, setShowKeyCfg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [preview, setPreview] = useState(null);
  const [applyMode, setApplyMode] = useState(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    (async () => {
      const savedProvider = await store.get('gymapp:provider');
      const savedKeys = await store.get('gymapp:aikeys');
      const legacyKey = await store.get('gymapp:apikey');
      if (savedProvider && PROVIDERS[savedProvider]) setProvider(savedProvider);
      const next = { ...EMPTY_KEYS, ...(savedKeys || {}) };
      if (legacyKey && !next.anthropic) {
        next.anthropic = legacyKey;
        await store.set('gymapp:aikeys', next);
        await store.del('gymapp:apikey');
      }
      setKeys(next);
    })();
  }, []);

  const apiKey = keys[provider] || '';
  const setApiKey = (val) => setKeys((prev) => ({ ...prev, [provider]: val }));
  const cfg = PROVIDERS[provider];

  function toggleSet(setter, key) {
    setter((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key); else n.add(key);
      return n;
    });
  }

  async function changeProvider(p) {
    setProvider(p);
    await store.set('gymapp:provider', p);
  }

  async function saveCurrentKey(silent) {
    const trimmed = { ...keys, [provider]: (keys[provider] || '').trim() };
    setKeys(trimmed);
    await store.set('gymapp:aikeys', trimmed);
    if (!silent) { setErrMsg(''); setShowKeyCfg(false); }
  }

  const libLang = libraryFor(lang);
  const available = libLang.filter((e) => e.equip.every((k) => sel.has(k)));

  async function generate() {
    setErrMsg('');
    if (!goal.trim()) { setErrMsg(t('gen.errGoal')); return; }
    if (minutes < 15) { setErrMsg(t('gen.errMin')); return; }
    if (!apiKey.trim()) { setErrMsg(t('gen.errKey', { provider: cfg.label })); setShowKeyCfg(true); return; }
    if (available.length < 8) { setErrMsg(t('gen.errEquip')); return; }
    setLoading(true);
    setPreview(null);
    await saveCurrentKey(true);

    const lib = available.map((e) => ({ name: e.name, muscle: e.muscle, equipment: e.equip }));
    const injuryLabels = [...injuries].map((k) => injuryLabel(k, lang));
    const hasInjuryInput = injuryLabels.length > 0 || injuryNotes.trim();

    const isEn = lang === 'en';
    const promptLines = isEn ? [
      'You are an expert strength and hypertrophy coach. Design a personalized gym routine.',
      'USER GOAL AND CONTEXT: ' + goal.trim(),
      'TRAINING DAYS PER WEEK: ' + nDays,
      'SESSION TIME: ' + minutes + ' minutes. Includes short warm-up, approach sets and rest.',
      'PREFERRED EXERCISE LIBRARY (these have curated technique videos — when one fits, copy the EXACT name):',
      JSON.stringify(lib),
      'You may also suggest exercises OUTSIDE this library when the goal requires them. For library exercises, copy the name exactly so we can attach the video. For non-library exercises, use a clear, standard English name and include the primary "muscle" group (e.g. "Chest", "Back", "Hamstrings", "Glutes", "Core").',
    ] : [
      'Eres un entrenador experto en fuerza e hipertrofia. Diseña una rutina de gimnasio personalizada.',
      'OBJETIVO Y CONTEXTO DEL USUARIO: ' + goal.trim(),
      'DÍAS DE ENTRENAMIENTO POR SEMANA: ' + nDays,
      'TIEMPO POR SESIÓN: ' + minutes + ' minutos. Incluye calentamiento corto, series de aproximación y descansos.',
      'BIBLIOTECA DE EJERCICIOS PREFERIDA (tienen video de técnica curado — cuando alguno encaje, copia el nombre EXACTO):',
      JSON.stringify(lib),
      'Puedes sugerir ejercicios FUERA de esta biblioteca cuando el objetivo lo requiera. Para los de la biblioteca, copia el nombre exacto para poder atar el video. Para los nuevos, usa un nombre estándar en español e incluye el grupo "muscle" principal (ej: "Pecho", "Espalda", "Femoral", "Glúteo", "Core").',
    ];

    if (hasInjuryInput) {
      if (isEn) {
        promptLines.push('INJURIES AND LIMITATIONS (avoid exercises that load or aggravate these zones):');
        if (injuryLabels.length) promptLines.push('- ' + injuryLabels.join('\n- '));
        if (injuryNotes.trim()) promptLines.push('Additional notes from user: ' + injuryNotes.trim());
      } else {
        promptLines.push('LESIONES Y LIMITACIONES (evita ejercicios que carguen o agraven estas zonas):');
        if (injuryLabels.length) promptLines.push('- ' + injuryLabels.join('\n- '));
        if (injuryNotes.trim()) promptLines.push('Notas adicionales del usuario: ' + injuryNotes.trim());
      }
    }

    if (isEn) {
      promptLines.push(
        'RULES:',
        '- Exactly ' + nDays + ' day' + (nDays > 1 ? 's' : '') + '.',
        '- Adjust exercise and set counts so each session lasts ~' + minutes + ' minutes (≈3-4 min per compound set, ≈2 min per isolation set, rest included). Minimum 3 exercises, maximum 10 per day.',
        '- Heavy compounds first; isolation and core at the end.',
        '- Do not repeat the same exercise within the same day.',
        "- 'sets' is a number; 'reps' is short text (e.g. '6-8', '12 per side', 'To failure').",
        "- Each exercise carries a short, useful technique 'tip' in English.",
        "- Each day's 'name' is short and descriptive (e.g. 'Day A · Push').",
      );
      if (hasInjuryInput) {
        promptLines.push(
          '- AVOID any exercise that directly loads the injured zones above.',
          "- If working an injured zone is unavoidable, choose the safest variant and add a clear warning in the 'tip'.",
        );
      }
      promptLines.push(
        'Respond ONLY with valid JSON, no markdown or extra text, with this exact structure:',
        '{"days":[{"name":"Day A","exercises":[{"name":"Barbell back squat","sets":4,"reps":"6-8","muscle":"Quads","tip":"..."}]}]}',
      );
    } else {
      promptLines.push(
        'REGLAS:',
        '- Exactamente ' + nDays + ' día' + (nDays > 1 ? 's' : '') + '.',
        '- Ajusta el número de ejercicios y series por día para que la sesión completa dure aproximadamente ' + minutes + ' minutos (~3-4 min por compuesto pesado, ~2 min por aislamiento, descansos incluidos). Mínimo 3 ejercicios, máximo 10 por día.',
        '- Compuestos pesados primero; aislamiento y core al final.',
        '- No repitas el mismo ejercicio dentro del mismo día.',
        "- 'sets' es un número; 'reps' es texto corto (ej: '6-8', '12 c/lado', 'Al fallo').",
        "- Cada ejercicio lleva un 'tip' técnico breve y útil en español.",
        "- El 'name' de cada día debe ser corto y descriptivo (ej: 'Día A · Empuje').",
      );
      if (hasInjuryInput) {
        promptLines.push(
          '- EVITA cualquier ejercicio que cargue directamente las zonas lesionadas indicadas arriba.',
          "- Si una zona lesionada es inevitable de trabajar, elige la variante más segura y agrega una advertencia clara en el 'tip'.",
        );
      }
      promptLines.push(
        'Responde ÚNICAMENTE con JSON válido, sin markdown ni texto extra, con esta estructura exacta:',
        '{"days":[{"name":"Día A","exercises":[{"name":"Sentadilla con barra","sets":4,"reps":"6-8","muscle":"Cuádriceps","tip":"..."}]}]}',
      );
    }

    const prompt = promptLines.join('\n');

    try {
      const text = await callAI({ provider, apiKey: apiKey.trim(), prompt });
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      if (!parsed.days || !Array.isArray(parsed.days) || parsed.days.length === 0) throw new Error(t('gen.errInvalidResponse'));
      setPreview(parsed.days);
    } catch (e) {
      const msg = e && e.message ? e.message : '';
      setErrMsg(t('gen.errAI', { msg: msg.includes('fetch') ? t('gen.errConnection') : msg }));
    }
    setLoading(false);
  }

  function buildDays() {
    const ids = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const byName = {};
    LIBRARY.forEach((e) => {
      byName[pickLang(e.name, lang).toLowerCase()] = e;
      byName[pickLang(e.name, 'es').toLowerCase()] = e;
      byName[pickLang(e.name, 'en').toLowerCase()] = e;
    });
    return preview.map((d, i) => {
      const belt = BJJ_BELTS[i % BJJ_BELTS.length];
      return {
        id: ids[i] || String(i + 1),
        name: d.name || (lang === 'en' ? 'Day ' : 'Día ') + (ids[i] || i + 1),
        color: belt.color,
        stripeColor: belt.stripeColor,
        exercises: (d.exercises || []).map((x) => {
          const found = byName[String(x.name || '').toLowerCase().trim()];
          return {
            id: uid(),
            name: x.name || (lang === 'en' ? 'Exercise' : 'Ejercicio'),
            sets: Number(x.sets) || 3,
            reps: String(x.reps || '10'),
            video: found ? found.video : '',
            muscle: found ? pickLang(found.muscle, lang) : (x.muscle || ''),
            tip: x.tip || '',
          };
        }),
      };
    });
  }

  function applyReplace() {
    applyDays(buildDays(), { asNew: false });
    setPreview(null);
    setApplyMode(null);
    setNewName('');
  }

  function applyAsNew() {
    const name = newName.trim() || (lang === 'en' ? 'New routine' : 'Nueva rutina');
    applyDays(buildDays(), { asNew: true, name });
    setPreview(null);
    setApplyMode(null);
    setNewName('');
  }

  const hasKey = !!(keys[provider] || '').trim();
  const injuriesField = injuries.size === 0
    ? t('gen.injuries')
    : injuries.size === 1
      ? t('gen.injuriesCount', { n: 1 })
      : t('gen.injuriesCountPl', { n: injuries.size });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, textTransform: 'uppercase' }}>{t('gen.title')}</h3>
        <p className="text-sm mt-1" style={{ color: C.dim }}>{t('gen.intro', { n: LIBRARY.length })}</p>
      </Card>

      <Card>
        <Field label={t('gen.goal')}>
          <textarea
            style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder={t('gen.goalPlaceholder')}
          />
        </Field>

        <div className="mt-3">
          <Field label={t('gen.daysPerWeek')}>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button key={n} onClick={() => setNDays(n)} className="rounded-lg px-4 py-2 font-semibold" style={{
                  background: nDays === n ? C.gold : 'transparent',
                  color: nDays === n ? C.ink : C.dim,
                  border: '1px solid ' + (nDays === n ? C.gold : C.line),
                  cursor: 'pointer',
                  minWidth: 44,
                }}>{n}</button>
              ))}
            </div>
          </Field>
        </div>

        <div className="mt-3">
          <Field label={t('gen.timePerSession', { duration: formatDuration(minutes, lang) })}>
            <div className="flex gap-2 items-center">
              <select
                value={Math.floor(minutes / 60)}
                onChange={(e) => setMinutes(parseInt(e.target.value, 10) * 60 + (minutes % 60))}
                style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}
              >
                {[0, 1, 2, 3, 4, 5, 6].map((h) => (
                  <option key={h} value={h}>{h} {t('common.hours')}</option>
                ))}
              </select>
              <select
                value={minutes % 60}
                onChange={(e) => setMinutes(Math.floor(minutes / 60) * 60 + parseInt(e.target.value, 10))}
                style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}
              >
                {[0, 15, 30, 45].map((m) => (
                  <option key={m} value={m}>{String(m).padStart(2, '0')} {t('common.minutes')}</option>
                ))}
              </select>
            </div>
          </Field>
        </div>

        <div className="mt-3">
          <Field label={t('gen.equipment', { n: available.length })}>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT.map((e) => {
                const on = sel.has(e.key);
                return (
                  <button key={e.key} onClick={() => toggleSet(setSel, e.key)} className="rounded-full px-3 py-1 text-sm font-semibold" style={{
                    background: on ? C.surface2 : 'transparent',
                    color: on ? C.text : C.dim,
                    border: '1px solid ' + (on ? C.gold : C.line),
                    cursor: 'pointer',
                  }}>{on ? '✓ ' : ''}{equipmentLabel(e.key, lang)}</button>
                );
              })}
            </div>
          </Field>
        </div>

        <div className="mt-3">
          <Field label={injuriesField}>
            <div className="flex flex-wrap gap-2">
              {INJURIES.map((inj) => {
                const on = injuries.has(inj.key);
                return (
                  <button key={inj.key} onClick={() => toggleSet(setInjuries, inj.key)} className="rounded-full px-3 py-1 text-sm font-semibold" style={{
                    background: on ? 'rgba(224,96,96,0.15)' : 'transparent',
                    color: on ? C.text : C.dim,
                    border: '1px solid ' + (on ? C.red : C.line),
                    cursor: 'pointer',
                  }}>{on ? '✕ ' : ''}{injuryLabel(inj.key, lang)}</button>
                );
              })}
            </div>
          </Field>
          <div className="mt-2">
            <Field label={t('gen.injuryNotes')}>
              <textarea
                style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
                value={injuryNotes}
                onChange={(e) => setInjuryNotes(e.target.value)}
                placeholder={t('gen.injuryNotesPlaceholder')}
              />
            </Field>
          </div>
        </div>

        {errMsg && <p className="text-sm mt-3" style={{ color: C.red }}>{errMsg}</p>}
        <div className="mt-4">
          <Btn full color={C.gold} onClick={loading ? () => {} : generate} style={{ opacity: loading ? 0.6 : 1 }}>
            {loading ? t('gen.generating') : t('gen.generate')}
          </Btn>
        </div>
      </Card>

      {preview && (
        <Card style={{ border: '1px solid ' + C.green }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, textTransform: 'uppercase', color: C.green }}>{t('gen.proposal')}</h3>
          {preview.map((d, i) => (
            <div key={i} className="mt-3">
              <p className="font-semibold">{d.name || (lang === 'en' ? 'Day ' : 'Día ') + (i + 1)}</p>
              <div className="mt-1 flex flex-col gap-1">
                {(d.exercises || []).map((x, j) => (
                  <p key={j} className="text-sm" style={{ color: C.dim }}>• {x.name} — {x.sets}×{x.reps}</p>
                ))}
              </div>
            </div>
          ))}
          {applyMode === 'new' ? (
            <div className="mt-4 flex flex-col gap-2">
              <Field label={t('gen.newRoutineName')}>
                <input
                  style={inputStyle}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t('gen.newRoutinePlaceholder')}
                />
              </Field>
              <div className="flex gap-2">
                <Btn color={C.gold} onClick={applyAsNew}>{t('common.create')}</Btn>
                <Btn ghost onClick={() => { setApplyMode(null); setNewName(''); }}>{t('common.cancel')}</Btn>
              </div>
            </div>
          ) : applyMode === 'replace' ? (
            <div className="mt-4 flex flex-col gap-2">
              <p className="text-sm" style={{ color: C.red }}>{t('gen.replaceConfirm', { name: activeRoutineName || '' })}</p>
              <div className="flex gap-2">
                <Btn color={C.red} onClick={applyReplace}>{t('gen.replaceYes')}</Btn>
                <Btn ghost onClick={() => setApplyMode(null)}>{t('common.cancel')}</Btn>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              <Btn color={C.gold} onClick={() => setApplyMode('new')}>{t('gen.saveAsNew')}</Btn>
              {activeRoutineName && (
                <Btn ghost color={C.red} onClick={() => setApplyMode('replace')}>{t('gen.replaceActive', { name: activeRoutineName })}</Btn>
              )}
              <Btn ghost onClick={() => setPreview(null)}>{t('gen.discard')}</Btn>
            </div>
          )}
          <p className="text-xs mt-2" style={{ color: C.dim }}>{t('gen.applyNote')}</p>
        </Card>
      )}

      <Card style={{ background: C.surface2 }}>
        <button onClick={() => setShowKeyCfg(!showKeyCfg)} className="w-full flex items-center justify-between" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, textTransform: 'uppercase' }}>{t('gen.configAI')}</span>
          <span className="text-sm" style={{ color: hasKey ? C.green : C.gold }}>
            {cfg.label} · {hasKey ? t('gen.keySaved') : t('gen.keyRequired')}{showKeyCfg ? '−' : '+'}
          </span>
        </button>
        {showKeyCfg && (
          <div className="mt-3 flex flex-col gap-3">
            <Field label={t('gen.provider')}>
              <div className="flex flex-wrap gap-2">
                {Object.keys(PROVIDERS).map((p) => {
                  const on = provider === p;
                  const keySet = !!(keys[p] || '').trim();
                  return (
                    <button key={p} onClick={() => changeProvider(p)} className="rounded-full px-3 py-1 text-sm font-semibold" style={{
                      background: on ? C.gold : 'transparent',
                      color: on ? C.ink : C.dim,
                      border: '1px solid ' + (on ? C.gold : C.line),
                      cursor: 'pointer',
                    }}>{PROVIDERS[p].label}{keySet ? ' ✓' : ''}</button>
                  );
                })}
              </div>
            </Field>

            <Field label={cfg.keyLabel}>
              <input
                style={inputStyle}
                type={cfg.keyType}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={cfg.keyPlaceholder}
              />
            </Field>

            <p className="text-xs" style={{ color: C.dim }}>
              {cfg.keyHelp}. {t('gen.keyNote')}
            </p>

            <div>
              <Btn small color={C.gold} onClick={() => saveCurrentKey(false)}>{t('common.save')}</Btn>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
