import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.warn(
    'Inkwell: Supabase env vars are missing. Copy .env.example to .env and fill in your project URL + anon key (see SETUP_GUIDE.md).'
  )
}

export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder')
export const supabaseConfigured = Boolean(url && key)
