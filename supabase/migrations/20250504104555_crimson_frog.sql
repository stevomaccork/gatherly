/*
  # Add thread interactions

  1. New Tables
    - `thread_likes`
      - `thread_id` (uuid, references threads)
      - `profile_id` (uuid, references profiles)
      - `created_at` (timestamp)
    - `thread_reply_likes`
      - `reply_id` (uuid, references thread_replies)
      - `profile_id` (uuid, references profiles)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create thread_likes table
CREATE TABLE IF NOT EXISTS thread_likes (
  thread_id uuid REFERENCES threads(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (thread_id, profile_id)
);

-- Create thread_reply_likes table
CREATE TABLE IF NOT EXISTS thread_reply_likes (
  reply_id uuid REFERENCES thread_replies(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (reply_id, profile_id)
);

-- Enable RLS
ALTER TABLE thread_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_reply_likes ENABLE ROW LEVEL SECURITY;

-- Policies for thread_likes
CREATE POLICY "Users can like threads"
  ON thread_likes
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can unlike threads"
  ON thread_likes
  FOR DELETE
  TO public
  USING (auth.uid() = profile_id);

CREATE POLICY "Thread likes are viewable by everyone"
  ON thread_likes
  FOR SELECT
  TO public
  USING (true);

-- Policies for thread_reply_likes
CREATE POLICY "Users can like replies"
  ON thread_reply_likes
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can unlike replies"
  ON thread_reply_likes
  FOR DELETE
  TO public
  USING (auth.uid() = profile_id);

CREATE POLICY "Reply likes are viewable by everyone"
  ON thread_reply_likes
  FOR SELECT
  TO public
  USING (true);