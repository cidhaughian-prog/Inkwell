import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../supabaseClient.js'

const NODE_R = 28
const COL_GAP = 130
const ROW_GAP = 100
const TOP_PAD = 50
const SIDE_PAD = 70
const COMPONENT_GAP = 60

// Groups characters into connected clusters and stacks each one as a
// top-down branching tree (root row, then whoever links off them, etc).
// People with no connections yet get lined up in their own row at the bottom.
function buildLayout(characters, links) {
  const idToChar = {}
  characters.forEach((c) => { idToChar[c.id] = c })
  const adjacency = {}
  characters.forEach((c) => { adjacency[c.id] = [] })
  links.forEach((r) => {
    if (adjacency[r.character_id]) adjacency[r.character_id].push(r.related_character_id)
    if (adjacency[r.related_character_id]) adjacency[r.related_character_id].push(r.character_id)
  })

  const visited = new Set()
  const trees = []
  const loners = []

  characters.forEach((c) => {
    if (visited.has(c.id)) return
    const levels = []
    let frontier = [c.id]
    visited.add(c.id)
    while (frontier.length) {
      levels.push(frontier)
      const next = []
      frontier.forEach((id) => {
        ;(adjacency[id] || []).forEach((to) => {
          if (to && !visited.has(to) && idToChar[to]) {
            visited.add(to)
            next.push(to)
          }
        })
      })
      frontier = next
    }
    if (levels.length === 1 && levels[0].length === 1) loners.push(levels[0][0])
    else trees.push(levels)
  })

  const treeWidths = trees.map((levels) => Math.max(...levels.map((l) => l.length)) * COL_GAP)
  const lonersWidth = loners.length * COL_GAP
  const canvasWidth = Math.max(lonersWidth, ...treeWidths, COL_GAP) + SIDE_PAD * 2

  const positions = {}
  let y = TOP_PAD

  trees.forEach((levels) => {
    levels.forEach((level, li) => {
      const rowWidth = level.length * COL_GAP
      const startX = (canvasWidth - rowWidth) / 2 + COL_GAP / 2
      level.forEach((id, idx) => {
        positions[id] = { x: startX + idx * COL_GAP, y: y + li * ROW_GAP }
      })
    })
    y += levels.length * ROW_GAP + COMPONENT_GAP
  })

  let lonersY = null
  if (loners.length) {
    lonersY = y
    const rowWidth = loners.length * COL_GAP
    const startX = (canvasWidth - rowWidth) / 2 + COL_GAP / 2
    loners.forEach((id, idx) => {
      positions[id] = { x: startX + idx * COL_GAP, y: lonersY }
    })
    y += ROW_GAP
  }

  return { positions, width: canvasWidth, height: y, hasLoners: loners.length > 0, lonersY }
}

function TreeDiagram({ characters, relationships, labelMode, onToggleLabelMode }) {
  const idToChar = useMemo(() => {
    const m = {}
    characters.forEach((c) => { m[c.id] = c })
    return m
  }, [characters])

  const links = useMemo(
    () => relationships.filter((r) => r.related_character_id && idToChar[r.character_id] && idToChar[r.related_character_id]),
    [relationships, idToChar]
  )

  const layout = useMemo(() => buildLayout(characters, links), [characters, links])
  const { positions, width, height, hasLoners, lonersY } = layout

  const labelColor = labelMode === 'dark' ? '#241a2c' : '#f5ece3'
  const chipColor = labelMode === 'dark' ? 'rgba(245,236,227,0.92)' : 'rgba(20,14,28,0.8)'

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="font-serif text-xl text-gilt-300">The family tree</h3>
        <div className="flex items-center gap-2">
          <span className="font-ui text-[10px] uppercase tracking-widest text-ink-600 opacity-60">Label color</span>
          <button
            onClick={() => onToggleLabelMode('light')}
            className={`font-ui text-xs px-3 py-1 rounded-full border ${labelMode !== 'dark' ? 'border-gilt-400 text-gilt-300 bg-ink-800' : 'border-gilt-500/20 text-ink-600 opacity-70'}`}
          >Light</button>
          <button
            onClick={() => onToggleLabelMode('dark')}
            className={`font-ui text-xs px-3 py-1 rounded-full border ${labelMode === 'dark' ? 'border-gilt-400 text-gilt-300 bg-ink-800' : 'border-gilt-500/20 text-ink-600 opacity-70'}`}
          >Dark</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: Math.max(width, 320), maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
        >
          {hasLoners && lonersY != null && (
            <text x={16} y={lonersY - ROW_GAP / 2 + 6} fontSize="9" fill="#e8cf9f" opacity="0.5" letterSpacing="1">
              NOT CONNECTED YET
            </text>
          )}
          {links.map((r) => {
            const a = positions[r.character_id]
            const b = positions[r.related_character_id]
            if (!a || !b) return null
            const midX = (a.x + b.x) / 2
            const midY = (a.y + b.y) / 2
            const labelWidth = Math.min(130, Math.max(40, (r.dynamic || '').length * 5.5 + 14))
            return (
              <g key={r.id}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#c8324a" strokeOpacity="0.55" strokeWidth="1.5" />
                {r.dynamic && (
                  <g>
                    <rect x={midX - labelWidth / 2} y={midY - 9} width={labelWidth} height={16} rx={8} fill={chipColor} />
                    <text x={midX} y={midY + 1} fontSize="9" fill={labelColor} textAnchor="middle" dominantBaseline="middle">
                      {r.dynamic}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
          {characters.map((c) => {
            const p = positions[c.id]
            if (!p) return null
            return (
              <g key={c.id}>
                <circle cx={p.x} cy={p.y} r={NODE_R} fill="#241a2c" stroke="#c8324a" strokeWidth="1.5" />
                <text x={p.x} y={p.y + 3} fontSize="9" fill="#e8cf9f" textAnchor="middle">
                  {(c.name || '?').length > 10 ? `${(c.name || '?').slice(0, 9)}…` : (c.name || '?')}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {links.length === 0 && (
        <p className="font-ui text-xs text-ink-600 opacity-50 text-center mt-2">Add connections below and they'll branch out here.</p>
      )}
    </div>
  )
}

function ConnTextField({ value, onSave, placeholder, className }) {
  const [val, setVal] = useState(value || '')
  useEffect(() => setVal(value || ''), [value])
  return (
    <input
      className={className}
      placeholder={placeholder}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => val !== (value || '') && onSave(val)}
    />
  )
}

export default function ConnectionsTab({ characters, bookId }) {
  const [relationships, setRelationships] = useState([])
  const [loading, setLoading] = useState(true)
  const [saveError, setSaveError] = useState('')
  const [labelMode, setLabelMode] = useState('light')

  const ids = useMemo(() => characters.map((c) => c.id), [characters])

  useEffect(() => {
    const saved = localStorage.getItem(`inkwell-connections-label-${bookId}`)
    if (saved === 'light' || saved === 'dark') setLabelMode(saved)
  }, [bookId])

  useEffect(() => { load() }, [ids.join(',')])

  function setLabelModeAndSave(mode) {
    setLabelMode(mode)
    localStorage.setItem(`inkwell-connections-label-${bookId}`, mode)
  }

  async function load() {
    setLoading(true)
    if (!ids.length) { setRelationships([]); setLoading(false); return }
    const { data, error } = await supabase
      .from('character_relationships')
      .select('*')
      .in('character_id', ids)
      .order('created_at')
    if (error) setSaveError(`Couldn't load connections: ${error.message}`)
    setRelationships(data || [])
    setLoading(false)
  }

  async function addConnection() {
    if (characters.length < 2) return
    const { data, error } = await supabase.from('character_relationships').insert({
      character_id: characters[0].id,
      related_character_id: characters[1].id,
      dynamic: '',
      notes: '',
    }).select().single()
    if (error) { setSaveError(`Couldn't add that connection: ${error.message}`); return }
    setSaveError('')
    if (data) setRelationships((r) => [...r, data])
  }

  async function updateConnection(id, field, value) {
    const { data, error } = await supabase
      .from('character_relationships')
      .update({ [field]: value })
      .eq('id', id)
      .select()
    if (error) { setSaveError(`Couldn't save that change: ${error.message}`); return }
    if (!data || data.length === 0) {
      setSaveError("That change didn't save — try reloading the page and editing again.")
      return
    }
    setSaveError('')
    setRelationships((r) => r.map((x) => (x.id === id ? { ...x, [field]: value } : x)))
  }

  async function removeConnection(id) {
    const { error } = await supabase.from('character_relationships').delete().eq('id', id)
    if (error) { setSaveError(`Couldn't delete that connection: ${error.message}`); return }
    setSaveError('')
    setRelationships((r) => r.filter((x) => x.id !== id))
  }

  if (characters.length < 2) {
    return (
      <div className="card p-12 text-center font-ui text-ink-600">
        Add at least two characters on the Characters tab first — connections link two of them together.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {saveError && (
        <div className="card p-3 border border-blood-500/40" style={{ background: 'rgba(200,50,74,0.12)' }}>
          <p className="font-ui text-xs text-blood-400">{saveError}</p>
        </div>
      )}

      <TreeDiagram
        characters={characters}
        relationships={relationships}
        labelMode={labelMode}
        onToggleLabelMode={setLabelModeAndSave}
      />

      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-serif text-xl text-gilt-300">Connections</h3>
          <button onClick={addConnection} className="btn-primary font-ui text-xs px-3 py-2 rounded-lg">+ Add connection</button>
        </div>
        {loading ? (
          <p className="font-ui text-sm text-ink-600 opacity-70">Loading...</p>
        ) : relationships.length === 0 ? (
          <p className="font-ui text-sm text-ink-600 opacity-60">No connections yet. Add one to start building the tree — family ties, rivalries, whatever binds them.</p>
        ) : (
          <div className="space-y-3">
            {relationships.map((r) => (
              <div key={r.id} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center border-b border-gilt-500/10 pb-3 last:border-0 last:pb-0">
                <select
                  className="px-2 py-1.5 text-sm sm:w-36"
                  value={r.character_id}
                  onChange={(e) => updateConnection(r.id, 'character_id', e.target.value)}
                >
                  {characters.map((c) => <option key={c.id} value={c.id}>{c.name || 'Unnamed'}</option>)}
                </select>
                <span className="font-ui text-xs text-ink-600 opacity-60 text-center sm:w-6">&harr;</span>
                <select
                  className="px-2 py-1.5 text-sm sm:w-36"
                  value={r.related_character_id || ''}
                  onChange={(e) => updateConnection(r.id, 'related_character_id', e.target.value || null)}
                >
                  <option value="">Someone else...</option>
                  {characters.filter((c) => c.id !== r.character_id).map((c) => <option key={c.id} value={c.id}>{c.name || 'Unnamed'}</option>)}
                </select>
                <ConnTextField
                  className="flex-1 px-2 py-1.5 text-sm"
                  placeholder="Dynamic (e.g. captor/captive, siblings, exes)"
                  value={r.dynamic}
                  onSave={(v) => updateConnection(r.id, 'dynamic', v)}
                />
                <ConnTextField
                  className="flex-[2] px-2 py-1.5 text-sm"
                  placeholder="Notes"
                  value={r.notes}
                  onSave={(v) => updateConnection(r.id, 'notes', v)}
                />
                <button onClick={() => removeConnection(r.id)} className="font-ui text-xs text-blood-400 opacity-60 hover:opacity-100 px-1 self-end sm:self-auto">✕ Remove</button>
              </div>
            ))}
          </div>
        )}
        <p className="font-ui text-[10px] text-ink-600 opacity-50 mt-4">Both people need to already be added on the Characters tab — add them there first, then link them here.</p>
      </div>
    </div>
  )
}
