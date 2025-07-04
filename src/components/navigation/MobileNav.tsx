import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Users, Calendar, PlusCircle, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface MobileNavProps {
  toggleNotifications?: () => void;
}

const MobileNav: React.FC<MobileNavProps> = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 h-16 bg-secondary border-t border-surface-blur backdrop-blur-xl z-50"
    >
      <div className="flex h-full items-center justify-around">
        <Link 
          to="/" 
          className={`flex flex-col items-center justify-center ${isActive('/') ? 'text-accent-1' : 'text-text-secondary'}`}
        >
          <Home size={24} />
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        <Link 
          to="/communities" 
          className={`flex flex-col items-center justify-center ${isActive('/communities') ? 'text-accent-1' : 'text-text-secondary'}`}
        >
          <Users size={24} />
          <span className="text-xs mt-1">Communities</span>
        </Link>
        
        {user && (
          <div className="-mt-8">
            <Link to="/community/create" className="btn-primary flex items-center justify-center w-14 h-14 rounded-full p-0">
              <PlusCircle size={24} />
            </Link>
          </div>
        )}
        
        <Link 
          to="/events" 
          className={`flex flex-col items-center justify-center ${isActive('/events') ? 'text-accent-1' : 'text-text-secondary'}`}
        >
          <Calendar size={24} />
          <span className="text-xs mt-1">Events</span>
        </Link>
        
        {!user && (
          <Link 
            to="/auth" 
            className="flex flex-col items-center justify-center text-accent-1"
          >
            <LogIn size={24} />
            <span className="text-xs mt-1">Sign In</span>
          </Link>
        )}
      </div>
    </motion.div>
  );
};

export default MobileNav;