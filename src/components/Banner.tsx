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

  const chips = [
    { label: t('banner.priceLabel'), value: formatCOP(RAFFLE.ticketPriceCOP) },
    { label: t('banner.drawLabel'), value: formatDrawDate(RAFFLE.drawDate, i18n.language) },
    { label: t('banner.lotteryLabel'), value: RAFFLE.lotteryName },
  ]

  return (
    <section className="relative overflow-hidden rounded-3xl bg-aurora px-5 py-10 sm:px-10 sm:py-14 ring-1 ring-white/10 shadow-2xl">
      {/* Decorative glow orbs behind the hero content. */}
      <div
        aria-hidden="true"
        className="glow-blob -top-16 -left-10 h-56 w-56 bg-nintendo-500/40"
      />
      <div
        aria-hidden="true"
        className="glow-blob -bottom-20 -right-8 h-64 w-64 bg-switchblue-500/30"
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        <p className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-nintendo-400 via-white to-switchblue-400 bg-clip-text text-transparent drop-shadow">
          {t('hero.tagline')}
        </p>
        <h1 className="mt-2 font-display text-xl sm:text-2xl font-bold text-white/95">
          {t('app.title')}
        </h1>
        <p className="mt-2 max-w-xl text-sm sm:text-base text-slate-300">{t('raffle.intro')}</p>

        {/* Prize images: stacked on mobile, side by side on larger screens. */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
          <figure className="flex flex-col items-center">
            <img
              src="/premios/switch.png"
              alt={t('hero.switchAlt')}
              width={320}
              height={180}
              loading="eager"
              className="w-56 sm:w-72 h-auto rounded-2xl object-contain drop-shadow-[0_12px_30px_rgba(230,0,18,0.35)] animate-float"
            />
            <figcaption className="mt-3 font-display text-sm font-semibold text-nintendo-300">
              {t('hero.switchAlt')}
            </figcaption>
          </figure>

          <figure className="flex flex-col items-center">
            <img
              src="/premios/airpods4.png"
              alt={t('hero.airpodsAlt')}
              width={200}
              height={200}
              loading="eager"
              className="w-40 sm:w-48 h-auto rounded-2xl object-contain drop-shadow-[0_12px_30px_rgba(0,195,227,0.35)] animate-floatDelayed"
            />
            <figcaption className="mt-3 font-display text-sm font-semibold text-switchblue-300">
              {t('hero.airpodsAlt')}
            </figcaption>
          </figure>
        </div>

        {/* Price / date / lottery read from RAFFLE config. */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {chips.map((chip) => (
            <span
              key={chip.label}
              className="inline-flex flex-col items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 backdrop-blur"
            >
              <span className="text-[0.65rem] uppercase tracking-wide text-slate-400">
                {chip.label}
              </span>
              <span className="font-display text-sm font-semibold text-white">{chip.value}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Banner
