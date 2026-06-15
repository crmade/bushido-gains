import { useState } from 'react';
import { C, FONT_DISPLAY } from '../lib/theme';
import { useLang } from '../lib/i18n.jsx';
import Card from './Card';

export default function WhenToChange() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  return (
    <Card style={{ background: C.surface2 }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text }}
      >
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, textTransform: 'uppercase' }}>{t('whenToChange.title')}</span>
        <span style={{ color: C.gold }}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="mt-3 text-sm flex flex-col gap-2" style={{ color: C.dim }}>
          <p><b style={{ color: C.text }}>{t('whenToChange.p1Bold')}</b> {t('whenToChange.p1')}</p>
          <p><b style={{ color: C.text }}>{t('whenToChange.p2Bold')}</b> {t('whenToChange.p2')}</p>
          <p><b style={{ color: C.text }}>{t('whenToChange.p3Bold')}</b> {t('whenToChange.p3')}</p>
          <p><b style={{ color: C.text }}>{t('whenToChange.p4Bold')}</b> {t('whenToChange.p4')}</p>
          <p><b style={{ color: C.text }}>{t('whenToChange.p5Bold')}</b> {t('whenToChange.p5')}</p>
        </div>
      )}
    </Card>
  );
}
