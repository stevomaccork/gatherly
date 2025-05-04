/*
  # Add Community Admin Features

  1. Changes
    - Add admin-specific columns to community_members table
    - Add member approval system
    - Add policies for admin actions

  2. New Features
    - Member approval system
    - Admin role management
    - Member status tracking
    - Pinned threads

  3. Security
    - Only admins can approve members
    - Only admins can manage other admins
    - Only admins can pin threads
*/

-- Add status column to community_members
ALTER TABLE community_members 
ADD COLUMN status text NOT NULL DEFAULT 'pending' 
CHECK (status IN ('pending', 'approved', 'rejected', 'banned'));

-- Add is_admin column to community_members
ALTER TABLE community_members 
ADD COLUMN is_admin boolean NOT NULL DEFAULT false;

-- Add pinned column to threads
ALTER TABLE threads
ADD COLUMN is_pinned boolean NOT NULL DEFAULT false;

-- Update RLS policies for admin actions
CREATE POLICY "Admins can approve members"
  ON community_members
  FOR UPDATE
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
  USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_members.community_id
      AND cm.profile_id = auth.uid()
      AND cm.is_admin = true
    )
  );

CREATE POLICY "Admins can pin threads"
  ON threads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = threads.community_id
      AND cm.profile_id = auth.uid()
      AND cm.is_admin = true
    )
  );