import { useState } from 'react';
import { C } from '../lib/theme';
import { ytId } from '../lib/utils';

export default function VideoEmbed({ video, dayColor }) {
  const [open, setOpen] = useState(false);
  const id = ytId(video);

  if (!id) {
    return (
      <p className="text-sm mt-2" style={{ color: C.dim }}>
        Sin video. Activa el modo edición y pega un link de YouTube.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 w-full rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-85"
        style={{ background: C.surface2, border: '1px solid ' + C.line, color: dayColor }}
      >
        <span style={{ fontSize: 11 }}>▶</span> Ver técnica
      </button>
    );
  }

  return (
    <div className="mt-3">
      <div className="w-full rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', background: C.ink }}>
        <iframe
          width="100%" height="100%"
          src={'https://www.youtube.com/embed/' + id + '?rel=0'}
          title="Video de técnica"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
      <button
        onClick={() => setOpen(false)}
        className="mt-1 text-xs"
        style={{ color: C.dim, background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Ocultar video
      </button>
    </div>
  );
}
