import { useState } from 'react'
import { PALETTE } from '../lib/palette.js'

function Field({ label, value, onSave, textarea, placeholder }) {
  const [val, setVal] = useState(value || '')
  const Tag = textarea ? 'textarea' : 'input'
  return (
    <div>
      <label>{label}</label>
      <Tag
        className="w-full px-3 py-2 mt-1 font-body text-base"
        rows={textarea ? 4 : undefined}
        value={val}
        placeholder={placeholder}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => onSave(val)}
      />
    </div>
  )
}

export default function BookInfoTab({ book, onUpdate }) {
  return (
    <div className="card p-8 space-y-6">
      <div>
        <label>Shelf cover color — how this book looks on your shelf</label>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {PALETTE.map((c) => (
            <button
              key={c.hex}
              onClick={() => onUpdate('accent_color', c.hex)}
              title={c.name}
              className="w-8 h-8 rounded-full transition-transform"
              style={{
                backgroundColor: c.hex,
                outline: (book.accent_color || '#c8324a') === c.hex ? '2px solid #ede4e0' : 'none',
                outlineOffset: '2px',
                transform: (book.accent_color || '#c8324a') === c.hex ? 'scale(1.15)' : 'scale(1)',
              }}
            />
          ))}
          <span className="w-px h-6 bg-gilt-500/20 mx-1" />
          <input
            type="color"
            value={book.accent_color || '#c8324a'}
            onChange={(e) => onUpdate('accent_color', e.target.value)}
            title="Pick any exact color"
          />
          <span className="font-ui text-[11px] text-ink-600 opacity-60">or pick any exact shade</span>
        </div>
      </div>

      <div className="border-t border-gilt-500/10 pt-6">
        <label>Book background — the actual background color inside this book (chapters, characters, everything)</label>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {PALETTE.map((c) => (
            <button
              key={c.hex}
              onClick={() => onUpdate('workspace_color', c.hex)}
              title={c.name}
              className="w-8 h-8 rounded-full transition-transform"
              style={{
                backgroundColor: c.hex,
                outline: (book.workspace_color || '#150e1f') === c.hex ? '2px solid #ede4e0' : 'none',
                outlineOffset: '2px',
                transform: (book.workspace_color || '#150e1f') === c.hex ? 'scale(1.15)' : 'scale(1)',
              }}
            />
          ))}
          <span className="w-px h-6 bg-gilt-500/20 mx-1" />
          <input
            type="color"
            value={book.workspace_color || '#150e1f'}
            onChange={(e) => onUpdate('workspace_color', e.target.value)}
            title="Pick any exact color"
          />
          <span className="font-ui text-[11px] text-ink-600 opacity-60">or pick any exact shade</span>
        </div>

        <div className="mt-4">
          <label>Text color inside this book</label>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => onUpdate('text_mode', 'light')}
              className={`font-ui text-xs px-3 py-1.5 rounded-full border ${
                (book.text_mode || 'light') === 'light' ? 'border-gilt-400 text-gilt-300 bg-ink-800' : 'border-gilt-500/20 text-ink-600 opacity-70'
              }`}
            >
              Light text
            </button>
            <button
              onClick={() => onUpdate('text_mode', 'dark')}
              className={`font-ui text-xs px-3 py-1.5 rounded-full border ${
                book.text_mode === 'dark' ? 'border-gilt-400 text-gilt-300 bg-ink-800' : 'border-gilt-500/20 text-ink-600 opacity-70'
              }`}
            >
              Dark text
            </button>
          </div>
          <p className="font-ui text-[11px] text-ink-600 opacity-60 mt-1">Pick whichever stays readable against the background color above — light text for dark backgrounds, dark text for light ones.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Field label="Series" value={book.series_name} onSave={(v) => onUpdate('series_name', v)} placeholder="e.g. Kings of Ruin" />
        <Field label="Book # in series" value={book.book_number} onSave={(v) => onUpdate('book_number', v)} placeholder="1" />
        <Field label="Genre" value={book.genre} onSave={(v) => onUpdate('genre', v)} placeholder="Dark Romance" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Tropes" value={book.tropes} onSave={(v) => onUpdate('tropes', v)} placeholder="enemies to lovers, obsession, captive..." />
        <Field label="POV structure" value={book.pov_structure} onSave={(v) => onUpdate('pov_structure', v)} placeholder="Dual POV, 1st person, present tense" />
      </div>
      <Field label="Heat level / content notes" value={book.heat_level} onSave={(v) => onUpdate('heat_level', v)} placeholder="Explicit, dubcon elements, CW: ..." />
      <Field label="Blurb / pitch" value={book.blurb} onSave={(v) => onUpdate('blurb', v)} textarea placeholder="The one-paragraph hook." />
      <Field label="Cover / mood notes" value={book.cover_note} onSave={(v) => onUpdate('cover_note', v)} textarea placeholder="Color palette, imagery, vibe references." />
    </div>
  )
}
