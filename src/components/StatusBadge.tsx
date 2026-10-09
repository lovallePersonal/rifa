import { useTranslation } from 'react-i18next'
import type { Status } from '../types'

/**
 * Accessible status badge. Colors are chosen for sufficient contrast:
 *   available -> green, reserved -> amber, paid -> dark gray.
 * The text label is always rendered (never color-only) via i18n.
 */
const STYLES: Record<Status, string> = {
  available: 'bg-green-100 text-green-800 dark:bg-switchblue-500/20 dark:text-switchblue-200',
  reserved: 'bg-amber-100 text-amber-800 dark:bg-gold-500/20 dark:text-gold-200',
  paid: 'bg-gray-200 text-gray-800 dark:bg-white/10 dark:text-slate-200',
}

export function StatusBadge({ status }: { status: Status }) {
  const { t } = useTranslation()
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {t(`status.${status}`)}
    </span>
  )
}

export default StatusBadge
