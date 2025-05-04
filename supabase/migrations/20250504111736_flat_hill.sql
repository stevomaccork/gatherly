/*
  # Sample Data Population

  This migration adds sample data to demonstrate the platform's functionality.
  The data includes users, communities, threads, events, and conversations.

  1. Create auth.users first
  2. Then create corresponding profiles
  3. Add community data
  4. Add interaction data (threads, events, messages)
*/

-- First, create users in auth.users table
INSERT INTO auth.users (id, email, created_at, updated_at)
VALUES
  ('d7529fd2-9244-4ce5-9aef-2d9c666d3111', 'sarah@example.com', NOW() - INTERVAL '6 months', NOW()),
  ('8f9b2433-88e7-4b49-8924-4e5e91c2c222', 'alex@example.com', NOW() - INTERVAL '5 months', NOW()),
  ('c12d6d0a-7b1c-4b5b-9c22-4e5e91c2c333', 'mike@example.com', NOW() - INTERVAL '4 months', NOW()),
  ('e45e91c2-c444-4b5b-9c22-4e5e91c2c444', 'emma@example.com', NOW() - INTERVAL '3 months', NOW()),
  ('f67f82d3-5555-4b5b-9c22-4e5e91c2c555', 'dave@example.com', NOW() - INTERVAL '2 months', NOW());

-- Now create corresponding profiles
INSERT INTO profiles (id, username, avatar_url, created_at)
VALUES
  ('d7529fd2-9244-4ce5-9aef-2d9c666d3111', 'techie_sarah', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=sarah', NOW() - INTERVAL '6 months'),
  ('8f9b2433-88e7-4b49-8924-4e5e91c2c222', 'quantum_alex', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=alex', NOW() - INTERVAL '5 months'),
  ('c12d6d0a-7b1c-4b5b-9c22-4e5e91c2c333', 'cyber_mike', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=mike', NOW() - INTERVAL '4 months'),
  ('e45e91c2-c444-4b5b-9c22-4e5e91c2c444', 'ai_emma', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=emma', NOW() - INTERVAL '3 months'),
  ('f67f82d3-5555-4b5b-9c22-4e5e91c2c555', 'gamer_dave', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=dave', NOW() - INTERVAL '2 months');

-- Sample Communities
INSERT INTO communities (id, name, description, cover_image, created_at, created_by)
VALUES
  (
    'a1b2c3d4-e5f6-4a5b-9c22-4e5e91c2c666',
    'Quantum Computing Enthusiasts',
    'A community dedicated to discussing quantum computing advances, research, and applications. Join us to explore the future of computation!',
    'https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg',
    NOW() - INTERVAL '5 months',
    'd7529fd2-9244-4ce5-9aef-2d9c666d3111'
  ),
  (
    'b2c3d4e5-f6a7-4b5b-9c22-4e5e91c2c777',
    'AI Ethics Forum',
    'Discussing the ethical implications of artificial intelligence and ensuring responsible AI development.',
    'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg',
    NOW() - INTERVAL '4 months',
    '8f9b2433-88e7-4b49-8924-4e5e91c2c222'
  ),
  (
    'c3d4e5f6-a7b8-4b5b-9c22-4e5e91c2c888',
    'Retro Gaming Club',
    'Celebrating classic video games, sharing memories, and organizing retro gaming events.',
    'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg',
    NOW() - INTERVAL '3 months',
    'c12d6d0a-7b1c-4b5b-9c22-4e5e91c2c333'
  );

-- Sample Community Members
INSERT INTO community_members (community_id, profile_id, role, status, is_admin, joined_at)
VALUES
  ('a1b2c3d4-e5f6-4a5b-9c22-4e5e91c2c666', 'd7529fd2-9244-4ce5-9aef-2d9c666d3111', 'admin', 'approved', true, NOW() - INTERVAL '5 months'),
  ('a1b2c3d4-e5f6-4a5b-9c22-4e5e91c2c666', '8f9b2433-88e7-4b49-8924-4e5e91c2c222', 'member', 'approved', false, NOW() - INTERVAL '4 months'),
  ('b2c3d4e5-f6a7-4b5b-9c22-4e5e91c2c777', '8f9b2433-88e7-4b49-8924-4e5e91c2c222', 'admin', 'approved', true, NOW() - INTERVAL '4 months'),
  ('b2c3d4e5-f6a7-4b5b-9c22-4e5e91c2c777', 'e45e91c2-c444-4b5b-9c22-4e5e91c2c444', 'member', 'approved', false, NOW() - INTERVAL '3 months'),
  ('c3d4e5f6-a7b8-4b5b-9c22-4e5e91c2c888', 'c12d6d0a-7b1c-4b5b-9c22-4e5e91c2c333', 'admin', 'approved', true, NOW() - INTERVAL '3 months'),
  ('c3d4e5f6-a7b8-4b5b-9c22-4e5e91c2c888', 'f67f82d3-5555-4b5b-9c22-4e5e91c2c555', 'member', 'pending', false, NOW() - INTERVAL '1 day');

-- Sample Threads
INSERT INTO threads (id, community_id, title, content, created_at, created_by, is_pinned)
VALUES
  (
    'd4e5f6a7-b8c9-4b5b-9c22-4e5e91c2c999',
    'a1b2c3d4-e5f6-4a5b-9c22-4e5e91c2c666',
    'Latest Breakthrough in Quantum Error Correction',
    'Researchers have made a significant breakthrough in quantum error correction. This could be a game-changer for building reliable quantum computers. What are your thoughts on this development?',
    NOW() - INTERVAL '2 months',
    'd7529fd2-9244-4ce5-9aef-2d9c666d3111',
    true
  ),
  (
    'e5f6a7b8-c9d0-4b5b-9c22-4e5e91c2caaa',
    'b2c3d4e5-f6a7-4b5b-9c22-4e5e91c2c777',
    'AI Bias in Healthcare Applications',
    'We need to discuss the implications of AI bias in healthcare applications. How can we ensure fair and equitable treatment for all patients?',
    NOW() - INTERVAL '1 month',
    '8f9b2433-88e7-4b49-8924-4e5e91c2c222',
    false
  ),
  (
    'f6a7b8c9-d0e1-4b5b-9c22-4e5e91c2cbbb',
    'c3d4e5f6-a7b8-4b5b-9c22-4e5e91c2c888',
    'Best NES Games of All Time',
    'Let''s compile a list of the best NES games ever made. Share your favorites and why they deserve a spot on the list!',
    NOW() - INTERVAL '2 weeks',
    'c12d6d0a-7b1c-4b5b-9c22-4e5e91c2c333',
    false
  );

-- Sample Thread Replies
INSERT INTO thread_replies (id, thread_id, content, created_at, created_by)
VALUES
  (
    'a7b8c9d0-e1f2-4b5b-9c22-4e5e91c2cccc',
    'd4e5f6a7-b8c9-4b5b-9c22-4e5e91c2c999',
    'This is fascinating! The implications for quantum computing stability are enormous.',
    NOW() - INTERVAL '1 month 29 days',
    '8f9b2433-88e7-4b49-8924-4e5e91c2c222'
  ),
  (
    'b8c9d0e1-f2a3-4b5b-9c22-4e5e91c2cddd',
    'e5f6a7b8-c9d0-4b5b-9c22-4e5e91c2caaa',
    'We should implement rigorous testing protocols to identify and eliminate bias in AI algorithms.',
    NOW() - INTERVAL '29 days',
    'e45e91c2-c444-4b5b-9c22-4e5e91c2c444'
  ),
  (
    'c9d0e1f2-a3b4-4b5b-9c22-4e5e91c2ceee',
    'f6a7b8c9-d0e1-4b5b-9c22-4e5e91c2cbbb',
    'Super Mario Bros. 3 has to be at the top of the list. The level design was revolutionary!',
    NOW() - INTERVAL '13 days',
    'f67f82d3-5555-4b5b-9c22-4e5e91c2c555'
  );

-- Sample Thread Likes
INSERT INTO thread_likes (thread_id, profile_id, created_at)
VALUES
  ('d4e5f6a7-b8c9-4b5b-9c22-4e5e91c2c999', '8f9b2433-88e7-4b49-8924-4e5e91c2c222', NOW() - INTERVAL '1 month 29 days'),
  ('e5f6a7b8-c9d0-4b5b-9c22-4e5e91c2caaa', 'e45e91c2-c444-4b5b-9c22-4e5e91c2c444', NOW() - INTERVAL '29 days'),
  ('f6a7b8c9-d0e1-4b5b-9c22-4e5e91c2cbbb', 'f67f82d3-5555-4b5b-9c22-4e5e91c2c555', NOW() - INTERVAL '13 days');

-- Sample Events
INSERT INTO events (
  id, community_id, title, description, location, type,
  start_time, end_time, created_at, created_by,
  meeting_link, max_attendees, is_private
)
VALUES
  (
    'd0e1f2a3-b4c5-4b5b-9c22-4e5e91c2cfff',
    'a1b2c3d4-e5f6-4a5b-9c22-4e5e91c2c666',
    'Quantum Computing Workshop',
    'Join us for an interactive workshop on quantum computing basics and current research trends.',
    'Virtual Event',
    'online',
    NOW() + INTERVAL '2 weeks',
    NOW() + INTERVAL '2 weeks 3 hours',
    NOW() - INTERVAL '2 weeks',
    'd7529fd2-9244-4ce5-9aef-2d9c666d3111',
    'https://meet.example.com/quantum-workshop',
    50,
    false
  ),
  (
    'e1f2a3b4-c5d6-4b5b-9c22-4e5e91c2cggg',
    'b2c3d4e5-f6a7-4b5b-9c22-4e5e91c2c777',
    'AI Ethics Panel Discussion',
    'Expert panel discussing ethical considerations in AI development and deployment.',
    'Tech Hub Conference Center',
    'hybrid',
    NOW() + INTERVAL '1 month',
    NOW() + INTERVAL '1 month 2 hours',
    NOW() - INTERVAL '1 week',
    '8f9b2433-88e7-4b49-8924-4e5e91c2c222',
    'https://meet.example.com/ai-ethics-panel',
    100,
    false
  ),
  (
    'f2a3b4c5-d6e7-4b5b-9c22-4e5e91c2chhh',
    'c3d4e5f6-a7b8-4b5b-9c22-4e5e91c2c888',
    'Retro Gaming Tournament',
    'Classic NES tournament featuring Super Mario Bros., Contra, and more!',
    'Retro Arcade',
    'offline',
    NOW() + INTERVAL '3 weeks',
    NOW() + INTERVAL '3 weeks 6 hours',
    NOW() - INTERVAL '3 days',
    'c12d6d0a-7b1c-4b5b-9c22-4e5e91c2c333',
    NULL,
    32,
    false
  );

-- Sample Event Attendees
INSERT INTO event_attendees (event_id, profile_id, status, created_at)
VALUES
  ('d0e1f2a3-b4c5-4b5b-9c22-4e5e91c2cfff', '8f9b2433-88e7-4b49-8924-4e5e91c2c222', 'confirmed', NOW() - INTERVAL '13 days'),
  ('e1f2a3b4-c5d6-4b5b-9c22-4e5e91c2cggg', 'e45e91c2-c444-4b5b-9c22-4e5e91c2c444', 'confirmed', NOW() - INTERVAL '6 days'),
  ('f2a3b4c5-d6e7-4b5b-9c22-4e5e91c2chhh', 'f67f82d3-5555-4b5b-9c22-4e5e91c2c555', 'pending', NOW() - INTERVAL '2 days');

-- Sample Conversations
INSERT INTO conversations (id, created_at, updated_at)
VALUES
  ('a3b4c5d6-e7f8-4b5b-9c22-4e5e91c2ciii', NOW() - INTERVAL '1 month', NOW() - INTERVAL '2 days'),
  ('b4c5d6e7-f8a9-4b5b-9c22-4e5e91c2cjjj', NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '1 day');

-- Sample Conversation Participants
INSERT INTO conversation_participants (conversation_id, profile_id, created_at)
VALUES
  ('a3b4c5d6-e7f8-4b5b-9c22-4e5e91c2ciii', 'd7529fd2-9244-4ce5-9aef-2d9c666d3111', NOW() - INTERVAL '1 month'),
  ('a3b4c5d6-e7f8-4b5b-9c22-4e5e91c2ciii', '8f9b2433-88e7-4b49-8924-4e5e91c2c222', NOW() - INTERVAL '1 month'),
  ('b4c5d6e7-f8a9-4b5b-9c22-4e5e91c2cjjj', '8f9b2433-88e7-4b49-8924-4e5e91c2c222', NOW() - INTERVAL '2 weeks'),
  ('b4c5d6e7-f8a9-4b5b-9c22-4e5e91c2cjjj', 'c12d6d0a-7b1c-4b5b-9c22-4e5e91c2c333', NOW() - INTERVAL '2 weeks');

-- Sample Messages
INSERT INTO messages (id, conversation_id, sender_id, content, created_at, is_read)
VALUES
  (
    'c5d6e7f8-a9b0-4b5b-9c22-4e5e91c2ckkk',
    'a3b4c5d6-e7f8-4b5b-9c22-4e5e91c2ciii',
    'd7529fd2-9244-4ce5-9aef-2d9c666d3111',
    'Hey! I saw your post about quantum computing. Would love to discuss more!',
    NOW() - INTERVAL '1 month',
    true
  ),
  (
    'd6e7f8a9-b0c1-4b5b-9c22-4e5e91c2clll',
    'a3b4c5d6-e7f8-4b5b-9c22-4e5e91c2ciii',
    '8f9b2433-88e7-4b49-8924-4e5e91c2c222',
    'Absolutely! I''m particularly interested in quantum error correction.',
    NOW() - INTERVAL '1 month',
    true
  ),
  (
    'e7f8a9b0-c1d2-4b5b-9c22-4e5e91c2cmmm',
    'b4c5d6e7-f8a9-4b5b-9c22-4e5e91c2cjjj',
    '8f9b2433-88e7-4b49-8924-4e5e91c2c222',
    'Are you joining the retro gaming tournament?',
    NOW() - INTERVAL '2 weeks',
    true
  ),
  (
    'f8a9b0c1-d2e3-4b5b-9c22-4e5e91c2cnnn',
    'b4c5d6e7-f8a9-4b5b-9c22-4e5e91c2cjjj',
    'c12d6d0a-7b1c-4b5b-9c22-4e5e91c2c333',
    'Yes! I''m bringing my original NES controller too!',
    NOW() - INTERVAL '2 weeks',
    false
  );