// Frontend owner whitelist — mirrored in supabase/functions/_shared/owner.ts.
// Accounts listed here have unlimited free access to every paid feature.
const OWNER_EMAILS = new Set<string>([
  "xyzdiverseservices@gmail.com",
]);

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return OWNER_EMAILS.has(email.trim().toLowerCase());
}
