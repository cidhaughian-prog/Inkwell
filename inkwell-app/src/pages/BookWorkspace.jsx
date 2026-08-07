import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import { PALETTE } from '../lib/palette.js'
import { FONT_OPTIONS } from '../lib/fonts.js'
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

function ColorRow({ label, value, fallback, onChange }) {
  return (
    <div className="mb-4">
      <label>{label}</label>
      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
        {PALETTE.map((c) => (
          <button
            key={c.hex}
            onClick={() => onChange(c.hex)}
            title={c.name}
            className="w-6 h-6 rounded-full"
            style={{
              backgroundColor: c.hex,
              outline: (value || fallback) === c.hex ? '2px solid #ede4e0' : 'none',
              outlineOffset: '2px',
            }}
          />
        ))}
        <input type="color" value={value || fallback} onChange={(e) => onChange(e.target.value)} title="Pick any exact color" />
      </div>
    </div>
  )
}

function TextModeToggle({ label, value, onChange }) {
  return (
    <div className="mb-4">
      <label>{label}</label>
      <div className="flex gap-2 mt-1.5">
        <button
          onClick={() => onChange('light')}
          className={`font-ui text-xs px-3 py-1 rounded-full border ${(value || 'light') === 'light' ? 'border-gilt-400 text-gilt-300 bg-ink-800' : 'border-gilt-500/20 text-ink-600 opacity-70'}`}
        >Light</button>
        <button
          onClick={() => onChange('dark')}
          className={`font-ui text-xs px-3 py-1 rounded-full border ${value === 'dark' ? 'border-gilt-400 text-gilt-300 bg-ink-800' : 'border-gilt-500/20 text-ink-600 opacity-70'}`}
        >Dark</button>
      </div>
    </div>
  )
}

function BookSettingsPanel({ book, onUpdate, onClose }) {
  return (
    <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-ui text-xs uppercase tracking-widest text-gilt-400">Book look</span>
        <button onClick={onClose} className="font-ui text-xs text-ink-600 hover:text-gilt-300">✕</button>
      </div>
      <ColorRow label="Shelf cover color" value={book.accent_color} fallback="#c8324a" onChange={(v) => onUpdate('accent_color', v)} />
      <ColorRow label="Book background color" value={book.workspace_color} fallback="#150e1f" onChange={(v) => onUpdate('workspace_color', v)} />
      <TextModeToggle label="Text color (chapters, characters, everything else)" value={book.text_mode} onChange={(v) => onUpdate('text_mode', v)} />
      <TextModeToggle label="Title text color (separate from the rest)" value={book.title_text_mode} onChange={(v) => onUpdate('title_text_mode', v)} />
      <div>
        <label>Title & heading font</label>
        <select
          className="w-full px-2 py-1.5 mt-1.5 font-ui text-sm"
          value={book.font_family || 'Playfair Display'}
          onChange={(e) => onUpdate('font_family', e.target.value)}
        >
          {FONT_OPTIONS.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
        </select>
        <p className="font-ui text-[10px] text-ink-600 opacity-60 mt-1">Chapter prose stays in the regular reading font no matter what — this only changes titles and headings.</p>
      </div>
    </div>
  )
}

export default function BookWorkspace() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [tab, setTab] = useState('info')
  const [characters, setCharacters] = useState([])
  const [settingsOpen, setSettingsOpen] = useState(false)

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

  const accent = book.accent_color || '#c8324a'
  const isDarkText = book.text_mode === 'dark'
  const isTitleDark = book.title_text_mode === 'dark'
  const font = FONT_OPTIONS.find((f) => f.name === book.font_family) || FONT_OPTIONS[0]
  const panelBg = isDarkText
    ? 'linear-gradient(160deg, rgba(255,255,255,0.55), rgba(255,255,255,0.72))'
    : 'linear-gradient(160deg, rgba(0,0,0,0.28), rgba(0,0,0,0.48))'

  const pageStyle = {
    '--book-bg': book.workspace_color || '#150e1f',
    '--book-panel-bg': panelBg,
    '--book-font': font.stack,
  }

  return (
    <div className={`min-h-screen book-theme ${isDarkText ? 'text-dark' : ''}`} style={pageStyle}>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/')} className="font-ui text-xs text-gilt-400 opacity-70 hover:opacity-100 tracking-wide">&larr; Back to shelf</button>
        </div>

        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: accent }} />
            <input
              className="font-serif text-4xl bg-transparent border-none px-0 focus:ring-0 focus:shadow-none"
              style={{ background: 'transparent', color: isTitleDark ? '#241a2c' : '#e8cf9f', fontFamily: font.stack }}
              value={book.title || ''}
              onChange={(e) => updateBookField('title', e.target.value)}
              onBlur={(e) => updateBookField('title', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 relative">
            <select
              className="font-ui text-xs px-3 py-1.5 rounded-full"
              value={book.status || 'Idea'}
              onChange={(e) => updateBookField('status', e.target.value)}
            >
              {['Idea', 'Drafting', 'Revising', 'Complete'].map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => setSettingsOpen((v) => !v)} title="Book look settings" className="gear-btn">⚙</button>
            {settingsOpen && (
              <BookSettingsPanel book={book} onUpdate={updateBookField} onClose={() => setSettingsOpen(false)} />
            )}
          </div>
        </div>

        <div className="flex gap-1 mb-8 border-b border-gilt-500/15 overflow-x-auto font-ui">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors"
              style={{
                borderColor: tab === t.key ? accent : 'transparent',
                color: tab === t.key ? '#e8cf9f' : undefined,
                opacity: tab === t.key ? 1 : 0.7,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'info' && <BookInfoTab book={book} onUpdate={updateBookField} />}
        {tab === 'characters' && <CharactersTab bookId={id} onCharactersChange={loadCharacters} />}
        {tab === 'plot' && <PlotArcTab bookId={id} />}
        {tab === 'chapters' && <ChaptersTab bookId={id} characters={characters} />}
        {tab === 'dump' && <BrainDumpTab bookId={id} characters={characters} onCharactersChange={loadCharacters} />}
        {tab === 'world' && <WorldTab bookId={id} />}
        {tab === 'timeline' && <TimelineTab bookId={id} />}
      </div>
    </div>
  )
}
