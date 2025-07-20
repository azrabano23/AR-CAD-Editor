import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Upload, ArrowRight } from 'lucide-react';
import { signInWithEmail, signUpWithEmail } from '../lib/supabaseClient';
import ModernButton from './ModernButton';

interface AuthPageProps {
  onAuthSuccess: (user: any) => void;
  onClose?: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        
        const { data, error } = await signUpWithEmail(email, password);
        if (error) throw error;
        
        if (data.user) {
          // Create user profile
          onAuthSuccess(data.user);
        }
      } else {
        const { data, error } = await signInWithEmail(email, password);
        if (error) throw error;
        
        if (data.user) {
          onAuthSuccess(data.user);
        }
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left side - Product showcase */}
        <div className="auth-showcase">
          <div className="showcase-content">
            <div className="logo-section">
              <div className="logo-icon">
                <svg width="48" height="48" viewBox="0 0 32 32" className="text-blue-600">
                  <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                  <path d="M4 8 L16 2 L28 8 L28 24 L16 30 L4 24 Z" fill="none" stroke="url(#logoGradient)" strokeWidth="2" opacity="0.8"/>
                  <path d="M4 8 L16 16 L28 8" stroke="url(#logoGradient)" strokeWidth="2" fill="none"/>
                  <path d="M16 16 L16 30" stroke="url(#logoGradient)" strokeWidth="2"/>
                  <circle cx="16" cy="12" r="3" fill="url(#logoGradient)" opacity="0.6"/>
                </svg>
              </div>
              <h1>HoloDraft</h1>
              <p className="tagline">CAD-to-AR Platform</p>
            </div>

            <div className="features-preview">
              <h2>Transform Your CAD Workflow</h2>
              <ul className="feature-list">
                <li>
                  <Upload className="w-5 h-5" />
                  <span>Upload any CAD format (STL, STEP, OBJ, PLY, DAE)</span>
                </li>
                <li>
                  <ArrowRight className="w-5 h-5" />
                  <span>Automatic AR conversion in seconds</span>
                </li>
                <li>
                  <div className="ar-icon">🥽</div>
                  <span>Deploy to MetaQuest with one click</span>
                </li>
                <li>
                  <div className="collab-icon">👥</div>
                  <span>Real-time collaboration on AR projects</span>
                </li>
              </ul>

              <div className="stats-preview">
                <div className="stat">
                  <span className="stat-number">75%</span>
                  <span className="stat-label">Faster Reviews</span>
                </div>
                <div className="stat">
                  <span className="stat-number">$120K</span>
                  <span className="stat-label">Annual Savings</span>
                </div>
                <div className="stat">
                  <span className="stat-number">87%</span>
                  <span className="stat-label">Error Detection</span>
                </div>
              </div>

              <div className="tech-requirements">
                <h3>📱 Quick Setup Requirements</h3>
                <div className="requirements-list">
                  <div className="requirement">
                    <strong>🥽 MetaQuest:</strong>
                    <ul>
                      <li>SideQuest or Developer Hub</li>
                    </ul>
                  </div>
                  <div className="requirement">
                    <strong>👓 HoloLens:</strong>
                    <ul>
                      <li>Device Portal & Visual Studio</li>
                    </ul>
                  </div>
                </div>
                <p className="requirements-note">
                  💡 See full setup instructions on the main page.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth form */}
        <div className="auth-form-container">
          {onClose && (
            <button className="auth-close-btn" onClick={onClose} title="Close">
              ✕
            </button>
          )}
          <motion.div 
            className="auth-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="form-header">
              <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
              <p>{isSignUp ? 'Start your AR workflow journey' : 'Sign in to your HoloDraft workspace'}</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form-fields">
              {isSignUp && (
                <div className="form-field">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                  />
                </div>
              )}

              <div className="form-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div className="form-field">
                <label htmlFor="password">Password</label>
                <div className="password-input">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isSignUp && (
                <div className="form-field">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm your password"
                    minLength={6}
                  />
                </div>
              )}

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <ModernButton
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="auth-submit"
              >
                {isSignUp ? 'Create Account' : 'Sign In'}
              </ModernButton>
              
            </form>

            <div className="form-footer">
              <p>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="auth-switch"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
