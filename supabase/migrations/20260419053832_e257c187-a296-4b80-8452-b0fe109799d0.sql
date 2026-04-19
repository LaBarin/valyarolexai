-- 1. Track monthly grant on subscriptions if needed (lightweight - we'll grant via tx log)
ALTER TABLE public.user_credits
  ADD COLUMN IF NOT EXISTS last_monthly_grant_at timestamptz;

-- 2. Atomic spend function (server-side only via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.spend_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Ensure row exists, lock it
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance INTO v_balance
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance < p_amount THEN
    RETURN false;
  END IF;

  UPDATE public.user_credits
  SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -p_amount, 'spend', p_description);

  RETURN true;
END;
$$;

-- 3. Grant function for service role (subscription monthly grants, refunds, etc.)
CREATE OR REPLACE FUNCTION public.grant_credits(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_description text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  INSERT INTO public.user_credits (user_id, balance, last_monthly_grant_at)
  VALUES (p_user_id, p_amount, CASE WHEN p_type = 'monthly_grant' THEN now() ELSE NULL END)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = user_credits.balance + p_amount,
      last_monthly_grant_at = CASE WHEN p_type = 'monthly_grant' THEN now() ELSE user_credits.last_monthly_grant_at END,
      updated_at = now();

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, p_type, p_description);
END;
$$;

-- Make sure unique constraint exists on user_credits.user_id (needed for ON CONFLICT)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_credits_user_id_key'
  ) THEN
    ALTER TABLE public.user_credits ADD CONSTRAINT user_credits_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 4. Cancellation = immediate revoke. Update has_active_subscription.
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'live')
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
      AND environment = check_env
      AND status IN ('active', 'trialing')
      AND COALESCE(cancel_at_period_end, false) = false
      AND (current_period_end IS NULL OR current_period_end > now())
  );
$$;

-- 5. handle_new_user: seed profile + starter credits, attach trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_credits (user_id, balance)
  VALUES (NEW.id, 25)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (NEW.id, 25, 'signup_bonus', 'Welcome bonus');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Lock down user_credits: remove user-side UPDATE policy (only service role + SECURITY DEFINER fns can mutate)
DROP POLICY IF EXISTS "Users update own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users insert own credits" ON public.user_credits;

-- Service role full access (defense layer)
DROP POLICY IF EXISTS "Service role manages credits" ON public.user_credits;
CREATE POLICY "Service role manages credits"
  ON public.user_credits FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Same for credit_transactions: only service role / SECURITY DEFINER can write
DROP POLICY IF EXISTS "Users insert own transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Service role manages transactions" ON public.credit_transactions;
CREATE POLICY "Service role manages transactions"
  ON public.credit_transactions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');