import { useTranslation } from 'react-i18next'
import type { Status } from '../types'
import { RAFFLE } from '../config'

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount)
}

interface CountersProps {
  /** Status of every ticket (public or admin source). */
  statuses: Status[]
}

/**
 * Derived figures shown to both public and admin:
 *   sold        = reserved + paid
 *   paid        = paid count
 *   totalRaised = paidCount * price
 *   projected   = soldCount * price
 */
export function Counters({ statuses }: CountersProps) {
  const { t } = useTranslation()

  const paidCount = statuses.filter((s) => s === 'paid').length
  const reservedCount = statuses.filter((s) => s === 'reserved').length
  const soldCount = paidCount + reservedCount
  const totalRaised = paidCount * RAFFLE.ticketPriceCOP
  const projected = soldCount * RAFFLE.ticketPriceCOP

  const cards = [
    { label: t('counters.sold'), value: String(soldCount) },
    { label: t('counters.paid'), value: String(paidCount) },
    { label: t('counters.raised'), value: formatCOP(totalRaised) },
    { label: t('counters.projected'), value: formatCOP(projected) },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-ink-800/60 dark:backdrop-blur px-3 py-3 text-center"
        >
          <div className="text-xs text-gray-500 dark:text-slate-400">{c.label}</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white dark:font-display">{c.value}</div>
        </div>
      ))}
    </div>
  )
}

export default Counters
