/*
  # Enhance Communities and Profiles for Better Discovery

  1. Changes
    - Add location and category fields to communities table
    - Add interests and location to profiles table
    - Add categories table for hierarchical category management
    - Add community_categories table for many-to-many relationships

  2. New Features
    - Location-based community search
    - Multi-category support for communities
    - User interests for personalized recommendations
    - Hierarchical category system

  3. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- Create categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  parent_id uuid REFERENCES categories(id),
  description text,
  icon text,
  created_at timestamptz DEFAULT now()
);

-- Add location and category columns to communities
ALTER TABLE communities
ADD COLUMN country text,
ADD COLUMN city text,
ADD COLUMN latitude double precision,
ADD COLUMN longitude double precision;

-- Create community_categories table
CREATE TABLE community_categories (
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (community_id, category_id)
);

-- Add interests and location to profiles
ALTER TABLE profiles
ADD COLUMN interests jsonb DEFAULT '[]'::jsonb,
ADD COLUMN country text,
ADD COLUMN city text;

-- Enable RLS on new tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Community categories are viewable by everyone"
  ON community_categories FOR SELECT
  TO public
  USING (true);

-- Insert main categories
INSERT INTO categories (id, name, slug, description, icon) VALUES
  ('00000000-0000-4000-a000-000000000001', 'Sports', 'sports', 'Sports and athletic activities', 'trophy'),
  ('00000000-0000-4000-a000-000000000002', 'Gaming', 'gaming', 'Video games and gaming culture', 'gamepad'),
  ('00000000-0000-4000-a000-000000000003', 'Arts', 'arts', 'Visual arts, music, and creative expression', 'palette'),
  ('00000000-0000-4000-a000-000000000004', 'Technology', 'technology', 'Technology and innovation', 'cpu'),
  ('00000000-0000-4000-a000-000000000005', 'Science', 'science', 'Scientific discussion and research', 'flask');

-- Insert subcategories for Sports
INSERT INTO categories (name, slug, parent_id, description, icon) VALUES
  ('Football', 'football', '00000000-0000-4000-a000-000000000001', 'Soccer/Football discussions and events', 'ball'),
  ('Basketball', 'basketball', '00000000-0000-4000-a000-000000000001', 'Basketball discussions and events', 'basketball'),
  ('Tennis', 'tennis', '00000000-0000-4000-a000-000000000001', 'Tennis discussions and events', 'tennis-ball'),
  ('eSports', 'esports', '00000000-0000-4000-a000-000000000001', 'Competitive gaming events', 'trophy');

-- Insert subcategories for Gaming
INSERT INTO categories (name, slug, parent_id, description, icon) VALUES
  ('PC Gaming', 'pc-gaming', '00000000-0000-4000-a000-000000000002', 'PC gaming discussions', 'monitor'),
  ('Console Gaming', 'console-gaming', '00000000-0000-4000-a000-000000000002', 'Console gaming discussions', 'gamepad'),
  ('Mobile Gaming', 'mobile-gaming', '00000000-0000-4000-a000-000000000002', 'Mobile gaming discussions', 'smartphone'),
  ('Retro Gaming', 'retro-gaming', '00000000-0000-4000-a000-000000000002', 'Classic and retro games', 'vintage');

-- Insert subcategories for Arts
INSERT INTO categories (name, slug, parent_id, description, icon) VALUES
  ('Digital Art', 'digital-art', '00000000-0000-4000-a000-000000000003', 'Digital artwork and design', 'pen-tool'),
  ('Music', 'music', '00000000-0000-4000-a000-000000000003', 'Music discussion and sharing', 'music'),
  ('Photography', 'photography', '00000000-0000-4000-a000-000000000003', 'Photography and cameras', 'camera'),
  ('Traditional Art', 'traditional-art', '00000000-0000-4000-a000-000000000003', 'Traditional art mediums', 'brush');

-- Insert subcategories for Technology
INSERT INTO categories (name, slug, parent_id, description, icon) VALUES
  ('Programming', 'programming', '00000000-0000-4000-a000-000000000004', 'Programming and software development', 'code'),
  ('AI & ML', 'ai-ml', '00000000-0000-4000-a000-000000000004', 'Artificial Intelligence and Machine Learning', 'brain'),
  ('Cybersecurity', 'cybersecurity', '00000000-0000-4000-a000-000000000004', 'Security and privacy', 'shield'),
  ('Hardware', 'hardware', '00000000-0000-4000-a000-000000000004', 'Computer hardware and DIY', 'cpu');

-- Insert subcategories for Science
INSERT INTO categories (name, slug, parent_id, description, icon) VALUES
  ('Physics', 'physics', '00000000-0000-4000-a000-000000000005', 'Physics discussions and news', 'atom'),
  ('Biology', 'biology', '00000000-0000-4000-a000-000000000005', 'Biology and life sciences', 'microscope'),
  ('Chemistry', 'chemistry', '00000000-0000-4000-a000-000000000005', 'Chemistry discussions', 'flask'),
  ('Astronomy', 'astronomy', '00000000-0000-4000-a000-000000000005', 'Space and astronomy', 'star');