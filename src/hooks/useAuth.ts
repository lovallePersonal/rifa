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
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export function useAuth(): UseAuthResult {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

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

  return { session, user, email, isAdmin, loading, signInWithGoogle, signOut }
}
