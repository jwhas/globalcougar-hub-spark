-- GlobalCougar shared data: students, roadmap milestones, per-student progress,
-- and the discussion board.
-- ISSS directory, career help, and campus/legal news are pulled from BYU's own
-- website at run time, so they are intentionally not stored here.

CREATE TABLE public.student (
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

CREATE TABLE public.milestone (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  phase smallint NOT NULL DEFAULT 0,
  step_order smallint NOT NULL DEFAULT 0,
  required_documents text NOT NULL DEFAULT '',
  office_location text NOT NULL DEFAULT '',
  is_checkpoint boolean NOT NULL DEFAULT false
);

CREATE TABLE public.user_milestone (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id integer NOT NULL REFERENCES public.student(id) ON DELETE CASCADE,
  milestone_id integer NOT NULL REFERENCES public.milestone(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  completed_date date,
  UNIQUE (student_id, milestone_id)
);

CREATE TABLE public.forum_thread (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id integer NOT NULL REFERENCES public.student(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  topic text NOT NULL DEFAULT 'Campus Life',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.forum_reply (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  thread_id integer NOT NULL REFERENCES public.forum_thread(id) ON DELETE CASCADE,
  student_id integer NOT NULL REFERENCES public.student(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- The Data API grants no default privileges on the public schema, so grant
-- exactly what the policies below allow.
GRANT SELECT ON public.student, public.milestone, public.forum_thread, public.forum_reply TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_milestone TO anon, authenticated;
GRANT INSERT ON public.forum_thread, public.forum_reply TO anon, authenticated;
GRANT ALL ON public.student, public.milestone, public.user_milestone, public.forum_thread, public.forum_reply TO service_role;

ALTER TABLE public.student ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_milestone ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_thread ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_reply ENABLE ROW LEVEL SECURITY;

-- The prototype has no sign-in yet, so the demo checklist and the board are
-- open to any visitor. Tighten these to auth.uid() once accounts exist.
CREATE POLICY student_read ON public.student FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY milestone_read ON public.milestone FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY user_milestone_read ON public.user_milestone FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY user_milestone_insert ON public.user_milestone FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY user_milestone_update ON public.user_milestone FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY forum_thread_read ON public.forum_thread FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY forum_thread_insert ON public.forum_thread FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY forum_reply_read ON public.forum_reply FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY forum_reply_insert ON public.forum_reply FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Seed data: the demo students already named in the prototype, the eight
-- roadmap milestones, one finished checkpoint, and the starter discussions.
INSERT INTO public.student (name, email, home_country, situations, semester, account_start_date, us_arrival_date) VALUES
  ('James A.', '', '', '', 'Fall 2026', DATE '2026-08-15', DATE '2026-08-26'),
  ('Mina K.', '', '', '', 'Fall 2026', NULL, NULL),
  ('Aiko T.', '', '', '', 'Fall 2026', NULL, NULL),
  ('Daniel O.', '', '', '', 'Fall 2026', NULL, NULL),
  ('Paulo R.', '', '', '', 'Fall 2026', NULL, NULL),
  ('Sofia L.', '', '', '', 'Fall 2026', NULL, NULL);

INSERT INTO public.milestone (title, description, phase, step_order, required_documents, office_location, is_checkpoint) VALUES
  ('START: Obtain I-20 & Pay SEVIS Fee', 'Get your I-20 from BYU and pay the I-901 SEVIS fee before your visa interview.', 0, 1, 'Valid passport · BYU admission letter · I-901 payment receipt', 'Complete online through the SEVP portal', true),
  ('F-1 Visa Interview & Approval', 'Attend your visa interview at the nearest U.S. embassy or consulate.', 0, 2, 'DS-160 confirmation · Form I-20 · Financial evidence', 'Nearest U.S. Embassy or Consulate', false),
  ('Book Flights to SLC / Provo', 'Arrive no earlier than 30 days before your program starts.', 0, 3, 'Passport and visa · Printed I-20 · BYU arrival details', 'Salt Lake City International Airport', false),
  ('STOP: TB Health Screening & Immunizations', 'Mandatory health checkpoint at the BYU Student Health Center.', 1, 4, 'Photo ID · Immunization records · Health insurance information', 'BYU Student Health Center', true),
  ('BYU Housing Check-In', 'Check in to your assigned residence hall.', 1, 5, 'Housing confirmation · Photo ID · First payment receipt', 'Assigned residence hall front desk', false),
  ('Open Local Bank Account', 'Set up a U.S. bank account for paychecks and expenses.', 1, 6, 'Passport · Form I-20 · BYU ID · Proof of Provo address', 'Bank branch on Cougar Boulevard', false),
  ('ISSS In-Person Check-In', 'Confirm your F-1 status in person with the ISSS Office.', 2, 7, 'Passport and visa · Signed I-20 · BYU ID', '2400 Wilkinson Student Center', true),
  ('FINISH: First Day of Classes', 'Your onboarding is complete when you walk into class.', 2, 8, 'BYU ID · Class schedule · Notebook or laptop', 'Your first scheduled classroom', true);

INSERT INTO public.user_milestone (student_id, milestone_id, status, completed_date)
SELECT s.id, m.id,
  CASE WHEN m.step_order = 1 THEN 'completed' ELSE 'pending' END,
  CASE WHEN m.step_order = 1 THEN CURRENT_DATE ELSE NULL END
FROM public.student s
CROSS JOIN public.milestone m
WHERE s.name = 'James A.';

INSERT INTO public.forum_thread (student_id, title, body, topic, created_at)
SELECT s.id, t.title, t.body, t.topic, now() - (t.age_hours || ' hours')::interval
FROM public.student s
JOIN (VALUES
  ('Mina K.', 'How many hours can I work on campus during finals week?', 'My manager asked me to pick up extra shifts. Is the 20 hour rule still in effect during finals?', 'Work', 48),
  ('Aiko T.', 'Anyone found good scholarships for second year students?', 'I missed the first deadline. Are there any I can still apply to this winter?', 'Scholarships', 96),
  ('Daniel O.', 'Tips for a first U.S. job interview?', 'I have my first interview at the Creamery next week. What should I expect?', 'Careers', 144)
) AS t(name, title, body, topic, age_hours) ON s.name = t.name;

INSERT INTO public.forum_reply (thread_id, student_id, body, created_at)
SELECT th.id, s.id, r.body, now() - (r.age_hours || ' hours')::interval
FROM public.student s
JOIN (VALUES
  ('How many hours can I work on campus during finals week?', 'Paulo R.', 'Yes, 20 hours a week while school is in session. Ask ISSS to be sure about breaks.', 24),
  ('Tips for a first U.S. job interview?', 'Sofia L.', 'CareerLaunch does free mock interviews. It really helped me.', 120)
) AS r(thread_title, name, body, age_hours) ON s.name = r.name
JOIN public.forum_thread th ON th.title = r.thread_title;
