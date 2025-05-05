import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUI } from '../contexts/UIContext';

import Sidebar from '../components/navigation/Sidebar';
import MobileNav from '../components/navigation/MobileNav';

const MainLayout: React.FC = () => {
  const { isMobile } = useUI();

  return (
    <div className="flex min-h-screen bg-white">
      {!isMobile && <Sidebar />}
      
      <main className="flex-1 pb-20 md:pb-0 md:pl-[280px] relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="container mx-auto p-4 relative z-10"
        >
          <Outlet />
        </motion.div>
      </main>
      
      {isMobile && <MobileNav />}
    </div>
  );
};

export default MainLayout;