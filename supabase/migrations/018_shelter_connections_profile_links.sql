-- Add proper FK links from shelter_connections to org profiles and user profiles
ALTER TABLE shelter_connections
  ADD COLUMN IF NOT EXISTS shelter_details_id uuid REFERENCES shelter_details(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
