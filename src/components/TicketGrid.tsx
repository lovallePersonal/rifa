import { useTranslation } from 'react-i18next'
import type { PublicTicket } from '../types'
import { format3 } from '../config'

interface TicketGridProps {
  tickets: PublicTicket[]
  /** Highlighted number from the search box (or null). */
  highlight: number | null
  /** Opens the reserve modal for an available number. */
  onSelect: (n: number) => void
}

/** Tailwind classes per status; available is interactive, others are not. */
const CELL_STYLES: Record<PublicTicket['status'], string> = {
  available:
    'bg-green-100 text-green-900 hover:bg-green-200 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-800 cursor-pointer',
  reserved:
    'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100 cursor-not-allowed opacity-80',
  paid: 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed opacity-70',
}

export function TicketGrid({ tickets, highlight, onSelect }: TicketGridProps) {
  const { t } = useTranslation()

  if (tickets.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('public.noResults')}</p>
  }

  return (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(3.25rem, 1fr))' }}
    >
      {tickets.map((ticket) => {
        const isAvailable = ticket.status === 'available'
        const isHighlighted = highlight === ticket.number
        return (
          <button
            key={ticket.number}
            type="button"
            disabled={!isAvailable}
            onClick={() => isAvailable && onSelect(ticket.number)}
            aria-label={`${format3(ticket.number)} - ${t(`status.${ticket.status}`)}`}
            className={`relative rounded-md py-2 text-sm font-mono font-medium text-center transition-colors ${
              CELL_STYLES[ticket.status]
            } ${isHighlighted ? 'ring-2 ring-brand-500 ring-offset-1 dark:ring-offset-gray-900' : ''}`}
          >
            {format3(ticket.number)}
            {ticket.is_winner && (
              <span
                className="absolute -top-1 -right-1 text-xs"
                aria-label={t('public.legend.winner')}
                title={t('public.legend.winner')}
              >
                ★
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default TicketGrid
