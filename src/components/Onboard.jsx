import { useState } from 'react';
import { C, FONT_DISPLAY, inputStyle } from '../lib/theme';
import Btn from './Btn';
import Card from './Card';
import Field from './Field';

export default function Onboard({ onCreate, saveWarn, sbReady, onSignIn }) {
  const [name, setName] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [err, setErr] = useState('');

  return (
    <div className="px-5 pt-12 pb-10">
      <p className="text-xs uppercase tracking-widest mb-2" style={{ color: C.gold }}>Tu plan de fuerza para el tatami</p>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 44, lineHeight: 1, textTransform: 'uppercase' }}>
        Bushido <span style={{ color: C.gold }}>Gains</span>
      </h1>
      <p className="mt-3 mb-6" style={{ color: C.dim }}>
        Rutina full body 3×/semana con videos de técnica, registro de medidas corporales y editor de plan. Crea tu perfil para empezar.
      </p>
      {saveWarn && (
        <div className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(224,96,96,0.12)', border: '1px solid ' + C.red }}>
          Almacenamiento no disponible: tus datos no se guardarán entre sesiones.
        </div>
      )}
      {sbReady && (
        <div className="mb-4">
          <Btn full onClick={onSignIn}>Continuar con Google</Btn>
          <p className="text-xs text-center mt-2" style={{ color: C.dim }}>Sincroniza entre dispositivos · o crea un perfil local abajo</p>
        </div>
      )}
      <Card>
        <div className="flex flex-col gap-4">
          <Field label="Nombre">
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Andrés" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Estatura (cm)">
              <input style={inputStyle} type="number" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175" />
            </Field>
            <Field label="Peso actual (kg)">
              <input style={inputStyle} type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="78" />
            </Field>
          </div>
          {err && <p className="text-sm" style={{ color: C.red }}>{err}</p>}
          <Btn full color={C.gold} onClick={() => {
            if (!name.trim()) { setErr('Escribe tu nombre para crear el perfil.'); return; }
            onCreate(name, height, weight);
          }}>Crear mi perfil</Btn>
        </div>
      </Card>
    </div>
  );
}
