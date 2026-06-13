import { useState, useEffect } from 'react';
import { C, FONT_DISPLAY, inputStyle } from '../lib/theme';
import { uid } from '../lib/utils';
import { EQUIPMENT, LIBRARY } from '../data/exercises';
import { store } from '../lib/supabase';
import Btn from './Btn';
import Card from './Card';
import Field from './Field';

export default function GeneratorTab({ applyDays }) {
  const [goal, setGoal] = useState('');
  const [nDays, setNDays] = useState(3);
  const [sel, setSel] = useState(() => new Set(EQUIPMENT.map((e) => e.key)));
  const [apiKey, setApiKey] = useState('');
  const [showKeyCfg, setShowKeyCfg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    (async () => {
      const k = await store.get('gymapp:apikey');
      if (k) setApiKey(k);
    })();
  }, []);

  function toggleEquip(k) {
    setSel((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k); else n.add(k);
      return n;
    });
  }

  const available = LIBRARY.filter((e) => e.equip.every((k) => sel.has(k)));

  async function generate() {
    setErrMsg('');
    if (!goal.trim()) { setErrMsg('Cuéntame primero qué buscas: objetivo, deporte, tiempo disponible…'); return; }
    if (!apiKey.trim()) { setErrMsg('Configura tu clave de API de Anthropic en la sección de abajo para usar la IA.'); setShowKeyCfg(true); return; }
    if (available.length < 8) { setErrMsg('Con el equipo seleccionado hay muy pocos ejercicios disponibles. Marca más opciones.'); return; }
    setLoading(true);
    setPreview(null);
    await store.set('gymapp:apikey', apiKey.trim());
    const lib = available.map((e) => ({ nombre: e.name, musculo: e.muscle, equipo: e.equip }));
    const prompt = [
      'Eres un entrenador experto en fuerza e hipertrofia. Diseña una rutina de gimnasio personalizada.',
      'OBJETIVO Y CONTEXTO DEL USUARIO: ' + goal.trim(),
      'DÍAS DE ENTRENAMIENTO POR SEMANA: ' + nDays,
      'BIBLIOTECA DE EJERCICIOS PERMITIDOS (usa SOLO estos, copiando el nombre EXACTO):',
      JSON.stringify(lib),
      'REGLAS:',
      '- Exactamente ' + nDays + ' días, con 5 a 7 ejercicios cada uno.',
      '- Compuestos pesados primero; aislamiento y core al final.',
      '- No repitas el mismo ejercicio dentro del mismo día.',
      "- 'sets' es un número; 'reps' es texto corto (ej: '6-8', '12 c/lado', 'Al fallo').",
      "- Cada ejercicio lleva un 'tip' técnico breve y útil en español.",
      "- El 'name' de cada día debe ser corto y descriptivo (ej: 'Día A · Empuje').",
      'Responde ÚNICAMENTE con JSON válido, sin markdown ni texto extra, con esta estructura exacta:',
      '{"days":[{"name":"Día A","exercises":[{"name":"Sentadilla con barra","sets":4,"reps":"6-8","tip":"..."}]}]}',
    ].join('\n');
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 3500, messages: [{ role: 'user', content: prompt }] }),
      });
      if (!r.ok) {
        let detail = '';
        try { const j = await r.json(); detail = j.error && j.error.message ? j.error.message : ''; } catch (e2) {}
        throw new Error('error ' + r.status + (detail ? ': ' + detail : ''));
      }
      const dataR = await r.json();
      const text = (dataR.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
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
    const colors = [C.blue, C.purple, C.brown, C.green, C.gold, C.red];
    const ids = ['A', 'B', 'C', 'D', 'E', 'F'];
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

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, textTransform: 'uppercase' }}>Generar rutina con IA</h3>
        <p className="text-sm mt-1" style={{ color: C.dim }}>Describe tu objetivo, marca el equipo que tienes y la IA arma un plan usando la biblioteca de {LIBRARY.length} ejercicios con video de técnica verificado.</p>
      </Card>

      <Card>
        <Field label="¿Qué buscas? (objetivo, deporte, tiempo, lesiones…)">
          <textarea
            style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Ej: practico BJJ 3 veces por semana, quiero ganar masa muscular y fuerza de agarre. Tengo 50 minutos por sesión y entreno antes de rodar."
          />
        </Field>
        <div className="mt-3">
          <Field label="Días de pesas por semana">
            <div className="flex gap-2">
              {[2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setNDays(n)} className="rounded-lg px-4 py-2 font-semibold" style={{
                  background: nDays === n ? C.gold : 'transparent',
                  color: nDays === n ? C.ink : C.dim,
                  border: '1px solid ' + (nDays === n ? C.gold : C.line),
                  cursor: 'pointer',
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
                  <button key={e.key} onClick={() => toggleEquip(e.key)} className="rounded-full px-3 py-1 text-sm font-semibold" style={{
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
        {errMsg && <p className="text-sm mt-3" style={{ color: C.red }}>{errMsg}</p>}
        <div className="mt-4">
          <Btn full color={C.gold} onClick={loading ? () => {} : generate} style={{ opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Generando… (10-20 s)' : '✦ Generar rutina con IA'}
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
          <span className="text-sm" style={{ color: apiKey ? C.green : C.gold }}>{apiKey ? 'Clave guardada ✓ ' : 'Requiere clave · '}{showKeyCfg ? '−' : '+'}</span>
        </button>
        {showKeyCfg && (
          <div className="mt-3 flex flex-col gap-3">
            <Field label="Clave de API de Anthropic">
              <input style={inputStyle} type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-ant-…" />
            </Field>
            <p className="text-xs" style={{ color: C.dim }}>
              La clave se guarda solo en este navegador y se usa para llamar directamente a la API de Anthropic (cada rutina cuesta centavos). Consigue la tuya en{' '}
              <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: C.gold }}>console.anthropic.com</a>. No la ingreses en dispositivos ajenos.
            </p>
            <div>
              <Btn small color={C.gold} onClick={async () => { await store.set('gymapp:apikey', apiKey.trim()); setErrMsg(''); setShowKeyCfg(false); }}>Guardar clave</Btn>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
