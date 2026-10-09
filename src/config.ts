// Centralized app configuration for the raffle (Rifa) app.
// All values are documented. Keep user-facing strings OUT of this file (those live in i18n).

import type { SoldBy } from './types'

/**
 * Allow-list of administrator emails.
 * IMPORTANT: all stored lowercased. The allow-list MUST be compared case-insensitively
 * (use isAdminEmail() below, which lowercases its argument before checking membership).
 */
export const ADMIN_EMAILS: readonly string[] = [
  'leandroovalle02@gmail.com', // owner / test admin
  'jacoboovallegiraldo@gmail.com', // Jaco (admin)
  'juan.feliperodriguezgarcia1508@gmail.com', // Felipe aka "Pipe" (admin)
]

/**
 * Case-insensitive admin check. Lowercases the incoming email and tests membership
 * against ADMIN_EMAILS (which are stored lowercased). Used for client-side gating.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.trim().toLowerCase())
}

/**
 * WhatsApp destination numbers in international format (country code 57 = Colombia, no '+').
 */
export const WHATSAPP_NUMBERS = {
  jaco: '573125556018', // Jaco's WhatsApp
  pipe: '573115469638', // Pipe's (Felipe) WhatsApp
  test: '573143933641', // User's own number used for the TESTING phase
} as const

/**
 * Fallback / default WhatsApp destination.
 * NOTE: the PUBLIC purchase flow no longer relies on this static value. Each
 * public visit resolves its seller from the ?v= query param via resolveSeller()
 * below, and the reserve flow opens WhatsApp to THAT seller's number. This
 * constant is kept only as a jaco-era fallback; per-visit resolution supersedes
 * it for the public flow.
 */
export const WHATSAPP_ACTIVE_DESTINATION: string = WHATSAPP_NUMBERS.jaco

/** The two public seller link keys (lowercase, used in the ?v= query param). */
export type SellerKey = 'jaco' | 'pipe'

/** Resolved seller identity for a public visit: the DB label + the WhatsApp number. */
export interface ResolvedSeller {
  sellerLabel: SoldBy // 'Jaco' | 'Pipe' — written to tickets.sold_by
  whatsappNumber: string // from WHATSAPP_NUMBERS, international format, no '+'
}

/**
 * Resolve a raw ?v= query value into a seller. Case-insensitive; trims.
 * Any missing/unknown value SAFE-DEFAULTS to 'jaco' so a bad or absent link
 * (e.g. a bare "/" with no param) still routes the sale to a real seller (Jaco).
 * Declared AFTER WHATSAPP_NUMBERS because it references it.
 */
export function resolveSeller(key: string | null | undefined): ResolvedSeller {
  const k = (key ?? '').trim().toLowerCase()
  if (k === 'pipe') return { sellerLabel: 'Pipe', whatsappNumber: WHATSAPP_NUMBERS.pipe }
  // default + explicit 'jaco'
  return { sellerLabel: 'Jaco', whatsappNumber: WHATSAPP_NUMBERS.jaco }
}

/**
 * Raffle parameters.
 */
export const RAFFLE = {
  ticketPriceCOP: 10000, // price per number in Colombian pesos (COP)
  drawDate: '2026-10-29', // date the raffle is played (ISO yyyy-mm-dd)
  prize: 'Nintendo Switch + AirPods 4', // the prize on offer
  numberMin: 1, // first number available (inclusive)
  numberMax: 999, // last number available (inclusive)
  lotteryName: 'Loteria de Bogota', // lottery whose last 3 digits decide the winner
} as const

/**
 * Zero-pad a raffle number to a 3-digit string, e.g. 7 -> "007", 999 -> "999".
 */
export function format3(n: number): string {
  return String(n).padStart(3, '0')
}
