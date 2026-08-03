ALTER TABLE public.global_chat_messages
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS private_with uuid REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS global_chat_private_idx ON public.global_chat_messages (private_with, created_at DESC);

-- Visibilité : salon public pour tous, messages privés réservés aux 2 parties (+ admin)
DROP POLICY IF EXISTS "Authenticated can read global chat" ON public.global_chat_messages;
CREATE POLICY "Read public room or own private" ON public.global_chat_messages FOR SELECT TO authenticated
  USING (
    private_with IS NULL
    OR auth.uid() = user_id
    OR auth.uid() = private_with
    OR public.has_role(auth.uid(), 'admin')
  );

-- Envoi : uniquement en son nom ; un message privé doit impliquer un administrateur
DROP POLICY IF EXISTS "Authenticated can send messages" ON public.global_chat_messages;
CREATE POLICY "Send own messages" ON public.global_chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      private_with IS NULL
      OR (
        private_with <> user_id
        AND (public.has_role(auth.uid(), 'admin') OR public.has_role(private_with, 'admin'))
      )
    )
  );

-- Modification de ses propres messages
DROP POLICY IF EXISTS "Authors can edit own messages" ON public.global_chat_messages;
CREATE POLICY "Authors can edit own messages" ON public.global_chat_messages FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.global_chat_edit_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.user_id := OLD.user_id;
  NEW.private_with := OLD.private_with;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS global_chat_edit_guard_trg ON public.global_chat_messages;
CREATE TRIGGER global_chat_edit_guard_trg BEFORE UPDATE ON public.global_chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.global_chat_edit_guard();
