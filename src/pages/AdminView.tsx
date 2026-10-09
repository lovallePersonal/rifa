import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import type { SoldBy, Ticket } from '../types'
import { useAuth } from '../hooks/useAuth'
import { downloadTicketsCsv } from '../lib/csv'
import AdminTable from '../components/AdminTable'
import EditTicketModal from '../components/EditTicketModal'
import WinnerInput from '../components/WinnerInput'
import Counters from '../components/Counters'
import Footer from '../components/Footer'

/**
 * Admin area. Gated by Google login + case-insensitive admin allow-list.
 * Admin reads/writes the base tickets table (allowed by RLS for admin emails).
 */
export function AdminView() {
  const { t } = useTranslation()
  const { session, isAdmin, loading, authError, signInWithGoogle, signOut } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [editing, setEditing] = useState<Ticket | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)
  const refreshingRef = useRef(false)

  const fetchTickets = useCallback(async () => {
    // Guard against overlapping fetches (poll + focus + manual can collide).
    if (refreshingRef.current) return
    refreshingRef.current = true
    setRefreshing(true)
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('number', { ascending: true })
    if (!error && data) {
      setTickets(data as Ticket[])
      setLastUpdatedAt(new Date())
    }
    refreshingRef.current = false
    setRefreshing(false)
  }, [])

  // Initial load + automatic refresh: poll every 25s and refetch when the tab
  // regains focus, so new reservations appear without a full page reload.
  useEffect(() => {
    if (!(session && isAdmin)) return

    void fetchTickets()

    const interval = window.setInterval(() => {
      void fetchTickets()
    }, 25000)

    const onFocus = () => {
      if (document.visibilityState === 'visible') void fetchTickets()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [session, isAdmin, fetchTickets])

  const markPaid = useCallback(
    async (n: number) => {
      await supabase
        .from('tickets')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('number', n)
      await fetchTickets()
    },
    [fetchTickets],
  )

  const release = useCallback(
    async (n: number) => {
      // Undo a fallen-through reservation: wipe buyer data and timestamps,
      // returning the number to the public pool.
      await supabase
        .from('tickets')
        .update({
          status: 'available',
          buyer_name: null,
          buyer_phone: null,
          buyer_email: null,
          reserved_at: null,
          paid_at: null,
          sold_by: null,
        })
        .eq('number', n)
      await fetchTickets()
    },
    [fetchTickets],
  )

  const setSeller = useCallback(
    async (n: number, seller: SoldBy) => {
      await supabase.from('tickets').update({ sold_by: seller }).eq('number', n)
      await fetchTickets()
    },
    [fetchTickets],
  )

  const setWinner = useCallback(
    async (n: number) => {
      await supabase.from('tickets').update({ is_winner: true }).eq('number', n)
      await fetchTickets()
    },
    [fetchTickets],
  )

  // Centralized write for Feature 1/2 (edit any row / register a sale from scratch).
  // It applies the status-transition rules consistently with the quick-action
  // handlers before writing the base tickets row.
  const saveTicket = useCallback(
    async (current: Ticket, patch: Partial<Ticket>) => {
      const now = new Date().toISOString()
      const next = { ...current, ...patch }
      let finalPatch: Partial<Ticket>

      if (next.status === 'available') {
        // Same semantics as the release handler: return the number to the pool.
        finalPatch = {
          status: 'available',
          buyer_name: null,
          buyer_phone: null,
          buyer_email: null,
          sold_by: null,
          reserved_at: null,
          paid_at: null,
        }
      } else if (next.status === 'paid') {
        // A direct sale logically passes through reserved; set timestamps only if missing.
        finalPatch = {
          status: 'paid',
          buyer_name: next.buyer_name,
          buyer_phone: next.buyer_phone,
          buyer_email: next.buyer_email,
          sold_by: next.sold_by,
          reserved_at: current.reserved_at ?? now,
          paid_at: current.paid_at ?? now,
        }
      } else {
        // reserved
        finalPatch = {
          status: 'reserved',
          buyer_name: next.buyer_name,
          buyer_phone: next.buyer_phone,
          buyer_email: next.buyer_email,
          sold_by: next.sold_by,
          reserved_at: current.reserved_at ?? now,
          paid_at: null,
        }
      }

      const { error } = await supabase
        .from('tickets')
        .update(finalPatch)
        .eq('number', current.number)
      if (error) throw error
      await fetchTickets()
    },
    [fetchTickets],
  )

  const statuses = useMemo(() => tickets.map((ti) => ti.status), [tickets])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        {t('app.loading')}
      </div>
    )
  }

  if (!session) {
    // No session. If the OAuth redirect returned an error, the auth hook most
    // likely rejected a non-admin account (no token issued): show the same
    // access-denied message so the user is never left on a broken-looking screen,
    // plus the login button so an authorized account can still sign in.
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-900 px-4 text-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {t('admin.title')}
        </h1>
        {authError && <p className="text-red-600 dark:text-red-400">{t('admin.accessDenied')}</p>}
        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          {t('admin.loginButton')}
        </button>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-900 px-4 text-center">
        <p className="text-red-600 dark:text-red-400">{t('admin.accessDenied')}</p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="rounded-lg bg-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600"
        >
          {t('admin.signOut')}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {t('admin.title')}
            </h1>
            {lastUpdatedAt && (
              <p className="text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
                {t('admin.lastUpdated', { time: lastUpdatedAt.toLocaleTimeString() })}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void fetchTickets()}
              disabled={refreshing}
              className="rounded-lg bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-60"
            >
              {refreshing ? t('admin.refreshing') : t('admin.refresh')}
            </button>
            <button
              type="button"
              onClick={() => downloadTicketsCsv(tickets)}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              {t('admin.csvExport')}
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-lg bg-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600"
            >
              {t('admin.signOut')}
            </button>
          </div>
        </div>

        <Counters statuses={statuses} />

        <WinnerInput tickets={tickets} onSetWinner={setWinner} />

        <AdminTable
          tickets={tickets}
          onMarkPaid={markPaid}
          onRelease={release}
          onSetSeller={setSeller}
          onEdit={(n) => setEditing(tickets.find((ti) => ti.number === n) ?? null)}
        />
      </main>

      <Footer />

      {editing && (
        <EditTicketModal
          ticket={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => saveTicket(editing, patch)}
        />
      )}
    </div>
  )
}

export default AdminView
