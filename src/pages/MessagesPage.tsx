import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Send, MoreVertical, Phone, Video, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  is_read: boolean;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

interface Conversation {
  id: string;
  updated_at: string;
  participants: {
    profile_id: string;
    profiles: {
      username: string;
      avatar_url: string | null;
    };
  }[];
  last_message?: {
    content: string;
    created_at: string;
  };
}

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user) {
      fetchConversations();
      subscribeToNewMessages();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations!inner (
            id,
            updated_at,
            conversation_participants (
              profile_id,
              profiles (
                username,
                avatar_url
              )
            ),
            messages (
              content,
              created_at
            )
          )
        `)
        .eq('profile_id', user?.id)
        .order('conversations.updated_at', { ascending: false });

      if (error) throw error;

      const formattedConversations = data.map((item: any) => ({
        id: item.conversations.id,
        updated_at: item.conversations.updated_at,
        participants: item.conversations.conversation_participants,
        last_message: item.conversations.messages[0]
      }));

      setConversations(formattedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('sender_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const subscribeToNewMessages = () => {
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, payload => {
        const newMessage = payload.new as Message;
        if (selectedConversation?.id === newMessage.conversation_id) {
          setMessages(prev => [...prev, newMessage]);
          markMessagesAsRead(newMessage.conversation_id);
        }
        fetchConversations();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          content: newMessage.trim(),
          sender_id: user?.id
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.profile_id !== user?.id)?.profiles;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-accent-1">Loading...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-[calc(100vh-2rem)] -mt-4 -mx-4 flex"
    >
      {(!isMobileView || !selectedConversation) && (
        <div className="w-full md:w-80 bg-secondary border-r border-surface-blur">
          <div className="p-4">
            <h1 className="text-2xl font-heading mb-4">Messages</h1>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 text-text-secondary" size={18} />
              <input
                type="text"
                placeholder="Search messages..."
                className="input-neon w-full pl-10"
              />
            </div>
          </div>

          <div className="overflow-y-auto h-[calc(100%-7rem)]">
            {conversations.map(conversation => {
              const otherUser = getOtherParticipant(conversation);
              return (
                <button
                  key={conversation.id}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-surface-blur transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-surface-blur' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <img
                    src={otherUser?.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${otherUser?.username}`}
                    alt={otherUser?.username}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1 text-left">
                    <div className="font-bold">{otherUser?.username}</div>
                    {conversation.last_message && (
                      <>
                        <div className="text-sm text-text-secondary truncate">
                          {conversation.last_message.content}
                        </div>
                        <div className="text-xs text-accent-2">
                          {formatDate(conversation.last_message.created_at)}
                        </div>
                      </>
                    )}
                  </div>
                </button>
              );
            })}

            {conversations.length === 0 && (
              <div className="text-center py-8 text-text-secondary">
                No conversations yet
              </div>
            )}
          </div>
        </div>
      )}

      {(!isMobileView || selectedConversation) && (
        <div className="flex-1 flex flex-col bg-primary">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-surface-blur flex items-center justify-between bg-secondary">
                <div className="flex items-center gap-3">
                  {isMobileView && (
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="btn-icon mr-2"
                    >
                      <ArrowLeft size={18} />
                    </button>
                  )}
                  <img
                    src={getOtherParticipant(selectedConversation)?.avatar_url || 
                      `https://api.dicebear.com/7.x/pixel-art/svg?seed=${getOtherParticipant(selectedConversation)?.username}`}
                    alt={getOtherParticipant(selectedConversation)?.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="font-bold">
                      {getOtherParticipant(selectedConversation)?.username}
                    </div>
                    <div className="text-xs text-accent-2">Online</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-icon">
                    <Phone size={18} />
                  </button>
                  <button className="btn-icon">
                    <Video size={18} />
                  </button>
                  <button className="btn-icon">
                    <User size={18} />
                  </button>
                  <button className="btn-icon">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isCurrentUser = message.sender_id === user?.id;
                    const showDate = index === 0 || 
                      formatDate(messages[index - 1].created_at) !== formatDate(message.created_at);

                    return (
                      <React.Fragment key={message.id}>
                        {showDate && (
                          <div className="text-center text-sm text-text-secondary my-4">
                            {formatDate(message.created_at)}
                          </div>
                        )}
                        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${isCurrentUser ? 'order-2' : ''}`}>
                            <div className={`glass-panel p-3 ${
                              isCurrentUser ? 'bg-accent-1 text-primary' : ''
                            }`}>
                              {message.content}
                            </div>
                            <div className={`text-xs mt-1 ${
                              isCurrentUser ? 'text-right' : ''
                            } text-text-secondary`}>
                              {formatTime(message.created_at)}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="p-4 border-t border-surface-blur bg-secondary">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="input-neon flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <button
                    className="btn-primary px-6"
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-secondary">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default MessagesPage;