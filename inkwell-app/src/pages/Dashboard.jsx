import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'

const STATUS_COLORS = {
  Idea: 'text-gilt-400 border-gilt-500/40',
  Drafting: 'text-blood-400 border-blood-500/40',
  Revising: 'text-amber-300 border-amber-400/40',
  Complete: 'text-emerald-300 border-emerald-400/40',
}

export default function Dashboard() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
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
    const { data, error } = await supabase.from('books').insert({ title }).select().single()
    if (!error && data) {
      navigate(`/book/${data.id}`)
    }
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
        <div className="card p-6 mb-10 flex items-center gap-4">
          <input
            autoFocus
            className="flex-1 px-4 py-2.5 font-serif text-lg"
            placeholder="Working title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createBook()}
          />
          <button className="btn-primary font-ui px-4 py-2 rounded-lg text-sm" onClick={createBook}>Create</button>
          <button className="btn-ghost font-ui px-4 py-2 rounded-lg text-sm" onClick={() => setCreating(false)}>Cancel</button>
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
          {books.map((b) => (
            <button
              key={b.id}
              onClick={() => navigate(`/book/${b.id}`)}
              className="card p-6 text-left hover:shadow-glow hover:border-blood-500/40 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`font-ui text-[10px] uppercase tracking-widest border rounded-full px-2 py-0.5 ${STATUS_COLORS[b.status] || 'text-ink-600 border-ink-600/40'}`}>
                  {b.status || 'Idea'}
                </span>
                {b.series_name && (
                  <span className="font-ui text-[10px] text-ink-600 opacity-70">{b.series_name} {b.book_number ? `#${b.book_number}` : ''}</span>
                )}
              </div>
              <h2 className="font-serif text-2xl text-gilt-300 group-hover:text-blood-400 transition-colors mb-2">{b.title}</h2>
              <p className="font-ui text-xs text-ink-600 opacity-70">{b.genre || 'Dark Romance'}</p>
              {b.blurb && <p className="font-body text-sm text-ink-600 opacity-80 mt-3 line-clamp-3">{b.blurb}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
