-- Harden RLS for scheduled_posts and publishing_connections
-- 1) Drop overly broad service_role ALL policies and rebuild explicit per-command policies
--    that always require user_id ownership for authenticated users, while service_role
--    retains full access (cron worker) but only via SECURITY DEFINER context.

-- ============ scheduled_posts ============
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages scheduled posts" ON public.scheduled_posts;
DROP POLICY IF EXISTS "Users view own scheduled posts" ON public.scheduled_posts;
DROP POLICY IF EXISTS "Users insert own scheduled posts" ON public.scheduled_posts;
DROP POLICY IF EXISTS "Users update own scheduled posts" ON public.scheduled_posts;
DROP POLICY IF EXISTS "Users delete own scheduled posts" ON public.scheduled_posts;

-- Block anon entirely (defense-in-depth; no policies for anon role)
CREATE POLICY "sp_select_own"
  ON public.scheduled_posts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "sp_insert_own"
  ON public.scheduled_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sp_update_own"
  ON public.scheduled_posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sp_delete_own"
  ON public.scheduled_posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Service role explicit per-command (cron worker)
CREATE POLICY "sp_service_select" ON public.scheduled_posts FOR SELECT TO service_role USING (true);
CREATE POLICY "sp_service_insert" ON public.scheduled_posts FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "sp_service_update" ON public.scheduled_posts FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sp_service_delete" ON public.scheduled_posts FOR DELETE TO service_role USING (true);

-- ============ publishing_connections ============
ALTER TABLE public.publishing_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishing_connections FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own publishing connections" ON public.publishing_connections;
DROP POLICY IF EXISTS "Users insert own publishing connections" ON public.publishing_connections;
DROP POLICY IF EXISTS "Users update own publishing connections" ON public.publishing_connections;
DROP POLICY IF EXISTS "Users delete own publishing connections" ON public.publishing_connections;

CREATE POLICY "pc_select_own"
  ON public.publishing_connections FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "pc_insert_own"
  ON public.publishing_connections FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pc_update_own"
  ON public.publishing_connections FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pc_delete_own"
  ON public.publishing_connections FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Service role explicit per-command (verification function uses anon+JWT, but allow worker access)
CREATE POLICY "pc_service_select" ON public.publishing_connections FOR SELECT TO service_role USING (true);
CREATE POLICY "pc_service_insert" ON public.publishing_connections FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "pc_service_update" ON public.publishing_connections FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "pc_service_delete" ON public.publishing_connections FOR DELETE TO service_role USING (true);

-- Ensure user_id is NOT NULL (already is per schema, but enforce defensively)
ALTER TABLE public.scheduled_posts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.publishing_connections ALTER COLUMN user_id SET NOT NULL;