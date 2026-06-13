import { useState, useEffect } from 'react';
import { C, FONT_DISPLAY, inputStyle } from '../lib/theme';
import { uid } from '../lib/utils';
import { EQUIPMENT, LIBRARY, INJURIES } from '../data/exercises';
import { store } from '../lib/supabase';
import { PROVIDERS, callAI } from '../lib/aiProviders';
import Btn from './Btn';
import Card from './Card';
import Field from './Field';

const EMPTY_KEYS = { anthropic: '', openai: '', gemini: '', ollama: '' };

export default function GeneratorTab({ applyDays }) {
  const [goal, setGoal] = useState('');
  const [nDays, setNDays] = useState(3);
  const [sel, setSel] = useState(() => new Set(EQUIPMENT.map((e) => e.key)));
  const [injuries, setInjuries] = useState(() => new Set());
  const [injuryNotes, setInjuryNotes] = useState('');
  const [provider, setProvider] = useState('anthropic');
  const [keys, setKeys] = useState(EMPTY_KEYS);
  const [showKeyCfg, setShowKeyCfg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [preview, setPreview] = useState(null);

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

  const available = LIBRARY.filter((e) => e.equip.every((k) => sel.has(k)));

  async function generate() {
    setErrMsg('');
    if (!goal.trim()) { setErrMsg('Cuéntame primero qué buscas: objetivo, deporte, tiempo disponible…'); return; }
    if (!apiKey.trim()) { setErrMsg('Configura el acceso a ' + cfg.label + ' en la sección de abajo.'); setShowKeyCfg(true); return; }
    if (available.length < 8) { setErrMsg('Con el equipo seleccionado hay muy pocos ejercicios disponibles. Marca más opciones.'); return; }
    setLoading(true);
    setPreview(null);
    await saveCurrentKey(true);

    const lib = available.map((e) => ({ nombre: e.name, musculo: e.muscle, equipo: e.equip }));
    const injuryLabels = [...injuries].map((k) => INJURIES.find((i) => i.key === k)?.label).filter(Boolean);
    const hasInjuryInput = injuryLabels.length > 0 || injuryNotes.trim();

    const promptLines = [
      'Eres un entrenador experto en fuerza e hipertrofia. Diseña una rutina de gimnasio personalizada.',
      'OBJETIVO Y CONTEXTO DEL USUARIO: ' + goal.trim(),
      'DÍAS DE ENTRENAMIENTO POR SEMANA: ' + nDays,
      'BIBLIOTECA DE EJERCICIOS PERMITIDOS (usa SOLO estos, copiando el nombre EXACTO):',
      JSON.stringify(lib),
    ];

    if (hasInjuryInput) {
      promptLines.push('LESIONES Y LIMITACIONES (evita ejercicios que carguen o agraven estas zonas):');
      if (injuryLabels.length) promptLines.push('- ' + injuryLabels.join('\n- '));
      if (injuryNotes.trim()) promptLines.push('Notas adicionales del usuario: ' + injuryNotes.trim());
    }

    promptLines.push(
      'REGLAS:',
      '- Exactamente ' + nDays + ' día' + (nDays > 1 ? 's' : '') + ', con 5 a 7 ejercicios cada uno.',
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
      '{"days":[{"name":"Día A","exercises":[{"name":"Sentadilla con barra","sets":4,"reps":"6-8","tip":"..."}]}]}',
    );

    const prompt = promptLines.join('\n');

    try {
      const text = await callAI({ provider, apiKey: apiKey.trim(), prompt });
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      if (!parsed.days || !Array.isArray(parsed.days) || parsed.days.length === 0) throw new Error('la respuesta no trajo días válidos');
      setPreview(parsed.days);
    } catch (e) {
      const msg = e && e.message ? e.message : '';
      setErrMsg('No se pudo generar la rutina (' + (msg.includes('fetch') ? 'revisa tu conexión y que la clave sea válida' : msg) + ').');
    }
    setLoading(false);
  }

  function apply() {
    const colors = [C.blue, C.purple, C.brown, C.green, C.gold, C.red, C.text];
    const ids = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const byName = {};
    LIBRARY.forEach((e) => { byName[e.name.toLowerCase()] = e; });
    const built = preview.map((d, i) => ({
      id: ids[i] || String(i + 1),
      name: d.name || 'Día ' + (ids[i] || i + 1),
      color: colors[i % colors.length],
      exercises: (d.exercises || []).map((x) => {
        const found = byName[String(x.name || '').toLowerCase().trim()];
        return {
          id: uid(),
          name: x.name || 'Ejercicio',
          sets: Number(x.sets) || 3,
          reps: String(x.reps || '10'),
          video: found ? found.video : '',
          muscle: found ? found.muscle : '',
          tip: x.tip || '',
        };
      }),
    }));
    applyDays(built);
    setPreview(null);
  }

  const hasKey = !!(keys[provider] || '').trim();

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, textTransform: 'uppercase' }}>Generar rutina con IA</h3>
        <p className="text-sm mt-1" style={{ color: C.dim }}>
          Describe tu objetivo, marca el equipo que tienes y las lesiones a evitar. La IA arma un plan usando la biblioteca de {LIBRARY.length} ejercicios con video de técnica verificado.
        </p>
      </Card>

      <Card>
        <Field label="¿Qué buscas? (objetivo, deporte, tiempo, contexto…)">
          <textarea
            style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Ej: practico BJJ 3 veces por semana, quiero ganar masa muscular y fuerza de agarre. Tengo 50 minutos por sesión y entreno antes de rodar."
          />
        </Field>

        <div className="mt-3">
          <Field label="Días de pesas por semana">
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
          <Field label={'Equipo disponible · ' + available.length + ' ejercicios posibles'}>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT.map((e) => {
                const on = sel.has(e.key);
                return (
                  <button key={e.key} onClick={() => toggleSet(setSel, e.key)} className="rounded-full px-3 py-1 text-sm font-semibold" style={{
                    background: on ? C.surface2 : 'transparent',
                    color: on ? C.text : C.dim,
                    border: '1px solid ' + (on ? C.gold : C.line),
                    cursor: 'pointer',
                  }}>{on ? '✓ ' : ''}{e.label}</button>
                );
              })}
            </div>
          </Field>
        </div>

        <div className="mt-3">
          <Field label={'Lesiones a evitar' + (injuries.size > 0 ? ' · ' + injuries.size + ' seleccionada' + (injuries.size > 1 ? 's' : '') : '')}>
            <div className="flex flex-wrap gap-2">
              {INJURIES.map((inj) => {
                const on = injuries.has(inj.key);
                return (
                  <button key={inj.key} onClick={() => toggleSet(setInjuries, inj.key)} className="rounded-full px-3 py-1 text-sm font-semibold" style={{
                    background: on ? 'rgba(224,96,96,0.15)' : 'transparent',
                    color: on ? C.text : C.dim,
                    border: '1px solid ' + (on ? C.red : C.line),
                    cursor: 'pointer',
                  }}>{on ? '✕ ' : ''}{inj.label}</button>
                );
              })}
            </div>
          </Field>
          <div className="mt-2">
            <Field label="Detalles adicionales (opcional)">
              <textarea
                style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
                value={injuryNotes}
                onChange={(e) => setInjuryNotes(e.target.value)}
                placeholder="Ej: desgarro parcial de manguito rotador derecho, tendinitis crónica en codo izquierdo…"
              />
            </Field>
          </div>
        </div>

        {errMsg && <p className="text-sm mt-3" style={{ color: C.red }}>{errMsg}</p>}
        <div className="mt-4">
          <Btn full color={C.gold} onClick={loading ? () => {} : generate} style={{ opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Generando… (10-30 s)' : '✦ Generar rutina con IA'}
          </Btn>
        </div>
      </Card>

      {preview && (
        <Card style={{ border: '1px solid ' + C.green }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, textTransform: 'uppercase', color: C.green }}>Propuesta generada</h3>
          {preview.map((d, i) => (
            <div key={i} className="mt-3">
              <p className="font-semibold">{d.name || 'Día ' + (i + 1)}</p>
              <div className="mt-1 flex flex-col gap-1">
                {(d.exercises || []).map((x, j) => (
                  <p key={j} className="text-sm" style={{ color: C.dim }}>• {x.name} — {x.sets}×{x.reps}</p>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-4 flex gap-2">
            <Btn color={C.green} onClick={apply}>Aplicar como mi rutina</Btn>
            <Btn ghost onClick={() => setPreview(null)}>Descartar</Btn>
          </div>
          <p className="text-xs mt-2" style={{ color: C.dim }}>Al aplicar se reemplaza tu rutina actual. El calentamiento, tus medidas e historial se conservan.</p>
        </Card>
      )}

      <Card style={{ background: C.surface2 }}>
        <button onClick={() => setShowKeyCfg(!showKeyCfg)} className="w-full flex items-center justify-between" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, textTransform: 'uppercase' }}>Configurar IA</span>
          <span className="text-sm" style={{ color: hasKey ? C.green : C.gold }}>
            {cfg.label} · {hasKey ? '✓ ' : 'pendiente · '}{showKeyCfg ? '−' : '+'}
          </span>
        </button>
        {showKeyCfg && (
          <div className="mt-3 flex flex-col gap-3">
            <Field label="Proveedor de IA">
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
              {cfg.keyHelp}. La clave se guarda solo en este navegador. No la ingreses en dispositivos ajenos.
            </p>

            <div>
              <Btn small color={C.gold} onClick={() => saveCurrentKey(false)}>Guardar</Btn>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
