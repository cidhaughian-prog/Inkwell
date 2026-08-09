import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../supabaseClient.js'

function WebDiagram({ characters, relationships }) {
  const size = 420
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 60
  const positions = {}
  characters.forEach((c, i) => {
    const angle = (i / characters.length) * Math.PI * 2 - Math.PI / 2
    positions[c.id] = {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    }
  })

  const links = relationships.filter((r) => r.related_character_id && positions[r.character_id] && positions[r.related_character_id])

  return (
    <div className="card p-6 overflow-x-auto">
      <h3 className="font-serif text-xl text-gilt-300 mb-4">The web</h3>
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto block" style={{ width: '100%', maxWidth: 460, height: 'auto' }}>
        {links.map((r) => {
          const a = positions[r.character_id]
          const b = positions[r.related_character_id]
          const midX = (a.x + b.x) / 2
          const midY = (a.y + b.y) / 2
          return (
            <g key={r.id}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#c8324a" strokeOpacity="0.55" strokeWidth="1.5" />
              {r.dynamic && (
                <text x={midX} y={midY} fontSize="9" fill="#e8cf9f" textAnchor="middle">
                  {r.dynamic}
                </text>
              )}
            </g>
          )
        })}
        {characters.map((c) => {
          const p = positions[c.id]
          return (
            <g key={c.id}>
              <circle cx={p.x} cy={p.y} r="24" fill="#241a2c" stroke="#c8324a" strokeWidth="1.5" />
              <text x={p.x} y={p.y + 3} fontSize="9" fill="#e8cf9f" textAnchor="middle">
                {(c.name || '?').length > 10 ? `${(c.name || '?').slice(0, 9)}…` : (c.name || '?')}
              </text>
            </g>
          )
        })}
      </svg>
      {relationships.filter((r) => r.related_character_id).length === 0 && (
        <p className="font-ui text-xs text-ink-600 opacity-50 text-center mt-2">Add connections below and they'll show up here as lines between characters.</p>
      )}
    </div>
  )
}

export default function ConnectionsTab({ characters }) {
  const [relationships, setRelationships] = useState([])
  const [loading, setLoading] = useState(true)

  const ids = useMemo(() => characters.map((c) => c.id), [characters])

  useEffect(() => { load() }, [ids.join(',')])

  async function load() {
    setLoading(true)
    if (!ids.length) { setRelationships([]); setLoading(false); return }
    const { data } = await supabase
      .from('character_relationships')
      .select('*')
      .in('character_id', ids)
      .order('created_at')
    setRelationships(data || [])
    setLoading(false)
  }

  async function addConnection() {
    if (characters.length < 2) return
    const { data } = await supabase.from('character_relationships').insert({
      character_id: characters[0].id,
      related_character_id: characters[1].id,
      dynamic: '',
      notes: '',
    }).select().single()
    if (data) setRelationships((r) => [...r, data])
  }

  async function updateConnection(id, field, value) {
    await supabase.from('character_relationships').update({ [field]: value }).eq('id', id)
    setRelationships((r) => r.map((x) => (x.id === id ? { ...x, [field]: value } : x)))
  }

  async function removeConnection(id) {
    await supabase.from('character_relationships').delete().eq('id', id)
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
      <WebDiagram characters={characters} relationships={relationships} />

      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-serif text-xl text-gilt-300">Connections</h3>
          <button onClick={addConnection} className="btn-primary font-ui text-xs px-3 py-2 rounded-lg">+ Add connection</button>
        </div>
        {loading ? (
          <p className="font-ui text-sm text-ink-600 opacity-70">Loading...</p>
        ) : relationships.length === 0 ? (
          <p className="font-ui text-sm text-ink-600 opacity-60">No connections yet. Add one to start building the web — family ties, rivalries, whatever binds them.</p>
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
                <input
                  className="flex-1 px-2 py-1.5 text-sm"
                  placeholder="Dynamic (e.g. captor/captive, siblings, exes)"
                  value={r.dynamic || ''}
                  onChange={(e) => updateConnection(r.id, 'dynamic', e.target.value)}
                />
                <input
                  className="flex-[2] px-2 py-1.5 text-sm"
                  placeholder="Notes"
                  value={r.notes || ''}
                  onChange={(e) => updateConnection(r.id, 'notes', e.target.value)}
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
