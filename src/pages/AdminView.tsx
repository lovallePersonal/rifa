import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import type { SoldBy, Ticket } from '../types'
import { useAuth } from '../hooks/useAuth'
import { downloadTicketsCsv } from '../lib/csv'
import AdminTable from '../components/AdminTable'
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

  const fetchTickets = useCallback(async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('number', { ascending: true })
    if (!error && data) {
      setTickets(data as Ticket[])
    }
  }, [])

  useEffect(() => {
    if (session && isAdmin) {
      void fetchTickets()
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
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('admin.title')}
          </h1>
          <div className="flex gap-2">
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
        />
      </main>

      <Footer />
    </div>
  )
}

export default AdminView
