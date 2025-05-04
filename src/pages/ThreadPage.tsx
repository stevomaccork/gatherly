import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Send, ThumbsUp, MessageSquare, Share2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, createReply, toggleThreadLike, toggleReplyLike } from '../utils/supabaseClient';
import type { Thread, ThreadReply } from '../utils/supabaseClient';

const ThreadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [thread, setThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<ThreadReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);

  useEffect(() => {
    if (id) {
      fetchThread();
      fetchReplies();
    }
  }, [id]);

  const fetchThread = async () => {
    try {
      const { data, error } = await supabase
        .from('threads')
        .select(`
          *,
          profiles:created_by (username, avatar_url),
          communities (name),
          thread_likes (count),
          thread_replies (count)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        setError('Thread not found');
        return;
      }

      // Check if the current user has liked the thread
      if (user) {
        const { data: likeData } = await supabase
          .from('thread_likes')
          .select()
          .eq('thread_id', id)
          .eq('profile_id', user.id)
          .maybeSingle();

        data.user_has_liked = !!likeData;
      }

      setThread(data);
    } catch (error: any) {
      console.error('Error fetching thread:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReplies = async () => {
    try {
      const { data, error } = await supabase
        .from('thread_replies')
        .select(`
          *,
          profiles:created_by (username, avatar_url),
          thread_reply_likes (count)
        `)
        .eq('thread_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Check which replies the current user has liked
      if (user && data) {
        const { data: likedReplies } = await supabase
          .from('thread_reply_likes')
          .select('reply_id')
          .eq('profile_id', user.id)
          .in('reply_id', data.map(reply => reply.id));

        data.forEach(reply => {
          reply.user_has_liked = likedReplies?.some(like => like.reply_id === reply.id) || false;
        });
      }

      setReplies(data || []);
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim() || !id || !user) return;

    setIsSubmitting(true);
    try {
      const newReply = await createReply(id, replyText);
      setReplies([...replies, newReply]);
      setReplyText('');
      
      // Update reply count in thread
      if (thread) {
        setThread({
          ...thread,
          thread_replies_count: (thread.thread_replies_count || 0) + 1
        });
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Failed to post reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThreadLike = async () => {
    if (!thread) return;

    if (!user) {
      navigate('/auth', { state: { from: `/thread/${id}` } });
      return;
    }

    try {
      const isLiked = await toggleThreadLike(thread.id);
      setThread({
        ...thread,
        thread_likes_count: (thread.thread_likes_count || 0) + (isLiked ? 1 : -1),
        user_has_liked: isLiked,
      });
    } catch (error) {
      console.error('Error toggling thread like:', error);
    }
  };

  const handleReplyLike = async (replyId: string) => {
    if (!user) {
      navigate('/auth', { state: { from: `/thread/${id}` } });
      return;
    }

    try {
      const isLiked = await toggleReplyLike(replyId);
      setReplies(replies.map(reply => {
        if (reply.id === replyId) {
          return {
            ...reply,
            thread_reply_likes_count: (reply.thread_reply_likes_count || 0) + (isLiked ? 1 : -1),
            user_has_liked: isLiked,
          };
        }
        return reply;
      }));
    } catch (error) {
      console.error('Error toggling reply like:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: thread?.title,
          text: thread?.content,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      setShowShareDialog(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-accent-1">Loading...</div>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="text-center py-20">
        <div className="flex items-center justify-center gap-2 text-error mb-4">
          <AlertCircle size={24} />
          <h2 className="text-2xl font-heading">Thread not found</h2>
        </div>
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
      <Link to={`/community/${thread.community_id}`} className="flex items-center text-accent-1 hover:underline mb-4">
        <ChevronLeft size={16} />
        <span className="ml-1">Back to {thread.communities?.name}</span>
      </Link>
      
      <div className="glass-panel p-6 mb-6">
        <h1 className="text-2xl font-heading mb-4">{thread.title}</h1>
        
        <div className="flex items-center mb-4">
          <img 
            src={thread.profiles?.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${thread.profiles?.username}`}
            alt={thread.profiles?.username} 
            className="w-10 h-10 rounded-full border-2 border-accent-1 mr-3" 
          />
          <div>
            <div className="font-bold">{thread.profiles?.username}</div>
            <div className="text-sm text-text-secondary">
              Posted {new Date(thread.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="mb-4 text-text-primary whitespace-pre-line">
          {thread.content}
        </div>
        
        <div className="flex gap-4 pt-4 border-t border-surface-blur">
          <button 
            className={`flex items-center gap-2 ${
              thread.user_has_liked ? 'text-accent-1' : 'text-text-secondary hover:text-accent-1'
            }`}
            onClick={handleThreadLike}
          >
            <ThumbsUp size={18} />
            <span>{thread.thread_likes_count || 0} Likes</span>
          </button>
          <button className="flex items-center gap-2 text-text-secondary hover:text-accent-1">
            <MessageSquare size={18} />
            <span>{thread.thread_replies_count || 0} Replies</span>
          </button>
          <button 
            className="flex items-center gap-2 text-text-secondary hover:text-accent-1"
            onClick={handleShare}
          >
            <Share2 size={18} />
            <span>Share</span>
          </button>
        </div>
      </div>
      
      <h3 className="text-xl font-heading mb-4">Replies</h3>
      
      <div className="space-y-5 mb-8">
        {replies.map((reply, index) => (
          <motion.div
            key={reply.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: index * 0.1 } }}
            className="glass-panel p-5"
          >
            <div className="flex items-center mb-3">
              <img 
                src={reply.profiles?.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${reply.profiles?.username}`}
                alt={reply.profiles?.username} 
                className="w-8 h-8 rounded-full border-2 border-accent-2 mr-3" 
              />
              <div>
                <div className="font-bold">{reply.profiles?.username}</div>
                <div className="text-xs text-text-secondary">
                  {new Date(reply.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div className="mb-3 text-text-primary">
              {reply.content}
            </div>
            
            <div className="flex items-center gap-2 text-text-secondary">
              <button 
                className={`flex items-center gap-1 ${
                  reply.user_has_liked ? 'text-accent-1' : 'hover:text-accent-1'
                }`}
                onClick={() => handleReplyLike(reply.id)}
              >
                <ThumbsUp size={14} />
                <span>{reply.thread_reply_likes_count || 0}</span>
              </button>
            </div>
          </motion.div>
        ))}

        {replies.length === 0 && (
          <div className="text-center py-8 text-text-secondary">
            No replies yet. Be the first to reply!
          </div>
        )}
      </div>
      
      {user ? (
        <div className="sticky bottom-20 md:bottom-6 glass-panel p-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <img 
              src={user.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`}
              alt="Your avatar" 
              className="w-10 h-10 rounded-full border-2 border-accent-1" 
            />
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="input-neon w-full pr-12"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleReplySubmit();
                  }
                }}
              />
              <button 
                className="absolute right-2 top-1/2 -translate-y-1/2 btn-icon"
                onClick={handleReplySubmit}
                disabled={!replyText.trim() || isSubmitting}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="sticky bottom-20 md:bottom-6 glass-panel p-4 backdrop-blur-xl">
          <Link 
            to="/auth" 
            state={{ from: `/thread/${id}` }}
            className="btn-primary w-full text-center block"
          >
            Sign in to Reply
          </Link>
        </div>
      )}

      {showShareDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 w-full max-w-md">
            <h3 className="text-xl font-heading mb-4">Share Thread</h3>
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

export default ThreadPage;