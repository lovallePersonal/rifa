import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import type { PublicTicket } from '../types'
import { RAFFLE, format3 } from '../config'
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
  const [selectedSet, setSelectedSet] = useState<Set<number>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)

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

  const toggle = useCallback((n: number) => {
    setSelectedSet((prev) => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n)
      else next.add(n)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => setSelectedSet(new Set()), [])

  const selectedNumbers = useMemo(
    () => [...selectedSet].sort((a, b) => a - b),
    [selectedSet],
  )

  const formattedSelected = useMemo(
    () => selectedNumbers.map(format3).join(', '),
    [selectedNumbers],
  )

  return (
    <div className="dark relative min-h-screen flex flex-col bg-ink-950 text-slate-100 overflow-hidden">
      {/* Ambient glow orbs behind the whole page (decorative). */}
      <div
        aria-hidden="true"
        className="glow-blob top-40 -left-24 h-72 w-72 bg-nintendo-600/20"
      />
      <div
        aria-hidden="true"
        className="glow-blob bottom-24 -right-24 h-80 w-80 bg-switchblue-600/15"
      />

      <main
        className={`relative z-10 flex-1 w-full max-w-5xl mx-auto px-4 py-6 space-y-6 ${
          selectedSet.size > 0 ? 'pb-32' : ''
        }`}
      >
        <Banner />

        <Counters statuses={statuses} />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-white">
              {t('public.title')}
            </h2>
            <p className="text-xs text-slate-400">
              {t('raffle.numbersRange', { min: RAFFLE.numberMin, max: RAFFLE.numberMax })}
            </p>
          </div>

          <SearchBox onSearch={setHighlight} />

          <Legend />

          <p className="text-xs text-slate-400">{t('public.multi.selectHint')}</p>

          <TicketGrid
            tickets={filtered}
            highlight={highlight}
            selected={selectedSet}
            onToggle={toggle}
          />
        </div>
      </main>

      {selectedSet.size > 0 && (
        <div
          role="region"
          aria-label={t('public.multi.confirmHint')}
          className="fixed inset-x-0 bottom-0 sm:sticky sm:bottom-0 z-40 border-t border-white/10 bg-ink-900/90 backdrop-blur pb-[env(safe-area-inset-bottom)]"
        >
          <div className="w-full max-w-5xl mx-auto px-4 py-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <p className="text-sm font-semibold text-white">
                {t('public.multi.selectedCount', { count: selectedSet.size })}
              </p>
              <p className="text-xs font-mono text-switchblue-200">
                {t('public.multi.selectedList', { numbers: formattedSelected })}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
              >
                {t('public.multi.clear')}
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="rounded-lg bg-gradient-to-r from-nintendo-500 to-switchblue-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-nintendo-500/20 hover:opacity-90 transition-opacity"
              >
                {t('public.multi.buySelected', { count: selectedSet.size })}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {modalOpen && (
        <ReserveModal
          numbers={selectedNumbers}
          onClose={() => setModalOpen(false)}
          onReserved={() => void fetchTickets()}
          onSuccess={clearSelection}
        />
      )}
    </div>
  )
}

function Legend() {
  const { t } = useTranslation()
  const items: { key: string; dot: string }[] = [
    { key: 'public.legend.available', dot: 'bg-switchblue-400' },
    { key: 'public.legend.reserved', dot: 'bg-gold-400' },
    { key: 'public.legend.paid', dot: 'bg-slate-500' },
  ]
  return (
    <div className="flex flex-wrap gap-4 text-xs text-slate-300">
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
