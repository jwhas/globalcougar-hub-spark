-- Authenticated users maintain student records and forum replies. Anonymous
-- users retain only the public access needed for discussion attribution/posts.
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.student FROM anon;
GRANT SELECT (id, name) ON public.student TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student TO authenticated;

REVOKE UPDATE, DELETE ON public.forum_reply FROM anon;
GRANT SELECT, INSERT ON public.forum_reply TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_reply TO authenticated;

DROP POLICY IF EXISTS student_insert_authenticated ON public.student;
CREATE POLICY student_insert_authenticated
  ON public.student FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS student_update_authenticated ON public.student;
CREATE POLICY student_update_authenticated
  ON public.student FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS student_delete_authenticated ON public.student;
CREATE POLICY student_delete_authenticated
  ON public.student FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS forum_reply_update_authenticated ON public.forum_reply;
CREATE POLICY forum_reply_update_authenticated
  ON public.forum_reply FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS forum_reply_delete_authenticated ON public.forum_reply;
CREATE POLICY forum_reply_delete_authenticated
  ON public.forum_reply FOR DELETE TO authenticated USING (true);
