ALTER TABLE public.forum_thread
  ADD COLUMN IF NOT EXISTS author_name text NOT NULL DEFAULT 'Student';
ALTER TABLE public.forum_reply
  ADD COLUMN IF NOT EXISTS author_name text NOT NULL DEFAULT 'Student';

UPDATE public.forum_thread AS thread
SET author_name = student.name
FROM public.student AS student
WHERE thread.student_id = student.id
  AND thread.author_name = 'Student';

UPDATE public.forum_reply AS reply
SET author_name = student.name
FROM public.student AS student
WHERE reply.student_id = student.id
  AND reply.author_name = 'Student';

NOTIFY pgrst, 'reload schema';
