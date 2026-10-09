import { useTranslation } from 'react-i18next'
import type { PublicTicket } from '../types'
import { format3 } from '../config'

interface TicketGridProps {
  tickets: PublicTicket[]
  /** Highlighted number from the search box (or null). */
  highlight: number | null
  /** Numbers currently in the selection set. */
  selected: Set<number>
  /** Toggles an available number in/out of the selection set. */
  onToggle: (n: number) => void
}

/** Tailwind classes per status; available is interactive, others are not. */
const CELL_STYLES: Record<PublicTicket['status'], string> = {
  available:
    'bg-ink-800 text-white border border-switchblue-500/40 hover:border-switchblue-400 hover:bg-ink-700 hover:text-white cursor-pointer',
  reserved:
    'bg-gold-500/15 text-gold-200 border border-gold-500/30 cursor-not-allowed opacity-80',
  paid: 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed opacity-70',
}

export function TicketGrid({ tickets, highlight, selected, onToggle }: TicketGridProps) {
  const { t } = useTranslation()

  if (tickets.length === 0) {
    return <p className="text-center text-slate-400 py-8">{t('public.noResults')}</p>
  }

  return (
    <div
      role="region"
      aria-label={t('public.gridRegionLabel')}
      className="max-h-[52vh] sm:max-h-[60vh] overflow-y-auto scroll-smooth overscroll-contain pr-1 pb-28"
    >
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(3.25rem, 1fr))' }}
      >
        {tickets.map((ticket) => {
          const isAvailable = ticket.status === 'available'
          const isHighlighted = highlight === ticket.number
          const isSelected = selected.has(ticket.number)
          return (
            <button
            key={ticket.number}
            type="button"
            disabled={!isAvailable}
            aria-pressed={isSelected}
            onClick={() => isAvailable && onToggle(ticket.number)}
            aria-label={`${format3(ticket.number)} - ${t(`status.${ticket.status}`)}`}
            className={`relative min-h-[2.75rem] rounded-lg py-2 text-sm font-mono font-semibold text-center transition-all duration-150 ${
              CELL_STYLES[ticket.status]
            } ${
              isSelected
                ? 'ring-2 ring-switchblue-400 ring-offset-2 ring-offset-ink-950 !border-switchblue-400 !bg-switchblue-500/25 !text-white shadow-[0_0_14px_rgba(0,195,227,0.55)]'
                : ''
            } ${
              isHighlighted && !isSelected
                ? 'ring-2 ring-nintendo-400 ring-offset-2 ring-offset-ink-950'
                : ''
            }`}
          >
            {format3(ticket.number)}
            {ticket.is_winner && (
              <span
                className="absolute -top-1 -right-1 text-xs text-gold-400 drop-shadow"
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
    </div>
  )
}

export default TicketGrid
