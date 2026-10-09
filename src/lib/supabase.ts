import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Non-fatal: the app still builds, but Supabase calls will fail until env vars are set.
  console.warn(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Set them in .env.local (see .env.example).',
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
})
