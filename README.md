# Bushido Gains

App para registrar entrenamiento de fuerza y técnica de BJJ. Rutinas personalizables, generador con IA, diario de clases, tracking de pesos y medidas corporales. Mobile-first, modo local o sincronizado a la nube.

**Live:** https://crmade.github.io/bushido-gains/

## Qué hace

- **Rutina** — Editor de rutina full-body multi-día. Calentamiento, ejercicios con series, reps, tip técnico, link de video. Cinta de progreso del día estilo BJJ (4 grados que se llenan proporcionalmente).
- **Generador con IA** — Describe tu objetivo, equipo disponible, lesiones a evitar, días por semana y tiempo de sesión. La IA arma una rutina usando una biblioteca de 28 ejercicios con video. Soporta Anthropic, OpenAI, Gemini y Ollama (las claves se guardan sólo localmente).
- **Progreso** — Registro de peso, % grasa, % músculo. Gráfica de tendencia. IMC automático. Historial de sesiones de entrenamiento con peso usado por ejercicio y notas.
- **Diario BJJ** — Notas de clases con posición (10 fijas), tipo de técnica (7 fijos) y tags libres con autocomplete. Búsqueda y filtros.
- **Perfil** — Cuentas con Google (Supabase) o perfiles locales múltiples. Settings de idioma (es/en) y unidades (kg/lbs).

## Stack

- React 19 + Vite
- Tailwind CSS v4
- Supabase (auth con Google + sincronización de datos vía `user_data` table)
- Despliegue: GitHub Pages vía GitHub Actions

## Setup local

```bash
npm install
cp .env.local.example .env.local   # editar con tus claves
npm run dev
```

Variables de entorno (`.env.local`):

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx
```

Si dejas las variables vacías, la app funciona en **modo local** (sólo localStorage, sin login, sin sync entre dispositivos).

## Setup de Supabase (opcional, para auth + sync)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Tabla `user_data`:
   ```sql
   create table user_data (
     user_id uuid primary key references auth.users on delete cascade,
     data jsonb not null default '{}'::jsonb,
     updated_at timestamptz not null default now()
   );
   alter table user_data enable row level security;
   create policy "users own data"
     on user_data for all
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);
   ```
3. **Authentication → Providers → Google**: activar y pegar Client ID + Secret de Google Cloud Console.
4. En Google Cloud Console: crear OAuth Client (Web) con redirect URI `https://<project>.supabase.co/auth/v1/callback`.
5. **Authentication → URL Configuration**:
   - Site URL: la URL pública de la app
   - Redirect URLs: `https://<tu-dominio>/**` y `http://localhost:5173/**`

## Estructura

```
src/
├── App.jsx                  Orquestador: tabs, mutaciones de datos
├── main.jsx                 Entry point + LangProvider
├── lib/
│   ├── supabase.js         Cliente Supabase, store localStorage, normalizeData
│   ├── i18n.jsx            Context de idioma + diccionario es/en
│   ├── units.js            Conversiones kg↔lbs / cm↔in
│   ├── aiProviders.js      Wrappers para Anthropic/OpenAI/Gemini/Ollama
│   ├── theme.js            Paleta y tipografía
│   └── utils.js            uid, todayStr, fmtDate, ytId
├── data/
│   ├── exercises.js        Biblioteca, defaultRoutine, defaultWarmup, EQUIPMENT, INJURIES
│   └── bjj.js              Posiciones BJJ, tipos de técnica, sistema de cintas
└── components/             Btn, Card, Field, Belt, Shell, MiniChart,
                            VideoEmbed, Onboard, WarmupCard, WhenToChange,
                            RoutineTab, ProgressTab, SessionsHistory,
                            GeneratorTab, JournalTab, JournalEditor,
                            ProfileTab, CloudProfileTab
```

## Modelo de datos (por usuario)

```js
{
  profile: { height, lang: 'es'|'en', units: 'kg'|'lbs' },
  routine: {
    warmup: [{ id, name, detail }],
    days:   [{ id, name, color, stripeColor, exercises: [...] }],
  },
  metrics:  [{ id, date, weight, fat, muscle }],         // weight en kg
  done:     { '2026-06-20': { exId: true } },            // checks del día
  sessions: { '2026-06-20': { dayId, notes, exercises: { exId: { weight } } } },
  journal:  [{ id, date, title, text, positions, types, tags, video }],
}
```

- Pesos se almacenan siempre en kg; el setting `units` sólo cambia display/input.
- Idioma se guarda también en `localStorage:gymapp:lang` para que la UI cargue en el idioma correcto antes de tener data.

## Despliegue

GitHub Actions corre `npm run build` y publica `dist/` a GitHub Pages en cada push a `main`. Las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` se inyectan desde GitHub Secrets.

Para deploy manual:

```bash
npm run build      # genera dist/
npm run preview    # sirve dist/ localmente
```

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción a `dist/`
- `npm run preview` — sirve el build de producción
- `npm run lint` — ESLint
