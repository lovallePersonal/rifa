import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SoldBy, Status, Ticket } from '../types'
import { RAFFLE, format3 } from '../config'
import StatusBadge from './StatusBadge'

const SELLERS: SoldBy[] = ['Felipe', 'Pipe']
const STATUSES: Status[] = ['available', 'reserved', 'paid']

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount)
}

interface AdminTableProps {
  tickets: Ticket[]
  onMarkPaid: (n: number) => Promise<void>
  onRelease: (n: number) => Promise<void>
  onSetSeller: (n: number, seller: SoldBy) => Promise<void>
}

/**
 * Full admin table over the base tickets rows: buyer data, status + seller
 * filters, per-seller sales totals, and inline row actions.
 */
export function AdminTable({ tickets, onMarkPaid, onRelease, onSetSeller }: AdminTableProps) {
  const { t } = useTranslation()
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [sellerFilter, setSellerFilter] = useState<SoldBy | 'all'>('all')

  const filtered = useMemo(() => {
    return tickets.filter((ti) => {
      if (statusFilter !== 'all' && ti.status !== statusFilter) return false
      if (sellerFilter !== 'all' && ti.sold_by !== sellerFilter) return false
      return true
    })
  }, [tickets, statusFilter, sellerFilter])

  const perSeller = useMemo(() => {
    return SELLERS.map((seller) => {
      const soldByThis = tickets.filter((ti) => ti.sold_by === seller)
      const paid = soldByThis.filter((ti) => ti.status === 'paid').length
      const sold = soldByThis.filter((ti) => ti.status === 'paid' || ti.status === 'reserved').length
      return { seller, sold, paid, raised: paid * RAFFLE.ticketPriceCOP }
    })
  }, [tickets])

  return (
    <section className="space-y-4">
      {/* Per-seller totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {perSeller.map((s) => (
          <div
            key={s.seller}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
          >
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {t('admin.perSellerTotal')}: {s.seller}
            </div>
            <div className="text-sm text-gray-900 dark:text-gray-100">
              {t('counters.sold')}: {s.sold} · {t('counters.paid')}: {s.paid} ·{' '}
              {t('counters.raised')}: {formatCOP(s.raised)}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <label className="text-sm text-gray-700 dark:text-gray-300">
          {t('admin.filters.status')}:{' '}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Status | 'all')}
            className="ml-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1"
          >
            <option value="all">{t('admin.filters.all')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-gray-700 dark:text-gray-300">
          {t('admin.filters.seller')}:{' '}
          <select
            value={sellerFilter}
            onChange={(e) => setSellerFilter(e.target.value as SoldBy | 'all')}
            className="ml-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1"
          >
            <option value="all">{t('admin.filters.all')}</option>
            {SELLERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-left text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-3 py-2">{t('admin.table.number')}</th>
              <th className="px-3 py-2">{t('admin.table.status')}</th>
              <th className="px-3 py-2">{t('admin.table.buyer')}</th>
              <th className="px-3 py-2">{t('admin.table.phone')}</th>
              <th className="px-3 py-2">{t('admin.table.email')}</th>
              <th className="px-3 py-2">{t('admin.table.soldBy')}</th>
              <th className="px-3 py-2">{t('admin.table.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((ti) => (
              <tr key={ti.number} className="text-gray-900 dark:text-gray-100">
                <td className="px-3 py-2 font-mono">{format3(ti.number)}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={ti.status} />
                </td>
                <td className="px-3 py-2">{ti.buyer_name ?? '—'}</td>
                <td className="px-3 py-2">{ti.buyer_phone ?? '—'}</td>
                <td className="px-3 py-2">{ti.buyer_email ?? '—'}</td>
                <td className="px-3 py-2">
                  <select
                    value={ti.sold_by ?? ''}
                    onChange={(e) =>
                      e.target.value && onSetSeller(ti.number, e.target.value as SoldBy)
                    }
                    className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1"
                  >
                    <option value="">—</option>
                    {SELLERS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    {ti.status !== 'paid' && (
                      <button
                        type="button"
                        onClick={() => onMarkPaid(ti.number)}
                        className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                      >
                        {t('admin.markPaid')}
                      </button>
                    )}
                    {ti.status !== 'available' && (
                      <button
                        type="button"
                        onClick={() => onRelease(ti.number)}
                        className="rounded bg-gray-500 px-2 py-1 text-xs font-medium text-white hover:bg-gray-600"
                      >
                        {t('admin.release')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default AdminTable
