import { supabase } from "@/integrations/supabase/client";

/**
 * Create an in-app notification for the current user.
 * Safe no-op if no session.
 */
export async function notify(input: {
  title: string;
  message?: string;
  type?: "info" | "success" | "warning" | "error";
  link?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("notifications").insert({
    user_id: user.id,
    title: input.title,
    message: input.message ?? null,
    type: input.type ?? "info",
    link: input.link ?? null,
  });
}
