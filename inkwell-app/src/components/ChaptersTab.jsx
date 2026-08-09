import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

const ROLES = [
  'MMC', 'FMC', 'Protagonist', 'Love Interest', 'Antagonist', 'Villain', 'Rival',
  'Best Friend', 'MMC\'s Best Friend', 'FMC\'s Best Friend', 'Best Friend\'s Brother',
  'Best Friend\'s Sister', 'Boyfriend', 'Girlfriend', 'Ex', 'Boss', 'Mentor', 'Sibling',
  'Parent', 'Confidant', 'Bodyguard', 'Enforcer', 'Rival Love Interest', 'Side Character',
]
const IMAGE_BUCKET = 'character-images'

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

function Moodboard({ characterId, onImagesChange }) {
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [characterId])

  async function load() {
    const { data } = await supabase.from('character_images').select('*').eq('character_id', characterId).order('created_at')
    setImages(data || [])
  }

  async function handleFiles(fileList) {
    setError('')
    setUploading(true)
    for (const file of Array.from(fileList)) {
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
      const path = `${characterId}/${Date.now()}-${safeName}`
      const { error: upErr } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file)
      if (upErr) {
        setError(`Couldn't upload ${file.name}: ${upErr.message}. Make sure you ran supabase_migration_v2_images.sql.`)
        continue
      }
      const { data: pub } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path)
      const { data: row } = await supabase.from('character_images').insert({
        character_id: characterId, url: pub.publicUrl, path,
      }).select().single()
      if (row) setImages((imgs) => [...imgs, row])
    }
    setUploading(false)
    onImagesChange?.()
  }

  async function removeImage(img) {
    await supabase.storage.from(IMAGE_BUCKET).remove([img.path])
    await supabase.from('character_images').delete().eq('id', img.id)
    setImages((imgs) => imgs.filter((i) => i.id !== img.id))
    onImagesChange?.()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label>Moodboard / face claim photos</label>
        <label className="btn-ghost font-ui text-[10px] px-2 py-1 rounded cursor-pointer">
          {uploading ? 'Uploading...' : '+ Upload photos'}
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files.length && handleFiles(e.target.files)} />
        </label>
      </div>
      {error && <p className="font-ui text-xs text-blood-400 mb-2">{error}</p>}
      {images.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-gilt-500/15">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(img)}
                className="absolute top-1 right-1 bg-ink-950/80 text-blood-400 rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >✕</button>
            </div>
          ))}
        </div>
      ) : (
        <p className="font-ui text-xs text-ink-600 opacity-60">No photos yet — upload reference images, face claims, aesthetic pulls, whatever helps you see them.</p>
      )}
    </div>
  )
}

export default function CharactersTab({ bookId, onCharactersChange }) {
  const [characters, setCharacters] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [family, setFamily] = useState([])
  const [photoMap, setPhotoMap] = useState({})

  useEffect(() => { loadCharacters() }, [bookId])
  useEffect(() => { if (selectedId) { loadFamily() } }, [selectedId])

  async function loadCharacters() {
    const { data } = await supabase.from('characters').select('*').eq('book_id', bookId).order('created_at')
    setCharacters(data || [])
    if (data && data.length && !selectedId) setSelectedId(data[0].id)
    await refreshPhotoMap((data || []).map((c) => c.id))
  }

  async function refreshPhotoMap(ids) {
    const characterIds = ids || characters.map((c) => c.id)
    if (!characterIds.length) { setPhotoMap({}); return }
    const { data: imgs } = await supabase
      .from('character_images')
      .select('character_id, url, created_at')
      .in('character_id', characterIds)
      .order('created_at')
    const map = {}
    ;(imgs || []).forEach((img) => { if (!map[img.character_id]) map[img.character_id] = img.url })
    setPhotoMap(map)
  }

  async function loadFamily() {
    const { data } = await supabase.from('family_members').select('*').eq('character_id', selectedId)
    setFamily(data || [])
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
    if (!confirm('Delete this character? This removes their family, relationship, and photo notes too.')) return
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
              className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg font-body text-lg transition-colors ${
                selectedId === c.id ? 'bg-blood-700/30 text-gilt-300' : 'text-ink-600 hover:bg-ink-800'
              }`}
            >
              {photoMap[c.id] ? (
                <img src={photoMap[c.id]} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 border border-gilt-500/20" />
              ) : (
                <span className="w-7 h-7 rounded-full bg-ink-800 border border-gilt-500/15 shrink-0 flex items-center justify-center font-ui text-[10px] text-ink-600 opacity-70">
                  {(c.name || '?').charAt(0).toUpperCase()}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate">{c.name || 'Unnamed'}</span>
                {c.role && <span className="block font-ui text-[10px] uppercase tracking-widest opacity-60">{c.role}</span>}
              </span>
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

          <Moodboard characterId={selected.id} onImagesChange={() => refreshPhotoMap()} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SavedField label="Age" value={selected.age} onSave={(v) => updateField('age', v)} />
            <div>
              <label>Role</label>
              <input
                className="w-full px-3 py-2 mt-1 font-body text-base"
                list="role-options"
                placeholder="Type or pick one..."
                defaultValue={selected.role || ''}
                key={selected.id}
                onBlur={(e) => e.target.value !== (selected.role || '') && updateField('role', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
              />
              <datalist id="role-options">
                {ROLES.map((r) => <option key={r} value={r} />)}
              </datalist>
              <p className="font-ui text-[10px] text-ink-600 opacity-60 mt-1">Pick a suggestion or type anything — MMC, bestie's brother, whatever fits.</p>
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
                <div key={m.id} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-start">
                  <input className="flex-1 px-2 py-1.5 text-sm" placeholder="Name" value={m.name || ''} onChange={(e) => updateFamilyMember(m.id, 'name', e.target.value)} />
                  <input className="flex-1 px-2 py-1.5 text-sm" placeholder="Relation" value={m.relation || ''} onChange={(e) => updateFamilyMember(m.id, 'relation', e.target.value)} />
                  <input className="flex-[2] px-2 py-1.5 text-sm" placeholder="Notes" value={m.notes || ''} onChange={(e) => updateFamilyMember(m.id, 'notes', e.target.value)} />
                  <button onClick={() => removeFamilyMember(m.id)} className="font-ui text-xs text-blood-400 opacity-60 hover:opacity-100 px-1 self-end sm:self-auto">✕ Remove</button>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4" style={{ background: 'rgba(0,0,0,0.15)' }}>
            <p className="font-ui text-xs text-ink-600 opacity-80">
              Looking for this character's relationships to other characters? Head to the <strong className="text-gilt-300">Connections</strong> tab — it's where you build the whole web now, and you pick characters from a list instead of retyping names.
            </p>
          </div>

          <SavedField label="Other notes" value={selected.notes} onSave={(v) => updateField('notes', v)} textarea placeholder="Anything else — this is also where brain-dump suggestions land." />
        </div>
      ) : (
        <div className="card p-12 text-center font-ui text-ink-600">No character selected yet.</div>
      )}
    </div>
  )
}
