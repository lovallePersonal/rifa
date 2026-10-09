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
  const [reserved, setReserved] = useState(false)
  const [waUrl, setWaUrl] = useState('')

  // Snapshot the numbers on first mount so the modal keeps showing them even
  // after the parent clears the live selection on a successful reservation.
  const [sorted] = useState(() => [...numbers].sort((a, b) => a - b))
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

  function buildWaUrl(): string {
    const message = t('whatsapp.messageTemplateMulti', {
      numbers: formattedNumbers,
      name: name.trim(),
      phone: phone.trim(),
    })
    return `https://wa.me/${WHATSAPP_ACTIVE_DESTINATION}?text=${encodeURIComponent(message)}`
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

    const url = buildWaUrl()
    setWaUrl(url)
    setReserved(true)
    onReserved()
    onSuccess?.()
    // Best-effort auto-open; this is NOT the primary path (it may be popup-blocked
    // because it runs after the awaited RPC). The real anchor below is the reliable
    // user-gesture path. We never depend on this call succeeding.
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-ink-850 dark:ring-1 dark:ring-white/10 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white dark:font-display">
          {reserved ? t('reserve.whatsapp.successTitle') : t('public.multi.title')}
        </h2>
        <p className="mt-1 text-sm font-mono text-gray-600 dark:text-switchblue-200">
          {formattedNumbers}
        </p>

        {reserved ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-700 dark:text-slate-300">
              {t('reserve.whatsapp.reservedLine', { numbers: formattedNumbers })}
            </p>
            <p className="text-sm text-gray-700 dark:text-slate-300">
              {t('reserve.whatsapp.instructions')}
            </p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-xl bg-brand-600 dark:bg-gradient-to-r dark:from-nintendo-500 dark:to-switchblue-500 px-4 py-3 text-center text-base font-bold text-white shadow-lg shadow-nintendo-500/20 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-switchblue-400 focus:ring-offset-2 dark:focus:ring-offset-ink-950"
            >
              {t('reserve.whatsapp.openButton')}
            </a>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {t('reserve.whatsapp.autoOpenNote')}
            </p>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                {t('reserve.whatsapp.done')}
              </button>
            </div>
          </div>
        ) : (
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="r-name" className="block text-sm text-gray-700 dark:text-slate-300">
              {t('reserve.nameLabel')}
            </label>
            <input
              id="r-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('reserve.namePlaceholder')}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-ink-800/70 px-3 py-2 text-gray-900 dark:text-white dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-switchblue-400"
            />
          </div>

          <div>
            <label htmlFor="r-phone" className="block text-sm text-gray-700 dark:text-slate-300">
              {t('reserve.phoneLabel')}
            </label>
            <input
              id="r-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('reserve.phonePlaceholder')}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-ink-800/70 px-3 py-2 text-gray-900 dark:text-white dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-switchblue-400"
            />
          </div>

          <div>
            <label htmlFor="r-email" className="block text-sm text-gray-700 dark:text-slate-300">
              {t('reserve.emailLabel')}
            </label>
            <input
              id="r-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('reserve.emailPlaceholder')}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-ink-800/70 px-3 py-2 text-gray-900 dark:text-white dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-switchblue-400"
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/10"
            >
              {t('reserve.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-brand-600 dark:bg-gradient-to-r dark:from-nintendo-500 dark:to-switchblue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 dark:hover:opacity-90 disabled:opacity-60"
            >
              {t('reserve.submit')}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}

export default ReserveModal
