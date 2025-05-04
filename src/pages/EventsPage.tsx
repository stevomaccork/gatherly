import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Calendar, Video, Globe, Search, Filter, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import type { Event } from '../utils/supabaseClient';

const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'attending' | 'hosting'>('all');
  const [eventType, setEventType] = useState<'all' | 'online' | 'offline' | 'hybrid'>('all');

  useEffect(() => {
    fetchEvents();
  }, [user, filter, eventType]);

  const fetchEvents = async () => {
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          communities (
            id,
            name
          ),
          event_attendees (
            profile_id,
            status
          ),
          profiles:created_by (
            username,
            avatar_url
          )
        `)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (user) {
        if (filter === 'attending') {
          query = query.contains('event_attendees', [{ profile_id: user.id, status: 'confirmed' }]);
        } else if (filter === 'hosting') {
          query = query.eq('created_by', user.id);
        }
      }

      if (eventType !== 'all') {
        query = query.eq('type', eventType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.communities?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-heading text-gradient-to-r from-accent-1 to-accent-2 mb-4">
          Upcoming Events
        </h1>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-3.5 text-text-secondary" size={20} />
          <input 
            type="text" 
            placeholder="Search events..." 
            className="input-neon w-full pl-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {user && (
            <>
              <button
                className={`px-4 py-2 rounded-full text-sm ${
                  filter === 'all' ? 'bg-accent-1 text-primary' : 'bg-surface-blur text-text-secondary'
                }`}
                onClick={() => setFilter('all')}
              >
                All Events
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm ${
                  filter === 'attending' ? 'bg-accent-1 text-primary' : 'bg-surface-blur text-text-secondary'
                }`}
                onClick={() => setFilter('attending')}
              >
                I'm Attending
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm ${
                  filter === 'hosting' ? 'bg-accent-1 text-primary' : 'bg-surface-blur text-text-secondary'
                }`}
                onClick={() => setFilter('hosting')}
              >
                I'm Hosting
              </button>
            </>
          )}

          <select
            className="px-4 py-2 rounded-full text-sm bg-surface-blur text-text-secondary"
            value={eventType}
            onChange={(e) => setEventType(e.target.value as typeof eventType)}
          >
            <option value="all">All Types</option>
            <option value="online">Online Only</option>
            <option value="offline">In-Person</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-accent-1">Loading events...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => (
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
                    <span className="text-text-secondary mx-2">•</span>
                    <Link 
                      to={`/community/${event.communities?.id}`}
                      className="hover:text-accent-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {event.communities?.name}
                    </Link>
                  </div>

                  <h3 className="text-xl font-bold mb-2">{event.title}</h3>

                  <div className="text-sm text-accent-2 mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={14} />
                      <span>{new Date(event.start_time).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>
                        {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {event.end_time && ` - ${new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                    </div>
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
                        {event.event_attendees?.length || 0}
                        {event.max_attendees ? ` / ${event.max_attendees}` : ''} attending
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-bold mb-2">No events found</h3>
          <p className="text-text-secondary">
            {filter !== 'all' 
              ? "Try changing your filters"
              : "There are no upcoming events at the moment"}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default EventsPage;