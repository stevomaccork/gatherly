import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import type { Event } from '../../utils/supabaseClient';

interface EventFormProps {
  communityId: string;
  onEventCreated: (event: Event) => void;
  onClose: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ communityId, onEventCreated, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'online' | 'offline' | 'hybrid'>('offline');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxAttendees, setMaxAttendees] = useState<number | ''>('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !startDate || !startTime) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
      const endDateTime = endDate && endTime 
        ? new Date(`${endDate}T${endTime}`).toISOString()
        : null;

      // Generate calendar link (iCal format)
      const calendarLink = generateCalendarLink({
        title,
        description,
        location: type === 'online' ? meetingLink : location,
        start: startDateTime,
        end: endDateTime || startDateTime,
      });

      const { data: event, error } = await supabase
        .from('events')
        .insert({
          community_id: communityId,
          title: title.trim(),
          description: description.trim(),
          type,
          location: type === 'online' ? null : location,
          meeting_link: type === 'offline' ? null : meetingLink,
          start_time: startDateTime,
          end_time: endDateTime,
          max_attendees: maxAttendees || null,
          is_private: isPrivate,
          calendar_link: calendarLink,
        })
        .select()
        .single();

      if (error) throw error;
      if (event) {
        onEventCreated(event);
      }
    } catch (error: any) {
      alert('Error creating event: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateCalendarLink = ({
    title,
    description,
    location,
    start,
    end,
  }: {
    title: string;
    description: string;
    location: string;
    start: string;
    end: string;
  }) => {
    const formatDate = (date: string) => {
      return date.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const event = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      `DTSTART:${formatDate(start)}`,
      `DTEND:${formatDate(end)}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    return `data:text/calendar;charset=utf8,${encodeURIComponent(event)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-panel w-full max-w-2xl relative overflow-y-auto max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 btn-icon"
        >
          <X size={18} />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-heading mb-6">Create a New Event</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-bold mb-2">
                Event Title *
              </label>
              <input
                type="text"
                id="title"
                className="input-neon w-full"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter event title"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-bold mb-2">
                Description
              </label>
              <textarea
                id="description"
                className="input-neon w-full min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your event..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">
                Event Type *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="offline"
                    checked={type === 'offline'}
                    onChange={(e) => setType(e.target.value as 'offline')}
                    className="mr-2"
                  />
                  In-person
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="online"
                    checked={type === 'online'}
                    onChange={(e) => setType(e.target.value as 'online')}
                    className="mr-2"
                  />
                  Online
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="hybrid"
                    checked={type === 'hybrid'}
                    onChange={(e) => setType(e.target.value as 'hybrid')}
                    className="mr-2"
                  />
                  Hybrid
                </label>
              </div>
            </div>

            {(type === 'offline' || type === 'hybrid') && (
              <div>
                <label htmlFor="location" className="block text-sm font-bold mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-text-secondary" size={18} />
                  <input
                    type="text"
                    id="location"
                    className="input-neon w-full pl-10"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter event location"
                  />
                </div>
              </div>
            )}

            {(type === 'online' || type === 'hybrid') && (
              <div>
                <label htmlFor="meetingLink" className="block text-sm font-bold mb-2">
                  Meeting Link
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3 text-text-secondary" size={18} />
                  <input
                    type="url"
                    id="meetingLink"
                    className="input-neon w-full pl-10"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="Enter meeting URL"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-bold mb-2">
                  Start Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-text-secondary" size={18} />
                  <input
                    type="date"
                    id="startDate"
                    className="input-neon w-full pl-10"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="startTime" className="block text-sm font-bold mb-2">
                  Start Time *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 text-text-secondary" size={18} />
                  <input
                    type="time"
                    id="startTime"
                    className="input-neon w-full pl-10"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-bold mb-2">
                  End Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-text-secondary" size={18} />
                  <input
                    type="date"
                    id="endDate"
                    className="input-neon w-full pl-10"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-bold mb-2">
                  End Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 text-text-secondary" size={18} />
                  <input
                    type="time"
                    id="endTime"
                    className="input-neon w-full pl-10"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="maxAttendees" className="block text-sm font-bold mb-2">
                Maximum Attendees
              </label>
              <input
                type="number"
                id="maxAttendees"
                className="input-neon w-full"
                value={maxAttendees}
                onChange={(e) => setMaxAttendees(e.target.value ? parseInt(e.target.value) : '')}
                min="1"
                placeholder="Leave empty for unlimited"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPrivate"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="isPrivate" className="text-sm">
                Make this event private (only visible to community members)
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventForm;