ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS photo_urls jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS video_url text;
