/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing RLS policies on profiles table
    - Add new policies for:
      - Inserting new profiles (authenticated users can create their own profile)
      - Selecting profiles (public access)
      - Updating profiles (users can update their own profile)

  2. Security
    - Enable RLS on profiles table
    - Policies ensure users can only:
      - Create their own profile
      - Update their own profile
      - View any profile
*/

-- First enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policies
CREATE POLICY "Anyone can view profiles"
  ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);