import { useState } from 'react';
import { C, FONT_DISPLAY, inputStyle } from '../lib/theme';
import Btn from './Btn';
import Card from './Card';
import Field from './Field';

export default function CloudProfileTab({ user, data, users, updateUser, importLocal, onSignOut, cloudErr }) {
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
          {cloudErr ? 'Sin conexión con la nube en este momento' : '✓ Sincronizado en la nube: tu progreso te sigue en cualquier dispositivo'}
        </p>
        <p className="text-xs mt-1" style={{ color: C.dim }}>{data ? data.metrics.length : 0} medidas registradas</p>
        <div className="mt-3 flex items-end gap-2">
          <Field label={'Estatura (cm)' + (user.height ? ' · actual: ' + user.height : '')}>
            <input style={inputStyle} type="number" inputMode="decimal" value={editH} onChange={(e) => setEditH(e.target.value)} placeholder={user.height ? String(user.height) : '175'} />
          </Field>
          <Btn color={C.gold} onClick={() => { if (editH) { updateUser({ height: Number(editH) }); setEditH(''); } }}>Guardar</Btn>
        </div>
      </Card>

      {users && users.length > 0 && (
        <Card>
          <h3 className="mb-1" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, textTransform: 'uppercase' }}>Importar datos locales</h3>
          <p className="text-xs mb-3" style={{ color: C.dim }}>Sube a tu cuenta los datos de un perfil local de este dispositivo. Esto reemplaza la rutina y medidas que tengas en la nube.</p>
          <div className="flex flex-col gap-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: C.surface2, border: '1px solid ' + C.line }}>
                <span className="font-semibold text-sm">{u.name}</span>
                {confirmImport === u.id ? (
                  <Btn small color={C.red} onClick={() => { importLocal(u.id); setConfirmImport(null); }}>¿Seguro? Sí, subir</Btn>
                ) : (
                  <Btn small ghost color={C.gold} onClick={() => setConfirmImport(u.id)}>Subir a la nube</Btn>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ background: C.surface2 }}>
        {confirmOut ? (
          <div className="flex gap-2">
            <Btn color={C.red} onClick={onSignOut}>Sí, cerrar sesión</Btn>
            <Btn ghost onClick={() => setConfirmOut(false)}>Cancelar</Btn>
          </div>
        ) : (
          <Btn full ghost color={C.red} onClick={() => setConfirmOut(true)}>Cerrar sesión</Btn>
        )}
        <p className="text-xs mt-2" style={{ color: C.dim }}>Al cerrar sesión vuelves al modo local de este dispositivo. Tus datos en la nube quedan guardados.</p>
      </Card>
    </div>
  );
}
