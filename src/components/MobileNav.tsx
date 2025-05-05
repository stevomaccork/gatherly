import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Calendar, Users, Menu } from 'lucide-react';

const MobileNav: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-primary z-50 md:hidden border-t border-surface-blur">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-around items-center h-16">
          <Link 
            to="/" 
            className={`mobile-nav-item ${path === '/' ? 'active' : ''}`}
            aria-label="Discover"
          >
            <Home size={24} />
            <span className="text-xs">Discover</span>
          </Link>
          
          <Link 
            to="/events" 
            className={`mobile-nav-item ${path.includes('/events') || path.includes('/event/') ? 'active' : ''}`}
            aria-label="Events"
          >
            <Calendar size={24} />
            <span className="text-xs">Events</span>
          </Link>
          
          <Link 
            to="/connections" 
            className={`mobile-nav-item ${path.includes('/connections') ? 'active' : ''}`}
            aria-label="Connections"
          >
            <Users size={24} />
            <span className="text-xs">Connections</span>
          </Link>
          
          <Link 
            to="/search" 
            className={`mobile-nav-item ${path.includes('/search') ? 'active' : ''}`}
            aria-label="Search"
          >
            <Search size={24} />
            <span className="text-xs">Search</span>
          </Link>
          
          <button 
            className="mobile-nav-item"
            onClick={() => document.body.classList.toggle('drawer-open')}
            aria-label="Menu"
          >
            <Menu size={24} />
            <span className="text-xs">Menu</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default MobileNav; 