import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

const BEATS = ['Setup', 'Inciting Incident', 'Rising Action', 'Midpoint', 'Crisis', 'Climax', 'Twist', 'Resolution']

function ArcChart({ points }) {
  if (points.length === 0) {
    return <div className="font-ui text-sm text-ink-600 opacity-60 text-center py-16">Add plot points below to see your tension curve.</div>
  }
  const w = 900, h = 260, pad = 40
  const step = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0
  const coords = points.map((p, i) => {
    const x = pad + i * step
    const y = h - pad - ((Number(p.tension) || 0) / 10) * (h - pad * 2)
    return { x, y, p }
  })
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
  const gridLines = [0, 2.5, 5, 7.5, 10]

  return (
    <svg viewBox={`0 0 ${w} ${h + 50}`} className="w-full">
      {gridLines.map((g) => {
        const y = h - pad - (g / 10) * (h - pad * 2)
        return <line key={g} x1={pad} y1={y} x2={w - pad} y2={y} stroke="rgba(212,184,118,0.08)" strokeWidth="1" />
      })}
      <path d={path} fill="none" stroke="#c8324a" strokeWidth="2.5" />
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r="5" fill="#e8cf9f" stroke="#0a0710" strokeWidth="1.5" />
          <text x={c.x} y={h - pad + 22} textAnchor="middle" fontSize="10" fill="#b8974f" fontFamily="Inter, sans-serif">
            {c.p.chapter_ref || `#${i + 1}`}
          </text>
          <text x={c.x} y={c.y - 12} textAnchor="middle" fontSize="10" fill="#ede4e0" fontFamily="Inter, sans-serif" opacity="0.85">
            {c.p.title?.slice(0, 18)}
          </text>
        </g>
      ))}
    </svg>
  )
}

export default function PlotArcTab({ bookId }) {
  const [points, setPoints] = useState([])

  useEffect(() => { load() }, [bookId])

  async function load() {
    const { data } = await supabase.from('plot_points').select('*').eq('book_id', bookId).order('order_index')
    setPoints(data || [])
  }

  async function addPoint() {
    const { data } = await supabase.from('plot_points').insert({
      book_id: bookId, title: 'New beat', beat_type: 'Rising Action', tension: 5, order_index: points.length,
    }).select().single()
    if (data) setPoints((p) => [...p, data])
  }

  async function updatePoint(id, field, value) {
    await supabase.from('plot_points').update({ [field]: value }).eq('id', id)
    setPoints((ps) => ps.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  async function removePoint(id) {
    await supabase.from('plot_points').delete().eq('id', id)
    const next = points.filter((p) => p.id !== id).map((p, i) => ({ ...p, order_index: i }))
    setPoints(next)
    next.forEach((p) => supabase.from('plot_points').update({ order_index: p.order_index }).eq('id', p.id))
  }

  async function move(id, dir) {
    const idx = points.findIndex((p) => p.id === id)
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= points.length) return
    const next = [...points]
    ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
    next.forEach((p, i) => { p.order_index = i })
    setPoints(next)
    await Promise.all(next.map((p) => supabase.from('plot_points').update({ order_index: p.order_index }).eq('id', p.id)))
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="font-serif text-xl text-gilt-300 mb-4">Tension curve</h3>
        <ArcChart points={points} />
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl text-gilt-300">Plot beats</h3>
          <button onClick={addPoint} className="btn-primary font-ui text-sm px-4 py-2 rounded-lg">+ Add beat</button>
        </div>
        <div className="space-y-3">
          {points.map((p, i) => (
            <div key={p.id} className="grid grid-cols-1 md:grid-cols-[auto_1fr_140px_100px_100px_auto] gap-2 items-center bg-ink-850/50 rounded-lg p-3">
              <div className="flex flex-col font-ui text-xs text-ink-600">
                <button onClick={() => move(p.id, -1)} disabled={i === 0} className="disabled:opacity-20 hover:text-gilt-400">▲</button>
                <button onClick={() => move(p.id, 1)} disabled={i === points.length - 1} className="disabled:opacity-20 hover:text-gilt-400">▼</button>
              </div>
              <input className="px-2 py-1.5 text-sm font-body" placeholder="Beat title" value={p.title || ''} onChange={(e) => updatePoint(p.id, 'title', e.target.value)} />
              <select className="px-2 py-1.5 text-sm" value={p.beat_type || ''} onChange={(e) => updatePoint(p.id, 'beat_type', e.target.value)}>
                {BEATS.map((b) => <option key={b}>{b}</option>)}
              </select>
              <input className="px-2 py-1.5 text-sm" placeholder="Ch. ref" value={p.chapter_ref || ''} onChange={(e) => updatePoint(p.id, 'chapter_ref', e.target.value)} />
              <div className="flex items-center gap-1">
                <input type="range" min="0" max="10" value={p.tension ?? 5} onChange={(e) => updatePoint(p.id, 'tension', Number(e.target.value))} className="w-full" />
                <span className="font-ui text-xs text-blood-400 w-4">{p.tension ?? 5}</span>
              </div>
              <button onClick={() => removePoint(p.id)} className="font-ui text-xs text-blood-400 opacity-60 hover:opacity-100 px-1">✕</button>
              <textarea
                className="md:col-span-6 px-2 py-1.5 text-sm font-body"
                rows={1}
                placeholder="Notes on this beat..."
                value={p.notes || ''}
                onChange={(e) => updatePoint(p.id, 'notes', e.target.value)}
              />
            </div>
          ))}
          {points.length === 0 && <p className="font-ui text-sm text-ink-600 opacity-60">No beats yet — add your inciting incident to start the curve.</p>}
        </div>
      </div>
    </div>
  )
}
