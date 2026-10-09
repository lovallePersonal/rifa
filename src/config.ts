// Centralized app configuration for the raffle (Rifa) app.
// All values are documented. Keep user-facing strings OUT of this file (those live in i18n).

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
 * TESTING PHASE: all purchase-intent notifications go to the test number 573143933641 only.
 * To go live later, change this ONE line to WHATSAPP_NUMBERS.jaco (or .pipe).
 */
export const WHATSAPP_ACTIVE_DESTINATION: string = WHATSAPP_NUMBERS.test

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
