/*
  # Initial Schema Setup for NeoByte Community Platform

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `avatar_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `communities`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `cover_image` (text)
      - `created_at` (timestamp)
      - `created_by` (uuid, references profiles)
    
    - `community_members`
      - `community_id` (uuid, references communities)
      - `profile_id` (uuid, references profiles)
      - `role` (text)
      - `joined_at` (timestamp)
    
    - `threads`
      - `id` (uuid, primary key)
      - `community_id` (uuid, references communities)
      - `title` (text)
      - `content` (text)
      - `created_at` (timestamp)
      - `created_by` (uuid, references profiles)
    
    - `thread_replies`
      - `id` (uuid, primary key)
      - `thread_id` (uuid, references threads)
      - `content` (text)
      - `created_at` (timestamp)
      - `created_by` (uuid, references profiles)
    
    - `events`
      - `id` (uuid, primary key)
      - `community_id` (uuid, references communities)
      - `title` (text)
      - `description` (text)
      - `location` (text)
      - `start_time` (timestamp)
      - `end_time` (timestamp)
      - `created_at` (timestamp)
      - `created_by` (uuid, references profiles)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create communities table
CREATE TABLE communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  cover_image text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Communities are viewable by everyone"
  ON communities FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create communities"
  ON communities FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create community_members table
CREATE TABLE community_members (
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (community_id, profile_id)
);

ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community members are viewable by everyone"
  ON community_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join communities"
  ON community_members FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Create threads table
CREATE TABLE threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Threads are viewable by everyone"
  ON threads FOR SELECT
  USING (true);

CREATE POLICY "Community members can create threads"
  ON threads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = threads.community_id
      AND profile_id = auth.uid()
    )
  );

-- Create thread_replies table
CREATE TABLE thread_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES threads(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

ALTER TABLE thread_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Replies are viewable by everyone"
  ON thread_replies FOR SELECT
  USING (true);

CREATE POLICY "Community members can create replies"
  ON thread_replies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM threads t
      JOIN community_members cm ON cm.community_id = t.community_id
      WHERE t.id = thread_replies.thread_id
      AND cm.profile_id = auth.uid()
    )
  );

-- Create events table
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  location text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by everyone"
  ON events FOR SELECT
  USING (true);

CREATE POLICY "Community members can create events"
  ON events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = events.community_id
      AND profile_id = auth.uid()
    )
  );