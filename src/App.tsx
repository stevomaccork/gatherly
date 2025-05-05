import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import DiscoverPage from './pages/DiscoverPage';
import CommunityPage from './pages/CommunityPage';
import ThreadPage from './pages/ThreadPage';
import EventPage from './pages/EventPage';
import EventsPage from './pages/EventsPage';
import DashboardPage from './pages/DashboardPage';
import AuthPage from './pages/AuthPage';
import AuthCallback from './pages/AuthCallback';
import CreateCommunityPage from './pages/CreateCommunityPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import MessagesPage from './pages/MessagesPage';
import NotFoundPage from './pages/NotFoundPage';

// Components
import ErrorBoundary from './components/ErrorBoundary';
import MobileNav from './components/MobileNav';
import MobileDrawer from './components/MobileDrawer';

// Contexts
import { UIProvider } from './contexts/UIContext';
import { AuthProvider } from './contexts/AuthContext';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <ErrorBoundary>
          <UIProvider>
            <div className="flex min-h-screen">
              <Sidebar className="hidden md:block" />
              <main className="flex-1 px-4 md:px-8 py-4 md:py-8 max-w-7xl mx-auto w-full">
                <AnimatePresence mode="wait">
                  <Routes>
                    <Route path="/" element={<MainLayout />}>
                      <Route index element={<DiscoverPage />} />
                      <Route path="communities" element={<DiscoverPage />} />
                      <Route path="community/create" element={<CreateCommunityPage />} />
                      <Route path="community/:id" element={<CommunityPage />} />
                      <Route path="thread/:id" element={<ThreadPage />} />
                      <Route path="event/:id" element={<EventPage />} />
                      <Route path="events" element={<EventsPage />} />
                      <Route path="dashboard" element={<DashboardPage />} />
                      <Route path="profile/:username" element={<ProfilePage />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="messages" element={<MessagesPage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Route>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                  </Routes>
                </AnimatePresence>
              </main>
            </div>
            
            {/* Mobile Navigation and Drawer */}
            <MobileNav />
            <MobileDrawer />
          </UIProvider>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
};

export default App;