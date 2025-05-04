import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const notifications = [
  {
    id: 1,
    isRead: false,
    title: 'New event in Cyberpunk Enthusiasts',
    message: 'Virtual Reality Meetup this Friday at 8pm',
    time: '10 minutes ago'
  },
  {
    id: 2,
    isRead: false,
    title: 'Your post got 5 new replies',
    message: 'Check out the discussion in AI Ethics thread',
    time: '2 hours ago'
  },
  {
    id: 3,
    isRead: true,
    title: 'Weekly community digest',
    message: 'See what happened in your communities this week',
    time: '1 day ago'
  }
];

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] glass-panel rounded-l-3xl z-50"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-heading flex items-center gap-2">
                  <Bell className="text-accent-1" size={20} />
                  Notifications
                </h3>
                <button 
                  onClick={onClose}
                  className="btn-icon"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="space-y-4">
                {notifications.map(notification => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`glass-panel p-4 ${!notification.isRead ? 'border-l-4 border-accent-2' : ''}`}
                  >
                    <div className="flex justify-between">
                      <h4 className="font-bold text-sm">{notification.title}</h4>
                      <span className="text-xs text-text-secondary">{notification.time}</span>
                    </div>
                    <p className="text-sm text-text-secondary mt-1">{notification.message}</p>
                  </motion.div>
                ))}
              </div>
              
              <button className="w-full text-center text-accent-1 mt-6 text-sm hover:underline">
                Mark all as read
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;