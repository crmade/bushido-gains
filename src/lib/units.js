export const KG_TO_LBS = 2.20462;

export function kgToDisplay(kg, units) {
  if (kg == null || kg === '') return '';
  const n = Number(kg);
  if (!Number.isFinite(n)) return '';
  const v = units === 'lbs' ? n * KG_TO_LBS : n;
  return Math.round(v * 10) / 10;
}

export function inputToKg(value, units) {
  if (value == null || value === '') return null;
  const n = parseFloat(String(value).replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  return units === 'lbs' ? n / KG_TO_LBS : n;
}

export function weightUnit(units) {
  return units === 'lbs' ? 'lbs' : 'kg';
}

export function cmToDisplay(cm, units) {
  if (cm == null || cm === '') return '';
  const n = Number(cm);
  if (!Number.isFinite(n)) return '';
  if (units === 'lbs') return Math.round(n * 0.3937 * 10) / 10;
  return n;
}

export function inputToCm(value, units) {
  if (value == null || value === '') return null;
  const n = parseFloat(String(value).replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  return units === 'lbs' ? n / 0.3937 : n;
}

export function heightUnit(units) {
  return units === 'lbs' ? 'in' : 'cm';
}
