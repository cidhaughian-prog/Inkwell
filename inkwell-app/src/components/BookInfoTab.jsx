import { useState } from 'react'
import { supabase } from '../supabaseClient.js'
import { PALETTE } from '../lib/palette.js'

const IMAGE_BUCKET = 'book-images'

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

function ImageSlot({ label, hint, book, urlField, pathField, onUpdate }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const url = book[urlField]

  async function handleFile(file) {
    if (!file) return
    setError('')
    setUploading(true)
    const oldPath = book[pathField]
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
    const path = `${book.id}/${urlField}-${Date.now()}-${safeName}`
    const { error: upErr } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file)
    if (upErr) {
      setError(`Couldn't upload: ${upErr.message}. Make sure you ran supabase_migration_v3_book_look.sql.`)
      setUploading(false)
      return
    }
    const { data: pub } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path)
    await onUpdate(urlField, pub.publicUrl)
    await onUpdate(pathField, path)
    if (oldPath) await supabase.storage.from(IMAGE_BUCKET).remove([oldPath])
    setUploading(false)
  }

  async function remove() {
    if (book[pathField]) await supabase.storage.from(IMAGE_BUCKET).remove([book[pathField]])
    await onUpdate(urlField, null)
    await onUpdate(pathField, null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label>{label}</label>
        <div className="flex gap-2">
          <label className="btn-ghost font-ui text-[10px] px-2 py-1 rounded cursor-pointer">
            {uploading ? 'Uploading...' : url ? 'Replace' : 'Upload'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          </label>
          {url && <button onClick={remove} className="btn-ghost font-ui text-[10px] px-2 py-1 rounded text-blood-400">Remove</button>}
        </div>
      </div>
      {error && <p className="font-ui text-xs text-blood-400 mb-2">{error}</p>}
      {url ? (
        <img src={url} alt={label} className="w-full h-32 object-cover rounded-lg border border-gilt-500/15" />
      ) : (
        <div className="w-full h-20 rounded-lg border border-dashed border-gilt-500/20 flex items-center justify-center">
          <p className="font-ui text-xs text-ink-600 opacity-60">{hint}</p>
        </div>
      )}
    </div>
  )
}

export default function BookInfoTab({ book, onUpdate }) {
  return (
    <div className="card p-8 space-y-6">
      <div>
        <label>Book color — tells this book apart on your shelf and in its tabs</label>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ImageSlot
          label="Cover photo"
          hint="Shows on your shelf + at the top of this book"
          book={book}
          urlField="cover_url"
          pathField="cover_path"
          onUpdate={onUpdate}
        />
        <ImageSlot
          label="Background photo"
          hint="Faded backdrop behind this book's workspace"
          book={book}
          urlField="background_url"
          pathField="background_path"
          onUpdate={onUpdate}
        />
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
