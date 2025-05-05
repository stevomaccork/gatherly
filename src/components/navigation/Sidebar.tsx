import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  Bell, 
  Settings, 
  LogOut,
  Search,
  LogIn,
  X,
  MapPin,
  Compass
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import type { Community, Event } from '../../utils/supabaseClient';
import { useUI } from '../../contexts/UIContext';
import Logo from '../common/Logo';

interface CommunityWithCount extends Community {
  community_members: Array<{ count: number }>;
}

// Extended Event type for search results from Supabase
interface EventWithCount extends Omit<Event, 'event_attendees'> {
  event_attendees: Array<{ count: number }>;
}

interface SupabaseCommunityResponse {
  community: Community;
}

interface SidebarProps {
  toggleNotifications: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ toggleNotifications }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile, user } = useAuth();
  const { isMobile } = useUI();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'communities' | 'events'>('communities');
  const [searchResults, setSearchResults] = useState<CommunityWithCount[]>([]);
  const [eventSearchResults, setEventSearchResults] = useState<EventWithCount[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const isActive = (path: string): boolean => {
    if (path === '/communities') {
      return location.pathname === '/' || location.pathname === '/communities';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const performSearch = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        setEventSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        if (searchType === 'communities') {
          const { data, error } = await supabase
            .from('communities')
            .select('*, community_members(count)')
            .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
            .limit(5);

          if (error) throw error;
          setSearchResults(data as CommunityWithCount[] || []);
          setEventSearchResults([]);
        } else {
          const { data, error } = await supabase
            .from('events')
            .select(`
              *,
              communities (id, name),
              event_attendees (count)
            `)
            .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
            .gte('start_time', new Date().toISOString())
            .limit(5);

          if (error) throw error;
          setEventSearchResults(data as EventWithCount[] || []);
          setSearchResults([]);
        }
      } catch (error) {
        console.error(`Error searching ${searchType}:`, error);
      } finally {
        setIsSearching(false);
      }
    };

    if (searchTerm) {
      timeoutId = setTimeout(performSearch, 300);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
      setSearchResults([]);
      setEventSearchResults([]);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchTerm, searchType]);

  useEffect(() => {
    if (user) {
      fetchUserCommunities();
    } else {
      setCommunities([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchUserCommunities = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select('community:communities(*)') // This returns the nested community object
        .eq('profile_id', user.id)
        .eq('status', 'approved');

      if (error) throw error;

      // Properly type and transform the data
      const typedData = (data || []) as unknown as SupabaseCommunityResponse[];
      const validCommunities = typedData
        .map(item => item.community)
        .filter((community): community is Community => {
          return Boolean(
            community &&
            typeof community === 'object' &&
            'id' in community &&
            'name' in community &&
            typeof community.id === 'string' &&
            typeof community.name === 'string'
          );
        });
      
      setCommunities(validCommunities);
    } catch (error) {
      console.error('Error fetching communities:', error);
      setCommunities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSelect = (id: string, type: 'community' | 'event') => {
    setSearchTerm('');
    setShowSearchResults(false);
    if (type === 'community') {
      navigate(`/community/${id}`);
    } else {
      navigate(`/event/${id}`);
    }
  };

  if (isLoading) {
    return (
      <motion.div 
        initial={{ x: isMobile ? -280 : 0 }}
        animate={{ x: 0 }}
        className={`fixed top-0 left-0 h-full w-[280px] bg-accent-5 border-r border-accent-1/20 backdrop-blur-lg z-10 ${
          isMobile ? 'transform transition-transform' : ''
        }`}
      >
        <div className="p-5">
          <div className="animate-pulse">Loading...</div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ x: isMobile ? -280 : 0 }}
      animate={{ x: 0 }}
      className={`fixed top-0 left-0 h-full w-[280px] bg-accent-5 border-r border-accent-1/20 backdrop-blur-lg z-10 ${
        isMobile ? 'transform transition-transform' : ''
      }`}
    >
      <div className="p-5">
        <div className="mb-8">
          <Logo size="md" />
        </div>
        
        <div className="relative mb-6">
          <div className="flex gap-2 mb-3">
            <button
              className={`px-3 py-1 rounded-full text-xs ${
                searchType === 'communities' 
                  ? 'bg-accent-1 text-white' 
                  : 'bg-white/60 text-accent-2'
              }`}
              onClick={() => setSearchType('communities')}
            >
              Communities
            </button>
            <button
              className={`px-3 py-1 rounded-full text-xs ${
                searchType === 'events' 
                  ? 'bg-accent-1 text-white' 
                  : 'bg-white/60 text-accent-2'
              }`}
              onClick={() => setSearchType('events')}
            >
              Events
            </button>
          </div>
          
          <Search className="absolute left-3 top-3 text-accent-2" size={18} />
          <input 
            type="text" 
            placeholder={`Search ${searchType}...`} 
            className="input-neon w-full pl-10 bg-white/80 text-accent-2 placeholder-accent-2/60"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            onFocus={() => {
              if (searchTerm) setShowSearchResults(true);
            }}
          />
          {searchTerm && (
            <button
              className="absolute right-3 top-3 text-accent-2 hover:text-accent-3"
              onClick={() => setSearchTerm('')}
            >
              <X size={18} />
            </button>
          )}

          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 border border-accent-1/20 rounded-xl shadow-lg overflow-hidden z-50">
              {isSearching ? (
                <div className="p-4 text-center text-accent-2">
                  Searching...
                </div>
              ) : searchType === 'communities' && searchResults.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto">
                  {searchResults.map(community => (
                    <button
                      key={community.id}
                      className="w-full p-3 hover:bg-accent-5/50 flex items-start gap-3 text-left"
                      onClick={() => handleSearchSelect(community.id, 'community')}
                    >
                      <div className="flex-1">
                        <div className="font-bold text-accent-1">{community.name}</div>
                        {community.description && (
                          <div className="text-sm text-accent-2 line-clamp-1">
                            {community.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-accent-2">
                          <Users size={12} />
                          <span>{community.community_members?.[0]?.count || 0} members</span>
                          {community.city && (
                            <>
                              <span>•</span>
                              <MapPin size={12} />
                              <span>{community.city}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchType === 'events' && eventSearchResults.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto">
                  {eventSearchResults.map(event => (
                    <button
                      key={event.id}
                      className="w-full p-3 hover:bg-accent-5/50 flex items-start gap-3 text-left"
                      onClick={() => handleSearchSelect(event.id, 'event')}
                    >
                      <div className="flex-1">
                        <div className="font-bold text-accent-1">{event.title}</div>
                        {event.description && (
                          <div className="text-sm text-accent-2 line-clamp-1">
                            {event.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-accent-2">
                          <Calendar size={12} />
                          <span>{new Date(event.start_time).toLocaleDateString()}</span>
                          {event.communities && (
                            <>
                              <span>•</span>
                              <Users size={12} />
                              <span>{event.communities.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchTerm && (
                <div className="p-4 text-center text-accent-2">
                  No {searchType} found
                </div>
              )}
            </div>
          )}
        </div>
        
        <nav className="space-y-2 mb-6">
          <h3 className="text-xs text-accent-2/70 uppercase tracking-wider font-semibold px-2 mb-1">Discover</h3>
          
          <Link to="/communities" className={`nav-item ${isActive('/communities') ? 'active font-bold' : 'text-accent-2 font-semibold'}`}>
            <Compass size={20} />
            <span>Communities</span>
          </Link>
          
          <Link to="/events" className={`nav-item ${isActive('/events') ? 'active font-bold' : 'text-accent-2 font-semibold'}`}>
            <Calendar size={20} />
            <span>Events</span>
          </Link>
          
          {user && (
            <>
              <h3 className="text-xs text-accent-2/70 uppercase tracking-wider font-semibold px-2 mb-1 mt-4">Personal</h3>
              
              <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active font-bold' : 'text-accent-2 font-semibold'}`}>
                <Users size={20} />
                <span>My Communities</span>
              </Link>
              
              <Link to="/messages" className={`nav-item ${isActive('/messages') ? 'active font-bold' : 'text-accent-2 font-semibold'}`}>
                <MessageSquare size={20} />
                <span>Messages</span>
              </Link>
            </>
          )}
        </nav>
        
        <div className="border-t border-accent-1/20 pt-6 mt-6">
          {user ? (
            <>
              <button 
                className="nav-item w-full text-accent-2 font-semibold hover:text-accent-3" 
                onClick={toggleNotifications}
              >
                <Bell size={20} />
                <span>Notifications</span>
              </button>
              <Link to="/settings" className="nav-item text-accent-2 font-semibold hover:text-accent-3">
                <Settings size={20} />
                <span>Settings</span>
              </Link>
              <button 
                className="nav-item w-full text-error font-semibold"
                onClick={() => signOut()}
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <Link to="/auth" className="nav-item text-accent-1 font-bold">
              <LogIn size={20} />
              <span>Sign In</span>
            </Link>
          )}
        </div>

        {profile && (
          <Link
            to={`/profile/${profile.username}`}
            className="absolute bottom-20 left-5 right-5 bg-white/90 p-4 flex items-center gap-3 hover:bg-white transition-all cursor-pointer rounded-xl border border-accent-1/30 shadow-md"
          >
            <img
              src={profile.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile.username}`}
              alt={profile.username}
              className="w-10 h-10 rounded-full border-2 border-accent-1"
            />
            <div>
              <div className="font-bold text-accent-2">{profile.username}</div>
              <div className="text-sm text-accent-2/80">Member</div>
            </div>
          </Link>
        )}

        {user && communities.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs text-accent-2/70 uppercase tracking-wider font-semibold px-2 mb-2">My Communities</h3>
            <div className="communities-list max-h-[300px] overflow-y-auto space-y-1">
              {communities.map(community => (
                <Link
                  key={community.id}
                  to={`/community/${community.id}`}
                  className="block rounded-lg p-2 hover:bg-white/60 transition-colors text-accent-2"
                >
                  <h3 className="font-bold line-clamp-1">{community.name}</h3>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="absolute bottom-5 left-5 right-5">
        {user ? (
          <Link to="/community/create" className="btn-primary w-full text-center block">
            + Create Community
          </Link>
        ) : (
          <Link to="/auth" className="btn-primary w-full text-center block">
            Sign in to Create Community
          </Link>
        )}
      </div>
    </motion.div>
  );
};

export default Sidebar;