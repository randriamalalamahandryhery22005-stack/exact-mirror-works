CREATE TABLE IF NOT EXISTS public.device_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_info text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_id, user_id)
);

CREATE INDEX IF NOT EXISTS device_accounts_device_idx ON public.device_accounts(device_id);

GRANT SELECT, INSERT ON public.device_accounts TO authenticated;
GRANT ALL ON public.device_accounts TO service_role;

ALTER TABLE public.device_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "device_accounts_own_select" ON public.device_accounts;
CREATE POLICY "device_accounts_own_select" ON public.device_accounts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "device_accounts_own_insert" ON public.device_accounts;
CREATE POLICY "device_accounts_own_insert" ON public.device_accounts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.device_accounts_limit_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  used int;
BEGIN
  SELECT count(DISTINCT user_id) INTO used
  FROM public.device_accounts
  WHERE device_id = NEW.device_id AND user_id <> NEW.user_id;
  IF used >= 2 THEN
    RAISE EXCEPTION 'DEVICE_ACCOUNT_LIMIT: limite de 2 comptes par appareil atteinte';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS device_accounts_limit ON public.device_accounts;
CREATE TRIGGER device_accounts_limit
  BEFORE INSERT ON public.device_accounts
  FOR EACH ROW EXECUTE FUNCTION public.device_accounts_limit_guard();

CREATE OR REPLACE FUNCTION public.device_accounts_used(_device_id text)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(DISTINCT user_id)::int
  FROM public.device_accounts
  WHERE device_id = _device_id;
$$;

GRANT EXECUTE ON FUNCTION public.device_accounts_used(text) TO anon, authenticated;