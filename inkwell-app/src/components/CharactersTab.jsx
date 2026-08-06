import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

const ROLES = ['Protagonist', 'Love Interest', 'Antagonist', 'Side Character']

function SavedField({ label, value, onSave, textarea, placeholder, small }) {
  const [val, setVal] = useState(value || '')
  useEffect(() => setVal(value || ''), [value])
  const Tag = textarea ? 'textarea' : 'input'
  return (
    <div>
      <label>{label}</label>
      <Tag
        className={`w-full px-3 py-2 mt-1 font-body ${small ? 'text-sm' : 'text-base'}`}
        rows={textarea ? 3 : undefined}
        value={val}
        placeholder={placeholder}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => val !== (value || '') && onSave(val)}
      />
    </div>
  )
}

export default function CharactersTab({ bookId, onCharactersChange }) {
  const [characters, setCharacters] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [family, setFamily] = useState([])
  const [relationships, setRelationships] = useState([])

  useEffect(() => { loadCharacters() }, [bookId])
  useEffect(() => { if (selectedId) { loadFamily(); loadRelationships() } }, [selectedId])

  async function loadCharacters() {
    const { data } = await supabase.from('characters').select('*').eq('book_id', bookId).order('created_at')
    setCharacters(data || [])
    if (data && data.length && !selectedId) setSelectedId(data[0].id)
  }

  async function loadFamily() {
    const { data } = await supabase.from('family_members').select('*').eq('character_id', selectedId)
    setFamily(data || [])
  }

  async function loadRelationships() {
    const { data } = await supabase.from('character_relationships').select('*').eq('character_id', selectedId)
    setRelationships(data || [])
  }

  async function addCharacter() {
    const { data } = await supabase.from('characters').insert({ book_id: bookId, name: 'New Character' }).select().single()
    if (data) {
      setCharacters((c) => [...c, data])
      setSelectedId(data.id)
      onCharactersChange?.()
    }
  }

  async function deleteCharacter(cid) {
    if (!confirm('Delete this character? This removes their family and relationship notes too.')) return
    await supabase.from('characters').delete().eq('id', cid)
    const next = characters.filter((c) => c.id !== cid)
    setCharacters(next)
    setSelectedId(next[0]?.id || null)
    onCharactersChange?.()
  }

  async function updateField(field, value) {
    await supabase.from('characters').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', selectedId)
    setCharacters((cs) => cs.map((c) => (c.id === selectedId ? { ...c, [field]: value } : c)))
    if (field === 'name') onCharactersChange?.()
  }

  async function addFamilyMember() {
    const { data } = await supabase.from('family_members').insert({ character_id: selectedId, name: '', relation: '' }).select().single()
    if (data) setFamily((f) => [...f, data])
  }
  async function updateFamilyMember(fid, field, value) {
    await supabase.from('family_members').update({ [field]: value }).eq('id', fid)
    setFamily((f) => f.map((m) => (m.id === fid ? { ...m, [field]: value } : m)))
  }
  async function removeFamilyMember(fid) {
    await supabase.from('family_members').delete().eq('id', fid)
    setFamily((f) => f.filter((m) => m.id !== fid))
  }

  async function addRelationship() {
    const { data } = await supabase.from('character_relationships').insert({ character_id: selectedId, related_name_freeform: '', dynamic: '' }).select().single()
    if (data) setRelationships((r) => [...r, data])
  }
  async function updateRelationship(rid, field, value) {
    await supabase.from('character_relationships').update({ [field]: value }).eq('id', rid)
    setRelationships((r) => r.map((x) => (x.id === rid ? { ...x, [field]: value } : x)))
  }
  async function removeRelationship(rid) {
    await supabase.from('character_relationships').delete().eq('id', rid)
    setRelationships((r) => r.filter((x) => x.id !== rid))
  }

  const selected = characters.find((c) => c.id === selectedId)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
      <div className="card p-4 h-fit">
        <button onClick={addCharacter} className="btn-primary w-full font-ui text-sm px-3 py-2 rounded-lg mb-3">+ New Character</button>
        <div className="space-y-1">
          {characters.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`w-full text-left px-3 py-2 rounded-lg font-body text-lg transition-colors ${
                selectedId === c.id ? 'bg-blood-700/30 text-gilt-300' : 'text-ink-600 hover:bg-ink-800'
              }`}
            >
              {c.name || 'Unnamed'}
              {c.role && <span className="block font-ui text-[10px] uppercase tracking-widest opacity-60">{c.role}</span>}
            </button>
          ))}
          {characters.length === 0 && <p className="font-ui text-xs text-ink-600 opacity-60 px-1">No characters yet.</p>}
        </div>
      </div>

      {selected ? (
        <div className="card p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
              <SavedField label="Name" value={selected.name} onSave={(v) => updateField('name', v)} />
              <SavedField label="Alias / Nickname" value={selected.alias} onSave={(v) => updateField('alias', v)} />
            </div>
            <button onClick={() => deleteCharacter(selected.id)} className="btn-ghost font-ui text-xs px-3 py-2 rounded-lg text-blood-400 mt-5">Delete</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SavedField label="Age" value={selected.age} onSave={(v) => updateField('age', v)} />
            <div>
              <label>Role</label>
              <select
                className="w-full px-3 py-2 mt-1 font-body text-base"
                value={selected.role || ''}
                onChange={(e) => updateField('role', e.target.value)}
              >
                <option value="">Select...</option>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <SavedField label="Occupation" value={selected.occupation} onSave={(v) => updateField('occupation', v)} />
          </div>

          <SavedField label="Appearance" value={selected.appearance} onSave={(v) => updateField('appearance', v)} textarea />
          <SavedField label="Personality" value={selected.personality} onSave={(v) => updateField('personality', v)} textarea />
          <SavedField label="Attributes / traits" value={selected.attributes} onSave={(v) => updateField('attributes', v)} placeholder="possessive, guarded, quick-tempered..." />
          <SavedField label="Origin" value={selected.origin} onSave={(v) => updateField('origin', v)} placeholder="Where they're from, how it shaped them" textarea />
          <SavedField label="Backstory" value={selected.backstory} onSave={(v) => updateField('backstory', v)} textarea />
          <SavedField label="Motivations / goals" value={selected.motivations} onSave={(v) => updateField('motivations', v)} textarea />
          <SavedField label="Fears / secrets / wounds" value={selected.fears_secrets} onSave={(v) => updateField('fears_secrets', v)} textarea />
          <SavedField label="Arc — how they change" value={selected.arc} onSave={(v) => updateField('arc', v)} textarea />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label>Family</label>
              <button onClick={addFamilyMember} className="btn-ghost font-ui text-[10px] px-2 py-1 rounded">+ Add family member</button>
            </div>
            <div className="space-y-2">
              {family.map((m) => (
                <div key={m.id} className="flex gap-2 items-start">
                  <input className="flex-1 px-2 py-1.5 text-sm" placeholder="Name" value={m.name || ''} onChange={(e) => updateFamilyMember(m.id, 'name', e.target.value)} />
                  <input className="flex-1 px-2 py-1.5 text-sm" placeholder="Relation" value={m.relation || ''} onChange={(e) => updateFamilyMember(m.id, 'relation', e.target.value)} />
                  <input className="flex-[2] px-2 py-1.5 text-sm" placeholder="Notes" value={m.notes || ''} onChange={(e) => updateFamilyMember(m.id, 'notes', e.target.value)} />
                  <button onClick={() => removeFamilyMember(m.id)} className="font-ui text-xs text-blood-400 opacity-60 hover:opacity-100 px-1">✕</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label>Relationships to other characters</label>
              <button onClick={addRelationship} className="btn-ghost font-ui text-[10px] px-2 py-1 rounded">+ Add relationship</button>
            </div>
            <div className="space-y-2">
              {relationships.map((r) => (
                <div key={r.id} className="flex gap-2 items-start">
                  <input className="flex-1 px-2 py-1.5 text-sm" placeholder="With whom" value={r.related_name_freeform || ''} onChange={(e) => updateRelationship(r.id, 'related_name_freeform', e.target.value)} />
                  <input className="flex-1 px-2 py-1.5 text-sm" placeholder="Dynamic (e.g. captor/captive)" value={r.dynamic || ''} onChange={(e) => updateRelationship(r.id, 'dynamic', e.target.value)} />
                  <input className="flex-[2] px-2 py-1.5 text-sm" placeholder="Notes" value={r.notes || ''} onChange={(e) => updateRelationship(r.id, 'notes', e.target.value)} />
                  <button onClick={() => removeRelationship(r.id)} className="font-ui text-xs text-blood-400 opacity-60 hover:opacity-100 px-1">✕</button>
                </div>
              ))}
            </div>
          </div>

          <SavedField label="Other notes" value={selected.notes} onSave={(v) => updateField('notes', v)} textarea placeholder="Anything else — this is also where brain-dump suggestions land." />
        </div>
      ) : (
        <div className="card p-12 text-center font-ui text-ink-600">No character selected yet.</div>
      )}
    </div>
  )
}
