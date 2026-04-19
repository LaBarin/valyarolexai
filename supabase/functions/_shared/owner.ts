// Platform owner whitelist — these accounts have unlimited free access to all
// features across every app built on this platform. Bypasses credit charges
// and subscription paywalls entirely.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OWNER_EMAILS = new Set<string>([
  "xyzdiverseservices@gmail.com",
]);

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return OWNER_EMAILS.has(email.trim().toLowerCase());
}

/** Looks up the user's email in auth.users and checks the owner whitelist. */
export async function isOwnerUser(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
): Promise<boolean> {
  const { data } = await serviceClient.auth.admin.getUserById(userId);
  return isOwnerEmail(data?.user?.email);
}
