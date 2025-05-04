/*
  # Add Friend System and Profile Enhancements

  1. New Tables
    - `user_relationships`
      - `follower_id` (uuid, references profiles)
      - `following_id` (uuid, references profiles)
      - `created_at` (timestamp)
      - `status` (text) - pending/accepted/blocked
    
  2. Security
    - Enable RLS on new tables
    - Add policies for:
      - Following users
      - Accepting/rejecting follow requests
      - Blocking users
*/

-- Create user_relationships table
CREATE TABLE user_relationships (
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

-- Enable RLS
ALTER TABLE user_relationships ENABLE ROW LEVEL SECURITY;

-- Policies for user_relationships
CREATE POLICY "Users can view their own relationships"
  ON user_relationships FOR SELECT
  TO public
  USING (
    auth.uid() = follower_id OR
    auth.uid() = following_id
  );

CREATE POLICY "Users can follow others"
  ON user_relationships FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() = follower_id AND
    follower_id != following_id AND
    NOT EXISTS (
      SELECT 1 FROM user_relationships
      WHERE follower_id = auth.uid()
      AND following_id = user_relationships.following_id
      AND status = 'blocked'
    )
  );

CREATE POLICY "Users can manage their relationships"
  ON user_relationships FOR UPDATE
  TO public
  USING (
    auth.uid() IN (follower_id, following_id)
  )
  WITH CHECK (
    auth.uid() IN (follower_id, following_id)
  );

CREATE POLICY "Users can remove relationships"
  ON user_relationships FOR DELETE
  TO public
  USING (
    auth.uid() IN (follower_id, following_id)
  );

-- Functions to get follower/following counts
CREATE OR REPLACE FUNCTION get_follower_count(profile_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)
  FROM user_relationships
  WHERE following_id = profile_id
  AND status = 'accepted';
$$;

CREATE OR REPLACE FUNCTION get_following_count(profile_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)
  FROM user_relationships
  WHERE follower_id = profile_id
  AND status = 'accepted';
$$;

-- Function to check if a user is following another user
CREATE OR REPLACE FUNCTION is_following(follower uuid, following uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_relationships
    WHERE follower_id = follower
    AND following_id = following
    AND status = 'accepted'
  );
$$;