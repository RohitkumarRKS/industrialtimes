import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const navigate = useNavigate();

  const getUserInfo = () => {
    try {
      const saved = sessionStorage.getItem('userInfo');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
      sessionStorage.setItem('userInfo', JSON.stringify(data));
      setTransitioning(true);
      // Redirect reporters to their dedicated dashboard
      const dest = data.role === 'author' ? '/reporter-dashboard' : '/';
      setTimeout(() => navigate(dest), 800);
    } catch (err) {
      if (err.response?.data?.status === 'pending') {
        setError('⏳ ' + err.response.data.message);
      } else if (err.response?.data?.status === 'rejected') {
        setError('❌ ' + err.response.data.message);
      } else {
        setError(err.response?.data?.message || 'Invalid email or password');
      }
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('userInfo');
    navigate('/');
  };

  const handleSignupClick = (e) => {
    e.preventDefault();
    setIsSwiping(true);
    setTimeout(() => {
      navigate('/signup');
    }, 500);
  };

  return (
    <div className={`auth-split-wrapper ${transitioning ? 'auth-transition-out' : ''} ${isSwiping ? 'auth-swipe-out' : 'auth-swipe-in'}`}>
        {/* Left Branding Panel */}
        <div className="auth-split-left">
          <div className="auth-left-shapes">
            <div className="auth-shape auth-shape-1"></div>
            <div className="auth-shape auth-shape-2"></div>
            <div className="auth-shape auth-shape-3"></div>
            <div className="auth-shape auth-shape-4"></div>
          </div>

          <div className="auth-brand-content">
            <div className="auth-welcome-animated">
              <span className="auth-welcome-letter" style={{animationDelay:'0s'}}>W</span>
              <span className="auth-welcome-letter" style={{animationDelay:'0.06s'}}>e</span>
              <span className="auth-welcome-letter" style={{animationDelay:'0.12s'}}>l</span>
              <span className="auth-welcome-letter" style={{animationDelay:'0.18s'}}>c</span>
              <span className="auth-welcome-letter" style={{animationDelay:'0.24s'}}>o</span>
              <span className="auth-welcome-letter" style={{animationDelay:'0.30s'}}>m</span>
              <span className="auth-welcome-letter" style={{animationDelay:'0.36s'}}>e</span>
              <span className="auth-welcome-space"></span>
              <span className="auth-welcome-letter" style={{animationDelay:'0.46s'}}>B</span>
              <span className="auth-welcome-letter" style={{animationDelay:'0.52s'}}>a</span>
              <span className="auth-welcome-letter" style={{animationDelay:'0.58s'}}>c</span>
              <span className="auth-welcome-letter" style={{animationDelay:'0.64s'}}>k</span>
              <span className="auth-welcome-letter auth-welcome-emoji" style={{animationDelay:'0.70s'}}>!</span>
            </div>

            <h2 className="auth-brand-tagline auth-hover-glow">
              Hello Industrial Times!<span className="auth-wave">👋</span>
            </h2>
            <p className="auth-brand-desc auth-hover-slide">
              Your trusted source for industrial news, manufacturing insights, and technology updates across India.
            </p>

            <div className="auth-brand-divider"></div>

            <div className="auth-brand-features">
              <div className="auth-feature-item auth-hover-lift">
                <i className="bi bi-check-circle-fill"></i>
                <span>Real-time Industry Updates</span>
              </div>
              <div className="auth-feature-item auth-hover-lift">
                <i className="bi bi-check-circle-fill"></i>
                <span>Expert Analysis & Reports</span>
              </div>
              <div className="auth-feature-item auth-hover-lift">
                <i className="bi bi-check-circle-fill"></i>
                <span>Exclusive Manufacturing Insights</span>
              </div>
            </div>
          </div>
          <div className="auth-brand-footer">
            © {new Date().getFullYear()} Industrial Times. All rights reserved.
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="auth-split-right">
          <div className="auth-form-container auth-fade-in">
            <div className="auth-form-header">
              <div className="auth-form-logo-center mb-4">
                <img src="/industrialtimes_white.png" alt="Industrial Times" className="auth-form-center-logo" style={{ height: '40px', width: 'auto' }} />
              </div>
              <h2 className="auth-form-title">Welcome Back!</h2>
              <p className="auth-form-subtitle">
                Sign in to your account to continue.
              </p>
            </div>

            {error && <div className="auth-error-alert">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-input-group auth-hover-input">
                <i className="bi bi-envelope auth-input-icon"></i>
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="auth-input auth-input-with-icon"
                />
              </div>

              <div className="auth-input-group auth-hover-input">
                <i className="bi bi-lock auth-input-icon"></i>
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="auth-input auth-input-with-icon"
                />
              </div>

              <div className="auth-form-options">
                <label className="auth-checkbox-label">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <Link to="#" className="auth-forgot-pass">Forgot password?</Link>
              </div>

              <button type="submit" className="auth-submit-btn auth-hover-btn" disabled={loading || transitioning}>
                {transitioning ? (
                  <><i className="bi bi-check-circle-fill"></i> Welcome!</>
                ) : loading ? (
                  <><span className="auth-spinner"></span> Signing in...</>
                ) : (
                  'Login Now'
                )}
              </button>
            </form>


            
            <div className="auth-register-prompt">
              Don't have an account? <a href="#" onClick={handleSignupClick} className="auth-link">Register now</a>
            </div>
          </div>
        </div>
    </div>
  );
};

export default Login;
