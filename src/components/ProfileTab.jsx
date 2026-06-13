import { useState } from 'react';
import { C, FONT_DISPLAY, inputStyle } from '../lib/theme';
import { fmtDate } from '../lib/utils';
import Btn from './Btn';
import Card from './Card';
import Field from './Field';

export default function ProfileTab({ users, activeUser, data, loadUser, createUser, updateUser, deleteUser, sbReady, onSignIn }) {
  const [name, setName] = useState('');
  const [height, setHeight] = useState('');
  const [editH, setEditH] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {sbReady && (
        <Card style={{ border: '1px solid ' + C.gold }}>
          <p className="text-sm mb-3" style={{ color: C.dim }}>Inicia sesión para sincronizar tu rutina, medidas y progreso entre todos tus dispositivos.</p>
          <Btn full onClick={onSignIn}>Continuar con Google</Btn>
        </Card>
      )}
      {activeUser && (
        <Card>
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: C.gold }}>Perfil activo</p>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 28, textTransform: 'uppercase' }}>{activeUser.name}</h3>
          <p className="text-sm mt-1" style={{ color: C.dim }}>
            Desde {fmtDate(activeUser.createdAt)} · {data ? data.metrics.length : 0} medidas registradas
          </p>
          <div className="mt-3 flex items-end gap-2">
            <Field label={'Estatura (cm)' + (activeUser.height ? ' · actual: ' + activeUser.height : '')}>
              <input style={inputStyle} type="number" inputMode="decimal" value={editH} onChange={(e) => setEditH(e.target.value)} placeholder={activeUser.height ? String(activeUser.height) : '175'} />
            </Field>
            <Btn color={C.gold} onClick={() => { if (editH) { updateUser({ height: Number(editH) }); setEditH(''); } }}>Guardar</Btn>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="mb-2" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, textTransform: 'uppercase' }}>Usuarios</h3>
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: C.surface2, border: '1px solid ' + (u.id === activeUser?.id ? C.gold : C.line) }}>
              <span className="font-semibold">{u.name}</span>
              <div className="flex gap-2 items-center">
                {u.id !== activeUser?.id && <Btn small ghost onClick={() => loadUser(u.id)}>Usar</Btn>}
                {confirmDel === u.id ? (
                  <Btn small color={C.red} onClick={() => { deleteUser(u.id); setConfirmDel(null); }}>¿Seguro?</Btn>
                ) : (
                  <button onClick={() => setConfirmDel(u.id)} aria-label="Eliminar usuario" style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 18 }}>×</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {!showNew ? (
          <div className="mt-3"><Btn full ghost color={C.gold} onClick={() => setShowNew(true)}>+ Crear otro usuario</Btn></div>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            <Field label="Nombre">
              <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del nuevo usuario" />
            </Field>
            <Field label="Estatura (cm, opcional)">
              <input style={inputStyle} type="number" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" />
            </Field>
            <div className="flex gap-2">
              <Btn color={C.gold} onClick={() => { if (name.trim()) { createUser(name, height, null); setName(''); setHeight(''); setShowNew(false); } }}>Crear</Btn>
              <Btn ghost onClick={() => setShowNew(false)}>Cancelar</Btn>
            </div>
          </div>
        )}
      </Card>

      <Card style={{ background: C.surface2 }}>
        <p className="text-sm" style={{ color: C.dim }}>
          Cada usuario tiene su propia rutina, medidas e historial, guardados en el navegador de este dispositivo (localStorage). Los videos son de YouTube: puedes reemplazar cualquiera desde <b style={{ color: C.text }}>Rutina → Editar rutina</b> pegando otro link.
        </p>
      </Card>
    </div>
  );
}
