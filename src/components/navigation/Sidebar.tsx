import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  Calendar,
  Search,
  LogIn,
  Home
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import Logo from '../common/Logo';

interface SidebarProps {
  toggleNotifications?: () => void;
}

const Sidebar: React.FC<SidebarProps> = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { isMobile } = useUI();
  
  const isActive = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/communities';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="fixed top-0 left-0 h-full w-[280px] bg-accent-5 border-r border-accent-1/20 backdrop-blur-lg z-10">
      <div className="p-5">
        <div className="mb-8">
          <Logo size="md" />
        </div>
        
        <div className="relative mb-6">
          <Link to="/search" className="flex items-center p-3 bg-white/80 rounded-lg text-accent-2">
            <Search className="mr-2" size={18} />
            <span>Search communities...</span>
          </Link>
        </div>
        
        <nav className="space-y-3 mb-6">
          <h3 className="text-xs text-accent-2/70 uppercase tracking-wider font-semibold px-2 mb-1">Navigation</h3>
          
          <Link to="/" className={`nav-item ${isActive('/') ? 'active font-bold' : 'text-accent-2 font-semibold'}`}>
            <Home size={20} />
            <span>Home</span>
          </Link>
          
          <Link to="/communities" className={`nav-item ${isActive('/communities') ? 'active font-bold' : 'text-accent-2 font-semibold'}`}>
            <Users size={20} />
            <span>Communities</span>
          </Link>
          
          <Link to="/events" className={`nav-item ${isActive('/events') ? 'active font-bold' : 'text-accent-2 font-semibold'}`}>
            <Calendar size={20} />
            <span>Events</span>
          </Link>
          
          {!user && (
            <Link to="/auth" className="nav-item border border-accent-1 bg-white mt-4 text-accent-1 font-bold rounded-lg flex justify-center">
              <LogIn size={20} className="mr-2" />
              <span>Sign In</span>
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;