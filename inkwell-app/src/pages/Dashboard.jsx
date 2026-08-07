import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import { PALETTE } from '../lib/palette.js'

const STATUS_COLORS = {
  Idea: 'text-gilt-400 border-gilt-500/40',
  Drafting: 'text-blood-400 border-blood-500/40',
  Revising: 'text-amber-300 border-amber-400/40',
  Complete: 'text-emerald-300 border-emerald-400/40',
}

function ColorPickerPopover({ value, onChange, onClose }) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute z-10 top-10 right-3 card p-3 w-56 shadow-glow"
      style={{ background: '#181022' }}
    >
      <div className="flex flex-wrap items-center gap-2">
        {PALETTE.map((c) => (
          <button
            key={c.hex}
            onClick={() => onChange(c.hex)}
            title={c.name}
            className="w-6 h-6 rounded-full"
            style={{
              backgroundColor: c.hex,
              outline: value === c.hex ? '2px solid #ede4e0' : 'none',
              outlineOffset: '2px',
            }}
          />
        ))}
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} title="Pick any exact color" />
      </div>
      <button onClick={onClose} className="font-ui text-[10px] text-ink-600 opacity-70 hover:opacity-100 mt-2">Done</button>
    </div>
  )
}

export default function Dashboard() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newColor, setNewColor] = useState(PALETTE[0].hex)
  const [editingColorId, setEditingColorId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { loadBooks() }, [])

  async function loadBooks() {
    setLoading(true)
    const { data, error } = await supabase.from('books').select('*').order('updated_at', { ascending: false })
    if (!error) setBooks(data || [])
    setLoading(false)
  }

  async function createBook() {
    const title = newTitle.trim() || 'Untitled Book'
    const { data, error } = await supabase.from('books').insert({ title, accent_color: newColor }).select().single()
    if (!error && data) {
      navigate(`/book/${data.id}`)
    }
  }

  async function updateBookColor(bookId, color) {
    setBooks((bs) => bs.map((b) => (b.id === bookId ? { ...b, accent_color: color } : b)))
    await supabase.from('books').update({ accent_color: color }).eq('id', bookId)
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <div className="flex items-end justify-between mb-12 border-b border-gilt-500/15 pb-6">
        <div>
          <h1 className="font-serif text-5xl text-gilt-300 tracking-wide">Inkwell</h1>
          <p className="font-ui text-sm text-ink-600 text-opacity-80 mt-2 tracking-wide">your shelf of dark things not yet written</p>
        </div>
        <button
          className="btn-primary font-ui px-5 py-2.5 rounded-lg text-sm"
          onClick={() => setCreating(true)}
        >
          + Start a new book
        </button>
      </div>

      {creating && (
        <div className="card p-6 mb-10 space-y-4">
          <div className="flex items-center gap-4">
            <input
              autoFocus
              className="flex-1 px-4 py-2.5 font-serif text-lg"
              placeholder="Working title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createBook()}
            />
          </div>
          <div>
            <label>Pick a cover color to tell this book apart on your shelf</label>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {PALETTE.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setNewColor(c.hex)}
                  title={c.name}
                  className="w-8 h-8 rounded-full transition-transform"
                  style={{
                    backgroundColor: c.hex,
                    outline: newColor === c.hex ? '2px solid #ede4e0' : 'none',
                    outlineOffset: '2px',
                    transform: newColor === c.hex ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
              <span className="w-px h-6 bg-gilt-500/20 mx-1" />
              <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} title="Pick any exact color" />
              <span className="font-ui text-[11px] text-ink-600 opacity-60">or pick any exact shade</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-primary font-ui px-4 py-2 rounded-lg text-sm" onClick={createBook}>Create</button>
            <button className="btn-ghost font-ui px-4 py-2 rounded-lg text-sm" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="font-ui text-ink-600">Loading your shelf...</p>
      ) : books.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-serif text-xl text-ink-600 mb-2">The shelf is empty.</p>
          <p className="font-ui text-sm text-ink-600 opacity-70">Every dark idea has to start somewhere. Start your first book above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((b) => {
            const accent = b.accent_color || '#c8324a'
            return (
              <div key={b.id} className="relative">
                <button
                  onClick={() => navigate(`/book/${b.id}`)}
                  className="card text-left hover:shadow-glow transition-all group overflow-hidden w-full"
                  style={{
                    borderColor: `${accent}55`,
                    backgroundColor: accent,
                    backgroundImage: 'linear-gradient(160deg, rgba(0,0,0,0.15), rgba(0,0,0,0.55))',
                  }}
                >
                  <div className="p-6 min-h-[180px] flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`font-ui text-[10px] uppercase tracking-widest border rounded-full px-2 py-0.5 bg-ink-950/40 ${STATUS_COLORS[b.status] || 'text-ink-100 border-ink-100/40'}`}>
                        {b.status || 'Idea'}
                      </span>
                      {b.series_name && (
                        <span className="font-ui text-[10px] text-ink-100 opacity-80">{b.series_name} {b.book_number ? `#${b.book_number}` : ''}</span>
                      )}
                    </div>
                    <h2 className="font-serif text-2xl text-white drop-shadow mb-2">{b.title}</h2>
                    <p className="font-ui text-xs text-white/80">{b.genre || 'Dark Romance'}</p>
                    {b.blurb && <p className="font-body text-sm text-white/80 mt-3 line-clamp-3">{b.blurb}</p>}
                  </div>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingColorId(editingColorId === b.id ? null : b.id) }}
                  title="Change cover color"
                  className="absolute top-3 right-3 w-6 h-6 rounded-full border-2 border-white/70 shadow"
                  style={{ backgroundColor: accent }}
                />
                {editingColorId === b.id && (
                  <ColorPickerPopover
                    value={accent}
                    onChange={(c) => updateBookColor(b.id, c)}
                    onClose={() => setEditingColorId(null)}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
