import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

export default function TimelineTab({ bookId }) {
  const [events, setEvents] = useState([])

  useEffect(() => { load() }, [bookId])

  async function load() {
    const { data } = await supabase.from('timeline_events').select('*').eq('book_id', bookId).order('order_index')
    setEvents(data || [])
  }

  async function addEvent() {
    const { data } = await supabase.from('timeline_events').insert({ book_id: bookId, order_index: events.length, title: 'New event' }).select().single()
    if (data) setEvents((e) => [...e, data])
  }

  async function updateEvent(id, field, value) {
    await supabase.from('timeline_events').update({ [field]: value }).eq('id', id)
    setEvents((es) => es.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  async function removeEvent(id) {
    await supabase.from('timeline_events').delete().eq('id', id)
    setEvents((e) => e.filter((x) => x.id !== id))
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-serif text-xl text-gilt-300">Timeline & continuity</h3>
          <p className="font-ui text-xs text-ink-600 opacity-60">keep dates, ages, and "who knew what when" straight</p>
        </div>
        <button onClick={addEvent} className="btn-primary font-ui text-sm px-4 py-2 rounded-lg">+ Add event</button>
      </div>
      <div className="space-y-3">
        {events.map((e) => (
          <div key={e.id} className="grid grid-cols-1 md:grid-cols-[120px_1fr_2fr_auto] gap-2 items-start bg-ink-850/50 rounded-lg p-3">
            <input className="px-2 py-1.5 text-sm" placeholder="Day 1 / age 19..." value={e.date_label || ''} onChange={(ev) => updateEvent(e.id, 'date_label', ev.target.value)} />
            <input className="px-2 py-1.5 text-sm font-body" placeholder="Event title" value={e.title || ''} onChange={(ev) => updateEvent(e.id, 'title', ev.target.value)} />
            <input className="px-2 py-1.5 text-sm font-body" placeholder="Description" value={e.description || ''} onChange={(ev) => updateEvent(e.id, 'description', ev.target.value)} />
            <button onClick={() => removeEvent(e.id)} className="font-ui text-xs text-blood-400 opacity-60 hover:opacity-100 px-1">✕</button>
          </div>
        ))}
        {events.length === 0 && <p className="font-ui text-sm text-ink-600 opacity-60">No timeline events yet.</p>}
      </div>
    </div>
  )
}
