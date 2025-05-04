-- Add social links column to communities table
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Add comment to explain the structure
COMMENT ON COLUMN communities.social_links IS 'Social media links in format: {"instagram": "url", "twitter": "url", "discord": "url", "facebook": "url"}'; 