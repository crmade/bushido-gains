import { useState } from 'react';
import { C, FONT_DISPLAY, inputStyle } from '../lib/theme';
import { useLang } from '../lib/i18n.jsx';
import { weightUnit, heightUnit, inputToKg, inputToCm } from '../lib/units';
import Btn from './Btn';
import Card from './Card';
import Field from './Field';

export default function Onboard({ onCreate, saveWarn, sbReady, onSignIn, units = 'kg' }) {
  const { t } = useLang();
  const [name, setName] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [err, setErr] = useState('');

  return (
    <div className="px-5 pt-12 pb-10">
      <p className="text-xs uppercase tracking-widest mb-2" style={{ color: C.gold }}>{t('app.subtitle')}</p>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 44, lineHeight: 1, textTransform: 'uppercase' }}>
        Bushido <span style={{ color: C.gold }}>Gains</span>
      </h1>
      <p className="mt-3 mb-6" style={{ color: C.dim }}>
        {t('onboard.intro')}
      </p>
      {saveWarn && (
        <div className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(224,96,96,0.12)', border: '1px solid ' + C.red }}>
          {t('onboard.storageWarn')}
        </div>
      )}
      {sbReady && (
        <div className="mb-4">
          <Btn full onClick={onSignIn}>{t('onboard.google')}</Btn>
          <p className="text-xs text-center mt-2" style={{ color: C.dim }}>{t('onboard.googleHint')}</p>
        </div>
      )}
      <Card>
        <div className="flex flex-col gap-4">
          <Field label={t('onboard.name')}>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('onboard.namePlaceholder')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('onboard.height', { unit: heightUnit(units) })}>
              <input style={inputStyle} type="number" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder={units === 'lbs' ? '69' : '175'} />
            </Field>
            <Field label={t('onboard.currentWeight', { unit: weightUnit(units) })}>
              <input style={inputStyle} type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={units === 'lbs' ? '172' : '78'} />
            </Field>
          </div>
          {err && <p className="text-sm" style={{ color: C.red }}>{err}</p>}
          <Btn full color={C.gold} onClick={() => {
            if (!name.trim()) { setErr(t('onboard.nameError')); return; }
            const heightCm = inputToCm(height, units);
            const weightKg = inputToKg(weight, units);
            onCreate(name, heightCm, weightKg);
          }}>{t('onboard.create')}</Btn>
        </div>
      </Card>
    </div>
  );
}
