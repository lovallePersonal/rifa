import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SoldBy, Status, Ticket } from '../types'
import { format3 } from '../config'

const STATUSES: Status[] = ['available', 'reserved', 'paid']
const SELLERS: SoldBy[] = ['Felipe', 'Pipe']

interface EditTicketModalProps {
  ticket: Ticket
  onClose: () => void
  /**
   * Persists the edited fields. The caller (AdminView) derives the final
   * timestamps/cleanup from this patch and writes to the base tickets table.
   */
  onSave: (patch: Partial<Ticket>) => Promise<void>
}

/**
 * Admin edit form for a single ticket (Features 1 and 2). It edits buyer data,
 * status and seller. It never touches Supabase directly: the write lives in
 * AdminView to keep the privacy boundary. Opening it on an 'available' row acts
 * as the "register sale" entry point.
 */
export function EditTicketModal({ ticket, onClose, onSave }: EditTicketModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(ticket.buyer_name ?? '')
  const [phone, setPhone] = useState(ticket.buyer_phone ?? '')
  const [email, setEmail] = useState(ticket.buyer_email ?? '')
  const [status, setStatus] = useState<Status>(ticket.status)
  const [soldBy, setSoldBy] = useState<SoldBy | ''>(ticket.sold_by ?? '')
  const [warning, setWarning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isRegister = ticket.status === 'available'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Light validation: reserved/paid should carry at least a buyer name (warn, do not block).
    if ((status === 'reserved' || status === 'paid') && !name.trim()) {
      setWarning(t('admin.edit.validation.nameForStatus'))
    } else {
      setWarning(null)
    }

    const patch: Partial<Ticket> = {
      status,
      buyer_name: name.trim() || null,
      buyer_phone: phone.trim() || null,
      buyer_email: email.trim() || null,
      sold_by: soldBy || null,
    }

    setSubmitting(true)
    try {
      await onSave(patch)
      onClose()
    } catch {
      setError(t('admin.edit.saveError'))
    } finally {
      setSubmitting(false)
    }
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
          {isRegister
            ? t('admin.edit.registerTitle', { number: format3(ticket.number) })
            : t('admin.edit.title', { number: format3(ticket.number) })}
        </h2>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="e-status" className="block text-sm text-gray-700 dark:text-gray-300">
              {t('admin.edit.statusLabel')}
            </label>
            <select
              id="e-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="e-seller" className="block text-sm text-gray-700 dark:text-gray-300">
              {t('admin.edit.sellerLabel')}
            </label>
            <select
              id="e-seller"
              value={soldBy}
              onChange={(e) => setSoldBy(e.target.value as SoldBy | '')}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">{t('admin.edit.sellerNone')}</option>
              {SELLERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="e-name" className="block text-sm text-gray-700 dark:text-gray-300">
              {t('admin.edit.nameLabel')}
            </label>
            <input
              id="e-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label htmlFor="e-phone" className="block text-sm text-gray-700 dark:text-gray-300">
              {t('admin.edit.phoneLabel')}
            </label>
            <input
              id="e-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label htmlFor="e-email" className="block text-sm text-gray-700 dark:text-gray-300">
              {t('admin.edit.emailLabel')}
            </label>
            <input
              id="e-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {warning && <p className="text-sm text-amber-600 dark:text-amber-400">{warning}</p>}
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {t('admin.edit.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {t('admin.edit.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditTicketModal
