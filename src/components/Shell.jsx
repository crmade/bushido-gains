import { C, FONT_BODY } from '../lib/theme';

export default function Shell({ children }) {
  return (
    <div className="min-h-screen w-full" style={{ background: C.bg, color: C.text, fontFamily: FONT_BODY }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700&display=swap');
        input::placeholder { color: #6B7682; }
        input:focus, button:focus { outline: 2px solid ${C.gold}; outline-offset: 1px; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
      <div className="mx-auto" style={{ maxWidth: 560 }}>{children}</div>
    </div>
  );
}
