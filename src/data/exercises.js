import { uid } from '../lib/utils';
import { BJJ_BELTS } from './bjj';

// Helpers to get lang-resolved values from multi-lang or plain string entries.
export function pickLang(value, lang) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.es || '';
}

// ---------- Warmup ----------
const WARMUP_KEYS = ['cardio', 'circles', 'shoulders', 'cat', 'legs', 'squat', 'scapula', 'approach'];

const WARMUP_CONTENT = {
  es: {
    cardio: { name: 'Cardio suave', detail: '3-4 min de bici o saltos de tijera, hasta sudar ligero' },
    circles: { name: 'Círculos articulares', detail: 'Cuello, hombros, muñecas, cadera y tobillos · 8-10 por articulación' },
    shoulders: { name: 'Dislocaciones de hombro', detail: '10-12 reps con palo o banda, agarre amplio' },
    cat: { name: 'Gato-vaca + rotación torácica', detail: '8 reps + 8 por lado' },
    legs: { name: 'Balanceos de pierna', detail: '10 por pierna, al frente y lateral' },
    squat: { name: 'Sentadilla profunda sostenida', detail: '30 segundos abajo, abriendo rodillas con los codos' },
    scapula: { name: 'Activación de escápulas', detail: '15-20 face pulls ligeros en polea' },
    approach: { name: 'Series de aproximación', detail: 'Primer básico del día: barra vacía ×10 → 50% ×6 → 70% ×3' },
  },
  en: {
    cardio: { name: 'Light cardio', detail: '3-4 min of bike or jumping jacks, until lightly sweaty' },
    circles: { name: 'Joint circles', detail: 'Neck, shoulders, wrists, hips and ankles · 8-10 per joint' },
    shoulders: { name: 'Shoulder dislocations', detail: '10-12 reps with stick or band, wide grip' },
    cat: { name: 'Cat-cow + thoracic rotation', detail: '8 reps + 8 per side' },
    legs: { name: 'Leg swings', detail: '10 per leg, front and side' },
    squat: { name: 'Deep squat hold', detail: '30 seconds at the bottom, opening knees with elbows' },
    scapula: { name: 'Scapular activation', detail: '15-20 light cable face pulls' },
    approach: { name: 'Approach sets', detail: "First main lift of the day: empty bar ×10 → 50% ×6 → 70% ×3" },
  },
};

export function defaultWarmup(lang = 'es') {
  const L = WARMUP_CONTENT[lang] || WARMUP_CONTENT.es;
  return WARMUP_KEYS.map((key) => ({ id: 'warmup-' + key, name: L[key].name, detail: L[key].detail }));
}

// ---------- Library + default routine helpers ----------
const ex = (name, sets, reps, video, muscle, tip) => ({ id: uid(), name, sets, reps, video, muscle, tip });

const MUSCLES = {
  legs: { es: 'Piernas', en: 'Legs' },
  chest: { es: 'Pecho', en: 'Chest' },
  back: { es: 'Espalda', en: 'Back' },
  shoulders: { es: 'Hombros', en: 'Shoulders' },
  biceps: { es: 'Bíceps', en: 'Biceps' },
  core: { es: 'Core', en: 'Core' },
  posterior: { es: 'Cadena posterior', en: 'Posterior chain' },
  upperChest: { es: 'Pecho superior', en: 'Upper chest' },
  rearDelt: { es: 'Hombro posterior', en: 'Rear deltoid' },
  antiRotation: { es: 'Core antirrotación', en: 'Anti-rotation core' },
  glutes: { es: 'Glúteos', en: 'Glutes' },
  triceps: { es: 'Tríceps', en: 'Triceps' },
  grip: { es: 'Agarre y core', en: 'Grip and core' },
  bicepsForearm: { es: 'Bíceps y antebrazo', en: 'Biceps and forearm' },
  legPower: { es: 'Potencia de piernas', en: 'Leg power' },
  quads: { es: 'Cuádriceps', en: 'Quadriceps' },
  hamstrings: { es: 'Isquios', en: 'Hamstrings' },
  lats: { es: 'Dorsales', en: 'Lats' },
  traps: { es: 'Trapecios', en: 'Traps' },
  lateralDelt: { es: 'Deltoides lateral', en: 'Lateral deltoid' },
  forearm: { es: 'Antebrazo', en: 'Forearm' },
  obliques: { es: 'Oblicuos', en: 'Obliques' },
  calves: { es: 'Pantorrillas', en: 'Calves' },
  adductors: { es: 'Aductores', en: 'Adductors' },
  neck: { es: 'Cuello', en: 'Neck' },
  fullBody: { es: 'Cuerpo completo', en: 'Full body' },
};

const m = (key, lang) => MUSCLES[key][lang] || MUSCLES[key].es;

// LIBRARY: each entry has multi-lang name + muscle.
const LI = (name, muscleKey, video, equip) => ({ name, muscleKey, video, equip });

const LIBRARY_RAW = [
  LI({ es: 'Sentadilla con barra', en: 'Barbell back squat' }, 'legs', 'OySgsMhs2pk', ['barra', 'rack']),
  LI({ es: 'Press de banca con barra', en: 'Barbell bench press' }, 'chest', 'fqsTgdTPRQU', ['barra', 'banco', 'rack']),
  LI({ es: 'Remo con barra', en: 'Barbell row' }, 'back', '5Gg2OPlCkuE', ['barra']),
  LI({ es: 'Press de hombro con mancuernas', en: 'Dumbbell shoulder press' }, 'shoulders', 'o5M9RZ-vWrc', ['mancuernas']),
  LI({ es: 'Curl de bíceps en polea', en: 'Cable biceps curl' }, 'biceps', 'vpIQHsHU82Q', ['polea']),
  LI({ es: 'Elevaciones de piernas colgado', en: 'Hanging leg raises' }, 'core', 'yJW8Gsovjfo', ['dominadas']),
  LI({ es: 'Peso muerto convencional', en: 'Conventional deadlift' }, 'posterior', 'kancsOn7CJY', ['barra']),
  LI({ es: 'Dominadas', en: 'Pull-ups' }, 'back', '8mhDd9Ahl1M', ['dominadas']),
  LI({ es: 'Press inclinado con mancuernas', en: 'Incline dumbbell press' }, 'upperChest', '9fy0A5xWsgk', ['mancuernas', 'banco']),
  LI({ es: 'Sentadilla búlgara', en: 'Bulgarian split squat' }, 'legs', 'IdilLr9nyuQ', ['banco']),
  LI({ es: 'Face pull con cuerda', en: 'Cable face pull' }, 'rearDelt', 'Q18p2QtQAes', ['polea']),
  LI({ es: 'Pallof press en polea', en: 'Cable Pallof press' }, 'antiRotation', '4l848GyVWUM', ['polea']),
  LI({ es: 'Sentadilla goblet con kettlebell', en: 'Kettlebell goblet squat' }, 'legs', 'EfQERnX-qGo', ['kettlebell']),
  LI({ es: 'Press militar con barra', en: 'Standing barbell press' }, 'shoulders', 'xM2FGQuhZAY', ['barra', 'rack']),
  LI({ es: 'Remo sentado en polea', en: 'Seated cable row' }, 'back', 'JtTusrYzAos', ['polea']),
  LI({ es: 'Hip thrust con barra', en: 'Barbell hip thrust' }, 'glutes', 'b1nsBZm9sU8', ['barra', 'banco']),
  LI({ es: 'Extensión de tríceps con cuerda', en: 'Cable triceps extension' }, 'triceps', 'YGrQysn3wAs', ['polea']),
  LI({ es: 'Farmer carry con kettlebells', en: 'Kettlebell farmer carry' }, 'grip', 'oojPmgON094', ['kettlebell']),
  LI({ es: 'Flexiones de pecho', en: 'Push-ups' }, 'chest', 'VsiEATZdNQw', ['corporal']),
  LI({ es: 'Kettlebell swing ruso', en: 'Russian kettlebell swing' }, 'posterior', 'chFTOa8Zicc', ['kettlebell']),
  LI({ es: 'Remo con mancuerna a una mano', en: 'One-arm dumbbell row' }, 'back', 'fZYGcNtMWSc', ['mancuernas', 'banco']),
  LI({ es: 'Zancadas', en: 'Lunges' }, 'legs', 'gItknnU0qkM', ['corporal']),
  LI({ es: 'Press de banca con mancuernas', en: 'Dumbbell bench press' }, 'chest', 'MeyuOEimrC0', ['mancuernas', 'banco']),
  LI({ es: 'Curl de bíceps con mancuernas', en: 'Dumbbell biceps curl' }, 'biceps', '8BsqlTaRg6Q', ['mancuernas']),
  LI({ es: 'Curl martillo con mancuernas', en: 'Dumbbell hammer curl' }, 'bicepsForearm', 'mPvlpDWIoDA', ['mancuernas']),
  LI({ es: 'Plancha abdominal', en: 'Plank' }, 'core', 'O4bNV8W4CkU', ['corporal']),
  LI({ es: 'Remo invertido en TRX', en: 'TRX inverted row' }, 'back', '9_iEY6nT8TM', ['trx']),
  LI({ es: 'Box jump (salto al cajón)', en: 'Box jump' }, 'legPower', 'bbFEYR3i8JU', ['cajon']),

  // ---- Piernas / cadera ----
  LI({ es: 'Sentadilla frontal con barra', en: 'Front squat' }, 'quads', '', ['barra', 'rack']),
  LI({ es: 'Peso muerto rumano con barra', en: 'Romanian deadlift' }, 'hamstrings', '', ['barra']),
  LI({ es: 'Peso muerto rumano a una pierna', en: 'Single-leg Romanian deadlift' }, 'hamstrings', '', ['mancuernas']),
  LI({ es: 'Zancadas caminando con mancuernas', en: 'Walking lunges with dumbbells' }, 'legs', '', ['mancuernas']),
  LI({ es: 'Step-up con mancuernas', en: 'Step-up with dumbbells' }, 'legs', '', ['cajon', 'mancuernas']),
  LI({ es: 'Sentadilla cosaca', en: 'Cossack squat' }, 'adductors', '', ['corporal']),
  LI({ es: 'Sentadilla con salto', en: 'Jump squat' }, 'legPower', '', ['corporal']),
  LI({ es: 'Pantorrillas de pie con mancuernas', en: 'Standing calf raise' }, 'calves', '', ['mancuernas']),

  // ---- Pecho ----
  LI({ es: 'Aperturas en polea', en: 'Cable chest fly' }, 'chest', '', ['polea']),
  LI({ es: 'Fondos en paralelas', en: 'Parallel bar dips' }, 'chest', '', ['dominadas']),
  LI({ es: 'Push-up hindú', en: 'Hindu push-up' }, 'chest', '', ['corporal']),

  // ---- Espalda ----
  LI({ es: 'Jalón al pecho en polea', en: 'Lat pulldown' }, 'lats', '', ['polea']),
  LI({ es: 'Pullover con mancuerna', en: 'Dumbbell pullover' }, 'lats', '', ['mancuernas', 'banco']),
  LI({ es: 'Encogimientos con mancuernas', en: 'Dumbbell shrugs' }, 'traps', '', ['mancuernas']),
  LI({ es: 'Dominadas con agarre supino (chin-ups)', en: 'Chin-ups' }, 'back', '', ['dominadas']),

  // ---- Hombros ----
  LI({ es: 'Elevaciones laterales con mancuernas', en: 'Dumbbell lateral raise' }, 'lateralDelt', '', ['mancuernas']),
  LI({ es: 'Pájaros con mancuernas', en: 'Bent-over dumbbell rear delt fly' }, 'rearDelt', '', ['mancuernas', 'banco']),
  LI({ es: 'Press Arnold con mancuernas', en: 'Arnold press' }, 'shoulders', '', ['mancuernas']),

  // ---- Brazos ----
  LI({ es: 'Curl predicador con barra Z', en: 'EZ-bar preacher curl' }, 'biceps', '', ['barra', 'banco']),
  LI({ es: 'Curl concentrado con mancuerna', en: 'Concentration curl' }, 'biceps', '', ['mancuernas', 'banco']),
  LI({ es: 'Press cerrado en banca', en: 'Close-grip bench press' }, 'triceps', '', ['barra', 'banco', 'rack']),
  LI({ es: 'Skullcrushers con barra Z', en: 'EZ-bar skullcrushers' }, 'triceps', '', ['barra', 'banco']),
  LI({ es: 'Fondos en banco para tríceps', en: 'Bench dips' }, 'triceps', '', ['banco']),
  LI({ es: 'Curl inverso con barra', en: 'Reverse barbell curl' }, 'forearm', '', ['barra']),

  // ---- Core ----
  LI({ es: 'Ab wheel rollout', en: 'Ab wheel rollout' }, 'core', '', ['corporal']),
  LI({ es: 'Dead bug', en: 'Dead bug' }, 'core', '', ['corporal']),
  LI({ es: 'Plancha lateral', en: 'Side plank' }, 'obliques', '', ['corporal']),
  LI({ es: 'Crunch en polea', en: 'Cable crunch' }, 'core', '', ['polea']),
  LI({ es: 'Russian twist con kettlebell', en: 'Russian twist with kettlebell' }, 'obliques', '', ['kettlebell']),

  // ---- BJJ-específico / cuerpo completo ----
  LI({ es: 'Turkish get-up con kettlebell', en: 'Turkish get-up' }, 'fullBody', '', ['kettlebell']),
  LI({ es: 'Puente de cuello (neck bridge)', en: 'Neck bridge' }, 'neck', '', ['corporal']),
];

// Library exposed with resolved muscle lookup.
export const LIBRARY = LIBRARY_RAW.map((li) => ({
  name: li.name,
  muscle: MUSCLES[li.muscleKey],
  video: li.video,
  equip: li.equip,
}));

export function libraryFor(lang) {
  return LIBRARY.map((e) => ({
    name: pickLang(e.name, lang),
    muscle: pickLang(e.muscle, lang),
    video: e.video,
    equip: e.equip,
  }));
}

// ---------- Default routine ----------
const ROUTINE_CONTENT = {
  es: {
    dayName: (id) => 'Día ' + id,
    A: [
      { libName: 'Sentadilla con barra', sets: 4, reps: '6-8', tip: 'Baja profundo y que las rodillas sigan la punta de los pies.' },
      { libName: 'Press de banca con barra', sets: 4, reps: '6-8', tip: 'Escápulas retraídas y pies firmes en el piso.' },
      { libName: 'Remo con barra', sets: 4, reps: '8-10', tip: 'Torso inclinado estable, jala hacia el ombligo.' },
      { libName: 'Press de hombro con mancuernas', sets: 3, reps: '10-12', tip: 'Core apretado, no arquees la zona lumbar.' },
      { libName: 'Curl de bíceps en polea', sets: 3, reps: '12', tip: 'Codos pegados al cuerpo, baja controlado.' },
      { libName: 'Elevaciones de piernas colgado', sets: 3, reps: '10-15', tip: 'Sin balanceo: sube con el abdomen, no con impulso.' },
    ],
    B: [
      { libName: 'Peso muerto convencional', sets: 4, reps: '5-6', tip: 'Espalda neutra y barra pegada a las piernas.' },
      { libName: 'Dominadas', sets: 4, reps: 'Al fallo', tip: 'Si no sacas 6+, usa jalón en polea o banda asistida.' },
      { libName: 'Press inclinado con mancuernas', sets: 3, reps: '8-10', tip: 'Banco a 30-45°, baja hasta sentir estiramiento.' },
      { libName: 'Sentadilla búlgara', sets: 3, reps: '10 c/pierna', tip: 'Pie trasero en banco o cajón, torso ligeramente adelante.' },
      { libName: 'Face pull con cuerda', sets: 3, reps: '15', tip: 'Jala hacia la cara abriendo los codos. Salud de hombro.' },
      { libName: 'Pallof press en polea', sets: 3, reps: '12 c/lado', tip: 'Resiste el giro del torso. Oro para el BJJ.' },
    ],
    C: [
      { libName: 'Sentadilla goblet con kettlebell', sets: 4, reps: '8-10', tip: 'Pesa pegada al pecho, torso erguido.' },
      { libName: 'Press militar con barra', sets: 4, reps: '6-8', tip: 'Glúteos y abdomen firmes, empuja la cabeza al frente al final.' },
      { libName: 'Remo sentado en polea', sets: 3, reps: '10-12', tip: 'Pecho arriba, lleva los codos atrás sin encoger hombros.' },
      { libName: 'Hip thrust con barra', sets: 3, reps: '10-12', tip: 'Espalda alta en el banco, aprieta arriba 1 segundo.' },
      { libName: 'Extensión de tríceps con cuerda', sets: 3, reps: '12-15', tip: 'Codos fijos, abre la cuerda al extender.' },
      { libName: 'Farmer carry con kettlebells', sets: 3, reps: '30-40 m', tip: 'Camina erguido con paso corto. Agarre = grips de BJJ.' },
    ],
  },
  en: {
    dayName: (id) => 'Day ' + id,
    A: [
      { libName: 'Barbell back squat', sets: 4, reps: '6-8', tip: 'Go deep and keep your knees tracking over your toes.' },
      { libName: 'Barbell bench press', sets: 4, reps: '6-8', tip: 'Retract scapulae and plant feet firmly on the floor.' },
      { libName: 'Barbell row', sets: 4, reps: '8-10', tip: 'Stable hinged torso, pull toward the navel.' },
      { libName: 'Dumbbell shoulder press', sets: 3, reps: '10-12', tip: 'Core tight, do not arch the lower back.' },
      { libName: 'Cable biceps curl', sets: 3, reps: '12', tip: 'Elbows pinned to your sides, lower under control.' },
      { libName: 'Hanging leg raises', sets: 3, reps: '10-15', tip: 'No swinging: lift with the abs, not momentum.' },
    ],
    B: [
      { libName: 'Conventional deadlift', sets: 4, reps: '5-6', tip: 'Neutral spine and bar against the legs.' },
      { libName: 'Pull-ups', sets: 4, reps: 'To failure', tip: 'If under 6, use cable pulldown or banded assistance.' },
      { libName: 'Incline dumbbell press', sets: 3, reps: '8-10', tip: 'Bench at 30-45°, lower until you feel the stretch.' },
      { libName: 'Bulgarian split squat', sets: 3, reps: '10 per leg', tip: 'Rear foot on bench or box, torso slightly forward.' },
      { libName: 'Cable face pull', sets: 3, reps: '15', tip: 'Pull to your face flaring your elbows. Shoulder health.' },
      { libName: 'Cable Pallof press', sets: 3, reps: '12 per side', tip: 'Resist torso rotation. Gold for BJJ.' },
    ],
    C: [
      { libName: 'Kettlebell goblet squat', sets: 4, reps: '8-10', tip: 'Bell against the chest, torso upright.' },
      { libName: 'Standing barbell press', sets: 4, reps: '6-8', tip: 'Glutes and abs braced, push head through at the top.' },
      { libName: 'Seated cable row', sets: 3, reps: '10-12', tip: 'Chest up, drive elbows back without shrugging.' },
      { libName: 'Barbell hip thrust', sets: 3, reps: '10-12', tip: 'Upper back on bench, squeeze the top for 1 second.' },
      { libName: 'Cable triceps extension', sets: 3, reps: '12-15', tip: 'Lock elbows, fan rope outward at full extension.' },
      { libName: 'Kettlebell farmer carry', sets: 3, reps: '30-40 m', tip: 'Walk tall with short steps. Grip = BJJ grips.' },
    ],
  },
};

export function defaultRoutine(lang = 'es') {
  const L = ROUTINE_CONTENT[lang] || ROUTINE_CONTENT.es;
  const buildDay = (id, beltIdx, entries) => {
    const belt = BJJ_BELTS[beltIdx];
    return {
      id,
      name: L.dayName(id),
      color: belt.color,
      stripeColor: belt.stripeColor,
      exercises: entries.map((e) => {
        const lib = LIBRARY.find((l) => l.name.es === e.libName) || LIBRARY.find((l) => l.name.en === e.libName);
        return ex(e.libName, e.sets, e.reps, lib?.video || '', pickLang(lib?.muscle, lang), e.tip);
      }),
    };
  };
  return {
    warmup: defaultWarmup(lang),
    days: [
      buildDay('A', 0, L.A),
      buildDay('B', 1, L.B),
      buildDay('C', 2, L.C),
    ],
  };
}

// ---------- Equipment and injuries ----------
export const EQUIPMENT = [
  { key: 'barra', label: { es: 'Barra y discos', en: 'Barbell and plates' } },
  { key: 'rack', label: { es: 'Rack de sentadillas', en: 'Squat rack' } },
  { key: 'mancuernas', label: { es: 'Mancuernas', en: 'Dumbbells' } },
  { key: 'kettlebell', label: { es: 'Kettlebells', en: 'Kettlebells' } },
  { key: 'polea', label: { es: 'Polea / cables', en: 'Cables / pulley' } },
  { key: 'banco', label: { es: 'Banco', en: 'Bench' } },
  { key: 'dominadas', label: { es: 'Barra de dominadas', en: 'Pull-up bar' } },
  { key: 'trx', label: { es: 'TRX / suspensión', en: 'TRX / suspension' } },
  { key: 'cajon', label: { es: 'Cajón pliométrico', en: 'Plyo box' } },
  { key: 'corporal', label: { es: 'Peso corporal', en: 'Bodyweight' } },
];

export const INJURIES = [
  { key: 'hombro', label: { es: 'Hombro', en: 'Shoulder' } },
  { key: 'codo', label: { es: 'Codo', en: 'Elbow' } },
  { key: 'muneca', label: { es: 'Muñeca', en: 'Wrist' } },
  { key: 'lumbar', label: { es: 'Espalda baja (lumbar)', en: 'Lower back (lumbar)' } },
  { key: 'cervical', label: { es: 'Cuello / cervical', en: 'Neck / cervical' } },
  { key: 'cadera', label: { es: 'Cadera', en: 'Hip' } },
  { key: 'rodilla', label: { es: 'Rodilla', en: 'Knee' } },
  { key: 'tobillo', label: { es: 'Tobillo', en: 'Ankle' } },
  { key: 'pecho', label: { es: 'Pecho / costillas', en: 'Chest / ribs' } },
  { key: 'ingle', label: { es: 'Ingle / aductores', en: 'Groin / adductors' } },
];

export function equipmentLabel(key, lang = 'es') {
  const e = EQUIPMENT.find((x) => x.key === key);
  return e ? pickLang(e.label, lang) : key;
}

export function injuryLabel(key, lang = 'es') {
  const i = INJURIES.find((x) => x.key === key);
  return i ? pickLang(i.label, lang) : key;
}
