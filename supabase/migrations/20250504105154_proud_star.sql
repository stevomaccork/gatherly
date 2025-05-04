/*
  # Event System Implementation

  1. New Tables
    - `event_attendees`: Tracks event attendance and RSVPs
      - `event_id` (uuid, references events)
      - `profile_id` (uuid, references profiles)
      - `status` (text, RSVP status)
      - `created_at` (timestamp)
    - `event_types`: Defines event types (online/offline)
      - `id` (uuid)
      - `name` (text)
      - `description` (text)

  2. Changes
    - Add new columns to events table:
      - `type` (text)
      - `meeting_link` (text)
      - `max_attendees` (integer)
      - `calendar_link` (text)
      - `is_private` (boolean)

  3. Security
    - Enable RLS on new tables
    - Add policies for event attendance management
*/

-- Create event_types enum
CREATE TYPE event_type AS ENUM ('online', 'offline', 'hybrid');

-- Add new columns to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS type event_type NOT NULL DEFAULT 'offline',
ADD COLUMN IF NOT EXISTS meeting_link text,
ADD COLUMN IF NOT EXISTS max_attendees integer,
ADD COLUMN IF NOT EXISTS calendar_link text,
ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;

-- Create event_attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'declined', 'waitlist')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (event_id, profile_id)
);

-- Enable RLS
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Policies for event_attendees
CREATE POLICY "Event attendees are viewable by everyone"
  ON event_attendees
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can RSVP to events"
  ON event_attendees
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() = profile_id AND
    NOT EXISTS (
      SELECT 1 FROM event_attendees
      WHERE event_id = event_attendees.event_id
      AND profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their RSVP status"
  ON event_attendees
  FOR UPDATE
  TO public
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can cancel their RSVP"
  ON event_attendees
  FOR DELETE
  TO public
  USING (auth.uid() = profile_id);

-- Add function to check attendance limit
CREATE OR REPLACE FUNCTION check_event_attendance_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' THEN
    IF EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = NEW.event_id
      AND e.max_attendees IS NOT NULL
      AND (
        SELECT COUNT(*) FROM event_attendees
        WHERE event_id = NEW.event_id
        AND status = 'confirmed'
      ) >= e.max_attendees
    ) THEN
      NEW.status := 'waitlist';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for attendance limit
CREATE TRIGGER check_attendance_limit
  BEFORE INSERT OR UPDATE ON event_attendees
  FOR EACH ROW
  EXECUTE FUNCTION check_event_attendance_limit();