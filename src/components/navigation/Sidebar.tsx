import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Users, 
  Calendar, 
  MessageSquare, 
  Bell, 
  Settings, 
  LogOut,
  Search,
  LogIn,
  X,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import type { Community } from '../../utils/supabaseClient';

interface SidebarProps {
  toggleNotifications: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ toggleNotifications }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Community[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const performSearch = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('communities')
          .select(`
            *,
            community_members (count)
          `)
          .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .limit(5);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (error) {
        console.error('Error searching communities:', error);
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
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  const handleSearchSelect = (communityId: string) => {
    setSearchTerm('');
    setShowSearchResults(false);
    navigate(`/community/${communityId}`);
  };

  return (
    <motion.div 
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className="fixed top-0 left-0 h-full w-[280px] bg-secondary border-r border-surface-blur backdrop-blur-lg z-10"
    >
      <div className="p-5">
        <h1 className="text-2xl font-heading text-accent-1 mb-8 flex items-center">
          <span className="mr-2">⬢</span> NeoByte
        </h1>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 text-text-secondary" size={18} />
          <input 
            type="text" 
            placeholder="Search communities..." 
            className="input-neon w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            onFocus={() => {
              if (searchTerm) setShowSearchResults(true);
            }}
          />
          {searchTerm && (
            <button
              className="absolute right-3 top-3 text-text-secondary hover:text-accent-1"
              onClick={() => setSearchTerm('')}
            >
              <X size={18} />
            </button>
          )}

          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-secondary border border-surface-blur rounded-xl shadow-lg overflow-hidden z-50">
              {isSearching ? (
                <div className="p-4 text-center text-text-secondary">
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto">
                  {searchResults.map(community => (
                    <button
                      key={community.id}
                      className="w-full p-3 hover:bg-surface-blur flex items-start gap-3 text-left"
                      onClick={() => handleSearchSelect(community.id)}
                    >
                      <div className="flex-1">
                        <div className="font-bold text-accent-1">{community.name}</div>
                        {community.description && (
                          <div className="text-sm text-text-secondary line-clamp-1">
                            {community.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
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
              ) : searchTerm && (
                <div className="p-4 text-center text-text-secondary">
                  No communities found
                </div>
              )}
            </div>
          )}
        </div>
        
        <nav className="space-y-2 mb-6">
          <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
            <Home size={20} />
            <span>Discover</span>
          </Link>
          {user && (
            <>
              <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
                <Users size={20} />
                <span>My Communities</span>
              </Link>
              <Link to="/events" className={`nav-item ${isActive('/events') ? 'active' : ''}`}>
                <Calendar size={20} />
                <span>Events</span>
              </Link>
              <Link to="/messages" className={`nav-item ${isActive('/messages') ? 'active' : ''}`}>
                <MessageSquare size={20} />
                <span>Messages</span>
              </Link>
            </>
          )}
        </nav>
        
        <div className="border-t border-surface-blur pt-6 mt-6">
          {user ? (
            <>
              <button 
                className="nav-item w-full" 
                onClick={toggleNotifications}
              >
                <Bell size={20} />
                <span>Notifications</span>
              </button>
              <Link to="/settings" className="nav-item">
                <Settings size={20} />
                <span>Settings</span>
              </Link>
              <button 
                className="nav-item w-full text-error"
                onClick={() => signOut()}
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <Link to="/auth" className="nav-item text-accent-1">
              <LogIn size={20} />
              <span>Sign In</span>
            </Link>
          )}
        </div>

        {profile && (
          <Link
            to={`/profile/${profile.username}`}
            className="absolute bottom-20 left-5 right-5 glass-panel p-4 flex items-center gap-3 hover:border-accent-1 transition-all cursor-pointer"
          >
            <img
              src={profile.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile.username}`}
              alt={profile.username}
              className="w-10 h-10 rounded-full border-2 border-accent-1"
            />
            <div>
              <div className="font-bold">{profile.username}</div>
              <div className="text-sm text-text-secondary">Member</div>
            </div>
          </Link>
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