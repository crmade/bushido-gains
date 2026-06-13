import { C } from '../lib/theme';

export default function Card({ children, style }) {
  return (
    <div className="rounded-xl p-4" style={{ background: C.surface, border: '1px solid ' + C.line, ...style }}>
      {children}
    </div>
  );
}
