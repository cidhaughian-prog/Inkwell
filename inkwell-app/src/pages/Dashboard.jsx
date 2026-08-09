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

const IMAGE_BUCKET = 'app-images'

function ColorPickerPopover({ value, onChange, onClose }) {
  return (
    <div onClick={(e) => e.stopPropagation()} className="absolute z-10 top-10 right-3 card p-3 w-56 max-w-[85vw] shadow-glow" style={{ background: '#181022' }}>
      <div className="flex flex-wrap items-center gap-2">
        {PALETTE.map((c) => (
          <button
            key={c.hex}
            onClick={() => onChange(c.hex)}
            title={c.name}
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: c.hex, outline: value === c.hex ? '2px solid #ede4e0' : 'none', outlineOffset: '2px' }}
          />
        ))}
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} title="Pick any exact color" />
      </div>
      <button onClick={onClose} className="font-ui text-[10px] text-ink-600 opacity-70 hover:opacity-100 mt-2">Done</button>
    </div>
  )
}

function ShelfSettingsPanel({ settings, onUpdate, onClose }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const bg = settings.background_color || '#0a0710'

  async function handlePhoto(file) {
    if (!file) return
    setError('')
    setUploading(true)
    const oldPath = settings.background_path
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
    const path = `shelf/${Date.now()}-${safeName}`
    const { error: upErr } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file)
    if (upErr) {
      setError(`Couldn't upload: ${upErr.message}. Make sure you ran supabase_migration_v5_settings.sql.`)
      setUploading(false)
      return
    }
    const { data: pub } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path)
    await onUpdate({ background_url: pub.publicUrl, background_path: path })
    if (oldPath) await supabase.storage.from(IMAGE_BUCKET).remove([oldPath])
    setUploading(false)
  }

  async function removePhoto() {
    if (settings.background_path) await supabase.storage.from(IMAGE_BUCKET).remove([settings.background_path])
    await onUpdate({ background_url: null, background_path: null })
  }

  return (
    <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-ui text-xs uppercase tracking-widest text-gilt-400">Shelf look</span>
        <button onClick={onClose} className="font-ui text-xs text-ink-600 hover:text-gilt-300">✕</button>
      </div>

      <div className="mb-4">
        <label>Background color</label>
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          {PALETTE.map((c) => (
            <button
              key={c.hex}
              onClick={() => onUpdate({ background_color: c.hex })}
              title={c.name}
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: c.hex, outline: bg === c.hex ? '2px solid #ede4e0' : 'none', outlineOffset: '2px' }}
            />
          ))}
          <input type="color" value={bg} onChange={(e) => onUpdate({ background_color: e.target.value })} title="Pick any exact color" />
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <label>Background photo (optional)</label>
          <div className="flex gap-1.5">
            <label className="btn-ghost font-ui text-[10px] px-2 py-1 rounded cursor-pointer">
              {uploading ? 'Uploading...' : settings.background_url ? 'Replace' : 'Upload'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(e.target.files[0])} />
            </label>
            {settings.background_url && <button onClick={removePhoto} className="btn-ghost font-ui text-[10px] px-2 py-1 rounded text-blood-400">Remove</button>}
          </div>
        </div>
        {error && <p className="font-ui text-xs text-blood-400">{error}</p>}
        {settings.background_url && (
          <img src={settings.background_url} alt="" className="w-full h-20 object-cover rounded-lg border border-gilt-500/15" />
        )}
      </div>

      <div>
        <label>Text color</label>
        <div className="flex gap-2 mt-1.5">
          <button
            onClick={() => onUpdate({ text_mode: 'light' })}
            className={`font-ui text-xs px-3 py-1 rounded-full border ${(settings.text_mode || 'light') === 'light' ? 'border-gilt-400 text-gilt-300 bg-ink-800' : 'border-gilt-500/20 text-ink-600 opacity-70'}`}
          >Light</button>
          <button
            onClick={() => onUpdate({ text_mode: 'dark' })}
            className={`font-ui text-xs px-3 py-1 rounded-full border ${settings.text_mode === 'dark' ? 'border-gilt-400 text-gilt-300 bg-ink-800' : 'border-gilt-500/20 text-ink-600 opacity-70'}`}
          >Dark</button>
        </div>
      </div>
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
  const [settings, setSettings] = useState({})
  const [settingsOpen, setSettingsOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { loadBooks(); loadSettings() }, [])

  async function currentUserId() {
    const { data } = await supabase.auth.getUser()
    return data?.user?.id
  }

  async function loadBooks() {
    setLoading(true)
    const { data, error } = await supabase.from('books').select('*').order('updated_at', { ascending: false })
    if (!error) setBooks(data || [])
    setLoading(false)
  }

  async function loadSettings() {
    const uid = await currentUserId()
    if (!uid) return
    const { data } = await supabase.from('app_settings').select('*').eq('user_id', uid).maybeSingle()
    setSettings(data || {})
  }

  async function updateSettings(fields) {
    const uid = await currentUserId()
    if (!uid) return
    setSettings((s) => ({ ...s, ...fields }))
    await supabase.from('app_settings').upsert({ user_id: uid, ...fields }, { onConflict: 'user_id' })
  }

  async function logOut() {
    await supabase.auth.signOut()
  }

  async function createBook() {
    const uid = await currentUserId()
    const title = newTitle.trim() || 'Untitled Book'
    const { data, error } = await supabase.from('books').insert({ title, accent_color: newColor, user_id: uid }).select().single()
    if (!error && data) {
      navigate(`/book/${data.id}`)
    }
  }

  async function updateBookColor(bookId, color) {
    setBooks((bs) => bs.map((b) => (b.id === bookId ? { ...b, accent_color: color } : b)))
    await supabase.from('books').update({ accent_color: color }).eq('id', bookId)
  }

  async function deleteBook(book) {
    const ok = confirm(`Delete "${book.title || 'this book'}" for good? This removes its characters, chapters, and everything else in it. This can't be undone.`)
    if (!ok) return
    setBooks((bs) => bs.filter((b) => b.id !== book.id))
    setEditingColorId(null)
    await supabase.from('books').delete().eq('id', book.id)
  }

  const isDarkText = settings.text_mode === 'dark'
  const shelfStyle = settings.background_url
    ? {
        backgroundImage: `linear-gradient(rgba(10,7,16,0.55), rgba(10,7,16,0.8)), url(${settings.background_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }
    : { '--shelf-bg': settings.background_color || '#0a0710' }

  return (
    <div className={`min-h-screen shelf-theme ${isDarkText ? 'text-dark' : ''}`} style={shelfStyle}>
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-12 border-b border-gilt-500/15 pb-6">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-gilt-300 tracking-wide">Inkwell</h1>
            <p className="font-ui text-xs sm:text-sm text-ink-600 text-opacity-80 mt-2 tracking-wide">your shelf of dark things not yet written</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 relative">
            <button className="btn-primary font-ui px-4 sm:px-5 py-2.5 rounded-lg text-sm" onClick={() => setCreating(true)}>
              + Start a new book
            </button>
            <button onClick={() => setSettingsOpen((v) => !v)} title="Shelf look settings" className="gear-btn">⚙</button>
            {settingsOpen && (
              <ShelfSettingsPanel settings={settings} onUpdate={updateSettings} onClose={() => setSettingsOpen(false)} />
            )}
            <button onClick={logOut} title="Log out" className="btn-ghost font-ui text-xs px-3 py-2 rounded-lg">Log out</button>
          </div>
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
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
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
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteBook(b) }}
                    title="Delete book"
                    className="absolute top-3 right-11 w-6 h-6 rounded-full border-2 border-white/70 shadow bg-ink-950/70 text-white/90 hover:bg-blood-700 hover:border-blood-300 flex items-center justify-center text-xs leading-none"
                  >✕</button>
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
    </div>
  )
}
