-- StudySync v1 database setup.
-- Run this in the Supabase SQL Editor after creating the project.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT NOT NULL DEFAULT '',
  initials        TEXT NOT NULL DEFAULT '',
  avatar_id       TEXT,
  referral_code   TEXT UNIQUE NOT NULL,
  onboarding_done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS session_segments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_name  TEXT NOT NULL DEFAULT 'General',
  started_at    TIMESTAMPTZ NOT NULL,
  ended_at      TIMESTAMPTZ,
  duration_secs INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN ended_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER
      ELSE NULL
    END
  ) STORED,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE TABLE IF NOT EXISTS todos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  text         TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (char_length(text) <= 200)
);

CREATE TABLE IF NOT EXISTS friend_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(requester_id, requested_id),
  CHECK (requester_id <> requested_id)
);

CREATE TABLE IF NOT EXISTS friendships (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_a, user_b),
  CHECK (user_a < user_b)
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON study_sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_session_segments_user_open ON session_segments(user_id) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_session_segments_session_started ON session_segments(session_id, started_at);
CREATE INDEX IF NOT EXISTS idx_todos_user_date_order ON todos(user_id, date, is_completed, sort_order);
CREATE INDEX IF NOT EXISTS idx_friend_requests_requested_status ON friend_requests(requested_id, status);

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  TEXT := '';
  i     INT;
BEGIN
  FOR i IN 1..8 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION compute_initials(full_name TEXT)
RETURNS TEXT AS $$
DECLARE
  words TEXT[];
  result TEXT := '';
BEGIN
  words := string_to_array(trim(full_name), ' ');
  IF array_length(words, 1) >= 2 THEN
    result := upper(substr(words[1], 1, 1) || substr(words[array_length(words, 1)], 1, 1));
  ELSIF array_length(words, 1) = 1 THEN
    result := upper(substr(words[1], 1, 1));
  ELSE
    result := 'U';
  END IF;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  name_val TEXT;
  code     TEXT;
  attempt  INT := 0;
BEGIN
  name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  LOOP
    code := generate_referral_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = code);
    attempt := attempt + 1;
    IF attempt > 20 THEN
      RAISE EXCEPTION 'Could not generate unique referral code';
    END IF;
  END LOOP;

  INSERT INTO profiles (id, email, full_name, initials, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    name_val,
    compute_initials(name_val),
    code
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

CREATE OR REPLACE FUNCTION accept_friend_request(request_id UUID)
RETURNS VOID AS $$
DECLARE
  req friend_requests%ROWTYPE;
  a   UUID;
  b   UUID;
BEGIN
  SELECT * INTO req FROM friend_requests WHERE id = request_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already handled';
  END IF;

  UPDATE friend_requests SET status = 'accepted' WHERE id = request_id;

  IF req.requester_id < req.requested_id THEN
    a := req.requester_id; b := req.requested_id;
  ELSE
    a := req.requested_id; b := req.requester_id;
  END IF;

  INSERT INTO friendships (user_a, user_b) VALUES (a, b)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION enforce_daily_todo_limit()
RETURNS TRIGGER AS $$
DECLARE
  existing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO existing_count
  FROM todos
  WHERE user_id = NEW.user_id AND date = NEW.date;

  IF existing_count >= 20 THEN
    RAISE EXCEPTION 'Daily todo limit reached';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS todos_daily_limit ON todos;
CREATE TRIGGER todos_daily_limit
  BEFORE INSERT ON todos
  FOR EACH ROW EXECUTE PROCEDURE enforce_daily_todo_limit();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles: self read-write" ON profiles;
CREATE POLICY "profiles: self read-write"
  ON profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles: friends can read" ON profiles;
CREATE POLICY "profiles: friends can read"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_a = auth.uid() AND user_b = id)
         OR (user_b = auth.uid() AND user_a = id)
    )
  );

DROP POLICY IF EXISTS "sessions: self write" ON study_sessions;
CREATE POLICY "sessions: self write"
  ON study_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "sessions: friends read" ON study_sessions;
CREATE POLICY "sessions: friends read"
  ON study_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_a = auth.uid() AND user_b = user_id)
         OR (user_b = auth.uid() AND user_a = user_id)
    )
  );

DROP POLICY IF EXISTS "segments: self write" ON session_segments;
CREATE POLICY "segments: self write"
  ON session_segments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "segments: friends read" ON session_segments;
CREATE POLICY "segments: friends read"
  ON session_segments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_a = auth.uid() AND user_b = user_id)
         OR (user_b = auth.uid() AND user_a = user_id)
    )
  );

DROP POLICY IF EXISTS "todos: self write" ON todos;
CREATE POLICY "todos: self write"
  ON todos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "todos: friends read" ON todos;
CREATE POLICY "todos: friends read"
  ON todos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_a = auth.uid() AND user_b = user_id)
         OR (user_b = auth.uid() AND user_a = user_id)
    )
  );

DROP POLICY IF EXISTS "requests: participants" ON friend_requests;
CREATE POLICY "requests: participants"
  ON friend_requests FOR ALL
  USING (auth.uid() = requester_id OR auth.uid() = requested_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = requested_id);

DROP POLICY IF EXISTS "friendships: participants read" ON friendships;
CREATE POLICY "friendships: participants read"
  ON friendships FOR SELECT
  USING (auth.uid() = user_a OR auth.uid() = user_b);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE session_segments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE todos;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE friend_requests;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
