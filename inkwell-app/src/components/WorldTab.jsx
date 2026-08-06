import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

const CATEGORIES = ['Setting', 'Rules / Magic / World Logic', 'Factions & Groups', 'Themes & Motifs', 'Research', 'General']

export default function WorldTab({ bookId }) {
  const [notes, setNotes] = useState([])

  useEffect(() => { load() }, [bookId])

  async function load() {
    const { data } = await supabase.from('world_notes').select('*').eq('book_id', bookId).order('created_at')
    setNotes(data || [])
  }

  async function addNote() {
    const { data } = await supabase.from('world_notes').insert({ book_id: bookId, category: 'General', title: 'New note' }).select().single()
    if (data) setNotes((n) => [...n, data])
  }

  async function updateNote(id, field, value) {
    await supabase.from('world_notes').update({ [field]: value }).eq('id', id)
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, [field]: value } : n)))
  }

  async function removeNote(id) {
    await supabase.from('world_notes').delete().eq('id', id)
    setNotes((n) => n.filter((x) => x.id !== id))
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-xl text-gilt-300">World, rules & themes</h3>
        <button onClick={addNote} className="btn-primary font-ui text-sm px-4 py-2 rounded-lg">+ Add note</button>
      </div>
      <div className="space-y-4">
        {notes.map((n) => (
          <div key={n.id} className="bg-ink-850/50 rounded-lg p-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <select className="text-xs px-2 py-1" value={n.category || 'General'} onChange={(e) => updateNote(n.id, 'category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input className="flex-1 px-2 py-1.5 font-serif text-lg" placeholder="Title" value={n.title || ''} onChange={(e) => updateNote(n.id, 'title', e.target.value)} />
              <button onClick={() => removeNote(n.id)} className="font-ui text-xs text-blood-400 opacity-60 hover:opacity-100 px-1">✕</button>
            </div>
            <textarea className="w-full px-3 py-2 font-body text-base" rows={3} value={n.content || ''} onChange={(e) => updateNote(n.id, 'content', e.target.value)} />
          </div>
        ))}
        {notes.length === 0 && <p className="font-ui text-sm text-ink-600 opacity-60">No world-building notes yet.</p>}
      </div>
    </div>
  )
}
