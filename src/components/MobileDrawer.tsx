import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  X, User, LogOut, Settings, Bell, 
  MessageCircle, Heart, Bookmark, HelpCircle, 
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const MobileDrawer: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  // Close drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const drawer = document.querySelector('.mobile-drawer');
      const drawerOverlay = document.querySelector('.drawer-overlay');
      
      if (
        document.body.classList.contains('drawer-open') && 
        drawer && 
        !drawer.contains(e.target as Node) &&
        drawerOverlay && 
        drawerOverlay.contains(e.target as Node)
      ) {
        document.body.classList.remove('drawer-open');
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    document.body.classList.remove('drawer-open');
    await signOut();
    navigate('/auth');
  };

  return (
    <>
      <div className="drawer-overlay"></div>
      <div className="mobile-drawer">
        <div className="drawer-header">
          <button 
            className="close-drawer"
            onClick={() => document.body.classList.remove('drawer-open')}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
          
          {user && profile ? (
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={profile.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile.username}`}
                alt={profile.username}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <div className="font-bold">{profile.username}</div>
                <div className="text-sm text-text-secondary">{user.email}</div>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <Link 
                to="/auth" 
                className="btn-primary w-full"
                onClick={() => document.body.classList.remove('drawer-open')}
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
        
        <div className="drawer-content">
          <div className="drawer-section">
            <h3 className="drawer-heading">Account</h3>
            <ul className="drawer-menu">
              {profile && (
                <>
                  <li>
                    <Link 
                      to={`/profile/${profile.username}`} 
                      className="drawer-menu-item"
                      onClick={() => document.body.classList.remove('drawer-open')}
                    >
                      <User size={20} />
                      <span>Profile</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/notifications" 
                      className="drawer-menu-item"
                      onClick={() => document.body.classList.remove('drawer-open')}
                    >
                      <Bell size={20} />
                      <span>Notifications</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/messages" 
                      className="drawer-menu-item"
                      onClick={() => document.body.classList.remove('drawer-open')}
                    >
                      <MessageCircle size={20} />
                      <span>Messages</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/favorites" 
                      className="drawer-menu-item"
                      onClick={() => document.body.classList.remove('drawer-open')}
                    >
                      <Heart size={20} />
                      <span>Favorites</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/saved" 
                      className="drawer-menu-item"
                      onClick={() => document.body.classList.remove('drawer-open')}
                    >
                      <Bookmark size={20} />
                      <span>Saved Items</span>
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link 
                  to="/settings" 
                  className="drawer-menu-item"
                  onClick={() => document.body.classList.remove('drawer-open')}
                >
                  <Settings size={20} />
                  <span>Settings</span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="drawer-section">
            <h3 className="drawer-heading">Support</h3>
            <ul className="drawer-menu">
              <li>
                <Link 
                  to="/help" 
                  className="drawer-menu-item"
                  onClick={() => document.body.classList.remove('drawer-open')}
                >
                  <HelpCircle size={20} />
                  <span>Help Center</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/guidelines" 
                  className="drawer-menu-item"
                  onClick={() => document.body.classList.remove('drawer-open')}
                >
                  <Shield size={20} />
                  <span>Community Guidelines</span>
                </Link>
              </li>
            </ul>
          </div>
          
          {user && (
            <div className="mt-auto pt-4">
              <button 
                className="drawer-menu-item text-red-500"
                onClick={handleLogout}
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileDrawer; 