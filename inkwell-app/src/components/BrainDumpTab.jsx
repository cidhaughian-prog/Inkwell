import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'
import { generateSuggestions } from '../lib/suggestionEngine.js'

export default function BrainDumpTab({ bookId, characters }) {
  const [current, setCurrent] = useState('')
  const [archived, setArchived] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [chapters, setChapters] = useState([])
  const [plotPoints, setPlotPoints] = useState([])
  const [worldNotes, setWorldNotes] = useState([])
  const [feedback, setFeedback] = useState('')

  useEffect(() => { loadArchived(); loadContext() }, [bookId])

  async function loadArchived() {
    const { data } = await supabase.from('brain_dumps').select('*').eq('book_id', bookId).order('created_at', { ascending: false })
    setArchived(data || [])
  }

  async function loadContext() {
    const [ch, pp, wn] = await Promise.all([
      supabase.from('chapters').select('id,number,title').eq('book_id', bookId),
      supabase.from('plot_points').select('id,title').eq('book_id', bookId),
      supabase.from('world_notes').select('id,title').eq('book_id', bookId),
    ])
    setChapters(ch.data || [])
    setPlotPoints(pp.data || [])
    setWorldNotes(wn.data || [])
  }

  function analyze() {
    const s = generateSuggestions(current, { characters, chapters, plotPoints, worldNotes })
    setSuggestions(s)
    if (s.length === 0) setFeedback('No obvious matches found — that just means this idea is new territory. Archive it and route it manually if needed.')
    else setFeedback('')
  }

  async function acceptSuggestion(s) {
    const stamp = `\n\n— from brain dump (${new Date().toLocaleDateString()}):\n${current}`;
    if (s.type === 'character') {
      const { data } = await supabase.from('characters').select('notes').eq('id', s.id).single()
      await supabase.from('characters').update({ notes: (data?.notes || '') + stamp }).eq('id', s.id)
    } else if (s.type === 'chapter') {
      const { data } = await supabase.from('chapters').select('outline').eq('id', s.id).single()
      await supabase.from('chapters').update({ outline: (data?.outline || '') + stamp }).eq('id', s.id)
    } else if (s.type === 'plot') {
      const { data } = await supabase.from('plot_points').select('notes').eq('id', s.id).single()
      await supabase.from('plot_points').update({ notes: (data?.notes || '') + stamp }).eq('id', s.id)
    } else if (s.type === 'world') {
      const { data } = await supabase.from('world_notes').select('content').eq('id', s.id).single()
      await supabase.from('world_notes').update({ content: (data?.content || '') + stamp }).eq('id', s.id)
    }
    setFeedback(`Added to ${s.label}.`)
  }

  async function archiveAndClear() {
    if (!current.trim()) return
    await supabase.from('brain_dumps').insert({ book_id: bookId, content: current, archived: true })
    setCurrent('')
    setSuggestions([])
    setFeedback('Archived. Fresh page below.')
    loadArchived()
  }

  async function deleteArchived(id) {
    await supabase.from('brain_dumps').delete().eq('id', id)
    setArchived((a) => a.filter((x) => x.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-serif text-xl text-gilt-300">Chaos page</h3>
          <span className="font-ui text-[10px] text-ink-600 opacity-60">write whatever, however it comes out</span>
        </div>
        <textarea
          className="w-full px-4 py-3 font-body text-lg leading-relaxed"
          rows={12}
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="Dump the scene, the line of dialogue, the random 2am thought — whatever it is..."
        />
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button onClick={analyze} disabled={!current.trim()} className="btn-ghost font-ui text-sm px-4 py-2 rounded-lg disabled:opacity-30">Suggest where this goes</button>
          <button onClick={archiveAndClear} disabled={!current.trim()} className="btn-primary font-ui text-sm px-4 py-2 rounded-lg disabled:opacity-30">Archive & start fresh page</button>
          {feedback && <span className="font-ui text-xs text-gilt-400">{feedback}</span>}
        </div>

        {suggestions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => acceptSuggestion(s)} className="font-ui text-xs px-3 py-1.5 rounded-full border border-gilt-500/30 text-gilt-300 hover:bg-blood-700/20">
                + {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-serif text-xl text-gilt-300 mb-3">Archived pages ({archived.length})</h3>
        <div className="space-y-3">
          {archived.map((a) => (
            <div key={a.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-ui text-[10px] uppercase tracking-widest text-ink-600 opacity-60">{new Date(a.created_at).toLocaleString()}</span>
                <button onClick={() => deleteArchived(a.id)} className="font-ui text-xs text-blood-400 opacity-60 hover:opacity-100">✕</button>
              </div>
              <p className="font-body text-base whitespace-pre-wrap text-ink-600 opacity-90">{a.content}</p>
            </div>
          ))}
          {archived.length === 0 && <p className="font-ui text-sm text-ink-600 opacity-60">Nothing archived yet.</p>}
        </div>
      </div>
    </div>
  )
}
