import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Calendar, Users, Bell, 
  Settings, MessageCircle, Compass
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const location = useLocation();
  const { user } = useAuth();
  const path = location.pathname;

  const isActive = (route: string) => {
    if (route === '/' && path === '/') return true;
    if (route !== '/' && path.startsWith(route)) return true;
    return false;
  };

  return (
    <aside className={`w-64 border-r border-surface-blur p-4 ${className}`}>
      <div className="mb-8">
        <Link to="/" className="flex items-center">
          <h1 className="text-2xl font-heading text-gradient-to-r from-accent-1 to-accent-2">Gatherly</h1>
        </Link>
      </div>

      <nav className="space-y-1">
        <Link
          to="/"
          className={`nav-item ${isActive('/') ? 'active' : ''}`}
        >
          <Home size={20} />
          <span>Discover</span>
        </Link>

        <Link
          to="/events"
          className={`nav-item ${isActive('/events') ? 'active' : ''}`}
        >
          <Calendar size={20} />
          <span>Events</span>
        </Link>

        {user && (
          <>
            <Link
              to="/connections"
              className={`nav-item ${isActive('/connections') ? 'active' : ''}`}
            >
              <Users size={20} />
              <span>Connections</span>
            </Link>

            <Link
              to="/messages"
              className={`nav-item ${isActive('/messages') ? 'active' : ''}`}
            >
              <MessageCircle size={20} />
              <span>Messages</span>
            </Link>

            <Link
              to="/notifications"
              className={`nav-item ${isActive('/notifications') ? 'active' : ''}`}
            >
              <Bell size={20} />
              <span>Notifications</span>
            </Link>
          </>
        )}

        <Link
          to="/explore"
          className={`nav-item ${isActive('/explore') ? 'active' : ''}`}
        >
          <Compass size={20} />
          <span>Explore</span>
        </Link>

        {user && (
          <Link
            to="/settings"
            className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        )}
      </nav>

      {!user && (
        <div className="mt-auto pt-8">
          <Link to="/auth" className="btn-primary w-full text-center">
            Sign In
          </Link>
        </div>
      )}
    </aside>
  );
};

export default Sidebar; 