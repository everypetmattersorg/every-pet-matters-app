-- Analytics events table for tracking logins and sessions
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL, -- 'login', 'session'
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_type_date ON analytics_events (event_type, created_at);
CREATE INDEX IF NOT EXISTS analytics_events_user_id ON analytics_events (user_id);

-- RLS: users can insert their own events; admins can read all
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can insert own events"
  ON analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admins can read all events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
