import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import type { Thread } from '../../utils/supabaseClient';

interface ThreadFormProps {
  communityId: string;
  onThreadCreated: (thread: Thread) => void;
  onClose: () => void;
}

const ThreadForm: React.FC<ThreadFormProps> = ({ communityId, onThreadCreated, onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: thread, error } = await supabase
        .from('threads')
        .insert({
          community_id: communityId,
          title: title.trim(),
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      if (thread) {
        onThreadCreated(thread);
      }
    } catch (error: any) {
      alert('Error creating thread: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-panel w-full max-w-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 btn-icon"
        >
          <X size={18} />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-heading mb-6">Start a New Discussion</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-bold mb-2">
                Title
              </label>
              <input
                type="text"
                id="title"
                className="input-neon w-full"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's on your mind?"
                required
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-bold mb-2">
                Content
              </label>
              <textarea
                id="content"
                className="input-neon w-full min-h-[200px]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts..."
                required
              />
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
                {isSubmitting ? 'Creating...' : 'Create Thread'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ThreadForm;