import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import type { User, Provider } from '@supabase/supabase-js';
import type { Profile } from '../utils/supabaseClient';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        // Check active sessions and sets the user
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setError('Failed to initialize authentication');
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      // If the profile doesn't exist yet (like after a Google sign in), create it
      if (!data) {
        await createProfileForUser(userId);
        return;
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const createProfileForUser = async (userId: string) => {
    try {
      // Get user details from auth
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      
      const user = userData.user;
      
      // Extract username from email or use a fallback
      const email = user.email || '';
      const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
      
      // Create profile
      const { error: profileError, data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username,
          email: user.email,
          avatar_url: user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`,
          full_name: user.user_metadata.full_name || null,
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error('Failed to create user profile');
      }
      
      setProfile(newProfile);
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      setError(null);
      
      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (existingUser) {
        throw new Error('Username is already taken');
      }

      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username,
            email: user.email,
            avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Delete the auth user if profile creation fails
          await supabase.auth.signOut();
          throw new Error('Failed to create user profile. Please try again.');
        }

        // Fetch the created profile
        await fetchProfile(user.id);
      }
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error('Invalid email or password. Please try again.');
        }
        throw error;
      }

      // Get the return path from location state or default to '/'
      const from = (location.state as any)?.from || '/';
      navigate(from, { replace: true });
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
      navigate('/auth');
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Add a loading state UI
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-1"></div>
      </div>
    );
  }

  // Show error state if there's an initialization error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-heading text-error mb-4">Authentication Error</h2>
          <p className="text-text-secondary mb-6">{error}</p>
          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const value = {
    user,
    profile,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    loading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}