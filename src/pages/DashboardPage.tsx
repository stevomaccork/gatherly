import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Calendar, Clock, ChevronRight, Video, Globe, MapPin, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import type { Community, Event } from '../utils/supabaseClient';

const DashboardPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [myCommunities, setMyCommunities] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [suggestedCommunities, setSuggestedCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [joiningCommunity, setJoiningCommunity] = useState<string | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    if (user) {
      fetchMyCommunities();
      fetchUpcomingEvents();
      fetchSuggestedCommunities();
    }
  }, [user]);

  const fetchMyCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          community_id,
          role,
          is_admin,
          communities (
            id,
            name,
            cover_image,
            threads (count),
            community_members (count)
          )
        `)
        .eq('profile_id', user?.id)
        .eq('status', 'approved');

      if (error) throw error;

      setMyCommunities(data?.map(item => ({
        id: item.community_id,
        name: item.communities?.name,
        role: item.is_admin ? 'Admin' : item.role,
        unreadPosts: item.communities?.threads_count || 0,
        avatar: item.communities?.cover_image,
        members: item.communities?.community_members_count || 0
      })) || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          communities (name),
          event_attendees (count)
        `)
        .in('community_id', myCommunities.map(c => c.id))
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(5);

      if (error) throw error;
      setUpcomingEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchSuggestedCommunities = async () => {
    try {
      // Exclude communities the user is already a member of
      const myCommunityIds = myCommunities.map(c => c.id);
      
      let query = supabase
        .from('communities')
        .select(`
          *,
          community_members (count),
          community_categories (
            categories (
              name
            )
          )
        `)
        .limit(6);

      // Only add the not-in condition if there are communities to exclude
      if (myCommunityIds.length > 0) {
        query = query.not('id', 'in', myCommunityIds);
      }

      // If user has interests, prioritize communities with matching categories
      if (profile?.interests?.length > 0) {
        query = query.contains('community_categories.categories.id', profile.interests);
      }

      // If user has location, prioritize nearby communities
      if (profile?.city) {
        query = query.ilike('city', `%${profile.city}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Sort communities by relevance score
      const sortedData = data?.sort((a, b) => {
        let scoreA = a.community_members?.[0]?.count || 0;
        let scoreB = b.community_members?.[0]?.count || 0;

        // Boost score for matching interests
        if (profile?.interests) {
          const matchingInterestsA = a.community_categories?.filter(cc => 
            profile.interests.includes(cc.categories.id)
          ).length || 0;
          const matchingInterestsB = b.community_categories?.filter(cc => 
            profile.interests.includes(cc.categories.id)
          ).length || 0;
          scoreA += matchingInterestsA * 100;
          scoreB += matchingInterestsB * 100;
        }

        // Boost score for location match
        if (profile?.city) {
          if (a.city?.toLowerCase().includes(profile.city.toLowerCase())) scoreA += 200;
          if (b.city?.toLowerCase().includes(profile.city.toLowerCase())) scoreB += 200;
        }

        return scoreB - scoreA;
      }) || [];

      setSuggestedCommunities(sortedData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching suggested communities:', error);
      setIsLoading(false);
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    try {
      setJoiningCommunity(communityId);
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          profile_id: user?.id,
          role: 'member',
          status: 'approved'
        });

      if (error) throw error;

      // Refresh the lists
      await Promise.all([
        fetchMyCommunities(),
        fetchSuggestedCommunities()
      ]);
    } catch (error) {
      console.error('Error joining community:', error);
      alert('Failed to join community. Please try again.');
    } finally {
      setJoiningCommunity(null);
    }
  };

  const filteredCommunities = suggestedCommunities.filter(community =>
    community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    community.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="glass-panel p-6 mb-8 bg-gradient-to-r from-primary via-secondary to-primary overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-1 rounded-full filter blur-[100px] opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-2 rounded-full filter blur-[100px] opacity-20"></div>
        
        <h1 className="text-3xl font-heading mb-2 relative z-10">
          <span className="text-gradient-to-r from-accent-1 to-accent-2">
            {greeting}, {profile?.username}
          </span>
        </h1>
        <p className="text-text-secondary relative z-10">
          {myCommunities.length > 0 
            ? `You're a member of ${myCommunities.length} ${myCommunities.length === 1 ? 'community' : 'communities'}`
            : "Join some communities to get started!"}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-heading">Upcoming Events</h2>
              <Link to="/events" className="text-accent-1 hover:underline text-sm">View All</Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map(event => (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel overflow-hidden"
                  >
                    <Link to={`/event/${event.id}`}>
                      <div 
                        className="h-32 w-full bg-cover bg-center relative"
                        style={{ backgroundImage: `url(${event.cover_image || 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg'})` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-secondary/90"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="flex items-center gap-2 text-accent-2 text-sm">
                            {event.type === 'online' && <Video size={16} />}
                            {event.type === 'hybrid' && <Globe size={16} />}
                            <span>{event.communities?.name}</span>
                          </div>
                          <h3 className="font-heading text-lg text-white">{event.title}</h3>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center text-text-secondary text-sm mb-2">
                          <Calendar size={14} className="mr-1" />
                          <span>{new Date(event.start_time).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-text-secondary text-sm mb-2">
                          <Clock size={14} className="mr-1" />
                          <span>
                            {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center text-text-secondary text-sm">
                          <Users size={14} className="mr-1" />
                          <span>
                            {event.event_attendees_count} 
                            {event.max_attendees ? ` / ${event.max_attendees}` : ''} attending
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-2 glass-panel p-6 text-center text-text-secondary">
                  No upcoming events in your communities
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <div className="mb-8">
            <h2 className="text-2xl font-heading mb-4">My Communities</h2>
            
            <div className="glass-panel divide-y divide-surface-blur mb-4">
              {myCommunities.length > 0 ? (
                myCommunities.map(community => (
                  <Link 
                    key={community.id}
                    to={`/community/${community.id}`}
                    className="flex items-center p-4 hover:bg-surface-blur transition-colors"
                  >
                    <img 
                      src={community.avatar || 'https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg'} 
                      alt={community.name} 
                      className="w-12 h-12 rounded-full mr-4" 
                    />
                    <div className="flex-1">
                      <div className="font-bold">{community.name}</div>
                      <div className="flex justify-between text-sm">
                        <span className="text-accent-2">{community.role}</span>
                        <span className="text-text-secondary">
                          {community.members} members
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-text-secondary" />
                  </Link>
                ))
              ) : (
                <div className="p-4 text-center text-text-secondary">
                  You haven't joined any communities yet
                </div>
              )}
            </div>
            
            <Link to="/community/create" className="btn-secondary w-full text-center">
              + Create New Community
            </Link>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-heading">Suggested For You</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                <input
                  type="text"
                  placeholder="Search..."
                  className="input-neon pl-9 py-1 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              {filteredCommunities.map(community => (
                <motion.div
                  key={community.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel overflow-hidden"
                >
                  <div 
                    className="h-24 w-full bg-cover bg-center relative"
                    style={{ backgroundImage: `url(${community.cover_image || 'https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg'})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-secondary/90"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-heading text-white">{community.name}</h3>
                      {community.city && (
                        <div className="flex items-center text-text-secondary text-xs">
                          <MapPin size={12} className="mr-1" />
                          {community.city}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-text-secondary text-sm mb-2 line-clamp-2">
                      {community.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {community.community_categories?.map(({ categories }) => (
                        <span
                          key={categories.id}
                          className="px-2 py-1 bg-surface-blur rounded-full text-xs text-text-secondary"
                        >
                          {categories.name}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-xs text-text-secondary">
                        <Users size={12} className="mr-1" />
                        <span>{community.community_members?.[0]?.count || 0} members</span>
                      </div>
                      <button
                        className={`btn-primary text-xs px-3 py-1 ${joiningCommunity === community.id ? 'opacity-50' : ''}`}
                        onClick={() => handleJoinCommunity(community.id)}
                        disabled={joiningCommunity === community.id}
                      >
                        {joiningCommunity === community.id ? 'Joining...' : 'Join'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {!isLoading && filteredCommunities.length === 0 && (
                <div className="text-center py-8 text-text-secondary">
                  No matching communities found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;