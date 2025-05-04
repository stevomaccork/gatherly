import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, MessageSquare, Calendar, Settings, Edit } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [communities, setCommunities] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'communities' | 'threads' | 'events'>('communities');

  useEffect(() => {
    if (username) {
      fetchProfileData();
    }
  }, [username]);

  const fetchProfileData = async () => {
    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch communities
      const { data: communitiesData } = await supabase
        .from('community_members')
        .select(`
          communities (
            id,
            name,
            description,
            cover_image,
            community_members (count)
          )
        `)
        .eq('profile_id', profileData.id)
        .eq('status', 'approved');

      setCommunities(communitiesData?.map(item => item.communities) || []);

      // Fetch threads
      const { data: threadsData } = await supabase
        .from('threads')
        .select(`
          *,
          communities (name),
          thread_likes (count)
        `)
        .eq('created_by', profileData.id)
        .order('created_at', { ascending: false });

      setThreads(threadsData || []);

      // Fetch events
      const { data: eventsData } = await supabase
        .from('events')
        .select(`
          *,
          communities (name),
          event_attendees (count)
        `)
        .eq('created_by', profileData.id)
        .order('start_time', { ascending: false });

      setEvents(eventsData || []);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-accent-1">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-heading text-accent-1">Profile not found</h2>
        <Link to="/" className="btn-primary mt-4 inline-block">
          Back to Discover
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="glass-panel p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <img
              src={profile.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile.username}`}
              alt={profile.username}
              className="w-24 h-24 rounded-full border-4 border-accent-1"
            />
            <div>
              <h1 className="text-3xl font-heading">{profile.username}</h1>
              <div className="text-text-secondary">
                Member since {new Date(profile.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          {user?.id === profile.id && (
            <Link to="/settings" className="btn-secondary">
              <Settings size={18} className="mr-2" />
              Edit Profile
            </Link>
          )}
        </div>

        <div className="flex gap-6 text-text-secondary">
          <div className="flex items-center gap-2">
            <Users size={16} />
            <span>{communities.length} Communities</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare size={16} />
            <span>{threads.length} Threads</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>{events.length} Events</span>
          </div>
        </div>
      </div>

      <div className="mb-8 flex border-b border-surface-blur">
        <button 
          className={`pb-3 px-4 text-sm font-bold relative ${activeTab === 'communities' ? 'text-accent-1' : 'text-text-secondary'}`}
          onClick={() => setActiveTab('communities')}
        >
          Communities
          {activeTab === 'communities' && (
            <motion.div 
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-1" 
            />
          )}
        </button>
        <button 
          className={`pb-3 px-4 text-sm font-bold relative ${activeTab === 'threads' ? 'text-accent-1' : 'text-text-secondary'}`}
          onClick={() => setActiveTab('threads')}
        >
          Threads
          {activeTab === 'threads' && (
            <motion.div 
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-1" 
            />
          )}
        </button>
        <button 
          className={`pb-3 px-4 text-sm font-bold relative ${activeTab === 'events' ? 'text-accent-1' : 'text-text-secondary'}`}
          onClick={() => setActiveTab('events')}
        >
          Events
          {activeTab === 'events' && (
            <motion.div 
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-1" 
            />
          )}
        </button>
      </div>

      {activeTab === 'communities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map(community => (
            <motion.div
              key={community.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel overflow-hidden"
            >
              <Link to={`/community/${community.id}`}>
                <div 
                  className="h-32 w-full bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${community.cover_image})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-secondary/90"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-heading text-white">{community.name}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-text-secondary text-sm mb-2 line-clamp-2">
                    {community.description}
                  </p>
                  <div className="flex items-center text-xs text-text-secondary">
                    <Users size={12} className="mr-1" />
                    <span>{community.community_members_count} members</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'threads' && (
        <div className="space-y-4">
          {threads.map(thread => (
            <motion.div
              key={thread.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6"
            >
              <Link to={`/thread/${thread.id}`} className="block">
                <div className="text-sm text-accent-2 mb-2">
                  in {thread.communities.name}
                </div>
                <h3 className="text-xl font-bold hover:text-accent-1 transition-colors">
                  {thread.title}
                </h3>
                <div className="flex items-center gap-4 mt-3 text-text-secondary text-sm">
                  <div className="flex items-center">
                    <MessageSquare size={14} className="mr-1" />
                    <span>{thread.thread_likes_count} likes</span>
                  </div>
                  <span>{new Date(thread.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel overflow-hidden"
            >
              <Link to={`/event/${event.id}`}>
                <div 
                  className="h-32 w-full bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${event.cover_image})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-secondary/90"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="text-accent-2 text-sm">{event.communities.name}</div>
                    <h3 className="font-heading text-white">{event.title}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center text-text-secondary text-sm mb-2">
                    <Calendar size={14} className="mr-1" />
                    <span>{new Date(event.start_time).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-text-secondary text-sm">
                    <Users size={14} className="mr-1" />
                    <span>{event.event_attendees_count} attending</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ProfilePage;