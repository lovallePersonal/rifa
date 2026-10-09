import { useTranslation } from 'react-i18next'
import { RAFFLE } from '../config'

/** Formats an ISO yyyy-mm-dd date to a readable long date in the active locale. */
function formatDrawDate(iso: string, locale: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, d)
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function Banner() {
  const { t, i18n } = useTranslation()

  return (
    <section className="bg-brand-50 dark:bg-gray-800 rounded-xl px-4 py-6 sm:px-6 sm:py-8 text-center">
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-600 dark:text-brand-400">
        {t('app.title')}
      </h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t('raffle.intro')}</p>

      <div className="mt-4 flex flex-col items-center gap-1 text-gray-800 dark:text-gray-100">
        <p className="text-lg font-semibold">
          {t('banner.prizeLabel')}: {RAFFLE.prize}
        </p>
        <p className="text-sm">
          {t('banner.priceLabel')}: {formatCOP(RAFFLE.ticketPriceCOP)}
        </p>
        <p className="text-sm">
          {t('banner.drawLabel')} {formatDrawDate(RAFFLE.drawDate, i18n.language)}{' '}
          {t('banner.lotteryLabel')} {RAFFLE.lotteryName}
        </p>
      </div>
    </section>
  )
}

export default Banner
