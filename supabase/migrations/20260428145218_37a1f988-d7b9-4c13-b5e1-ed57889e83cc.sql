CREATE TABLE public.publishing_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL,
  display_name text NOT NULL,
  account_id text,
  credentials jsonb NOT NULL DEFAULT '{}'::jsonb,
  required_scopes text[] NOT NULL DEFAULT '{}',
  granted_scopes text[] NOT NULL DEFAULT '{}',
  verification_status text NOT NULL DEFAULT 'unverified',
  last_verified_at timestamptz,
  verification_error text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.publishing_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own publishing connections" ON public.publishing_connections
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own publishing connections" ON public.publishing_connections
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own publishing connections" ON public.publishing_connections
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own publishing connections" ON public.publishing_connections
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_pub_conn_user_platform ON public.publishing_connections (user_id, platform);

CREATE TRIGGER update_publishing_connections_updated_at
  BEFORE UPDATE ON public.publishing_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();