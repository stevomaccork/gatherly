import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, MessageSquare, Calendar, ChevronLeft, Bell, Video, Globe, 
  Facebook, Twitter, Instagram, Youtube, Link as LinkIcon, MessageCircle
} from 'lucide-react';
import { supabase, joinCommunity, leaveCommunity, checkMembership } from '../utils/supabaseClient';
import type { Community, Thread, Event } from '../utils/supabaseClient';
import AdminPanel from '../components/community/AdminPanel';
import ThreadForm from '../components/thread/ThreadForm';
import EventForm from '../components/event/EventForm';
import { useAuth } from '../contexts/AuthContext';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Add new type for social links
interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  website?: string;
}

// Update Community type to include social links
interface ExtendedCommunity extends Community {
  social_links?: SocialLinks;
}

const CommunityPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [community, setCommunity] = useState<ExtendedCommunity | null>(null);
  const [isMember, setIsMember] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showThreadForm, setShowThreadForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    if (id) {
      // First try to fetch the community to validate the ID
      fetchCommunityData();
    }
  }, [id]);

  useEffect(() => {
    if (community?.id) {
      // Only fetch related data if we have a valid community
      fetchThreads();
      fetchEvents();
      fetchMembers();
      if (user) {
        checkMembershipStatus();
        checkAdminStatus();
      }
    }
  }, [community?.id, user]);

  const checkAdminStatus = async () => {
    try {
      if (!user || !community?.id) return;

      const { data, error } = await supabase
        .from('community_members')
        .select('is_admin')
        .eq('community_id', community.id)
        .eq('profile_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchCommunityData = async () => {
    try {
      let query = supabase.from('communities').select('*');
      
      // If the ID looks like a UUID, query directly
      if (UUID_REGEX.test(id!)) {
        query = query.eq('id', id);
      } else {
        // If not a UUID, try to find by a sequential ID or other identifier
        // This would require adding a custom identifier column to your communities table
        navigate('/404');
        return;
      }

      const { data, error } = await query.single();

      if (error) throw error;
      if (!data) {
        navigate('/404');
        return;
      }
      
      setCommunity(data);
    } catch (error) {
      console.error('Error fetching community:', error);
      setError('Community not found');
      navigate('/404');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchThreads = async () => {
    if (!community?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('threads')
        .select(`
          *,
          profiles:created_by (username, avatar_url),
          thread_replies (count),
          thread_likes (count)
        `)
        .eq('community_id', community.id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setThreads(data || []);
    } catch (error) {
      console.error('Error fetching threads:', error);
    }
  };

  const fetchEvents = async () => {
    if (!community?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_attendees (count),
          profiles:created_by (username, avatar_url)
        `)
        .eq('community_id', community.id)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchMembers = async () => {
    if (!community?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          *,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('community_id', community.id)
        .eq('status', 'approved')
        .order('joined_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const checkMembershipStatus = async () => {
    try {
      if (!user || !community?.id) return;
      const data = await checkMembership(community.id, user.id);
      setIsMember(!!data);
    } catch (error) {
      console.error('Error checking membership:', error);
    }
  };

  const handleJoinCommunity = async () => {
    if (!user) {
      navigate('/auth', { state: { from: `/community/${id}` } });
      return;
    }

    if (!community?.id) return;

    try {
      if (isMember) {
        await leaveCommunity(community.id, user.id);
        setIsMember(false);
      } else {
        await joinCommunity(community.id, user.id);
        setIsMember(true);
      }
      fetchCommunityData();
      fetchMembers();
    } catch (error) {
      console.error('Error updating membership:', error);
      alert('Error updating membership status');
    }
  };

  const handleThreadCreated = (thread: Thread) => {
    setShowThreadForm(false);
    setThreads([thread, ...threads]);
  };

  const handleEventCreated = (event: Event) => {
    setShowEventForm(false);
    setEvents([...events, event]);
  };

  const handleSendMessage = async () => {
    if (!user || !community?.created_by || !messageContent.trim()) return;

    setIsSendingMessage(true);
    try {
      // First create or get existing conversation
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();

      if (conversationError) throw conversationError;

      // Add participants
      await supabase.from('conversation_participants').insert([
        { conversation_id: conversationData.id, profile_id: user.id },
        { conversation_id: conversationData.id, profile_id: community.created_by }
      ]);

      // Send message
      await supabase.from('messages').insert({
        conversation_id: conversationData.id,
        sender_id: user.id,
        content: messageContent
      });

      setShowMessageDialog(false);
      setMessageContent('');
      alert('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const renderAuthPrompt = (action: string) => (
    <Link to="/auth" className="glass-panel p-6 text-center block hover:border-accent-1 transition-all">
      <h3 className="text-xl font-bold mb-2">Sign in to {action}</h3>
      <p className="text-text-secondary">Join the conversation and become part of the community</p>
    </Link>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-accent-1">Loading...</div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-heading text-accent-1">Community not found</h2>
        <Link to="/" className="btn-primary mt-4 inline-block">
          Back to Discover
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Link to="/" className="flex items-center text-accent-1 hover:underline mb-4">
        <ChevronLeft size={16} />
        <span className="ml-1">Back to Discover</span>
      </Link>
      
      <div 
        className="h-60 sm:h-80 w-full bg-cover bg-center rounded-3xl relative mb-6"
        style={{ backgroundImage: `url(${community.cover_image})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/90 rounded-3xl"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="font-heading text-3xl sm:text-4xl text-white mb-2">{community.name}</h1>
              <div className="flex items-center gap-4">
                {community.social_links && (
                  <div className="flex items-center gap-2">
                    {community.social_links.facebook && (
                      <a 
                        href={community.social_links.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary hover:text-accent-1"
                      >
                        <Facebook size={18} />
                      </a>
                    )}
                    {community.social_links.twitter && (
                      <a 
                        href={community.social_links.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary hover:text-accent-1"
                      >
                        <Twitter size={18} />
                      </a>
                    )}
                    {community.social_links.instagram && (
                      <a 
                        href={community.social_links.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary hover:text-accent-1"
                      >
                        <Instagram size={18} />
                      </a>
                    )}
                    {community.social_links.youtube && (
                      <a 
                        href={community.social_links.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary hover:text-accent-1"
                      >
                        <Youtube size={18} />
                      </a>
                    )}
                    {community.social_links.website && (
                      <a 
                        href={community.social_links.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary hover:text-accent-1"
                      >
                        <LinkIcon size={18} />
                      </a>
                    )}
                  </div>
                )}
                <div className="flex items-center text-text-secondary">
                  <Users size={16} className="mr-1" />
                  <span>{members.length} members</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {user ? (
                <>
                  <button 
                    className={isMember ? "btn-secondary" : "btn-primary pulse-animation"}
                    onClick={handleJoinCommunity}
                  >
                    {isMember ? 'Leave Community' : 'Join Community'}
                  </button>
                  {!isMember && community?.created_by && (
                    <button 
                      className="btn-icon"
                      onClick={() => setShowMessageDialog(true)}
                    >
                      <MessageCircle size={18} />
                    </button>
                  )}
                  <button className="btn-icon">
                    <Bell size={18} />
                  </button>
                </>
              ) : (
                <Link to="/auth" className="btn-primary">
                  Sign in to Join
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-8 flex border-b border-surface-blur">
        <button 
          className={`pb-3 px-4 text-sm font-bold relative ${activeTab === 'overview' ? 'text-accent-1' : 'text-text-secondary'}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
          {activeTab === 'overview' && (
            <motion.div 
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-1" 
            />
          )}
        </button>
        <button 
          className={`pb-3 px-4 text-sm font-bold relative ${activeTab === 'events' ? 'text-accent-1' : 'text-text-secondary'}`}
          onClick={() => setActiveTab('events')}
        >
          Events
          {activeTab === 'events' && (
            <motion.div 
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-1" 
            />
          )}
        </button>
        <button 
          className={`pb-3 px-4 text-sm font-bold relative ${activeTab === 'discussions' ? 'text-accent-1' : 'text-text-secondary'}`}
          onClick={() => setActiveTab('discussions')}
        >
          Discussions
          {activeTab === 'discussions' && (
            <motion.div 
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-1" 
            />
          )}
        </button>
        <button 
          className={`pb-3 px-4 text-sm font-bold relative ${activeTab === 'members' ? 'text-accent-1' : 'text-text-secondary'}`}
          onClick={() => setActiveTab('members')}
        >
          Members
          {activeTab === 'members' && (
            <motion.div 
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-1" 
            />
          )}
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {activeTab === 'overview' && (
            <>
              <div className="glass-panel p-6 mb-6">
                <h3 className="text-xl font-heading mb-4">About this community</h3>
                <p className="text-text-secondary">{community.description}</p>
              </div>
              
              <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-heading">Recent Discussions</h3>
                  <button 
                    onClick={() => setActiveTab('discussions')} 
                    className="text-sm text-accent-1 hover:underline"
                  >
                    View all
                  </button>
                </div>
                
                <div className="space-y-4">
                  {threads.slice(0, 3).map(thread => (
                    <Link 
                      key={thread.id} 
                      to={`/thread/${thread.id}`}
                      className="glass-panel p-4 block hover:border-accent-1 transition-all"
                    >
                      <h4 className="font-bold mb-2">{thread.title}</h4>
                      <div className="flex justify-between text-sm text-text-secondary">
                        <span>By {thread.profiles?.username}</span>
                        <div className="flex items-center">
                          <MessageSquare size={14} className="mr-1" />
                          <span>{thread.thread_replies_count} replies · {new Date(thread.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                
                {user && isMember && (
                  <button 
                    className="btn-secondary w-full mt-4"
                    onClick={() => setShowThreadForm(true)}
                  >
                    Start New Discussion
                  </button>
                )}

                {!user && (
                  <Link to="/auth" className="btn-secondary w-full mt-4 text-center">
                    Sign in to Start Discussion
                  </Link>
                )}
              </div>
            </>
          )}

          {activeTab === 'discussions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-heading">Community Discussions</h2>
                {user && isMember ? (
                  <button 
                    className="btn-primary"
                    onClick={() => setShowThreadForm(true)}
                  >
                    Start New Discussion
                  </button>
                ) : (
                  <Link to="/auth" className="btn-primary">
                    Sign in to Start Discussion
                  </Link>
                )}
              </div>
              
              {threads.map(thread => (
                <motion.div
                  key={thread.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel p-6"
                >
                  <Link to={`/thread/${thread.id}`} className="block">
                    <h3 className="text-xl font-bold hover:text-accent-1 transition-colors">
                      {thread.title}
                    </h3>
                    <div className="flex justify-between mt-3">
                      <span className="text-text-secondary">Started by {thread.profiles?.username}</span>
                      <div className="flex items-center gap-4 text-accent-2">
                        <div className="flex items-center">
                          <MessageSquare size={16} className="mr-1" />
                          <span>{thread.thread_replies_count} replies</span>
                        </div>
                        <span>{new Date(thread.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}

              {threads.length === 0 && (
                <div className="text-center py-12 text-text-secondary">
                  No discussions yet. {user ? 'Start the conversation!' : 'Sign in to start the conversation!'}
                </div>
              )}
            </div>
          )}

          {activeTab === 'events' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-heading">Community Events</h2>
                {user && isMember ? (
                  <button 
                    className="btn-primary"
                    onClick={() => setShowEventForm(true)}
                  >
                    Create New Event
                  </button>
                ) : user ? (
                  <div className="text-text-secondary">
                    Join community to create events
                  </div>
                ) : (
                  <Link to="/auth" className="btn-primary">
                    Sign in to Create Events
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel overflow-hidden"
                  >
                    <Link to={`/event/${event.id}`}>
                      <div className="p-6">
                        <div className="flex items-center gap-2 text-accent-2 text-sm mb-2">
                          {event.type === 'online' && <Video size={16} />}
                          {event.type === 'hybrid' && <Globe size={16} />}
                          <span className="capitalize">{event.type}</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                        <div className="text-sm text-accent-2 mb-3">
                          {new Date(event.start_time).toLocaleDateString()} · {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {event.description && (
                          <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                        <div className="flex justify-between items-center text-sm">
                          <div className="text-text-secondary">
                            {event.location || 'Online Event'}
                          </div>
                          <div className="flex items-center text-accent-1">
                            <Users size={14} className="mr-1" />
                            <span>
                              {event.event_attendees_count}
                              {event.max_attendees ? ` / ${event.max_attendees}` : ''} attending
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {events.length === 0 && (
                <div className="text-center py-12 text-text-secondary">
                  No upcoming events scheduled
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div>
              {isAdmin ? (
                <AdminPanel communityId={id!} />
              ) : (
                <div className="glass-panel p-6">
                  <h2 className="text-2xl font-heading mb-6">Community Members</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {members.map(member => (
                      <Link
                        key={member.profile_id}
                        to={`/profile/${member.profiles.username}`}
                        className="glass-panel p-4 flex items-center gap-3 hover:border-accent-1 transition-all"
                      >
                        <img
                          src={member.profiles.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${member.profiles.username}`}
                          alt={member.profiles.username}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <div className="font-bold">{member.profiles.username}</div>
                          <div className="text-sm text-text-secondary">
                            {member.is_admin ? 'Admin' : 'Member'}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {members.length === 0 && (
                    <div className="text-center py-8 text-text-secondary">
                      No members yet
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="glass-panel p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-heading">Upcoming Events</h3>
              <button 
                onClick={() => setActiveTab('events')} 
                className="text-sm text-accent-1 hover:underline"
              >
                View all
              </button>
            </div>
            
            <div className="space-y-4">
              {events.slice(0, 3).map(event => (
                <Link 
                  key={event.id} 
                  to={`/event/${event.id}`}
                  className="glass-panel p-4 block hover:border-accent-1 transition-all"
                >
                  <div className="flex items-center gap-2 text-accent-2 text-sm mb-1">
                    {event.type === 'online' && <Video size={14} />}
                    {event.type === 'hybrid' && <Globe size={14} />}
                    <span className="capitalize">{event.type}</span>
                  </div>
                  <h4 className="font-bold">{event.title}</h4>
                  <div className="text-sm text-accent-2 mt-1 mb-2">
                    {new Date(event.start_time).toLocaleDateString()} · {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-sm text-text-secondary flex justify-between items-center">
                    <span>{event.location || 'Online Event'}</span>
                    <div className="flex items-center">
                      <Users size={14} className="mr-1" />
                      <span>{event.event_attendees_count} attending</span>
                    </div>
                  </div>
                </Link>
              ))}

              {events.length === 0 && (
                <div className="text-center text-text-secondary py-4">
                  No upcoming events
                </div>
              )}
            </div>
            
            {user && isMember && (
              <button 
                className="btn-secondary w-full mt-4"
                onClick={() => setShowEventForm(true)}
              >
                Create New Event
              </button>
            )}

            {!user && (
              <Link to="/auth" className="btn-secondary w-full mt-4 text-center">
                Sign in to Create Event
              </Link>
            )}
          </div>
          
          <div className="glass-panel p-6">
            <h3 className="text-xl font-heading mb-4">Community Rules</h3>
            <ol className="list-decimal list-inside text-text-secondary space-y-2 pl-2">
              <li>Be respectful to all members</li>
              <li>No spam or self-promotion</li>
              <li>Stay on topic in discussions</li>
              <li>Credit sources for any shared content</li>
              <li>Report any violations to moderators</li>
            </ol>
          </div>
        </div>
      </div>

      {showThreadForm && (
        <ThreadForm
          communityId={id!}
          onThreadCreated={handleThreadCreated}
          onClose={() => setShowThreadForm(false)}
        />
      )}

      {showEventForm && (
        <EventForm
          communityId={id!}
          onEventCreated={handleEventCreated}
          onClose={() => setShowEventForm(false)}
        />
      )}

      {showMessageDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 w-full max-w-md">
            <h3 className="text-xl font-heading mb-4">Message Admin</h3>
            <textarea
              className="input-neon w-full min-h-[100px] mb-4"
              placeholder="Write your message..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
            />
            <div className="flex gap-4">
              <button
                className="btn-secondary flex-1"
                onClick={() => setShowMessageDialog(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary flex-1"
                onClick={handleSendMessage}
                disabled={isSendingMessage || !messageContent.trim()}
              >
                {isSendingMessage ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CommunityPage;