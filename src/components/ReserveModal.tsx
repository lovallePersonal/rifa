import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { WHATSAPP_ACTIVE_DESTINATION, format3 } from '../config'

interface ReserveModalProps {
  /** The numbers being reserved (1..999), all-or-nothing. */
  numbers: number[]
  onClose: () => void
  /** Refetch the grid (called on both success and conflict to reflect availability). */
  onReserved: () => void
  /** Called only on a fully successful reservation (e.g. to clear the selection). */
  onSuccess?: () => void
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Shared reservation form for one or many numbers. On submit it calls the
 * SECURITY DEFINER RPC reserve_tickets (atomic, all-or-nothing); on success it
 * opens a single WhatsApp (wa.me) link to WHATSAPP_ACTIVE_DESTINATION listing
 * all reserved numbers so an admin is notified of the purchase intent.
 */
export function ReserveModal({ numbers, onClose, onReserved, onSuccess }: ReserveModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const sorted = [...numbers].sort((a, b) => a - b)
  const formattedNumbers = sorted.map(format3).join(', ')

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
    const message = t('whatsapp.messageTemplateMulti', {
      numbers: formattedNumbers,
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
    const { data, error: rpcError } = await supabase.rpc('reserve_tickets', {
      p_numbers: sorted,
      p_name: name.trim(),
      p_phone: phone.trim(),
      p_email: email.trim() || null,
    })
    setSubmitting(false)

    // RETURNS TABLE(...) -> supabase-js returns an array of rows; take the first.
    const result = (data as { success: boolean; conflicts: number[] }[] | null)?.[0]

    if (rpcError || !result) {
      setError(t('reserve.error'))
      return
    }

    if (!result.success) {
      const conflicts = (result.conflicts ?? []).map(format3).join(', ')
      setError(t('public.multi.conflictError', { numbers: conflicts }))
      onReserved() // refetch so the grid reflects the current availability
      return
    }

    openWhatsApp()
    onReserved()
    onSuccess?.()
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
          {t('public.multi.title')}
        </h2>
        <p className="mt-1 text-sm font-mono text-gray-600 dark:text-gray-300">
          {formattedNumbers}
        </p>

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
