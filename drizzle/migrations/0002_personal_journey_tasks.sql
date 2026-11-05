CREATE TABLE public.personal_journey_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 1000),
  steps jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(steps) = 'array'),
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX personal_journey_tasks_user_id_idx ON public.personal_journey_tasks(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personal_journey_tasks TO authenticated;
ALTER TABLE public.personal_journey_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their personal journey tasks" ON public.personal_journey_tasks
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
COMMENT ON TABLE public.personal_journey_tasks IS 'Private checklist tasks created by an authenticated student from the GlobalCougar assistant.';
