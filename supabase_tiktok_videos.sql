CREATE TABLE tiktok_videos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt text NOT NULL,
  caption text,
  style text,
  status text DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'failed', 'posted')),
  runway_task_id text,
  video_url text,
  thumbnail_url text,
  duration_seconds integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE tiktok_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for now" ON tiktok_videos FOR ALL USING (true);
