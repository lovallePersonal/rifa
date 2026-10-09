import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RAFFLE } from '../config'

interface SearchBoxProps {
  /** Called with a valid number in range, or null when the box is cleared. */
  onSearch: (n: number | null) => void
}

/** Input to jump to / highlight a specific 3-digit number (validates 1..999). */
export function SearchBox({ onSearch }: SearchBoxProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')

  function handleChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 3)
    setValue(digits)
    if (digits === '') {
      onSearch(null)
      return
    }
    const n = Number(digits)
    if (n >= RAFFLE.numberMin && n <= RAFFLE.numberMax) {
      onSearch(n)
    } else {
      onSearch(null)
    }
  }

  return (
    <div>
      <label htmlFor="search-number" className="sr-only">
        {t('search.label')}
      </label>
      <input
        id="search-number"
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={t('search.placeholder')}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  )
}

export default SearchBox
