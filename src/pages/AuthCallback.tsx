import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Try to process the OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data.session) {
          // Success! Redirect to the home page or a desired route
          navigate('/', { replace: true });
        } else {
          // Extract hash and query parameters
          const hashParams = window.location.hash;
          const queryParams = window.location.search;
          
          if (hashParams || queryParams) {
            // Process the URL with OAuth parameters
            const { error: exchangeError } = await supabase.auth.setSession({
              access_token: '',
              refresh_token: '',
            });
            
            if (exchangeError) {
              throw exchangeError;
            }
            
            navigate('/', { replace: true });
          } else {
            throw new Error('No authentication data found in URL');
          }
        }
      } catch (err: any) {
        console.error('Error during auth callback:', err);
        setError(err.message || 'Authentication failed. Please try again.');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="glass-panel p-8 max-w-md text-center">
          <h2 className="text-2xl font-heading text-error mb-4">Authentication Error</h2>
          <p className="text-text-secondary mb-6">{error}</p>
          <button
            className="btn-primary"
            onClick={() => navigate('/auth', { replace: true })}
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-1 mb-4"></div>
        <p className="text-text-secondary">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback; 