import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { isAdminEmail } from '../config'

/**
 * Auth state + helpers for the admin area.
 *
 * - Subscribes to supabase.auth.onAuthStateChange and reads the initial
 *   session via getSession().
 * - `isAdmin` is derived from the session email using the case-insensitive
 *   isAdminEmail() helper (client-side gating only; the real gate is RLS).
 */
export interface UseAuthResult {
  session: Session | null
  user: User | null
  email: string | null
  isAdmin: boolean
  loading: boolean
  /**
   * True when the OAuth redirect came back with an error (e.g. the auth hook
   * rejected a non-admin account, so no token was issued). Lets the UI show a
   * graceful "acceso denegado" instead of an apparently-broken login button.
   */
  authError: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

/** Detects an OAuth error returned in the URL hash/query by Supabase Auth. */
function detectAuthError(): boolean {
  if (typeof window === 'undefined') return false
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash
  const params = new URLSearchParams(hash || window.location.search)
  return params.has('error') || params.has('error_description')
}

export function useAuth(): UseAuthResult {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<boolean>(detectAuthError)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setLoading(false)
      if (newSession) setAuthError(false)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const user = session?.user ?? null
  const email = user?.email ?? null
  const isAdmin = isAdminEmail(email)

  async function signInWithGoogle(): Promise<void> {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/admin' },
    })
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
  }

  return { session, user, email, isAdmin, loading, authError, signInWithGoogle, signOut }
}
