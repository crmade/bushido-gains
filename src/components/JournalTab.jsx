import { useState, useMemo } from 'react';
import { C, FONT_DISPLAY, inputStyle } from '../lib/theme';
import { fmtDate, ytId } from '../lib/utils';
import { positionLabel, typeLabel } from '../data/bjj';
import { useLang } from '../lib/i18n.jsx';
import Btn from './Btn';
import Card from './Card';
import VideoEmbed from './VideoEmbed';
import JournalEditor from './JournalEditor';

export default function JournalTab({ journal, saveNote, deleteNote }) {
  const { t, lang } = useLang();
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [fPosition, setFPosition] = useState(null);
  const [fType, setFType] = useState(null);
  const [fTag, setFTag] = useState(null);

  const allTags = useMemo(() => {
    const s = new Set();
    journal.forEach((n) => (n.tags || []).forEach((tg) => s.add(tg)));
    return [...s].sort();
  }, [journal]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...journal]
      .filter((n) => {
        if (q) {
          const hay = ((n.title || '') + ' ' + (n.text || '') + ' ' + (n.tags || []).join(' ')).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (fPosition && !(n.positions || []).includes(fPosition)) return false;
        if (fType && !(n.types || []).includes(fType)) return false;
        if (fTag && !(n.tags || []).includes(fTag)) return false;
        return true;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [journal, query, fPosition, fType, fTag]);

  if (editing) {
    const existing = editing === 'new' ? null : editing;
    return (
      <JournalEditor
        existing={existing}
        allTags={allTags}
        onSave={(note) => { saveNote(note); setEditing(null); }}
        onCancel={() => setEditing(null)}
        onDelete={(id) => { deleteNote(id); setEditing(null); }}
      />
    );
  }

  const filterActive = !!(fPosition || fType || fTag || query);
  const countLabel = journal.length === 1 ? '1 ' + t('journal.note') : journal.length + ' ' + t('journal.notes');

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, textTransform: 'uppercase' }}>{t('journal.title')}</h3>
            <p className="text-xs" style={{ color: C.dim }}>{countLabel}{filtered.length !== journal.length ? ' · ' + filtered.length + ' visible' : ''}</p>
          </div>
          <Btn small color={C.gold} onClick={() => setEditing('new')}>+ {t('common.new')}</Btn>
        </div>
        <input
          style={inputStyle}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('journal.searchPlaceholder')}
        />

        {filterActive && (
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs" style={{ color: C.dim }}>{t('journal.filters')}</span>
            {fPosition && <FilterPill label={positionLabel(fPosition, lang)} color={C.blue} onClear={() => setFPosition(null)} />}
            {fType && <FilterPill label={typeLabel(fType, lang)} color={C.purple} onClear={() => setFType(null)} />}
            {fTag && <FilterPill label={'#' + fTag} color={C.gold} onClear={() => setFTag(null)} />}
            <button onClick={() => { setFPosition(null); setFType(null); setFTag(null); setQuery(''); }} className="text-xs font-semibold" style={{ color: C.gold, background: 'none', border: 'none', cursor: 'pointer' }}>{t('common.clearAll').toLowerCase()}</button>
          </div>
        )}
      </Card>

      {journal.length === 0 && (
        <Card style={{ background: C.surface2 }}>
          <p className="text-sm" style={{ color: C.dim }}>{t('journal.empty')}</p>
        </Card>
      )}

      {filtered.length === 0 && journal.length > 0 && (
        <Card style={{ background: C.surface2 }}>
          <p className="text-sm" style={{ color: C.dim }}>{t('journal.noMatch')}</p>
        </Card>
      )}

      {filtered.map((n) => (
        <Card key={n.id}>
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <p className="text-xs" style={{ color: C.gold }}>{fmtDate(n.date)}</p>
              {n.title && (
                <h4 className="mt-0.5" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, lineHeight: 1.15, textTransform: 'uppercase' }}>{n.title}</h4>
              )}
            </div>
            <Btn small ghost onClick={() => setEditing(n)}>{t('common.edit')}</Btn>
          </div>

          {n.text && (
            <p className="text-sm mt-2 whitespace-pre-wrap" style={{ color: C.text }}>{n.text}</p>
          )}

          {((n.positions || []).length > 0 || (n.types || []).length > 0 || (n.tags || []).length > 0) && (
            <div className="flex flex-wrap gap-1 mt-3">
              {(n.positions || []).map((k) => (
                <Chip key={'p-' + k} label={positionLabel(k, lang)} color={C.blue} onClick={() => setFPosition(k)} />
              ))}
              {(n.types || []).map((k) => (
                <Chip key={'t-' + k} label={typeLabel(k, lang)} color={C.purple} onClick={() => setFType(k)} />
              ))}
              {(n.tags || []).map((tg) => (
                <Chip key={'tag-' + tg} label={'#' + tg} muted onClick={() => setFTag(tg)} />
              ))}
            </div>
          )}

          {n.video && ytId(n.video) && (
            <VideoEmbed video={n.video} dayColor={C.gold} name={n.title || 'BJJ'} />
          )}
        </Card>
      ))}
    </div>
  );
}

function Chip({ label, color, muted, onClick }) {
  return (
    <button onClick={onClick} className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{
      background: muted ? 'transparent' : C.surface2,
      color: muted ? C.dim : C.text,
      border: '1px solid ' + (color || C.line),
      cursor: 'pointer',
    }}>{label}</button>
  );
}

function FilterPill({ label, color, onClear }) {
  return (
    <button onClick={onClear} className="rounded-full px-2 py-0.5 text-xs font-semibold inline-flex items-center gap-1" style={{
      background: C.surface2, color: C.text, border: '1px solid ' + (color || C.gold), cursor: 'pointer',
    }}>{label} <span style={{ opacity: 0.6 }}>×</span></button>
  );
}
