import { useState } from 'react';
import { C } from '../lib/theme';
import { ytId } from '../lib/utils';

export default function VideoEmbed({ video, dayColor, name }) {
  const [open, setOpen] = useState(false);
  const id = ytId(video);

  const searchUrl =
    'https://www.youtube.com/results?search_query=' +
    encodeURIComponent((name || 'técnica') + ' técnica shorts');

  const SearchLink = () => (
    <a
      href={searchUrl}
      target="_blank"
      rel="noreferrer"
      className="text-xs hover:underline"
      style={{ color: C.dim }}
    >
      🔍 Buscar shorts en YouTube
    </a>
  );

  if (!id) {
    return (
      <div className="mt-2 flex flex-col gap-1">
        <p className="text-sm" style={{ color: C.dim }}>
          Sin video. Activa el modo edición y pega un link de YouTube, o busca uno aquí:
        </p>
        <SearchLink />
      </div>
    );
  }

  if (!open) {
    return (
      <div className="mt-3 flex flex-col items-center gap-1">
        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-85"
          style={{ background: C.surface2, border: '1px solid ' + C.line, color: dayColor }}
        >
          <span style={{ fontSize: 11 }}>▶</span> Ver técnica
        </button>
        <SearchLink />
      </div>
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
      <div className="mt-1 flex justify-between items-center">
        <button
          onClick={() => setOpen(false)}
          className="text-xs"
          style={{ color: C.dim, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Ocultar video
        </button>
        <SearchLink />
      </div>
    </div>
  );
}
