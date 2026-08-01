DROP POLICY IF EXISTS "Authenticated can read protected admins" ON public.protected_admins;
DROP POLICY IF EXISTS "Admins can read protected admins" ON public.protected_admins;
CREATE POLICY "Admins can read protected admins"
ON public.protected_admins
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));