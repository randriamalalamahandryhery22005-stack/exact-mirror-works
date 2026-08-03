-- 1. Demandes d'examen des comptes restreints
CREATE TABLE IF NOT EXISTS public.account_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft',
  step integer NOT NULL DEFAULT 1,
  id_photo_path text,
  personal_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  confirmed boolean NOT NULL DEFAULT false,
  reject_reason text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_reviews TO authenticated;
GRANT ALL ON public.account_reviews TO service_role;
ALTER TABLE public.account_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own review select" ON public.account_reviews;
CREATE POLICY "own review select" ON public.account_reviews FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "own review insert" ON public.account_reviews;
CREATE POLICY "own review insert" ON public.account_reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "own review update" ON public.account_reviews;
CREATE POLICY "own review update" ON public.account_reviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "admin review delete" ON public.account_reviews;
CREATE POLICY "admin review delete" ON public.account_reviews FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_account_reviews_updated_at ON public.account_reviews;
CREATE TRIGGER update_account_reviews_updated_at BEFORE UPDATE ON public.account_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Empêche un compte non admin de s'auto-valider
CREATE OR REPLACE FUNCTION public.account_reviews_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status NOT IN ('draft','pending') THEN NEW.status := OLD.status; END IF;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.reject_reason := OLD.reject_reason;
  ELSE
    NEW.status := 'draft';
    NEW.reviewed_at := NULL; NEW.reviewed_by := NULL; NEW.reject_reason := NULL;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS account_reviews_guard_trg ON public.account_reviews;
CREATE TRIGGER account_reviews_guard_trg BEFORE INSERT OR UPDATE ON public.account_reviews
  FOR EACH ROW EXECUTE FUNCTION public.account_reviews_guard();

-- 2. Limite de comptes par appareil + détection d'informations dupliquées
CREATE OR REPLACE FUNCTION public.device_account_count(_device_id text)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(DISTINCT user_id)::int FROM public.device_accounts WHERE device_id = _device_id;
$$;
GRANT EXECUTE ON FUNCTION public.device_account_count(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.register_device_account(_device_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR COALESCE(_device_id,'') = '' THEN RETURN; END IF;
  INSERT INTO public.device_accounts (device_id, user_id)
  VALUES (_device_id, auth.uid())
  ON CONFLICT DO NOTHING;
END; $$;
GRANT EXECUTE ON FUNCTION public.register_device_account(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.profile_info_conflict(_name text, _phone text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id <> COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
        (COALESCE(_name,'') <> '' AND lower(btrim(COALESCE(p.full_name, p.name, ''))) = lower(btrim(_name)))
        OR (COALESCE(_phone,'') <> '' AND regexp_replace(COALESCE(p.phone,''), '\D', '', 'g') = regexp_replace(_phone, '\D', '', 'g')
            AND regexp_replace(_phone, '\D', '', 'g') <> '')
      )
  );
$$;
GRANT EXECUTE ON FUNCTION public.profile_info_conflict(text, text) TO authenticated;

-- 3. Correctifs de sécurité
ALTER VIEW public.public_profiles SET (security_invoker = on);

DROP POLICY IF EXISTS "J&H Store write" ON storage.objects;
DROP POLICY IF EXISTS "J&H Store update" ON storage.objects;
DROP POLICY IF EXISTS "J&H Store delete" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view payment proofs" ON storage.objects;
