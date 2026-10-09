import type { Ticket } from '../types'
import { format3 } from '../config'

const HEADERS = [
  'number',
  'status',
  'buyer_name',
  'buyer_phone',
  'buyer_email',
  'sold_by',
  'is_winner',
  'reserved_at',
  'paid_at',
] as const

/** Quote a CSV field (RFC 4180): wrap in quotes and double any inner quotes. */
function escapeCsv(value: string | number | boolean | null): string {
  const s = value === null || value === undefined ? '' : String(value)
  return `"${s.replace(/"/g, '""')}"`
}

/** Build the CSV text for the given tickets (admin data, all columns). */
export function ticketsToCsv(tickets: Ticket[]): string {
  const lines = [HEADERS.join(',')]
  for (const ti of tickets) {
    lines.push(
      [
        escapeCsv(format3(ti.number)),
        escapeCsv(ti.status),
        escapeCsv(ti.buyer_name),
        escapeCsv(ti.buyer_phone),
        escapeCsv(ti.buyer_email),
        escapeCsv(ti.sold_by),
        escapeCsv(ti.is_winner),
        escapeCsv(ti.reserved_at),
        escapeCsv(ti.paid_at),
      ].join(','),
    )
  }
  return lines.join('\r\n')
}

/** Trigger a client-side download of the tickets as a CSV file. */
export function downloadTicketsCsv(tickets: Ticket[], filename = 'rifa.csv'): void {
  const csv = ticketsToCsv(tickets)
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
