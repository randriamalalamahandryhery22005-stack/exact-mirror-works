-- Apply this SQL in your Supabase project (SQL Editor) to fix the
-- internal support chat so that:
--   * a user's conversation is visible to them right after creation
--   * admins can read and reply to every support conversation

-- Creator can always see their conversation (needed for INSERT ... RETURNING
-- and for the initial lookup before conversation_members rows exist).
DROP POLICY IF EXISTS "creator views conversation" ON public.conversations;
CREATE POLICY "creator views conversation" ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = created_by);

-- Admins can see and update every conversation.
DROP POLICY IF EXISTS "admins view all conversations" ON public.conversations;
CREATE POLICY "admins view all conversations" ON public.conversations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins update all conversations" ON public.conversations;
CREATE POLICY "admins update all conversations" ON public.conversations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can see every membership row.
DROP POLICY IF EXISTS "admins view all members" ON public.conversation_members;
CREATE POLICY "admins view all members" ON public.conversation_members FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can read and send messages in any conversation.
DROP POLICY IF EXISTS "admins read all messages" ON public.messages;
CREATE POLICY "admins read all messages" ON public.messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins send messages" ON public.messages;
CREATE POLICY "admins send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));
