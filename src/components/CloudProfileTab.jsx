import { useState } from 'react';
import { C, FONT_DISPLAY, inputStyle } from '../lib/theme';
import { useLang, LANGS } from '../lib/i18n.jsx';
import { cmToDisplay, inputToCm, heightUnit } from '../lib/units';
import Btn from './Btn';
import Card from './Card';
import Field from './Field';

export default function CloudProfileTab({ user, data, users, updateUser, importLocal, onSignOut, cloudErr, units = 'kg', setLang, setUnits }) {
  const { t, lang } = useLang();
  const [editH, setEditH] = useState('');
  const [confirmImport, setConfirmImport] = useState(null);
  const [confirmOut, setConfirmOut] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <Card style={{ border: '1px solid ' + (cloudErr ? C.red : C.green) }}>
        <div className="flex items-center gap-3">
          {user.avatar ? (
            <img src={user.avatar} alt="" referrerPolicy="no-referrer" className="rounded-full" style={{ width: 48, height: 48 }} />
          ) : (
            <div className="rounded-full flex items-center justify-center" style={{ width: 48, height: 48, background: C.surface2, border: '1px solid ' + C.line, fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 20 }}>
              {(user.name || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, textTransform: 'uppercase', lineHeight: 1.1 }}>{user.name}</h3>
            <p className="text-xs" style={{ color: C.dim }}>{user.email}</p>
          </div>
        </div>
        <p className="text-sm mt-3" style={{ color: cloudErr ? C.red : C.green }}>
          {cloudErr ? t('profile.cloudErr') : t('profile.cloudSynced')}
        </p>
        <p className="text-xs mt-1" style={{ color: C.dim }}>{t('profile.metricsCount', { n: data ? data.metrics.length : 0 })}</p>
        <div className="mt-3 flex items-end gap-2">
          <Field label={user.height ? t('profile.heightCurrent', { unit: heightUnit(units), value: cmToDisplay(user.height, units) }) : t('profile.heightPlaceholder', { unit: heightUnit(units) })}>
            <input style={inputStyle} type="number" inputMode="decimal" value={editH} onChange={(e) => setEditH(e.target.value)} placeholder={user.height ? String(cmToDisplay(user.height, units)) : (units === 'lbs' ? '69' : '175')} />
          </Field>
          <Btn color={C.gold} onClick={() => { const cm = inputToCm(editH, units); if (cm) { updateUser({ height: cm }); setEditH(''); } }}>{t('common.save')}</Btn>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, textTransform: 'uppercase' }}>{t('profile.settings')}</h3>
        <div className="flex flex-col gap-3">
          <Field label={t('profile.language')}>
            <div className="flex gap-2">
              {LANGS.map((l) => {
                const on = lang === l.key;
                return (
                  <button key={l.key} onClick={() => setLang && setLang(l.key)} className="rounded-lg px-4 py-2 font-semibold" style={{
                    background: on ? C.gold : 'transparent',
                    color: on ? C.ink : C.dim,
                    border: '1px solid ' + (on ? C.gold : C.line),
                    cursor: 'pointer',
                  }}>{l.label}</button>
                );
              })}
            </div>
          </Field>

          <Field label={t('profile.units')}>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'kg', label: t('profile.unitsMetric') },
                { key: 'lbs', label: t('profile.unitsImperial') },
              ].map((u) => {
                const on = units === u.key;
                return (
                  <button key={u.key} onClick={() => setUnits && setUnits(u.key)} className="rounded-lg px-4 py-2 font-semibold" style={{
                    background: on ? C.gold : 'transparent',
                    color: on ? C.ink : C.dim,
                    border: '1px solid ' + (on ? C.gold : C.line),
                    cursor: 'pointer',
                  }}>{u.label}</button>
                );
              })}
            </div>
          </Field>
        </div>
      </Card>

      {users && users.length > 0 && (
        <Card>
          <h3 className="mb-1" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, textTransform: 'uppercase' }}>{t('profile.importLocal')}</h3>
          <p className="text-xs mb-3" style={{ color: C.dim }}>{t('profile.importNote')}</p>
          <div className="flex flex-col gap-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: C.surface2, border: '1px solid ' + C.line }}>
                <span className="font-semibold text-sm">{u.name}</span>
                {confirmImport === u.id ? (
                  <Btn small color={C.red} onClick={() => { importLocal(u.id); setConfirmImport(null); }}>{t('profile.uploadConfirm')}</Btn>
                ) : (
                  <Btn small ghost color={C.gold} onClick={() => setConfirmImport(u.id)}>{t('profile.uploadToCloud')}</Btn>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ background: C.surface2 }}>
        {confirmOut ? (
          <div className="flex gap-2">
            <Btn color={C.red} onClick={onSignOut}>{t('profile.signOutConfirm')}</Btn>
            <Btn ghost onClick={() => setConfirmOut(false)}>{t('common.cancel')}</Btn>
          </div>
        ) : (
          <Btn full ghost color={C.red} onClick={() => setConfirmOut(true)}>{t('profile.signOut')}</Btn>
        )}
        <p className="text-xs mt-2" style={{ color: C.dim }}>{t('profile.signOutNote')}</p>
      </Card>
    </div>
  );
}
