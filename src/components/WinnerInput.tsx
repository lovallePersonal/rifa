import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Ticket } from '../types'
import { RAFFLE, format3 } from '../config'

interface WinnerInputProps {
  tickets: Ticket[]
  /** Marks the given number as the winner (update tickets set is_winner=true). */
  onSetWinner: (n: number) => Promise<void>
}

/** Input for the 3 winning digits; shows the winning buyer when set. */
export function WinnerInput({ tickets, onSetWinner }: WinnerInputProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const winner = tickets.find((ti) => ti.is_winner) ?? null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = Number(value)
    if (!value || Number.isNaN(n) || n < RAFFLE.numberMin || n > RAFFLE.numberMax) {
      setError(t('reserve.validation.phoneInvalid'))
      return
    }
    setError(null)
    await onSetWinner(n)
    setValue('')
  }

  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {t('winner.label')}
      </h3>

      <form className="mt-2 flex gap-2" onSubmit={handleSubmit}>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 3))}
          placeholder={t('winner.placeholder')}
          className="w-40 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {t('winner.set')}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
        {winner ? (
          <div>
            <p className="font-medium">{t('winner.result', { number: format3(winner.number) })}</p>
            <p className="text-gray-600 dark:text-gray-400">
              {winner.buyer_name ?? '—'}
              {winner.buyer_phone ? ` · ${winner.buyer_phone}` : ''}
              {winner.buyer_email ? ` · ${winner.buyer_email}` : ''}
            </p>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">{t('winner.none')}</p>
        )}
      </div>
    </section>
  )
}

export default WinnerInput
