import { C, FONT_BODY } from '../lib/theme';

export default function Btn({ children, onClick, color, ghost, small, full, style }) {
  return (
    <button
      onClick={onClick}
      className={(small ? 'px-3 py-1 text-sm ' : 'px-4 py-2 ') + (full ? 'w-full ' : '') + 'rounded-lg font-semibold transition-opacity hover:opacity-85'}
      style={{
        background: ghost ? 'transparent' : color || C.text,
        color: ghost ? color || C.text : C.ink,
        border: ghost ? '1px solid ' + (color || C.line) : 'none',
        fontFamily: FONT_BODY,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
