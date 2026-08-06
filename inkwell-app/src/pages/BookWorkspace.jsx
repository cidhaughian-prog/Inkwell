import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import BookInfoTab from '../components/BookInfoTab.jsx'
import CharactersTab from '../components/CharactersTab.jsx'
import PlotArcTab from '../components/PlotArcTab.jsx'
import ChaptersTab from '../components/ChaptersTab.jsx'
import BrainDumpTab from '../components/BrainDumpTab.jsx'
import WorldTab from '../components/WorldTab.jsx'
import TimelineTab from '../components/TimelineTab.jsx'

const TABS = [
  { key: 'info', label: 'Book Info' },
  { key: 'characters', label: 'Characters' },
  { key: 'plot', label: 'Plot Arc' },
  { key: 'chapters', label: 'Chapters' },
  { key: 'dump', label: 'Brain Dump' },
  { key: 'world', label: 'World & Themes' },
  { key: 'timeline', label: 'Timeline' },
]

export default function BookWorkspace() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [tab, setTab] = useState('info')
  const [characters, setCharacters] = useState([])

  const loadBook = useCallback(async () => {
    const { data } = await supabase.from('books').select('*').eq('id', id).single()
    setBook(data)
  }, [id])

  const loadCharacters = useCallback(async () => {
    const { data } = await supabase.from('characters').select('id,name').eq('book_id', id).order('name')
    setCharacters(data || [])
  }, [id])

  useEffect(() => { loadBook(); loadCharacters() }, [loadBook, loadCharacters])

  async function updateBookField(field, value) {
    setBook((b) => ({ ...b, [field]: value }))
    await supabase.from('books').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', id)
  }

  if (!book) return <div className="max-w-6xl mx-auto px-6 py-14 font-ui text-ink-600">Opening book...</div>

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/')} className="font-ui text-xs text-gilt-400 opacity-70 hover:opacity-100 tracking-wide">&larr; Back to shelf</button>
      </div>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <input
          className="font-serif text-4xl text-gilt-300 bg-transparent border-none px-0 focus:ring-0 focus:shadow-none"
          value={book.title || ''}
          onChange={(e) => updateBookField('title', e.target.value)}
          onBlur={(e) => updateBookField('title', e.target.value)}
        />
        <select
          className="font-ui text-xs px-3 py-1.5 rounded-full"
          value={book.status || 'Idea'}
          onChange={(e) => updateBookField('status', e.target.value)}
        >
          {['Idea', 'Drafting', 'Revising', 'Complete'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex gap-1 mb-8 border-b border-gilt-500/15 overflow-x-auto font-ui">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
              tab === t.key ? 'border-blood-500 text-gilt-300' : 'border-transparent text-ink-600 opacity-70 hover:opacity-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' && <BookInfoTab book={book} onUpdate={updateBookField} />}
      {tab === 'characters' && <CharactersTab bookId={id} onCharactersChange={loadCharacters} />}
      {tab === 'plot' && <PlotArcTab bookId={id} />}
      {tab === 'chapters' && <ChaptersTab bookId={id} characters={characters} />}
      {tab === 'dump' && <BrainDumpTab bookId={id} characters={characters} />}
      {tab === 'world' && <WorldTab bookId={id} />}
      {tab === 'timeline' && <TimelineTab bookId={id} />}
    </div>
  )
}
