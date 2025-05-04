import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Calendar, Clock, MapPin, Users, Share2, Video, Globe, Bell, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, type Event, type EventAttendee } from '../utils/supabaseClient';

const EventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [userRSVP, setUserRSVP] = useState<EventAttendee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEventData();
      fetchAttendees();
      if (user) {
        fetchUserRSVP();
      }
    }
  }, [id, user]);

  const fetchEventData = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          communities (name),
          profiles:created_by (username, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendees = async () => {
    try {
      const { data: confirmedData, error: confirmedError } = await supabase
        .from('event_attendees')
        .select(`
          *,
          profiles (username, avatar_url)
        `)
        .eq('event_id', id)
        .eq('status', 'confirmed')
        .order('created_at');

      if (confirmedError) throw confirmedError;
      setAttendees(confirmedData || []);

      const { data: waitlistData, error: waitlistError } = await supabase
        .from('event_attendees')
        .select(`
          *,
          profiles (username, avatar_url)
        `)
        .eq('event_id', id)
        .eq('status', 'waitlist')
        .order('created_at');

      if (waitlistError) throw waitlistError;
      setWaitlist(waitlistData || []);
    } catch (error) {
      console.error('Error fetching attendees:', error);
    }
  };

  const fetchUserRSVP = async () => {
    try {
      const { data, error } = await supabase
        .from('event_attendees')
        .select()
        .eq('event_id', id)
        .eq('profile_id', user?.id)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          setUserRSVP(null);
          return;
        }
        throw error;
      }
      setUserRSVP(data);
    } catch (error) {
      console.error('Error fetching user RSVP:', error);
      setUserRSVP(null);
    }
  };

  const handleRSVP = async (status: EventAttendee['status']) => {
    if (!user) {
      navigate('/auth', { state: { from: `/event/${id}` } });
      return;
    }

    if (!event) return;
    setIsSubmitting(true);

    try {
      if (userRSVP) {
        if (status === 'declined') {
          // Cancel RSVP
          const { error } = await supabase
            .from('event_attendees')
            .delete()
            .eq('event_id', id)
            .eq('profile_id', user.id);

          if (error) throw error;
          setUserRSVP(null);
        } else {
          // Update RSVP status
          const { data, error } = await supabase
            .from('event_attendees')
            .update({ status })
            .eq('event_id', id)
            .eq('profile_id', user.id)
            .select()
            .single();

          if (error) throw error;
          setUserRSVP(data);
        }
      } else {
        // Create new RSVP
        const isEventFull = event.max_attendees !== null && 
          attendees.length >= event.max_attendees;

        const newStatus = isEventFull ? 'waitlist' : 'confirmed';

        const { data, error } = await supabase
          .from('event_attendees')
          .insert({
            event_id: id,
            profile_id: user.id,
            status: newStatus
          })
          .select()
          .single();

        if (error) throw error;
        setUserRSVP(data);
      }

      // Refresh attendees list
      fetchAttendees();
    } catch (error) {
      console.error('Error updating RSVP:', error);
      alert('Failed to update RSVP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotifyMe = async () => {
    if (!user) {
      navigate('/auth', { state: { from: `/event/${id}` } });
      return;
    }

    setIsNotifying(true);
    try {
      // Here you would typically set up a notification preference
      // For now, we'll just show a success message
      alert('You will be notified when spots become available.');
    } catch (error) {
      console.error('Error setting up notification:', error);
      alert('Failed to set up notification. Please try again.');
    } finally {
      setIsNotifying(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: event?.description,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      setShowShareDialog(true);
    }
  };

  const downloadCalendar = () => {
    if (event?.calendar_link) {
      const link = document.createElement('a');
      link.href = event.calendar_link;
      link.download = `${event.title}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-accent-1">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-heading text-accent-1">Event not found</h2>
        <Link to="/" className="btn-primary mt-4 inline-block">
          Back to Discover
        </Link>
      </div>
    );
  }

  const isEventFull = event.max_attendees !== null && 
    attendees.filter(a => a.status === 'confirmed').length >= event.max_attendees;

  const userPosition = waitlist.findIndex(a => a.profile_id === user?.id) + 1;

  const getRSVPButton = () => {
    if (!user) {
      return (
        <Link 
          to="/auth" 
          state={{ from: `/event/${id}` }}
          className="btn-primary w-full mb-4"
        >
          Sign in to RSVP
        </Link>
      );
    }

    if (isSubmitting) {
      return (
        <button className="btn-primary w-full mb-4" disabled>
          Updating...
        </button>
      );
    }

    if (!userRSVP) {
      if (isEventFull) {
        return (
          <div className="space-y-2 mb-4">
            <button 
              className="btn-secondary w-full"
              onClick={() => handleRSVP('waitlist')}
            >
              Join Waitlist
            </button>
            <button
              className="btn-primary w-full flex items-center justify-center gap-2"
              onClick={handleNotifyMe}
              disabled={isNotifying}
            >
              <Bell size={18} />
              {isNotifying ? 'Setting up...' : 'Notify when spots open'}
            </button>
          </div>
        );
      }

      return (
        <button 
          className="btn-primary w-full mb-4 pulse-animation"
          onClick={() => handleRSVP('confirmed')}
        >
          RSVP Now
        </button>
      );
    }

    if (userRSVP.status === 'confirmed') {
      return (
        <button 
          className="btn-secondary w-full mb-4"
          onClick={() => handleRSVP('declined')}
        >
          Cancel RSVP
        </button>
      );
    }

    if (userRSVP.status === 'waitlist') {
      return (
        <div className="space-y-2 mb-4">
          <div className="glass-panel p-4 text-center">
            <p className="text-accent-2 mb-2">You are #{userPosition} on the waitlist</p>
            <p className="text-sm text-text-secondary">
              We'll notify you when a spot becomes available
            </p>
          </div>
          <button 
            className="btn-secondary w-full"
            onClick={() => handleRSVP('declined')}
          >
            Leave Waitlist
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Link to={`/community/${event.community_id}`} className="flex items-center text-accent-1 hover:underline mb-4">
        <ChevronLeft size={16} />
        <span className="ml-1">Back to {event.communities?.name}</span>
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div 
            className="h-60 sm:h-80 w-full bg-cover bg-center rounded-3xl relative mb-6"
            style={{ backgroundImage: `url(${event.cover_image || 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg'})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/90 rounded-3xl"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-2 text-accent-2 mb-2">
                {event.type === 'online' && <Video size={16} />}
                {event.type === 'hybrid' && <Globe size={16} />}
                <span className="capitalize">{event.type} Event</span>
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl text-white">{event.title}</h1>
              <div className="text-accent-2 mt-2">
                Hosted by {event.profiles?.username}
              </div>
            </div>
          </div>
          
          <div className="glass-panel p-6 mb-6">
            <h2 className="text-xl font-heading mb-4">About this event</h2>
            <div className="text-text-primary whitespace-pre-line">
              {event.description}
            </div>
          </div>
          
          {(event.type === 'offline' || event.type === 'hybrid') && event.location && (
            <div className="glass-panel p-6">
              <h2 className="text-xl font-heading mb-4">Location</h2>
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="text-accent-1 mt-1" size={20} />
                <div>
                  <div className="font-bold">{event.location}</div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div>
          <div className="glass-panel p-6 mb-6 sticky top-4">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="text-accent-1" size={20} />
                <div>
                  <div className="text-sm text-text-secondary">Date</div>
                  <div>{new Date(event.start_time).toLocaleDateString()}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <Clock className="text-accent-1" size={20} />
                <div>
                  <div className="text-sm text-text-secondary">Time</div>
                  <div>
                    {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {event.end_time && ` - ${new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </div>
                </div>
              </div>
              
              {event.max_attendees && (
                <div className="flex items-center gap-3">
                  <Users className="text-accent-1" size={20} />
                  <div>
                    <div className="text-sm text-text-secondary">Capacity</div>
                    <div>
                      {attendees.length} / {event.max_attendees} spots filled
                      {isEventFull && (
                        <span className="flex items-center gap-1 text-warning text-sm mt-1">
                          <AlertTriangle size={14} />
                          Event is full
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {getRSVPButton()}
            
            <div className="flex gap-2">
              <button 
                className="btn-icon flex-1"
                onClick={downloadCalendar}
              >
                <Calendar size={18} />
              </button>
              <button 
                className="btn-icon flex-1"
                onClick={handleShare}
              >
                <Share2 size={18} />
              </button>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-heading mb-3">
                Attendees ({attendees.length})
                {event.max_attendees && ` / ${event.max_attendees}`}
              </h3>
              <div className="flex flex-wrap gap-2">
                {attendees.map((attendee, index) => (
                  <div 
                    key={index} 
                    className="group relative"
                  >
                    <img 
                      src={attendee.profiles.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${attendee.profiles.username}`}
                      alt={attendee.profiles.username} 
                      className="w-10 h-10 rounded-full border-2 border-accent-1" 
                    />
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-secondary px-3 py-1 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {attendee.profiles.username}
                    </div>
                  </div>
                ))}
                {event.max_attendees && attendees.length < event.max_attendees && (
                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-accent-2 flex items-center justify-center text-accent-2">
                    +
                  </div>
                )}
              </div>
            </div>

            {waitlist.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-heading mb-3">
                  Waitlist ({waitlist.length})
                </h3>
                <div className="space-y-2">
                  {waitlist.map((attendee, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 text-sm"
                    >
                      <img 
                        src={attendee.profiles.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${attendee.profiles.username}`}
                        alt={attendee.profiles.username} 
                        className="w-8 h-8 rounded-full border-2 border-accent-2" 
                      />
                      <div>
                        <div className="font-bold">{attendee.profiles.username}</div>
                        <div className="text-text-secondary">Position #{index + 1}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showShareDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 w-full max-w-md">
            <h3 className="text-xl font-heading mb-4">Share Event</h3>
            <div className="space-y-4">
              <button 
                className="btn-secondary w-full"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                  setShowShareDialog(false);
                }}
              >
                Copy Link
              </button>
              <button
                className="btn-secondary w-full"
                onClick={() => setShowShareDialog(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default EventPage;