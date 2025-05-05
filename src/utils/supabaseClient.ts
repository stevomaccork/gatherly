import { createClient, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  full_name: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  occupation: string | null;
  banner_image: string | null;
  interests: string[];
  social_links: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  } | null;
  created_at: string;
  updated_at: string;
  country: string | null;
  city: string | null;
};

export type UserRelationship = {
  follower_id: string;
  following_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  profiles?: Profile;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string | null;
  icon: string | null;
  created_at: string;
};

export interface Community {
  id: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  created_at: string;
  created_by: string | null;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  members_count?: number;
  events?: Array<Event>;
  categories?: Category[];
  social_links?: {
    website?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    discord?: string;
  } | null;
  community_members?: Array<{ count: number }>;
  community_members_count?: number;
  community_categories?: Array<{
    categories: Category;
  }>;
}

export type Thread = {
  id: string;
  community_id: string;
  title: string;
  content: string;
  created_at: string;
  created_by: string | null;
  is_pinned: boolean;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
  likes_count?: number;
  user_has_liked?: boolean;
};

export type ThreadReply = {
  id: string;
  thread_id: string;
  content: string;
  created_at: string;
  created_by: string | null;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
  likes_count?: number;
  user_has_liked?: boolean;
};

export type Event = {
  id: string;
  community_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string | null;
  created_at: string;
  created_by: string | null;
  type: 'online' | 'offline' | 'hybrid';
  meeting_link: string | null;
  max_attendees: number | null;
  calendar_link: string | null;
  is_private: boolean;
  communities?: {
    id: string;
    name: string;
  };
  event_attendees?: Array<{
    profile_id: string;
    status: string;
  }>;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
};

export type EventAttendee = {
  event_id: string;
  profile_id: string;
  status: 'pending' | 'confirmed' | 'declined' | 'waitlist';
  created_at: string;
};

// First, let's define our base types clearly
interface ProfileData {
  username: string;
  avatar_url: string | null;
}

export interface CommunityMember {
  community_id: string;
  profile_id: string;
  role: string;
  joined_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'banned';
  is_admin: boolean;
  profiles: ProfileData;
}

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
};

export type Conversation = {
  id: string;
  created_at: string;
  updated_at: string;
  participants: {
    profile_id: string;
    profiles: {
      username: string;
      avatar_url: string | null;
    };
  }[];
  last_message?: {
    content: string;
    created_at: string;
  };
};

export const followUser = async (followingId: string, currentUser: User) => {
  const { data, error } = await supabase
    .from('user_relationships')
    .insert({
      follower_id: currentUser.id,
      following_id: followingId,
      status: 'accepted'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const unfollowUser = async (followingId: string) => {
  const { error } = await supabase
    .from('user_relationships')
    .delete()
    .match({
      follower_id: supabase.auth.getUser().then(({ data }) => data.user?.id),
      following_id: followingId
    });

  if (error) throw error;
};

export const getFollowers = async (userId: string): Promise<UserRelationship[]> => {
  const { data, error } = await supabase
    .from('user_relationships')
    .select(`
      *,
      profiles:follower_id (
        username,
        avatar_url
      )
    `)
    .eq('following_id', userId)
    .eq('status', 'accepted');

  if (error) throw error;
  return data || [];
};

export const getFollowing = async (userId: string): Promise<UserRelationship[]> => {
  const { data, error } = await supabase
    .from('user_relationships')
    .select(`
      *,
      profiles:following_id (
        username,
        avatar_url
      )
    `)
    .eq('follower_id', userId)
    .eq('status', 'accepted');

  if (error) throw error;
  return data || [];
};

export const joinCommunity = async (communityId: string, profileId: string) => {
  const { error } = await supabase
    .from('community_members')
    .insert({
      community_id: communityId,
      profile_id: profileId,
      role: 'member',
      status: 'approved'
    });

  if (error) throw error;
};

export const leaveCommunity = async (communityId: string, profileId: string) => {
  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('profile_id', profileId);

  if (error) throw error;
};

export const checkMembership = async (communityId: string, profileId: string) => {
  const { data, error } = await supabase
    .from('community_members')
    .select()
    .eq('community_id', communityId)
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// Now let's modify the getMembers function to use type assertions
export const getMembers = async (communityId: string): Promise<CommunityMember[]> => {
  type DbResponse = {
    community_id: string;
    profile_id: string;
    role: string;
    joined_at: string;
    status: 'pending' | 'approved' | 'rejected' | 'banned';
    is_admin: boolean;
    profiles: {
      username: string;
      avatar_url: string | null;
    };
  };

  const { data, error } = await supabase
    .from('community_members')
    .select(`
      community_id,
      profile_id,
      role,
      joined_at,
      status,
      is_admin,
      profiles (
        username,
        avatar_url
      )
    `)
    .eq('community_id', communityId)
    .returns<DbResponse[]>();

  if (error) throw error;
  return data || [];
};

export const updateMemberStatus = async (communityId: string, profileId: string, status: CommunityMember['status']) => {
  const { error } = await supabase
    .from('community_members')
    .update({ status })
    .eq('community_id', communityId)
    .eq('profile_id', profileId);

  if (error) throw error;
};

export const createEvent = async (eventData: Partial<Event>) => {
  const { data, error } = await supabase
    .from('events')
    .insert(eventData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateEventAttendance = async (
  eventId: string,
  status: EventAttendee['status']
) => {
  const { data: existingRSVP } = await supabase
    .from('event_attendees')
    .select()
    .eq('event_id', eventId)
    .eq('profile_id', supabase.auth.getUser())
    .single();

  if (existingRSVP) {
    const { error } = await supabase
      .from('event_attendees')
      .update({ status })
      .eq('event_id', eventId)
      .eq('profile_id', supabase.auth.getUser());

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('event_attendees')
      .insert({
        event_id: eventId,
        profile_id: supabase.auth.getUser(),
        status
      });

    if (error) throw error;
  }
};

export const cancelEventAttendance = async (eventId: string) => {
  const { error } = await supabase
    .from('event_attendees')
    .delete()
    .eq('event_id', eventId)
    .eq('profile_id', supabase.auth.getUser());

  if (error) throw error;
};

export const removeMember = async (communityId: string, profileId: string) => {
  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('profile_id', profileId);

  if (error) throw error;
};

export const toggleAdmin = async (communityId: string, profileId: string, makeAdmin: boolean) => {
  const { error } = await supabase
    .from('community_members')
    .update({ is_admin: makeAdmin })
    .eq('community_id', communityId)
    .eq('profile_id', profileId);

  if (error) throw error;
};

export const createReply = async (threadId: string, content: string): Promise<ThreadReply> => {
  const { data, error } = await supabase
    .from('thread_replies')
    .insert({
      thread_id: threadId,
      content: content.trim(),
    })
    .select(`
      *,
      profiles:created_by (
        username,
        avatar_url
      )
    `)
    .single();

  if (error) throw error;
  return data;
};

export const toggleThreadLike = async (threadId: string): Promise<boolean> => {
  const { data: existingLike } = await supabase
    .from('thread_likes')
    .select()
    .eq('thread_id', threadId)
    .maybeSingle();

  if (existingLike) {
    const { error } = await supabase
      .from('thread_likes')
      .delete()
      .eq('thread_id', threadId);

    if (error) throw error;
    return false;
  } else {
    const { error } = await supabase
      .from('thread_likes')
      .insert({ thread_id: threadId });

    if (error) throw error;
    return true;
  }
};

export const toggleReplyLike = async (replyId: string): Promise<boolean> => {
  const { data: existingLike } = await supabase
    .from('thread_reply_likes')
    .select()
    .eq('reply_id', replyId)
    .maybeSingle();

  if (existingLike) {
    const { error } = await supabase
      .from('thread_reply_likes')
      .delete()
      .eq('reply_id', replyId);

    if (error) throw error;
    return false;
  } else {
    const { error } = await supabase
      .from('thread_reply_likes')
      .insert({ reply_id: replyId });

    if (error) throw error;
    return true;
  }
};

export const getUserCommunities = async (userId: string) => {
  const { data, error } = await supabase
    .from('community_members')
    .select('community:communities(*)')
    .eq('profile_id', userId)
    .eq('status', 'approved');

  if (error) throw error;
  return data;
};