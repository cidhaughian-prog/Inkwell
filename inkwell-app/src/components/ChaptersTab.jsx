import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

const STATUSES = ['Outline', 'Draft', 'Revising', 'Final']
const MAX_CHAPTERS = 100

function wordCount(text) {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

export default function ChaptersTab({ bookId, characters }) {
  const [chapters, setChapters] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState('')
  const [outlineDraft, setOutlineDraft] = useState('')
  const [saveState, setSaveState] = useState('')

  useEffect(() => { load() }, [bookId])

  async function load() {
    const { data } = await supabase.from('chapters').select('*').eq('book_id', bookId).order('number')
    setChapters(data || [])
    if (data && data.length && !selectedId) selectChapter(data[0])
  }

  function selectChapter(ch) {
    setSelectedId(ch.id)
    setDraft(ch.content || '')
    setOutlineDraft(ch.outline || '')
  }

  async function addChapter() {
    if (chapters.length >= MAX_CHAPTERS) return
    const nextNum = (chapters[chapters.length - 1]?.number || 0) + 1
    const { data } = await supabase.from('chapters').insert({ book_id: bookId, number: nextNum, title: `Chapter ${nextNum}`, status: 'Outline' }).select().single()
    if (data) {
      const next = [...chapters, data]
      setChapters(next)
      selectChapter(data)
    }
  }

  async function updateField(field, value) {
    setChapters((cs) => cs.map((c) => (c.id === selectedId ? { ...c, [field]: value } : c)))
    await supabase.from('chapters').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', selectedId)
  }

  async function saveContent() {
    setSaveState('Saving...')
    await supabase.from('chapters').update({ content: draft, outline: outlineDraft, updated_at: new Date().toISOString() }).eq('id', selectedId)
    setChapters((cs) => cs.map((c) => (c.id === selectedId ? { ...c, content: draft, outline: outlineDraft } : c)))
    setSaveState('Saved')
    setTimeout(() => setSaveState(''), 1500)
  }

  async function deleteChapter(id) {
    if (!confirm('Delete this chapter?')) return
    await supabase.from('chapters').delete().eq('id', id)
    const next = chapters.filter((c) => c.id !== id)
    setChapters(next)
    if (next.length) selectChapter(next[0])
    else setSelectedId(null)
  }

  const selected = chapters.find((c) => c.id === selectedId)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
      <div className="card p-4 h-fit max-h-[75vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="font-ui text-xs text-ink-600">{chapters.length}/{MAX_CHAPTERS}</span>
          <button onClick={addChapter} disabled={chapters.length >= MAX_CHAPTERS} className="btn-primary font-ui text-xs px-3 py-1.5 rounded-lg disabled:opacity-30">+ Add chapter</button>
        </div>
        <div className="space-y-1">
          {chapters.map((c) => (
            <button
              key={c.id}
              onClick={() => selectChapter(c)}
              className={`w-full text-left px-3 py-2 rounded-lg font-body transition-colors ${
                selectedId === c.id ? 'bg-blood-700/30 text-gilt-300' : 'text-ink-600 hover:bg-ink-800'
              }`}
            >
              <span className="block text-base">{c.number}. {c.title || 'Untitled'}</span>
              <span className="font-ui text-[10px] uppercase tracking-widest opacity-60">{c.status} · {wordCount(c.content)}w</span>
            </button>
          ))}
        </div>
      </div>

      {selected ? (
        <div className="card p-8 space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            <input
              className="flex-1 font-serif text-2xl bg-transparent border-none px-0 focus:ring-0"
              value={selected.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
            />
            <select className="font-ui text-xs px-3 py-1.5 rounded-full" value={selected.status || 'Draft'} onChange={(e) => updateField('status', e.target.value)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select className="font-ui text-xs px-3 py-1.5 rounded-full" value={selected.pov_character || ''} onChange={(e) => updateField('pov_character', e.target.value)}>
              <option value="">POV: none set</option>
              {characters.map((c) => <option key={c.id} value={c.name}>POV: {c.name}</option>)}
            </select>
            <button onClick={() => deleteChapter(selected.id)} className="btn-ghost font-ui text-xs px-3 py-1.5 rounded-lg text-blood-400">Delete</button>
          </div>

          <div>
            <label>Outline / beat plan</label>
            <textarea className="w-full px-3 py-2 mt-1 font-body text-base" rows={3} value={outlineDraft} onChange={(e) => setOutlineDraft(e.target.value)} placeholder="What happens in this chapter, beat by beat" />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label>Prose</label>
              <span className="font-ui text-[10px] text-ink-600 opacity-60">{wordCount(draft)} words</span>
            </div>
            <textarea
              className="w-full px-4 py-3 mt-1 font-body text-lg leading-relaxed"
              rows={22}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write the chapter here..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button onClick={saveContent} className="btn-primary font-ui text-sm px-5 py-2 rounded-lg">Save chapter</button>
            <span className="font-ui text-xs text-gilt-400">{saveState}</span>
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center font-ui text-ink-600">No chapters yet — add your first one.</div>
      )}
    </div>
  )
}
