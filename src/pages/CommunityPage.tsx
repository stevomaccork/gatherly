import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, MessageSquare, ChevronLeft, Bell, Video, Globe, 
  Facebook, Twitter, Instagram, MessageCircle, MapPin, Tag,
  Image as ImageIcon, X, ArrowLeft, ArrowRight, Share2
} from 'lucide-react';
import { supabase, joinCommunity, leaveCommunity, checkMembership } from '../utils/supabaseClient';
import type { Community, Thread as BaseThread, Event as BaseEvent } from '../utils/supabaseClient';
import AdminPanel from '../components/community/AdminPanel';
import ThreadForm from '../components/thread/ThreadForm';
import EventForm from '../components/event/EventForm';
import SocialShareBar from '../components/common/SocialShareBar';
import { useAuth } from '../contexts/AuthContext';
// Import Swiper React components and styles
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Add new type for social links
interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  website?: string;
  discord?: string;
}

// Update Community type to include social links
interface ExtendedCommunity extends Community {
  social_links?: SocialLinks;
  media?: string[]; // Array of image URLs
}

// Extended Thread type with count properties from Supabase queries
interface Thread extends BaseThread {
  thread_replies_count?: number;
  thread_likes_count?: number;
}

// Extended Event type with count properties from Supabase queries
interface Event extends BaseEvent {
  event_attendees_count?: number;
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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  // States for the mailing list feature
  const [showMailingListModal, setShowMailingListModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [emailSubmissionSuccess, setEmailSubmissionSuccess] = useState(false);
  // Related communities state
  const [relatedCommunities, setRelatedCommunities] = useState<Community[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);

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

  // Add mock media data for demo purposes
  useEffect(() => {
    if (community && !community.media) {
      setCommunity(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          media: [
            'https://source.unsplash.com/random/800x600?community',
            'https://source.unsplash.com/random/800x600?event',
            'https://source.unsplash.com/random/800x600?meetup',
            'https://source.unsplash.com/random/800x600?people',
            'https://source.unsplash.com/random/800x600?group',
            'https://source.unsplash.com/random/800x600?gathering'
          ]
        };
      });
    }
  }, [community]);

  // Add SEO metadata
  useEffect(() => {
    if (community) {
      // Set page title
      document.title = `${community.name} | Gatherly`;
      
      // Set meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', community.description || `Join ${community.name} on Gatherly`);
      
      // Set Open Graph tags
      updateOpenGraphTag('og:title', `${community.name} | Gatherly`);
      updateOpenGraphTag('og:description', community.description || `Join ${community.name} on Gatherly`);
      updateOpenGraphTag('og:image', community.cover_image || '');
      updateOpenGraphTag('og:url', window.location.href);
      updateOpenGraphTag('og:type', 'website');
    }
    
    // Cleanup on component unmount
    return () => {
      document.title = 'Gatherly'; // Reset title
    };
  }, [community]);
  
  // Helper function to create or update Open Graph tags
  const updateOpenGraphTag = (property: string, content: string) => {
    let ogTag = document.querySelector(`meta[property="${property}"]`);
    if (!ogTag) {
      ogTag = document.createElement('meta');
      ogTag.setAttribute('property', property);
      document.head.appendChild(ogTag);
    }
    ogTag.setAttribute('content', content);
  };

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
      let query = supabase.from('communities').select(`
        *,
        community_categories (
          categories (*)
        )
      `);
      
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
      
      // Mock media data for demo purposes - replace with real data when available
      // In production, you would store media URLs in a separate table and query them
      if (!data.media) {
        data.media = [
          'https://source.unsplash.com/random/800x600?community',
          'https://source.unsplash.com/random/800x600?event',
          'https://source.unsplash.com/random/800x600?meetup',
          'https://source.unsplash.com/random/800x600?people',
          'https://source.unsplash.com/random/800x600?group',
          'https://source.unsplash.com/random/800x600?gathering',
          'https://source.unsplash.com/random/800x600?conference',
          'https://source.unsplash.com/random/800x600?workshop'
        ];
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

  // Handle mailing list subscription
  const handleMailingListSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !community?.id) return;

    setIsSubmittingEmail(true);
    try {
      // Store email in public_leads table
      const { error } = await supabase
        .from('public_leads')
        .insert({
          email: emailInput.trim(),
          community_id: community.id,
          source: 'mailing_list',
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      
      // Show success message
      setEmailSubmissionSuccess(true);
      setEmailInput('');
      
      // Close the modal after 2 seconds
      setTimeout(() => {
        setShowMailingListModal(false);
        setEmailSubmissionSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error submitting email:', error);
      alert('Failed to submit your email. Please try again.');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const renderSocialLinks = () => {
    if (!community?.social_links) return null;

    return (
      <div className="flex gap-4 items-center mt-4">
        {community.social_links.instagram && (
          <a
            href={community.social_links.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-primary hover:text-accent-1 transition-colors"
            title="Instagram"
          >
            <Instagram size={24} />
          </a>
        )}
        {community.social_links.twitter && (
          <a
            href={community.social_links.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-primary hover:text-accent-1 transition-colors"
            title="Twitter"
          >
            <Twitter size={24} />
          </a>
        )}
        {community.social_links.discord && (
          <a
            href={community.social_links.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-primary hover:text-accent-1 transition-colors"
            title="Discord"
          >
            <MessageSquare size={24} />
          </a>
        )}
        {community.social_links.facebook && (
          <a
            href={community.social_links.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-primary hover:text-accent-1 transition-colors"
            title="Facebook"
          >
            <Facebook size={24} />
          </a>
        )}
      </div>
    );
  };

  // Simple custom lightbox component
  const ImageLightbox = () => {
    if (!isLightboxOpen || !community?.media) return null;
    
    const handleNext = () => {
      setPhotoIndex((prevIndex) => 
        prevIndex === community.media!.length - 1 ? 0 : prevIndex + 1
      );
    };
    
    const handlePrev = () => {
      setPhotoIndex((prevIndex) => 
        prevIndex === 0 ? community.media!.length - 1 : prevIndex - 1
      );
    };
    
    // Handle keyboard navigation
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!isLightboxOpen) return;
        
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'Escape') setIsLightboxOpen(false);
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLightboxOpen]);
    
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <button 
          className="absolute top-4 right-4 text-white hover:text-accent-1 transition-colors"
          onClick={() => setIsLightboxOpen(false)}
        >
          <X size={24} />
        </button>
        
        <button
          className="absolute left-4 text-white hover:text-accent-1 transition-colors"
          onClick={handlePrev}
        >
          <ArrowLeft size={32} />
        </button>
        
        <div className="relative max-w-4xl max-h-[80vh]">
          <img 
            src={community.media[photoIndex]} 
            alt={`${community.name} - Gallery Image ${photoIndex + 1}`}
            className="max-w-full max-h-[80vh] object-contain"
          />
          <div className="absolute bottom-0 left-0 right-0 text-center text-white py-2 text-sm bg-black/40">
            {photoIndex + 1} / {community.media.length}
          </div>
        </div>
        
        <button
          className="absolute right-4 text-white hover:text-accent-1 transition-colors"
          onClick={handleNext}
        >
          <ArrowRight size={32} />
        </button>
      </div>
    );
  };

  // Fetch related communities based on shared topics and location
  const fetchRelatedCommunities = async () => {
    if (!community) return;
    
    setIsLoadingRelated(true);
    try {
      // Get category IDs from current community
      const categoryIds = community.community_categories?.map(c => c.categories.id) || [];
      if (categoryIds.length === 0 && !community.city && !community.country) return;
      
      let query = supabase
        .from('communities')
        .select(`
          *,
          community_categories(categories(*)),
          community_members(count)
        `)
        .neq('id', community.id) // Exclude current community
        .limit(5);
      
      // Filter by categories if available
      if (categoryIds.length > 0) {
        // To find communities with similar categories, we need to search in the junction table
        const { data: communitiesByCategory } = await supabase
          .from('community_categories')
          .select('community_id')
          .in('category_id', categoryIds);
        
        const communityIds = communitiesByCategory?.map(c => c.community_id) || [];
        if (communityIds.length > 0) {
          query = query.in('id', communityIds);
        }
      }
      
      // Additional filters by location if available
      if (community.country) {
        query = query.eq('country', community.country);
      }
      
      if (community.city) {
        query = query.eq('city', community.city);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setRelatedCommunities(data || []);
    } catch (error) {
      console.error('Error fetching related communities:', error);
    } finally {
      setIsLoadingRelated(false);
    }
  };

  // Fetch related communities when main community data loads
  useEffect(() => {
    if (community) {
      fetchRelatedCommunities();
    }
  }, [community?.id]);

  // Handle joining a related community
  const handleJoinRelatedCommunity = async (communityId: string) => {
    if (!user) {
      navigate('/auth', { state: { from: `/community/${communityId}` } });
      return;
    }

    try {
      await joinCommunity(communityId, user.id);
      // Refresh related communities to update the UI
      fetchRelatedCommunities();
    } catch (error) {
      console.error('Error joining community:', error);
      alert('Error joining community');
    }
  };

  // Render a related community card
  const renderRelatedCommunityCard = (relatedCommunity: Community) => {
    return (
      <div key={relatedCommunity.id} className="glass-panel p-3 flex items-center gap-3 mb-3 hover:border-accent-1 transition-all">
        <Link to={`/community/${relatedCommunity.id}`} className="flex-shrink-0">
          <div 
            className="w-12 h-12 rounded-full bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${relatedCommunity.cover_image || `https://api.dicebear.com/7.x/shapes/svg?seed=${relatedCommunity.name}`})` 
            }}
            aria-label={`${relatedCommunity.name} cover image`}
          />
        </Link>
        
        <div className="flex-1 min-w-0">
          <Link 
            to={`/community/${relatedCommunity.id}`} 
            className="font-bold text-sm hover:text-accent-1 transition-colors truncate block"
          >
            {relatedCommunity.name}
          </Link>
          <div className="text-xs text-text-secondary flex items-center">
            <Users size={12} className="mr-1" />
            <span>{relatedCommunity.community_members?.length || 0} members</span>
          </div>
        </div>
        
        <button 
          className="btn-primary py-1 px-3 text-xs"
          onClick={() => handleJoinRelatedCommunity(relatedCommunity.id)}
        >
          Join
        </button>
      </div>
    );
  };

  // Function to handle native sharing
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${community?.name} | Gatherly`,
          text: `Check out ${community?.name} on Gatherly!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      // Just open the modal with our existing SocialShareBar
      document.querySelector('.glass-panel .social-share-bar')?.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };

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
      className="relative" // Add relative positioning for floating button
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
              
              {/* Tags container */}
              <div className="flex flex-wrap gap-2 mb-3">
                {/* Location tag */}
                {community.city && community.country && (
                  <Link 
                    to={`/?city=${encodeURIComponent(community.city)}&country=${encodeURIComponent(community.country)}`}
                    className="inline-flex items-center px-3 py-1 rounded-full bg-surface-blur/30 text-white text-sm hover:bg-accent-1 hover:text-primary transition-all"
                  >
                    <MapPin size={14} className="mr-1" />
                    {community.city}, {community.country}
                  </Link>
                )}
                
                {/* Topic tags */}
                {community.community_categories && community.community_categories.map(({ categories }) => (
                  <Link 
                    key={categories.id}
                    to={`/?category=${encodeURIComponent(categories.id)}`}
                    className="inline-flex items-center px-3 py-1 rounded-full bg-surface-blur/30 text-white text-sm hover:bg-accent-1 hover:text-primary transition-all"
                  >
                    <Tag size={14} className="mr-1" />
                    {categories.name}
                  </Link>
                ))}
              </div>
              
              <div className="flex items-center gap-4">
                {renderSocialLinks()}
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
                  {!isMember && (
                    <>
                      {community?.created_by && (
                        <button 
                          className="btn-icon"
                          onClick={() => setShowMessageDialog(true)}
                        >
                          <MessageCircle size={18} />
                        </button>
                      )}
                      <button 
                        className="btn-secondary"
                        onClick={() => setShowMailingListModal(true)}
                      >
                        Join Mailing List
                      </button>
                    </>
                  )}
                  <button className="btn-icon">
                    <Bell size={18} />
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link to="/auth" className="btn-primary">
                    Sign in to Join
                  </Link>
                  <button 
                    className="btn-secondary"
                    onClick={() => setShowMailingListModal(true)}
                  >
                    Join Mailing List
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Social Share Bar */}
      <div className="glass-panel p-3 mb-6 flex justify-center sm:justify-start social-share-bar">
        <SocialShareBar 
          url={window.location.href}
          title={`Join ${community.name} on Gatherly`}
          description={community.description || ''}
        />
      </div>
      
      {/* Desktop Tabs - Hide on mobile */}
      <div className="mb-8 hidden md:flex border-b border-surface-blur">
        <button 
          className={`pb-3 px-4 text-sm font-bold relative ${activeTab === 'overview' ? 'text-accent-1' : 'text-text-secondary'}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
          {activeTab === 'overview' && (
            <motion.div 
              layoutId="activeTabDesktop"
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
              layoutId="activeTabDesktop"
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
              layoutId="activeTabDesktop"
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
              layoutId="activeTabDesktop"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-1" 
            />
          )}
        </button>
      </div>
      
      {/* Mobile Swipeable Tabs - Show only on mobile */}
      <div className="md:hidden mb-8">
        <Swiper
          modules={[Pagination]}
          spaceBetween={0}
          slidesPerView={4}
          pagination={{ clickable: true }}
          onSlideChange={(swiper) => {
            const tabs = ['overview', 'events', 'discussions', 'members'];
            setActiveTab(tabs[swiper.activeIndex]);
          }}
          initialSlide={['overview', 'events', 'discussions', 'members'].indexOf(activeTab)}
          className="community-tabs-swiper"
        >
          <SwiperSlide>
            <button 
              className={`w-full pb-3 px-4 text-sm font-bold relative ${activeTab === 'overview' ? 'text-accent-1' : 'text-text-secondary'}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
              {activeTab === 'overview' && (
                <motion.div 
                  layoutId="activeTabMobile"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-1" 
                />
              )}
            </button>
          </SwiperSlide>
          <SwiperSlide>
            <button 
              className={`w-full pb-3 px-4 text-sm font-bold relative ${activeTab === 'events' ? 'text-accent-1' : 'text-text-secondary'}`}
              onClick={() => setActiveTab('events')}
            >
              Events
              {activeTab === 'events' && (
                <motion.div 
                  layoutId="activeTabMobile"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-1" 
                />
              )}
            </button>
          </SwiperSlide>
          <SwiperSlide>
            <button 
              className={`w-full pb-3 px-4 text-sm font-bold relative ${activeTab === 'discussions' ? 'text-accent-1' : 'text-text-secondary'}`}
              onClick={() => setActiveTab('discussions')}
            >
              Discussions
              {activeTab === 'discussions' && (
                <motion.div 
                  layoutId="activeTabMobile"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-1" 
                />
              )}
            </button>
          </SwiperSlide>
          <SwiperSlide>
            <button 
              className={`w-full pb-3 px-4 text-sm font-bold relative ${activeTab === 'members' ? 'text-accent-1' : 'text-text-secondary'}`}
              onClick={() => setActiveTab('members')}
            >
              Members
              {activeTab === 'members' && (
                <motion.div 
                  layoutId="activeTabMobile"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-1" 
                />
              )}
            </button>
          </SwiperSlide>
        </Swiper>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {activeTab === 'overview' && (
            <>
              <div className="glass-panel p-6 mb-6">
                <h3 className="text-xl font-heading mb-4">About this community</h3>
                <p className="text-text-secondary">{community.description}</p>
              </div>
              
              {/* Image Gallery Card */}
              {community.media && community.media.length > 0 && (
                <div className="glass-panel p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-heading">
                      <ImageIcon size={20} className="inline mr-2" />
                      Image Gallery
                    </h3>
                    <span className="text-sm text-text-secondary">
                      {community.media.length} {community.media.length === 1 ? 'photo' : 'photos'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {community.media.slice(0, 6).map((image, index) => (
                      <div 
                        key={index}
                        className="aspect-square overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-all"
                        onClick={() => {
                          setPhotoIndex(index);
                          setIsLightboxOpen(true);
                        }}
                      >
                        <img 
                          src={image} 
                          alt={`${community.name} gallery image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  
                  {community.media.length > 6 && (
                    <button 
                      className="btn-secondary w-full mt-4"
                      onClick={() => {
                        setPhotoIndex(0);
                        setIsLightboxOpen(true);
                      }}
                    >
                      View All Photos ({community.media.length})
                    </button>
                  )}
                </div>
              )}
              
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
                          <span>{(thread as any).thread_replies_count} replies · {new Date(thread.created_at).toLocaleDateString()}</span>
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
                          <span>{(thread as any).thread_replies_count} replies</span>
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
          
          {/* Related Communities Widget */}
          {relatedCommunities.length > 0 && (
            <div className="glass-panel p-6 mb-6">
              <h3 className="text-xl font-heading mb-4">Related Communities</h3>
              <div className="space-y-3">
                {relatedCommunities.map(relatedCommunity => renderRelatedCommunityCard(relatedCommunity))}
              </div>
            </div>
          )}
          
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

      {/* Mailing List Modal */}
      {showMailingListModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 w-full max-w-md">
            <h3 className="text-xl font-heading mb-2">Join {community.name} Mailing List</h3>
            <p className="text-text-secondary mb-4">
              Stay updated with the latest events, discussions, and announcements from this community.
            </p>
            
            {emailSubmissionSuccess ? (
              <div className="text-center py-6">
                <div className="text-accent-1 text-lg mb-2">Success!</div>
                <p className="text-text-secondary">
                  Your email has been added to the mailing list.
                </p>
              </div>
            ) : (
              <form onSubmit={handleMailingListSubmit}>
                <div className="mb-4">
                  <label htmlFor="email" className="block mb-2 text-sm">Email Address</label>
                  <input 
                    type="email"
                    id="email"
                    className="input-neon w-full"
                    placeholder="your@email.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    className="btn-secondary flex-1"
                    onClick={() => setShowMailingListModal(false)}
                    disabled={isSubmittingEmail}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={isSubmittingEmail || !emailInput.trim()}
                  >
                    {isSubmittingEmail ? 'Submitting...' : 'Subscribe'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Custom Image Lightbox */}
      <ImageLightbox />

      {/* Mobile Floating Share Button - Show only on mobile */}
      <button
        className="fixed right-4 bottom-16 z-40 btn-icon-floating md:hidden"
        onClick={handleShare}
        aria-label="Share this community"
      >
        <Share2 size={20} />
      </button>
    </motion.div>
  );
};

export default CommunityPage;