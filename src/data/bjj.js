export const POSITIONS = [
  { key: 'guardia-cerrada', label: { es: 'Guardia cerrada', en: 'Closed guard' } },
  { key: 'guardia-abierta', label: { es: 'Guardia abierta', en: 'Open guard' } },
  { key: 'media-guardia', label: { es: 'Media guardia', en: 'Half guard' } },
  { key: '100-kilos', label: { es: '100 kilos', en: 'Side control' } },
  { key: 'montada', label: { es: 'Montada', en: 'Mount' } },
  { key: 'espalda', label: { es: 'Espalda', en: 'Back' } },
  { key: 'tortuga', label: { es: 'Tortuga', en: 'Turtle' } },
  { key: 'norte-sur', label: { es: 'Norte-sur', en: 'North-south' } },
  { key: 'rodilla-panza', label: { es: 'Rodilla en panza', en: 'Knee on belly' } },
  { key: 'de-pie', label: { es: 'De pie', en: 'Standing' } },
];

export const TECHNIQUE_TYPES = [
  { key: 'pase', label: { es: 'Pase', en: 'Pass' } },
  { key: 'sumision', label: { es: 'Sumisión', en: 'Submission' } },
  { key: 'barrida', label: { es: 'Barrida', en: 'Sweep' } },
  { key: 'escape', label: { es: 'Escape', en: 'Escape' } },
  { key: 'derribo', label: { es: 'Derribo', en: 'Takedown' } },
  { key: 'defensa', label: { es: 'Defensa', en: 'Defense' } },
  { key: 'concepto', label: { es: 'Concepto / transición', en: 'Concept / transition' } },
];

export function positionLabel(key, lang = 'es') {
  const p = POSITIONS.find((x) => x.key === key);
  if (!p) return key;
  return p.label[lang] || p.label.es || key;
}

export function typeLabel(key, lang = 'es') {
  const t = TECHNIQUE_TYPES.find((x) => x.key === key);
  if (!t) return key;
  return t.label[lang] || t.label.es || key;
}

export const BJJ_BELTS = [
  { name: { es: 'Blanca', en: 'White' }, color: '#EDE8DF', stripeColor: '#F6F2E7' },
  { name: { es: 'Azul', en: 'Blue' }, color: '#4D7CFF', stripeColor: '#F6F2E7' },
  { name: { es: 'Morada', en: 'Purple' }, color: '#9B6DFF', stripeColor: '#F6F2E7' },
  { name: { es: 'Café', en: 'Brown' }, color: '#C98A4B', stripeColor: '#F6F2E7' },
  { name: { es: 'Negra', en: 'Black' }, color: '#1F2937', stripeColor: '#F6F2E7' },
  { name: { es: 'Negra/Roja', en: 'Coral' }, color: '#7C1F1F', stripeColor: '#F6F2E7' },
  { name: { es: 'Roja', en: 'Red' }, color: '#DC2626', stripeColor: '#F6F2E7' },
];

export function beltForIndex(idx) {
  return BJJ_BELTS[Math.min(Math.max(idx, 0), BJJ_BELTS.length - 1)];
}

export function beltName(belt, lang = 'es') {
  if (!belt) return '';
  if (typeof belt.name === 'string') return belt.name;
  return belt.name?.[lang] || belt.name?.es || '';
}
