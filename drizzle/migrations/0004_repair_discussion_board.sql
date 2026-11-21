-- Repair partially provisioned Lovable Cloud discussion tables without
-- replacing or deleting any existing class-demo data.
CREATE TABLE IF NOT EXISTS public.student (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL DEFAULT '',
  home_country text NOT NULL DEFAULT '',
  situations text NOT NULL DEFAULT '',
  semester text NOT NULL DEFAULT '',
  account_start_date date,
  us_arrival_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forum_thread (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id integer NOT NULL REFERENCES public.student(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  topic text NOT NULL DEFAULT 'Campus Life',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forum_reply (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  thread_id integer NOT NULL REFERENCES public.forum_thread(id) ON DELETE CASCADE,
  student_id integer NOT NULL REFERENCES public.student(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.student, public.forum_thread, public.forum_reply TO anon, authenticated;
REVOKE INSERT ON public.forum_thread, public.forum_reply FROM anon;
GRANT INSERT ON public.forum_thread, public.forum_reply TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON public.student, public.forum_thread, public.forum_reply TO service_role;

ALTER TABLE public.student ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_thread ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_reply ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='student' AND policyname='student_read') THEN
    CREATE POLICY student_read ON public.student FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='forum_thread' AND policyname='forum_thread_read') THEN
    CREATE POLICY forum_thread_read ON public.forum_thread FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='forum_reply' AND policyname='forum_reply_read') THEN
    CREATE POLICY forum_reply_read ON public.forum_reply FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

DROP POLICY IF EXISTS forum_thread_insert ON public.forum_thread;
CREATE POLICY forum_thread_insert ON public.forum_thread FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS forum_reply_insert ON public.forum_reply;
CREATE POLICY forum_reply_insert ON public.forum_reply FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

NOTIFY pgrst, 'reload schema';
