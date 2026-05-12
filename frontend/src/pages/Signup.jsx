import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('http://localhost:5000/api/auth/signup', formData);
      setTransitioning(true);
      setTimeout(() => navigate('/login', { state: { message: 'Registration successful! Please login.' } }), 800);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setLoading(false);
    }
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    setIsSwiping(true);
    setTimeout(() => {
      navigate('/login');
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
              <span className="auth-welcome-letter" style={{animationDelay:'0s'}}>G</span>
              <span className="auth-welcome-letter" style={{animationDelay:'0.06s'}}>e</span>
              <span className="auth-welcome-letter" style={{animationDelay:'0.12s'}}>t</span>
              <span className="auth-welcome-space"></span>
              <span className="auth-welcome-letter" style={{animationDelay:'0.22s'}}>S</span>
              <span className="auth-welcome-letter" style={{animationDelay:'0.28s'}}>t</span>
              <span className="auth-welcome-letter" style={{animationDelay:'0.34s'}}>a</span>
              <span className="auth-welcome-letter" style={{animationDelay:'0.40s'}}>r</span>
              <span className="auth-welcome-letter" style={{animationDelay:'0.46s'}}>t</span>
              <span className="auth-welcome-letter" style={{animationDelay:'0.52s'}}>e</span>
              <span className="auth-welcome-letter" style={{animationDelay:'0.58s'}}>d</span>
              <span className="auth-welcome-letter auth-welcome-emoji" style={{animationDelay:'0.64s'}}>!</span>
            </div>

            <h2 className="auth-brand-tagline auth-hover-glow">
              Join Industrial Times!<span className="auth-wave">🚀</span>
            </h2>
            <p className="auth-brand-desc auth-hover-slide">
              Get access to premium industrial reporting, manufacturing insights, and the latest technology trends.
            </p>

            <div className="auth-brand-divider"></div>

            <div className="auth-brand-features">
              <div className="auth-feature-item auth-hover-lift">
                <i className="bi bi-check-circle-fill"></i>
                <span>Unlimited Article Access</span>
              </div>
              <div className="auth-feature-item auth-hover-lift">
                <i className="bi bi-check-circle-fill"></i>
                <span>Personalized News Feed</span>
              </div>
              <div className="auth-feature-item auth-hover-lift">
                <i className="bi bi-check-circle-fill"></i>
                <span>Exclusive Industry Reports</span>
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
              <h2 className="auth-form-title">Create Account</h2>
              <p className="auth-form-subtitle">
                Join thousands of industry professionals.
              </p>
            </div>

            {error && <div className="auth-error-alert">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-input-group auth-hover-input">
                <i className="bi bi-person auth-input-icon"></i>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="auth-input auth-input-with-icon"
                />
              </div>

              <div className="auth-input-group auth-hover-input">
                <i className="bi bi-envelope auth-input-icon"></i>
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="auth-input auth-input-with-icon"
                />
              </div>

              <div className="auth-input-group auth-hover-input">
                <i className="bi bi-lock auth-input-icon"></i>
                <input
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="auth-input auth-input-with-icon"
                />
              </div>

              <div className="auth-role-group">
                <label className="auth-role-label auth-hover-lift">
                  <input type="radio" name="role" checked={formData.role === 'user'} onChange={() => setFormData({ ...formData, role: 'user' })} />
                  <span>Reader</span>
                </label>
                <label className="auth-role-label auth-hover-lift">
                  <input type="radio" name="role" checked={formData.role === 'author'} onChange={() => setFormData({ ...formData, role: 'author' })} />
                  <span>Author / Reporter</span>
                </label>
              </div>

              <button type="submit" className="auth-submit-btn auth-hover-btn" disabled={loading || transitioning}>
                {transitioning ? (
                  <><i className="bi bi-check-circle-fill"></i> Account Created!</>
                ) : loading ? (
                  <><span className="auth-spinner"></span> Creating Account...</>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="auth-footer-links">
              By signing up, you agree to our <Link to="/terms" className="auth-link-bold">Terms</Link> & <Link to="/privacy" className="auth-link-bold">Privacy Policy</Link>
            </div>
            
            <div className="auth-register-prompt" style={{marginTop: '1.5rem', textAlign: 'center'}}>
              Already have an account? <a href="#" onClick={handleLoginClick} className="auth-link">Sign in here</a>
            </div>
          </div>
        </div>
    </div>
  );
};

export default Signup;
