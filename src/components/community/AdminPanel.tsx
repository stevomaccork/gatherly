import React, { useState, useEffect } from 'react';
import { Users, Shield, Ban, UserPlus, UserMinus } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase, getMembers, updateMemberStatus, toggleAdmin, removeMember } from '../../utils/supabaseClient';
import type { CommunityMember } from '../../utils/supabaseClient';

interface AdminPanelProps {
  communityId: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ communityId }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'approved' | 'banned'>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const data = await getMembers(communityId);
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (profileId: string, status: CommunityMember['status']) => {
    try {
      await updateMemberStatus(communityId, profileId, status);
      fetchMembers();
    } catch (error) {
      console.error('Error updating member status:', error);
    }
  };

  const handleAdminToggle = async (profileId: string, makeAdmin: boolean) => {
    try {
      await toggleAdmin(communityId, profileId, makeAdmin);
      fetchMembers();
    } catch (error) {
      console.error('Error toggling admin status:', error);
    }
  };

  const handleRemoveMember = async (profileId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
      await removeMember(communityId, profileId);
      fetchMembers();
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const filteredMembers = members.filter(member => member.status === selectedTab);

  return (
    <div className="glass-panel p-6">
      <h2 className="text-2xl font-heading mb-6">Community Management</h2>

      <div className="flex gap-4 mb-6">
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            selectedTab === 'pending' ? 'bg-accent-1 text-primary' : 'bg-surface-blur text-text-secondary'
          }`}
          onClick={() => setSelectedTab('pending')}
        >
          <UserPlus size={16} />
          <span>Pending</span>
          <span className="bg-primary/20 px-2 rounded-full ml-1">
            {members.filter(m => m.status === 'pending').length}
          </span>
        </button>

        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            selectedTab === 'approved' ? 'bg-accent-1 text-primary' : 'bg-surface-blur text-text-secondary'
          }`}
          onClick={() => setSelectedTab('approved')}
        >
          <Users size={16} />
          <span>Members</span>
        </button>

        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            selectedTab === 'banned' ? 'bg-accent-1 text-primary' : 'bg-surface-blur text-text-secondary'
          }`}
          onClick={() => setSelectedTab('banned')}
        >
          <Ban size={16} />
          <span>Banned</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-text-secondary">Loading...</div>
      ) : (
        <div className="space-y-4">
          {filteredMembers.map((member) => (
            <motion.div
              key={member.profile_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <img
                  src={member.profiles.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${member.profiles.username}`}
                  alt={member.profiles.username}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <div className="font-bold">{member.profiles.username}</div>
                  <div className="text-sm text-text-secondary">
                    {member.is_admin ? (
                      <span className="text-accent-1 flex items-center gap-1">
                        <Shield size={14} /> Admin
                      </span>
                    ) : 'Member'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedTab === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(member.profile_id, 'approved')}
                      className="btn-primary py-1 px-3 text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(member.profile_id, 'rejected')}
                      className="btn-secondary py-1 px-3 text-sm"
                    >
                      Reject
                    </button>
                  </>
                )}

                {selectedTab === 'approved' && !member.is_admin && (
                  <>
                    <button
                      onClick={() => handleAdminToggle(member.profile_id, true)}
                      className="btn-secondary py-1 px-3 text-sm"
                    >
                      Make Admin
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(member.profile_id, 'banned')}
                      className="btn-secondary py-1 px-3 text-sm text-error"
                    >
                      Ban
                    </button>
                  </>
                )}

                {selectedTab === 'approved' && member.is_admin && (
                  <button
                    onClick={() => handleAdminToggle(member.profile_id, false)}
                    className="btn-secondary py-1 px-3 text-sm"
                  >
                    Remove Admin
                  </button>
                )}

                {selectedTab === 'banned' && (
                  <button
                    onClick={() => handleStatusUpdate(member.profile_id, 'approved')}
                    className="btn-primary py-1 px-3 text-sm"
                  >
                    Unban
                  </button>
                )}

                <button
                  onClick={() => handleRemoveMember(member.profile_id)}
                  className="btn-icon"
                >
                  <UserMinus size={16} />
                </button>
              </div>
            </motion.div>
          ))}

          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-text-secondary">
              No {selectedTab} members found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;