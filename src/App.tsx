import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

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
import CreateCommunityPage from './pages/CreateCommunityPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import MessagesPage from './pages/MessagesPage';
import NotFoundPage from './pages/NotFoundPage';

// Components
import ErrorBoundary from './components/ErrorBoundary';

// Contexts
import { UIProvider } from './contexts/UIContext';
import { AuthProvider } from './contexts/AuthContext';

const App: React.FC = () => {
  return (
    <Router>
      <ErrorBoundary>
        <UIProvider>
          <AuthProvider>
            <div className="min-h-screen bg-white">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/auth" element={<AuthPage />} />
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
                </Routes>
              </AnimatePresence>
            </div>
          </AuthProvider>
        </UIProvider>
      </ErrorBoundary>
    </Router>
  );
};

export default App;