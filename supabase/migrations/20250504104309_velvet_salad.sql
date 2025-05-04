/*
  # Community Members Table and Policies

  1. New Tables
    - `community_members`
      - `community_id` (uuid, references communities)
      - `profile_id` (uuid, references profiles)
      - `role` (text, default 'member')
      - `joined_at` (timestamptz)
      - `status` (text with check constraint)
      - `is_admin` (boolean)

  2. Security
    - Enable RLS
    - Add policies for:
      - Public viewing
      - User join
      - Admin management
*/

-- Create community_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS community_members (
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'banned')),
  is_admin boolean NOT NULL DEFAULT false,
  PRIMARY KEY (community_id, profile_id)
);

-- Enable RLS
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Community members are viewable by everyone" ON community_members;
  DROP POLICY IF EXISTS "Users can join communities" ON community_members;
  DROP POLICY IF EXISTS "Admins can approve members" ON community_members;
  DROP POLICY IF EXISTS "Admins can delete members" ON community_members;
END $$;

-- Create policies
CREATE POLICY "Community members are viewable by everyone"
  ON community_members
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can join communities"
  ON community_members
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Admins can approve members"
  ON community_members
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_members.community_id
      AND cm.profile_id = auth.uid()
      AND cm.is_admin = true
    )
  );

CREATE POLICY "Admins can delete members"
  ON community_members
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_members.community_id
      AND cm.profile_id = auth.uid()
      AND cm.is_admin = true
    )
  );