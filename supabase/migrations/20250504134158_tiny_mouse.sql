/*
  # Add social links to communities

  1. Changes
    - Add social_links JSONB column to communities table
    - Add default empty object value
    - Update existing communities with sample social links

  2. Security
    - Maintain existing RLS policies
*/

-- Add social_links column to communities
ALTER TABLE communities
ADD COLUMN social_links jsonb DEFAULT '{}'::jsonb;

-- Add sample social links to existing communities
UPDATE communities
SET social_links = jsonb_build_object(
  'website', 'https://example.com/quantum-computing',
  'twitter', 'https://twitter.com/quantumcomputing',
  'youtube', 'https://youtube.com/c/quantumcomputing'
)
WHERE id = 'a1b2c3d4-e5f6-4a5b-9c22-4e5e91c2c666';

UPDATE communities
SET social_links = jsonb_build_object(
  'website', 'https://example.com/ai-ethics',
  'twitter', 'https://twitter.com/aiethics',
  'facebook', 'https://facebook.com/aiethics'
)
WHERE id = 'b2c3d4e5-f6a7-4b5b-9c22-4e5e91c2c777';

UPDATE communities
SET social_links = jsonb_build_object(
  'instagram', 'https://instagram.com/retrogaming',
  'youtube', 'https://youtube.com/c/retrogaming',
  'twitter', 'https://twitter.com/retrogaming'
)
WHERE id = 'c3d4e5f6-a7b8-4b5b-9c22-4e5e91c2c888';