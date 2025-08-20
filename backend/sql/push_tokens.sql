-- Push tokens table for storing user notification tokens
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);

-- RLS policies
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only access their own push tokens
CREATE POLICY "Users can manage their own push tokens" ON push_tokens
  FOR ALL USING (auth.uid() = user_id);