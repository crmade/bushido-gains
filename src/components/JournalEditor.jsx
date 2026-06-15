import { useState, useMemo } from 'react';
import { C, FONT_DISPLAY, inputStyle } from '../lib/theme';
import { uid, todayStr } from '../lib/utils';
import { POSITIONS, TECHNIQUE_TYPES, positionLabel, typeLabel } from '../data/bjj';
import { useLang } from '../lib/i18n.jsx';
import Btn from './Btn';
import Card from './Card';
import Field from './Field';

export default function JournalEditor({ existing, allTags, onSave, onCancel, onDelete }) {
  const { t, lang } = useLang();
  const [date, setDate] = useState(existing?.date || todayStr());
  const [title, setTitle] = useState(existing?.title || '');
  const [text, setText] = useState(existing?.text || '');
  const [positions, setPositions] = useState(() => new Set(existing?.positions || []));
  const [types, setTypes] = useState(() => new Set(existing?.types || []));
  const [tags, setTags] = useState(existing?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [video, setVideo] = useState(existing?.video || '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  function toggle(set, setter, key) {
    const n = new Set(set);
    if (n.has(key)) n.delete(key); else n.add(key);
    setter(n);
  }

  function commitTag(raw) {
    const v = (raw || '').trim().replace(/,$/, '').trim().toLowerCase();
    if (!v) { setTagInput(''); return; }
    if (!tags.includes(v)) setTags([...tags, v]);
    setTagInput('');
  }

  function removeTag(tg) {
    setTags(tags.filter((x) => x !== tg));
  }

  const suggestions = useMemo(() => {
    const q = tagInput.trim().toLowerCase();
    if (!q) return [];
    return allTags.filter((tg) => tg.includes(q) && !tags.includes(tg)).slice(0, 8);
  }, [tagInput, allTags, tags]);

  function save() {
    const note = {
      id: existing?.id || uid(),
      date,
      title: title.trim(),
      text: text.trim(),
      positions: [...positions],
      types: [...types],
      tags,
      video: video.trim(),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(note);
  }

  const positionLabelText = positions.size === 0
    ? t('journal.fieldPosition')
    : t('journal.fieldPosition') + ' · ' + positions.size;
  const typeLabelText = types.size === 0
    ? t('journal.fieldType')
    : t('journal.fieldType') + ' · ' + types.size;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex justify-between items-center mb-3">
          <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, textTransform: 'uppercase' }}>
            {existing ? t('journal.editNote') : t('journal.newNote')}
          </h3>
          <Btn small ghost onClick={onCancel}>{t('common.back')}</Btn>
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('journal.fieldDate')}>
              <input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label={t('journal.fieldTitle')}>
              <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('journal.titlePlaceholder')} />
            </Field>
          </div>

          <Field label={t('journal.fieldNote')}>
            <textarea
              style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('journal.notePlaceholder')}
            />
          </Field>

          <Field label={positionLabelText}>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map((p) => {
                const on = positions.has(p.key);
                return (
                  <button key={p.key} onClick={() => toggle(positions, setPositions, p.key)} className="rounded-full px-3 py-1 text-sm font-semibold" style={{
                    background: on ? C.surface2 : 'transparent',
                    color: on ? C.text : C.dim,
                    border: '1px solid ' + (on ? C.blue : C.line),
                    cursor: 'pointer',
                  }}>{on ? '✓ ' : ''}{positionLabel(p.key, lang)}</button>
                );
              })}
            </div>
          </Field>

          <Field label={typeLabelText}>
            <div className="flex flex-wrap gap-2">
              {TECHNIQUE_TYPES.map((ty) => {
                const on = types.has(ty.key);
                return (
                  <button key={ty.key} onClick={() => toggle(types, setTypes, ty.key)} className="rounded-full px-3 py-1 text-sm font-semibold" style={{
                    background: on ? C.surface2 : 'transparent',
                    color: on ? C.text : C.dim,
                    border: '1px solid ' + (on ? C.purple : C.line),
                    cursor: 'pointer',
                  }}>{on ? '✓ ' : ''}{typeLabel(ty.key, lang)}</button>
                );
              })}
            </div>
          </Field>

          <Field label={t('journal.fieldTags')}>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tg) => (
                  <button key={tg} onClick={() => removeTag(tg)} className="rounded-full px-3 py-1 text-sm font-semibold inline-flex items-center gap-1" style={{
                    background: C.surface2, color: C.text, border: '1px solid ' + C.gold, cursor: 'pointer',
                  }}>#{tg} <span style={{ opacity: 0.5 }}>×</span></button>
                ))}
              </div>
            )}
            <input
              style={inputStyle}
              value={tagInput}
              onChange={(e) => {
                const v = e.target.value;
                if (v.endsWith(',')) commitTag(v.slice(0, -1));
                else setTagInput(v);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); commitTag(tagInput); }
                if (e.key === 'Backspace' && !tagInput && tags.length) removeTag(tags[tags.length - 1]);
              }}
              onBlur={() => { if (tagInput.trim()) commitTag(tagInput); }}
              placeholder={t('journal.tagsPlaceholder')}
            />
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => { setTags([...tags, s]); setTagInput(''); }} className="rounded-full px-2 py-0.5 text-xs" style={{
                    background: 'transparent', color: C.dim, border: '1px dashed ' + C.line, cursor: 'pointer',
                  }}>+ {s}</button>
                ))}
              </div>
            )}
          </Field>

          <Field label={t('journal.fieldVideo')}>
            <input style={inputStyle} value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://youtube.com/watch?v=…" />
          </Field>

          <div className="flex gap-2 mt-2 flex-wrap">
            <Btn color={C.gold} onClick={save}>{t('journal.saveNote')}</Btn>
            <Btn ghost onClick={onCancel}>{t('common.cancel')}</Btn>
            {existing && (
              confirmDelete ? (
                <Btn color={C.red} onClick={() => onDelete(existing.id)}>{t('journal.deleteConfirm')}</Btn>
              ) : (
                <Btn ghost color={C.red} onClick={() => setConfirmDelete(true)}>{t('common.delete')}</Btn>
              )
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
