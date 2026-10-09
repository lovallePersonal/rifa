import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { WHATSAPP_ACTIVE_DESTINATION, format3 } from '../config'

interface ReserveModalProps {
  /** The number being reserved (1..999). */
  number: number
  onClose: () => void
  /** Called after a successful reservation so the grid can refetch. */
  onReserved: () => void
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Reservation form. On submit it calls the SECURITY DEFINER RPC reserve_ticket;
 * on success it opens a WhatsApp (wa.me) link to WHATSAPP_ACTIVE_DESTINATION with
 * a Spanish prefilled message so an admin is notified of the purchase intent.
 */
export function ReserveModal({ number, onClose, onReserved }: ReserveModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function validate(): boolean {
    if (!name.trim()) {
      setError(t('reserve.validation.nameRequired'))
      return false
    }
    if (!phone.trim()) {
      setError(t('reserve.validation.phoneRequired'))
      return false
    }
    if (!/^\+?\d[\d\s-]{5,}$/.test(phone.trim())) {
      setError(t('reserve.validation.phoneInvalid'))
      return false
    }
    if (email.trim() && !EMAIL_RE.test(email.trim())) {
      setError(t('reserve.validation.emailInvalid'))
      return false
    }
    setError(null)
    return true
  }

  function openWhatsApp() {
    const message = t('whatsapp.messageTemplate', {
      number: format3(number),
      name: name.trim(),
      phone: phone.trim(),
    })
    const url = `https://wa.me/${WHATSAPP_ACTIVE_DESTINATION}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    const { data, error: rpcError } = await supabase.rpc('reserve_ticket', {
      p_number: number,
      p_name: name.trim(),
      p_phone: phone.trim(),
      p_email: email.trim() || null,
    })
    setSubmitting(false)

    if (rpcError || data !== true) {
      setError(t('reserve.error'))
      return
    }

    openWhatsApp()
    onReserved()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t('reserve.title', { number: format3(number) })}
        </h2>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="r-name" className="block text-sm text-gray-700 dark:text-gray-300">
              {t('reserve.nameLabel')}
            </label>
            <input
              id="r-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('reserve.namePlaceholder')}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label htmlFor="r-phone" className="block text-sm text-gray-700 dark:text-gray-300">
              {t('reserve.phoneLabel')}
            </label>
            <input
              id="r-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('reserve.phonePlaceholder')}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label htmlFor="r-email" className="block text-sm text-gray-700 dark:text-gray-300">
              {t('reserve.emailLabel')}
            </label>
            <input
              id="r-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('reserve.emailPlaceholder')}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {t('reserve.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {t('reserve.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReserveModal
