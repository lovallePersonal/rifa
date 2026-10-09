import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import type { PublicTicket } from '../types'
import { RAFFLE } from '../config'
import Banner from '../components/Banner'
import Counters from '../components/Counters'
import SearchBox from '../components/SearchBox'
import TicketGrid from '../components/TicketGrid'
import ReserveModal from '../components/ReserveModal'
import Footer from '../components/Footer'

/**
 * Public, open-to-the-world view. It reads ONLY the public_tickets view
 * (number, status, is_winner) and never touches the base tickets table.
 */
export function PublicView() {
  const { t } = useTranslation()
  const [tickets, setTickets] = useState<PublicTicket[]>([])
  const [highlight, setHighlight] = useState<number | null>(null)
  const [selected, setSelected] = useState<number | null>(null)

  const fetchTickets = useCallback(async () => {
    const { data, error } = await supabase
      .from('public_tickets')
      .select('number,status,is_winner')
      .order('number', { ascending: true })
    if (!error && data) {
      setTickets(data as PublicTicket[])
    }
  }, [])

  useEffect(() => {
    void fetchTickets()
  }, [fetchTickets])

  const filtered = useMemo(() => {
    if (highlight === null) return tickets
    return tickets.filter((ti) => ti.number === highlight)
  }, [tickets, highlight])

  const statuses = useMemo(() => tickets.map((ti) => ti.status), [tickets])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 space-y-6">
        <Banner />

        <Counters statuses={statuses} />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('public.title')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('raffle.numbersRange', { min: RAFFLE.numberMin, max: RAFFLE.numberMax })}
            </p>
          </div>

          <SearchBox onSearch={setHighlight} />

          <Legend />

          <TicketGrid tickets={filtered} highlight={highlight} onSelect={setSelected} />
        </div>
      </main>

      <Footer />

      {selected !== null && (
        <ReserveModal
          number={selected}
          onClose={() => setSelected(null)}
          onReserved={() => void fetchTickets()}
        />
      )}
    </div>
  )
}

function Legend() {
  const { t } = useTranslation()
  const items: { key: string; dot: string }[] = [
    { key: 'public.legend.available', dot: 'bg-green-400' },
    { key: 'public.legend.reserved', dot: 'bg-amber-400' },
    { key: 'public.legend.paid', dot: 'bg-gray-400' },
  ]
  return (
    <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-300">
      {items.map((it) => (
        <span key={it.key} className="inline-flex items-center gap-1.5">
          <span className={`h-3 w-3 rounded-full ${it.dot}`} aria-hidden="true" />
          {t(it.key)}
        </span>
      ))}
    </div>
  )
}

export default PublicView
