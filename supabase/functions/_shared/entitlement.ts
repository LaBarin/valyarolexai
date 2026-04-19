// Shared entitlement helpers for edge functions: check active subscription and
// charge credits when the user is not subscribed.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isOwnerUser } from "./owner.ts";

export type PaddleEnv = "sandbox" | "live";

const PRO_TIERS = new Set(["pro_plan", "business_plan"]);

/**
 * Returns true if the user has an active (non-canceled, non-expired) subscription
 * in the given environment.
 */
export async function isActiveSubscriber(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  env: PaddleEnv,
): Promise<boolean> {
  const { data } = await serviceClient
    .from("subscriptions")
    .select("status, current_period_end, cancel_at_period_end, product_id")
    .eq("user_id", userId)
    .eq("environment", env)
    .maybeSingle();

  if (!data) return false;
  if (!["active", "trialing"].includes(data.status)) return false;
  if (data.cancel_at_period_end) return false;
  if (data.current_period_end && new Date(data.current_period_end) <= new Date()) return false;
  return PRO_TIERS.has(data.product_id);
}

/**
 * Charges credits unless the user is an active subscriber.
 * Returns { ok: true } when allowed, { ok: false, reason } when blocked.
 */
export async function chargeOrSubscribe(opts: {
  userId: string;
  amount: number;
  description: string;
  env: PaddleEnv;
}): Promise<{ ok: true } | { ok: false; reason: "insufficient_credits" }> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Platform owners get unlimited free access — never charged credits.
  if (await isOwnerUser(supabase, opts.userId)) {
    return { ok: true };
  }

  if (await isActiveSubscriber(supabase, opts.userId, opts.env)) {
    return { ok: true };
  }

  const { data, error } = await supabase.rpc("spend_credits", {
    p_user_id: opts.userId,
    p_amount: opts.amount,
    p_description: opts.description,
  });

  if (error) {
    console.error("spend_credits error:", error);
    return { ok: false, reason: "insufficient_credits" };
  }
  if (data === false) {
    return { ok: false, reason: "insufficient_credits" };
  }
  return { ok: true };
}

/** Best-effort refund used when a charged operation fails afterwards. */
export async function refundCredits(userId: string, amount: number, description: string) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  await supabase.rpc("grant_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_type: "refund",
    p_description: description,
  });
}

/** Derive sandbox/live from the request (frontend posts it). */
export function envFromRequest(input: { environment?: string } | undefined): PaddleEnv {
  return input?.environment === "live" ? "live" : "sandbox";
}
