import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Facebook, Twitter, Instagram, MessageSquare,
  Save, X
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import type { Community } from '../../utils/supabaseClient';

interface CommunitySettingsProps {
  communityId: string;
  onClose?: () => void;
}

const CommunitySettings: React.FC<CommunitySettingsProps> = ({ communityId, onClose }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    twitter: '',
    discord: '',
    facebook: ''
  });

  useEffect(() => {
    fetchCommunityData();
  }, [communityId]);

  const fetchCommunityData = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('social_links')
        .eq('id', communityId)
        .single();

      if (error) throw error;
      if (data?.social_links) {
        setSocialLinks({
          instagram: data.social_links.instagram || '',
          twitter: data.social_links.twitter || '',
          discord: data.social_links.discord || '',
          facebook: data.social_links.facebook || ''
        });
      }
    } catch (error) {
      console.error('Error fetching community:', error);
      setError('Failed to load community settings');
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('communities')
        .update({
          social_links: socialLinks
        })
        .eq('id', communityId);

      if (error) throw error;
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error updating community:', error);
      setError('Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-heading">Community Settings</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <X size={24} />
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-xl font-heading">Social Media Links</h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Instagram size={24} />
              <input
                type="url"
                placeholder="Instagram URL"
                value={socialLinks.instagram}
                onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                className="flex-1 bg-background-secondary rounded px-3 py-2"
              />
            </div>

            <div className="flex items-center gap-3">
              <Twitter size={24} />
              <input
                type="url"
                placeholder="Twitter URL"
                value={socialLinks.twitter}
                onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                className="flex-1 bg-background-secondary rounded px-3 py-2"
              />
            </div>

            <div className="flex items-center gap-3">
              <MessageSquare size={24} />
              <input
                type="url"
                placeholder="Discord Invite URL"
                value={socialLinks.discord}
                onChange={(e) => setSocialLinks({ ...socialLinks, discord: e.target.value })}
                className="flex-1 bg-background-secondary rounded px-3 py-2"
              />
            </div>

            <div className="flex items-center gap-3">
              <Facebook size={24} />
              <input
                type="url"
                placeholder="Facebook URL"
                value={socialLinks.facebook}
                onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                className="flex-1 bg-background-secondary rounded px-3 py-2"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <div className="flex justify-end gap-4">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={20} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunitySettings; 