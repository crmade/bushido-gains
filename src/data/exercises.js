import { uid } from '../lib/utils';
import { C } from '../lib/theme';

const ex = (name, sets, reps, video, muscle, tip) => ({ id: uid(), name, sets, reps, video, muscle, tip });

export function defaultWarmup() {
  const wu = (name, detail) => ({ id: uid(), name, detail });
  return [
    wu('Cardio suave', '3-4 min de bici o saltos de tijera, hasta sudar ligero'),
    wu('Círculos articulares', 'Cuello, hombros, muñecas, cadera y tobillos · 8-10 por articulación'),
    wu('Dislocaciones de hombro', '10-12 reps con palo o banda, agarre amplio'),
    wu('Gato-vaca + rotación torácica', '8 reps + 8 por lado'),
    wu('Balanceos de pierna', '10 por pierna, al frente y lateral'),
    wu('Sentadilla profunda sostenida', '30 segundos abajo, abriendo rodillas con los codos'),
    wu('Activación de escápulas', '15-20 face pulls ligeros en polea'),
    wu('Series de aproximación', 'Primer básico del día: barra vacía ×10 → 50% ×6 → 70% ×3'),
  ];
}

export function defaultRoutine() {
  return {
    warmup: defaultWarmup(),
    days: [
      {
        id: 'A', name: 'Día A', color: C.blue,
        exercises: [
          ex('Sentadilla con barra', 4, '6-8', 'OySgsMhs2pk', 'Piernas', 'Baja profundo y que las rodillas sigan la punta de los pies.'),
          ex('Press de banca con barra', 4, '6-8', 'fqsTgdTPRQU', 'Pecho', 'Escápulas retraídas y pies firmes en el piso.'),
          ex('Remo con barra', 4, '8-10', '5Gg2OPlCkuE', 'Espalda', 'Torso inclinado estable, jala hacia el ombligo.'),
          ex('Press de hombro con mancuernas', 3, '10-12', 'o5M9RZ-vWrc', 'Hombros', 'Core apretado, no arquees la zona lumbar.'),
          ex('Curl de bíceps en polea', 3, '12', 'vpIQHsHU82Q', 'Bíceps', 'Codos pegados al cuerpo, baja controlado.'),
          ex('Elevaciones de piernas colgado', 3, '10-15', 'yJW8Gsovjfo', 'Core', 'Sin balanceo: sube con el abdomen, no con impulso.'),
        ],
      },
      {
        id: 'B', name: 'Día B', color: C.purple,
        exercises: [
          ex('Peso muerto convencional', 4, '5-6', 'kancsOn7CJY', 'Cadena posterior', 'Espalda neutra y barra pegada a las piernas.'),
          ex('Dominadas', 4, 'Al fallo', '8mhDd9Ahl1M', 'Espalda', 'Si no sacas 6+, usa jalón en polea o banda asistida.'),
          ex('Press inclinado con mancuernas', 3, '8-10', '9fy0A5xWsgk', 'Pecho superior', 'Banco a 30-45°, baja hasta sentir estiramiento.'),
          ex('Sentadilla búlgara', 3, '10 c/pierna', 'IdilLr9nyuQ', 'Piernas', 'Pie trasero en banco o cajón, torso ligeramente adelante.'),
          ex('Face pull con cuerda', 3, '15', 'Q18p2QtQAes', 'Hombro posterior', 'Jala hacia la cara abriendo los codos. Salud de hombro.'),
          ex('Pallof press en polea', 3, '12 c/lado', '4l848GyVWUM', 'Core antirrotación', 'Resiste el giro del torso. Oro para el BJJ.'),
        ],
      },
      {
        id: 'C', name: 'Día C', color: C.brown,
        exercises: [
          ex('Sentadilla goblet con kettlebell', 4, '8-10', 'EfQERnX-qGo', 'Piernas', 'Pesa pegada al pecho, torso erguido.'),
          ex('Press militar con barra', 4, '6-8', 'xM2FGQuhZAY', 'Hombros', 'Glúteos y abdomen firmes, empuja la cabeza al frente al final.'),
          ex('Remo sentado en polea', 3, '10-12', 'JtTusrYzAos', 'Espalda', 'Pecho arriba, lleva los codos atrás sin encoger hombros.'),
          ex('Hip thrust con barra', 3, '10-12', 'b1nsBZm9sU8', 'Glúteos', 'Espalda alta en el banco, aprieta arriba 1 segundo.'),
          ex('Extensión de tríceps con cuerda', 3, '12-15', 'YGrQysn3wAs', 'Tríceps', 'Codos fijos, abre la cuerda al extender.'),
          ex('Farmer carry con kettlebells', 3, '30-40 m', 'oojPmgON094', 'Agarre y core', 'Camina erguido con paso corto. Agarre = grips de BJJ.'),
        ],
      },
    ],
  };
}

const LI = (name, muscle, video, equip) => ({ name, muscle, video, equip });

export const LIBRARY = [
  LI('Sentadilla con barra', 'Piernas', 'OySgsMhs2pk', ['barra', 'rack']),
  LI('Press de banca con barra', 'Pecho', 'fqsTgdTPRQU', ['barra', 'banco', 'rack']),
  LI('Remo con barra', 'Espalda', '5Gg2OPlCkuE', ['barra']),
  LI('Press de hombro con mancuernas', 'Hombros', 'o5M9RZ-vWrc', ['mancuernas']),
  LI('Curl de bíceps en polea', 'Bíceps', 'vpIQHsHU82Q', ['polea']),
  LI('Elevaciones de piernas colgado', 'Core', 'yJW8Gsovjfo', ['dominadas']),
  LI('Peso muerto convencional', 'Cadena posterior', 'kancsOn7CJY', ['barra']),
  LI('Dominadas', 'Espalda', '8mhDd9Ahl1M', ['dominadas']),
  LI('Press inclinado con mancuernas', 'Pecho superior', '9fy0A5xWsgk', ['mancuernas', 'banco']),
  LI('Sentadilla búlgara', 'Piernas', 'IdilLr9nyuQ', ['banco']),
  LI('Face pull con cuerda', 'Hombro posterior', 'Q18p2QtQAes', ['polea']),
  LI('Pallof press en polea', 'Core antirrotación', '4l848GyVWUM', ['polea']),
  LI('Sentadilla goblet con kettlebell', 'Piernas', 'EfQERnX-qGo', ['kettlebell']),
  LI('Press militar con barra', 'Hombros', 'xM2FGQuhZAY', ['barra', 'rack']),
  LI('Remo sentado en polea', 'Espalda', 'JtTusrYzAos', ['polea']),
  LI('Hip thrust con barra', 'Glúteos', 'b1nsBZm9sU8', ['barra', 'banco']),
  LI('Extensión de tríceps con cuerda', 'Tríceps', 'YGrQysn3wAs', ['polea']),
  LI('Farmer carry con kettlebells', 'Agarre y core', 'oojPmgON094', ['kettlebell']),
  LI('Flexiones de pecho', 'Pecho', 'VsiEATZdNQw', ['corporal']),
  LI('Kettlebell swing ruso', 'Cadena posterior', 'chFTOa8Zicc', ['kettlebell']),
  LI('Remo con mancuerna a una mano', 'Espalda', 'fZYGcNtMWSc', ['mancuernas', 'banco']),
  LI('Zancadas', 'Piernas', 'gItknnU0qkM', ['corporal']),
  LI('Press de banca con mancuernas', 'Pecho', 'MeyuOEimrC0', ['mancuernas', 'banco']),
  LI('Curl de bíceps con mancuernas', 'Bíceps', '8BsqlTaRg6Q', ['mancuernas']),
  LI('Curl martillo con mancuernas', 'Bíceps y antebrazo', 'mPvlpDWIoDA', ['mancuernas']),
  LI('Plancha abdominal', 'Core', 'O4bNV8W4CkU', ['corporal']),
  LI('Remo invertido en TRX', 'Espalda', '9_iEY6nT8TM', ['trx']),
  LI('Box jump (salto al cajón)', 'Potencia de piernas', 'bbFEYR3i8JU', ['cajon']),
];

export const INJURIES = [
  { key: 'hombro', label: 'Hombro' },
  { key: 'codo', label: 'Codo' },
  { key: 'muneca', label: 'Muñeca' },
  { key: 'lumbar', label: 'Espalda baja (lumbar)' },
  { key: 'cervical', label: 'Cuello / cervical' },
  { key: 'cadera', label: 'Cadera' },
  { key: 'rodilla', label: 'Rodilla' },
  { key: 'tobillo', label: 'Tobillo' },
  { key: 'pecho', label: 'Pecho / costillas' },
  { key: 'ingle', label: 'Ingle / aductores' },
];

export const EQUIPMENT = [
  { key: 'barra', label: 'Barra y discos' },
  { key: 'rack', label: 'Rack de sentadillas' },
  { key: 'mancuernas', label: 'Mancuernas' },
  { key: 'kettlebell', label: 'Kettlebells' },
  { key: 'polea', label: 'Polea / cables' },
  { key: 'banco', label: 'Banco' },
  { key: 'dominadas', label: 'Barra de dominadas' },
  { key: 'trx', label: 'TRX / suspensión' },
  { key: 'cajon', label: 'Cajón pliométrico' },
  { key: 'corporal', label: 'Peso corporal' },
];
