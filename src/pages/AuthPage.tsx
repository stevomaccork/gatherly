import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import InterestsForm from '../components/onboarding/InterestsForm';

const AuthPage: React.FC = () => {
  const { signIn, signUp, signInWithGoogle, user, error } = useAuth();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInterestsForm, setShowInterestsForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    username?: string;
  }>({});

  const from = location.state?.from || '/';

  if (user && !showInterestsForm) {
    return <Navigate to={from} />;
  }

  const validateForm = () => {
    const errors: typeof validationErrors = {};

    // Email validation
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else if (!isLogin && password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    // Username validation for signup
    if (!isLogin && !username) {
      errors.username = 'Username is required';
    } else if (!isLogin && username.length < 3) {
      errors.username = 'Username must be at least 3 characters long';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, username);
        setShowInterestsForm(true);
      }
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google auth error:', error);
      setLoading(false);
    }
  };

  if (showInterestsForm && user) {
    return (
      <InterestsForm
        userId={user.id}
        onComplete={() => {
          setShowInterestsForm(false);
        }}
      />
    );
  }

  const renderFieldError = (fieldName: keyof typeof validationErrors) => {
    if (validationErrors[fieldName]) {
      return (
        <div className="text-error text-sm mt-1 flex items-center gap-1">
          <AlertCircle size={14} />
          {validationErrors[fieldName]}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel p-8 max-w-md w-full"
      >
        <h1 className="text-3xl font-heading text-center mb-2">
          <span className="inline-block">⬢</span> Gatherly
        </h1>
        <p className="text-text-secondary text-center mb-8">
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </p>
        
        {error && (
          <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={18} />
            <span>
              {error === 'Invalid login credentials' 
                ? 'Invalid email or password. Please check your credentials and try again.'
                : error}
            </span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {!isLogin && (
            <div>
              <label htmlFor="username" className="block text-sm font-bold mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-text-secondary" size={18} />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setValidationErrors((prev) => ({ ...prev, username: undefined }));
                  }}
                  className={`input-neon w-full pl-10 ${
                    validationErrors.username ? 'border-error' : ''
                  }`}
                  placeholder="Choose a username"
                />
              </div>
              {renderFieldError('username')}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-bold mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-text-secondary" size={18} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, email: undefined }));
                }}
                className={`input-neon w-full pl-10 ${
                  validationErrors.email ? 'border-error' : ''
                }`}
                placeholder="your@email.com"
              />
            </div>
            {renderFieldError('email')}
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-bold mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-text-secondary" size={18} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, password: undefined }));
                }}
                className={`input-neon w-full pl-10 ${
                  validationErrors.password ? 'border-error' : ''
                }`}
                placeholder="••••••••"
              />
            </div>
            {renderFieldError('password')}
            {!isLogin && (
              <p className="text-text-secondary text-sm mt-1">
                Password must be at least 8 characters long
              </p>
            )}
          </div>
          
          <button 
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-accent-1/20"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-secondary px-4 text-sm text-text-secondary">Or continue with</span>
          </div>
        </div>
        
        <button 
          onClick={handleGoogleSignIn}
          className="flex items-center justify-center w-full p-2 border border-accent-1/30 bg-white text-text-primary rounded-lg hover:bg-gray-50 mb-6"
          disabled={loading}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
            </g>
          </svg>
          Continue with Google
        </button>
        
        <div className="text-center text-text-secondary text-sm">
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <button 
                className="text-accent-1 hover:underline"
                onClick={() => {
                  setIsLogin(false);
                  setValidationErrors({});
                }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button 
                className="text-accent-1 hover:underline"
                onClick={() => {
                  setIsLogin(true);
                  setValidationErrors({});
                }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;