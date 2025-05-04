import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import InterestsForm from '../components/onboarding/InterestsForm';

const AuthPage: React.FC = () => {
  const { signIn, signUp, user, error } = useAuth();
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
          <span className="inline-block">⬢</span> NeoByte
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