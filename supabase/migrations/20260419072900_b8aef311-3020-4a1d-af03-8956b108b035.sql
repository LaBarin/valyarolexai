-- Revoke credit-modifying RPCs from end-users; only service role may call them.
REVOKE EXECUTE ON FUNCTION public.grant_credits(uuid, integer, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_credits(uuid, integer, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.spend_credits(uuid, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spend_credits(uuid, integer, text) TO service_role;

-- Ensure email_send_log is not readable by anon/authenticated. Drop any permissive policies
-- and rely on service-role bypass only.
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'email_send_log'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.email_send_log', pol.policyname);
  END LOOP;
END $$;

REVOKE ALL ON public.email_send_log FROM anon, authenticated;
