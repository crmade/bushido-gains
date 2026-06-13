import { C } from '../lib/theme';

export default function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wider" style={{ color: C.dim }}>{label}</span>
      {children}
    </div>
  );
}
