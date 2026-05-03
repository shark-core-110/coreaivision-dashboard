/**
 * Canonical list of admin accounts.
 * Shariq / Shark — same person, multiple emails.
 */
const ADMIN_EMAILS = new Set([
  'shark@coreaivision.com',
  '07shariq@gmail.com',
])

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.has(email.toLowerCase().trim())
}
