CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  source_item_id text NOT NULL CHECK (char_length(source_item_id) BETWEEN 1 AND 500),
  source_url text NOT NULL CHECK (source_url LIKE 'https://%'),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
  summary text NOT NULL DEFAULT '' CHECK (char_length(summary) <= 1200),
  source_categories text[] NOT NULL DEFAULT '{}',
  categories text[] NOT NULL DEFAULT '{}',
  interest_keys text[] NOT NULL DEFAULT '{}',
  published_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  expires_at timestamptz,
  is_published boolean NOT NULL DEFAULT true,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, source_item_id),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at)
);

CREATE INDEX announcements_published_date_idx
  ON public.announcements (published_at DESC)
  WHERE is_published;
CREATE INDEX announcements_categories_idx
  ON public.announcements USING gin (categories);
CREATE INDEX announcements_interest_keys_idx
  ON public.announcements USING gin (interest_keys);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT ALL ON public.announcements TO service_role;

CREATE POLICY announcements_public_read ON public.announcements
  FOR SELECT TO anon, authenticated
  USING (
    is_published
    AND (expires_at IS NULL OR expires_at > now())
    AND (ends_at IS NULL OR ends_at > now())
  );

COMMENT ON TABLE public.announcements IS
  'Public, source-attributed BYU announcement metadata imported server-side. Browser roles have read-only access.';
