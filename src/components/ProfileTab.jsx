import { useState } from 'react';
import { C, FONT_DISPLAY, inputStyle } from '../lib/theme';
import { fmtDate } from '../lib/utils';
import { useLang, LANGS } from '../lib/i18n.jsx';
import { cmToDisplay, inputToCm, heightUnit } from '../lib/units';
import Btn from './Btn';
import Card from './Card';
import Field from './Field';

export default function ProfileTab({ users, activeUser, data, loadUser, createUser, updateUser, deleteUser, sbReady, onSignIn, onSignOut, units = 'kg', setLang, setUnits }) {
  const { t, lang } = useLang();
  const [name, setName] = useState('');
  const [height, setHeight] = useState('');
  const [editH, setEditH] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {sbReady && (
        <Card style={{ border: '1px solid ' + C.gold }}>
          <p className="text-sm mb-3" style={{ color: C.dim }}>{t('profile.signInPrompt')}</p>
          <Btn full onClick={onSignIn}>{t('onboard.google')}</Btn>
        </Card>
      )}
      {activeUser && (
        <Card>
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: C.gold }}>{t('profile.active')}</p>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 28, textTransform: 'uppercase' }}>{activeUser.name}</h3>
          <p className="text-sm mt-1" style={{ color: C.dim }}>
            {t('profile.since', { date: fmtDate(activeUser.createdAt), n: data ? data.metrics.length : 0 })}
          </p>
          <div className="mt-3 flex items-end gap-2">
            <Field label={activeUser.height ? t('profile.heightCurrent', { unit: heightUnit(units), value: cmToDisplay(activeUser.height, units) }) : t('profile.heightPlaceholder', { unit: heightUnit(units) })}>
              <input style={inputStyle} type="number" inputMode="decimal" value={editH} onChange={(e) => setEditH(e.target.value)} placeholder={activeUser.height ? String(cmToDisplay(activeUser.height, units)) : (units === 'lbs' ? '69' : '175')} />
            </Field>
            <Btn color={C.gold} onClick={() => { const cm = inputToCm(editH, units); if (cm) { updateUser({ height: cm }); setEditH(''); } }}>{t('common.save')}</Btn>
          </div>
        </Card>
      )}

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

      <Card>
        <h3 className="mb-2" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, textTransform: 'uppercase' }}>{t('profile.users')}</h3>
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: C.surface2, border: '1px solid ' + (u.id === activeUser?.id ? C.gold : C.line) }}>
              <span className="font-semibold">{u.name}</span>
              <div className="flex gap-2 items-center">
                {u.id !== activeUser?.id && <Btn small ghost onClick={() => loadUser(u.id)}>{t('profile.useThisOne')}</Btn>}
                {confirmDel === u.id ? (
                  <Btn small color={C.red} onClick={() => { deleteUser(u.id); setConfirmDel(null); }}>{t('common.confirm')}</Btn>
                ) : (
                  <button onClick={() => setConfirmDel(u.id)} aria-label={t('common.delete')} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 18 }}>×</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {!showNew ? (
          <div className="mt-3"><Btn full ghost color={C.gold} onClick={() => setShowNew(true)}>{t('profile.createAnother')}</Btn></div>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            <Field label={t('onboard.name')}>
              <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('onboard.namePlaceholder')} />
            </Field>
            <Field label={t('onboard.height', { unit: heightUnit(units) }) + ' ' + t('common.optional')}>
              <input style={inputStyle} type="number" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder={units === 'lbs' ? '67' : '170'} />
            </Field>
            <div className="flex gap-2">
              <Btn color={C.gold} onClick={() => { if (name.trim()) { const cm = inputToCm(height, units); createUser(name, cm, null); setName(''); setHeight(''); setShowNew(false); } }}>{t('onboard.create')}</Btn>
              <Btn ghost onClick={() => setShowNew(false)}>{t('common.cancel')}</Btn>
            </div>
          </div>
        )}
      </Card>

      {onSignOut && activeUser && (
        <Card style={{ background: C.surface2 }}>
          {confirmOut ? (
            <div className="flex gap-2">
              <Btn color={C.red} onClick={onSignOut}>{t('profile.closeProfileConfirm')}</Btn>
              <Btn ghost onClick={() => setConfirmOut(false)}>{t('common.cancel')}</Btn>
            </div>
          ) : (
            <Btn full ghost color={C.red} onClick={() => setConfirmOut(true)}>{t('profile.closeProfile')}</Btn>
          )}
          <p className="text-xs mt-2" style={{ color: C.dim }}>{t('profile.closeProfileNote')}</p>
        </Card>
      )}

      <Card style={{ background: C.surface2 }}>
        <p className="text-sm" style={{ color: C.dim }}>{t('profile.note')}</p>
      </Card>
    </div>
  );
}
