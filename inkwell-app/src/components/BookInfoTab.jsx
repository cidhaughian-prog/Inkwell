import { useState } from 'react'

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
