import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config/api';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    phone: '',
    bio: '',
    expertise: '',
    portfolio: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const navigate = useNavigate();

  const isReporter = formData.role === 'author';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/signup`, formData);

      if (isReporter) {
        // Reporter needs approval - show success message
        setSuccess(data.message || 'Reporter application submitted! You will receive approval within 24 hours.');
        setFormData({ name: '', email: '', password: '', role: 'author', phone: '', bio: '', expertise: '', portfolio: '' });
        setLoading(false);
      } else {
        // Reader - instant login redirect
        setTransitioning(true);
        setTimeout(() => navigate('/login', { state: { message: 'Registration successful! Please login.' } }), 800);
      }
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
    <>
      {/* Full Screen Pending Approval Popup */}
      {success && isReporter && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, color: '#fff', padding: '2rem', textAlign: 'center'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1e293b, #0f172a)',
            padding: '3rem', borderRadius: '24px', maxWidth: '500px', width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)'
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(234, 179, 8, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
              color: '#eab308', fontSize: '2.5rem'
            }}>
              <i className="bi bi-hourglass-split"></i>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f8fafc' }}>
              Application Submitted!
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '0.5rem' }}>
              {success}
            </p>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.5', marginBottom: '2rem' }}>
              Our SuperAdmin will review your reporter application within <strong style={{ color: '#eab308' }}>24 hours</strong>. You will be able to login and access your dashboard once approved.
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                background: '#10b981', color: '#fff', border: 'none', padding: '12px 32px',
                borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
                transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
              onMouseOver={(e) => e.target.style.background = '#059669'}
              onMouseOut={(e) => e.target.style.background = '#10b981'}
            >
              Okay, I Understand
            </button>
          </div>
        </div>
      )}

      <div className={`auth-split-wrapper ${transitioning ? 'auth-transition-out' : ''} ${isSwiping ? 'auth-swipe-out' : 'auth-swipe-in'}`}>
        <Link to="/" className="auth-visit-site-btn">
          <i className="bi bi-arrow-left"></i> Visit Website
        </Link>
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
              <span className="auth-welcome-letter" style={{ animationDelay: '0s' }}>G</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.06s' }}>e</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.12s' }}>t</span>
              <span className="auth-welcome-space"></span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.22s' }}>S</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.28s' }}>t</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.34s' }}>a</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.40s' }}>r</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.46s' }}>t</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.52s' }}>e</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.58s' }}>d</span>
              <span className="auth-welcome-letter auth-welcome-emoji" style={{ animationDelay: '0.64s' }}>!</span>
            </div>

            <h2 className="auth-brand-tagline auth-hover-glow">
              {isReporter ? 'Become a Reporter!' : 'Join Industrial Times!'}
              <span className="auth-wave">{isReporter ? '📝' : '🚀'}</span>
            </h2>
            <p className="auth-brand-desc auth-hover-slide">
              {isReporter
                ? 'Apply to become an authorized reporter. Publish articles, build your portfolio, and reach millions of industry readers.'
                : 'Get access to premium industrial reporting, manufacturing insights, and the latest technology trends.'
              }
            </p>

            <div className="auth-brand-divider"></div>

            <div className="auth-brand-features">
              {isReporter ? (
                <>
                  <div className="auth-feature-item auth-hover-lift">
                    <i className="bi bi-check-circle-fill"></i>
                    <span>Publish Your Own Articles</span>
                  </div>
                  <div className="auth-feature-item auth-hover-lift">
                    <i className="bi bi-check-circle-fill"></i>
                    <span>Real-time Analytics Dashboard</span>
                  </div>
                  <div className="auth-feature-item auth-hover-lift">
                    <i className="bi bi-check-circle-fill"></i>
                    <span>Build Your Reporter Profile</span>
                  </div>
                  <div className="auth-feature-item auth-hover-lift">
                    <i className="bi bi-check-circle-fill"></i>
                    <span>Approval Within 24 Hours</span>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
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
                <Link to="/">
                  <img src="/industrialtimes_white.png" alt="Industrial Times" className="auth-form-center-logo" style={{ width: '180px', maxWidth: '100%', height: 'auto' }} />
                </Link>
              </div>
              <h2 className="auth-form-title">Create Account</h2>
              <p className="auth-form-subtitle">
                {isReporter ? 'Apply as an authorized reporter.' : 'Join thousands of industry professionals.'}
              </p>
            </div>

            {error && <div className="auth-error-alert">{error}</div>}


            <form onSubmit={handleSubmit} className="auth-form">
              {/* Role Selection - Prominent Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                <div
                  onClick={() => { setFormData({ ...formData, role: 'user' }); setError(''); setSuccess(''); }}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: formData.role === 'user' ? '2px solid #3b82f6' : '2px solid rgba(255,255,255,0.1)',
                    background: formData.role === 'user' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <i className="bi bi-book" style={{ fontSize: '1.4rem', color: formData.role === 'user' ? '#3b82f6' : '#64748b', display: 'block', marginBottom: '6px' }}></i>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: formData.role === 'user' ? '#3b82f6' : '#94a3b8' }}>Reader</span>
                  <p style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: 0, marginTop: '4px' }}>Read articles & news</p>
                </div>
                <div
                  onClick={() => { setFormData({ ...formData, role: 'author' }); setError(''); setSuccess(''); }}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: formData.role === 'author' ? '2px solid #10b981' : '2px solid rgba(255,255,255,0.1)',
                    background: formData.role === 'author' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <i className="bi bi-pencil-square" style={{ fontSize: '1.4rem', color: formData.role === 'author' ? '#10b981' : '#64748b', display: 'block', marginBottom: '6px' }}></i>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: formData.role === 'author' ? '#10b981' : '#94a3b8' }}>Reporter</span>
                  <p style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: 0, marginTop: '4px' }}>Publish & write articles</p>
                </div>
              </div>

              {/* Common Fields */}
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
                  placeholder="Email Id"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="auth-input auth-input-with-icon"
                />
              </div>

              <div className="auth-input-group auth-hover-input">
                <i className="bi bi-lock auth-input-icon"></i>
                {/* Dummy field to prevent browser autofill/password suggestion popup */}
                <input type="password" style={{ display: 'none' }} tabIndex="-1" autoComplete="new-password" />
                <input
                  type="password"
                  name="password"
                  autoComplete="off"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="auth-input auth-input-with-icon"
                />
              </div>

              {/* Reporter-Specific Fields */}
              {isReporter && (
                <>
                  <div className="auth-input-group auth-hover-input">
                    <i className="bi bi-telephone auth-input-icon"></i>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="auth-input auth-input-with-icon"
                    />
                  </div>

                  <div className="auth-input-group auth-hover-input">
                    <i className="bi bi-tag auth-input-icon"></i>
                    <input
                      type="text"
                      name="expertise"
                      placeholder="Area of Expertise (Optional)"
                      value={formData.expertise}
                      onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                      className="auth-input auth-input-with-icon"
                    />
                  </div>

                  <div className="auth-input-group auth-hover-input">
                    <i className="bi bi-link-45deg auth-input-icon"></i>
                    <input
                      type="url"
                      name="portfolio"
                      placeholder="Portfolio / LinkedIn URL (optional)"
                      value={formData.portfolio}
                      onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                      className="auth-input auth-input-with-icon"
                    />
                  </div>

                  <div className="auth-input-group auth-hover-input" style={{ alignItems: 'flex-start' }}>
                    <i className="bi bi-chat-left-text auth-input-icon" style={{ marginTop: '14px' }}></i>
                    <textarea
                      name="bio"
                      placeholder="Brief bio — Why do you want to be a reporter? (min 20 chars)"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      required
                      className="auth-input auth-input-with-icon"
                      rows={3}
                      style={{ resize: 'none', minHeight: '80px' }}
                    />
                  </div>
                </>
              )}

              <button type="submit" className="auth-submit-btn auth-hover-btn" disabled={loading || transitioning} style={isReporter ? { background: 'linear-gradient(135deg, #10b981, #059669)' } : {}}>
                {transitioning ? (
                  <><i className="bi bi-check-circle-fill"></i> Account Created!</>
                ) : loading ? (
                  <><span className="auth-spinner"></span> {isReporter ? 'Submitting Application...' : 'Creating Account...'}</>
                ) : (
                  isReporter ? 'Apply as Reporter →' : 'Create Reader Account'
                )}
              </button>
            </form>

            <div className="auth-footer-links">
              By signing up, you agree to our <Link to="/terms" className="auth-link-bold">Terms</Link> & <Link to="/privacy" className="auth-link-bold">Privacy Policy</Link>
            </div>

            <div className="auth-register-prompt" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              Already have an account? <a href="#" onClick={handleLoginClick} className="auth-link">Sign in here</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
