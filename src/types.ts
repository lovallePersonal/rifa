// Shared TypeScript types for the raffle app.
// These literals MUST match the Supabase SQL definitions (FEAT-002):
//   status  -> 'available' | 'reserved' | 'paid'
//   sold_by -> 'Felipe' | 'Pipe'

export type Status = 'available' | 'reserved' | 'paid'

export type SoldBy = 'Felipe' | 'Pipe'

/** Full ticket row as stored in the base `tickets` table (admin-only access). */
export interface Ticket {
  number: number
  status: Status
  buyer_name: string | null
  buyer_phone: string | null
  buyer_email: string | null
  sold_by: SoldBy | null
  reserved_at: string | null
  paid_at: string | null
  is_winner: boolean
  created_at: string
  updated_at: string
}

/** Minimal ticket shape exposed publicly via the `public_tickets` view. */
export interface PublicTicket {
  number: number
  status: Status
  is_winner: boolean
}
