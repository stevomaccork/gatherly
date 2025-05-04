import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Bell, Shield, Trash2 } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const SettingsPage: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(profile?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'danger'>('profile');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSubmitting(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase.rpc('delete_user_account');
      if (error) throw error;
      
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error deleting account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-heading mb-8">Account Settings</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="glass-panel p-4">
            <nav className="space-y-2">
              <button
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 ${
                  activeTab === 'profile' ? 'bg-accent-1 text-primary' : 'hover:bg-surface-blur'
                }`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={18} />
                Profile
              </button>
              <button
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 ${
                  activeTab === 'notifications' ? 'bg-accent-1 text-primary' : 'hover:bg-surface-blur'
                }`}
                onClick={() => setActiveTab('notifications')}
              >
                <Bell size={18} />
                Notifications
              </button>
              <button
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 ${
                  activeTab === 'security' ? 'bg-accent-1 text-primary' : 'hover:bg-surface-blur'
                }`}
                onClick={() => setActiveTab('security')}
              >
                <Shield size={18} />
                Security
              </button>
              <button
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 ${
                  activeTab === 'danger' ? 'bg-error text-primary' : 'text-error hover:bg-surface-blur'
                }`}
                onClick={() => setActiveTab('danger')}
              >
                <Trash2 size={18} />
                Danger Zone
              </button>
            </nav>
          </div>

          <div className="md:col-span-3">
            {activeTab === 'profile' && (
              <div className="glass-panel p-6">
                <h2 className="text-xl font-heading mb-6">Profile Settings</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex items-center gap-6 mb-8">
                    <img
                      src={avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full border-4 border-accent-1"
                    />
                    <div>
                      <input
                        type="file"
                        id="avatar"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="avatar"
                        className="btn-secondary cursor-pointer"
                      >
                        Change Avatar
                      </label>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-sm font-bold mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      className="input-neon w-full"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-bold mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="input-neon w-full"
                      value={user?.email}
                      disabled
                    />
                    <p className="text-sm text-text-secondary mt-1">
                      Email cannot be changed
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="glass-panel p-6">
                <h2 className="text-xl font-heading mb-6">Notification Preferences</h2>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 glass-panel">
                    <div>
                      <div className="font-bold">Email Notifications</div>
                      <div className="text-sm text-text-secondary">
                        Receive email notifications for important updates
                      </div>
                    </div>
                    <input type="checkbox" className="toggle" />
                  </label>

                  <label className="flex items-center justify-between p-4 glass-panel">
                    <div>
                      <div className="font-bold">Community Updates</div>
                      <div className="text-sm text-text-secondary">
                        Get notified about new posts in your communities
                      </div>
                    </div>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </label>

                  <label className="flex items-center justify-between p-4 glass-panel">
                    <div>
                      <div className="font-bold">Event Reminders</div>
                      <div className="text-sm text-text-secondary">
                        Receive reminders for upcoming events
                      </div>
                    </div>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="glass-panel p-6">
                <h2 className="text-xl font-heading mb-6">Security Settings</h2>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-bold mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      className="input-neon w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-bold mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      className="input-neon w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-bold mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      className="input-neon w-full"
                    />
                  </div>

                  <button className="btn-primary">
                    Change Password
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="glass-panel p-6">
                <h2 className="text-xl font-heading mb-6 text-error">Danger Zone</h2>
                <div className="space-y-6">
                  <div className="glass-panel p-4 border-2 border-error">
                    <h3 className="text-lg font-bold text-error mb-2">Delete Account</h3>
                    <p className="text-text-secondary mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button
                      className="btn-secondary text-error border-error hover:bg-error hover:text-primary"
                      onClick={handleDeleteAccount}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;