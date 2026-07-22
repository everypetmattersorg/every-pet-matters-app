-- Add user_types array column to profiles (replaces single user_type)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS user_type text,
  ADD COLUMN IF NOT EXISTS user_types text[] DEFAULT '{}';
