import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../../config/api';

const CorporateLogin = () => {
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'basic';
  const [isSignup, setIsSignup] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [planLabels, setPlanLabels] = useState({});
  const navigate = useNavigate();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    designation: '',
    phone: ''
  });

  // Fetch plan labels from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/plans`);
        const labels = {};
        (data || []).forEach(p => { labels[p.planKey] = p.name; });
        setPlanLabels(labels);
      } catch (e) {
        // Fallback labels
        setPlanLabels({ basic: 'STARTER', standard: 'BUSINESS', premium: 'ENTERPRISE', pro: 'EXECUTIVE' });
      }
    };
    fetchPlans();
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/signup`, {
        ...signupData,
        role: 'corporate',
        selectedPlan
      });

      setSuccess(data.message || 'Corporate account registered! Awaiting admin approval.');
      setSignupData({ name: '', email: '', password: '', companyName: '', designation: '', phone: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/login`, {
        email: loginEmail,
        password: loginPassword
      });

      sessionStorage.setItem('userInfo', JSON.stringify(data));
      setTransitioning(true);
      setTimeout(() => {
        navigate('/profile');
      }, 800);
    } catch (err) {
      if (err.response?.data?.status === 'pending') {
        setError('⏳ ' + err.response.data.message);
      } else if (err.response?.data?.status === 'rejected') {
        setError('❌ ' + err.response.data.message);
      } else {
        setError(err.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-split-wrapper ${transitioning ? 'auth-transition-out' : ''}`}>
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
            <span className="auth-welcome-letter" style={{animationDelay:'0s'}}>C</span>
            <span className="auth-welcome-letter" style={{animationDelay:'0.06s'}}>o</span>
            <span className="auth-welcome-letter" style={{animationDelay:'0.12s'}}>r</span>
            <span className="auth-welcome-letter" style={{animationDelay:'0.18s'}}>p</span>
            <span className="auth-welcome-letter" style={{animationDelay:'0.24s'}}>o</span>
            <span className="auth-welcome-letter" style={{animationDelay:'0.30s'}}>r</span>
            <span className="auth-welcome-letter" style={{animationDelay:'0.36s'}}>a</span>
            <span className="auth-welcome-letter" style={{animationDelay:'0.42s'}}>t</span>
            <span className="auth-welcome-letter" style={{animationDelay:'0.48s'}}>e</span>
            <span className="auth-welcome-letter auth-welcome-emoji" style={{animationDelay:'0.54s'}}>!</span>
          </div>

          <h2 className="auth-brand-tagline auth-hover-glow">
            Corporate Access Portal<span className="auth-wave">🏢</span>
          </h2>
          <p className="auth-brand-desc auth-hover-slide">
            Industrial Times Corporate accounts provide premium publishing access, brand campaigns, and dedicated editorial support for enterprises.
          </p>

          <div className="auth-brand-divider"></div>

          <div className="auth-brand-features">
            <div className="auth-feature-item auth-hover-lift">
              <i className="bi bi-check-circle-fill"></i>
              <span>Dedicated Account Manager</span>
            </div>
            <div className="auth-feature-item auth-hover-lift">
              <i className="bi bi-check-circle-fill"></i>
              <span>Brand Campaign Management</span>
            </div>
            <div className="auth-feature-item auth-hover-lift">
              <i className="bi bi-check-circle-fill"></i>
              <span>Priority Publishing Queue</span>
            </div>
            <div className="auth-feature-item auth-hover-lift">
              <i className="bi bi-check-circle-fill"></i>
              <span>Admin-Verified & Secure</span>
            </div>
          </div>

          {selectedPlan && (
            <div style={{ marginTop: '1.5rem' }}>
              <div className="auth-stat-pill auth-hover-lift" style={{ display: 'inline-flex' }}>
                <i className="bi bi-tag-fill"></i>
                <span>Selected Plan: <strong>{planLabels[selectedPlan] || selectedPlan.toUpperCase()}</strong></span>
              </div>
            </div>
          )}
        </div>
        <div className="auth-brand-footer">
          © {new Date().getFullYear()} Industrial Times Networks. All rights reserved.
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-split-right">
        <div className="auth-form-container auth-fade-in">
          <div className="auth-form-header">
            <div className="auth-form-logo-center mb-4">
              <img src="/industrialtimes_white.png" alt="Industrial Times" className="auth-form-center-logo" style={{ height: '40px', width: 'auto' }} />
            </div>
            <h2 className="auth-form-title">{isSignup ? 'Corporate Registration' : 'Corporate Login'}</h2>
            <p className="auth-form-subtitle">
              {isSignup 
                ? 'Register your corporate account. Admin approval is required.'
                : 'Sign in to your approved corporate account.'
              }
            </p>
          </div>

          {error && <div className="auth-error-alert">{error}</div>}
          {success && (
            <div style={{
              background: '#f0fdf4',
              color: '#16a34a',
              padding: '14px 18px',
              borderRadius: '12px',
              fontSize: '0.88rem',
              marginBottom: '1rem',
              border: '1px solid #bbf7d0',
              lineHeight: 1.5,
              fontWeight: 600
            }}>
              <i className="bi bi-check-circle-fill" style={{ marginRight: '8px' }}></i>
              {success}
            </div>
          )}

          {isSignup ? (
            <form onSubmit={handleSignup} className="auth-form">
              <div className="auth-input-group auth-hover-input">
                <i className="bi bi-person auth-input-icon"></i>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Full Name"
                  value={signupData.name}
                  onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                  required
                  className="auth-input auth-input-with-icon"
                />
              </div>

              <div className="auth-input-group auth-hover-input">
                <i className="bi bi-building auth-input-icon"></i>
                <input
                  type="text"
                  name="companyName"
                  placeholder="Company / Organization Name"
                  value={signupData.companyName}
                  onChange={(e) => setSignupData({ ...signupData, companyName: e.target.value })}
                  required
                  className="auth-input auth-input-with-icon"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="auth-input-group auth-hover-input">
                  <i className="bi bi-award auth-input-icon"></i>
                  <input
                    type="text"
                    name="designation"
                    placeholder="Designation"
                    value={signupData.designation}
                    onChange={(e) => setSignupData({ ...signupData, designation: e.target.value })}
                    className="auth-input auth-input-with-icon"
                  />
                </div>
                <div className="auth-input-group auth-hover-input">
                  <i className="bi bi-telephone auth-input-icon"></i>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone"
                    value={signupData.phone}
                    onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                    className="auth-input auth-input-with-icon"
                  />
                </div>
              </div>

              <div className="auth-input-group auth-hover-input">
                <i className="bi bi-envelope auth-input-icon"></i>
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  placeholder="Corporate Email"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
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
                  placeholder="Create Password"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  required
                  className="auth-input auth-input-with-icon"
                />
              </div>

              <button type="submit" className="auth-submit-btn auth-submit-btn-red auth-hover-btn" disabled={loading || transitioning}>
                {loading ? (
                  <><span className="auth-spinner"></span> Registering...</>
                ) : (
                  <>Register Corporate Account <i className="bi bi-arrow-right"></i></>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="auth-input-group auth-hover-input">
                <i className="bi bi-envelope auth-input-icon"></i>
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  placeholder="Corporate Email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
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
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="auth-input auth-input-with-icon"
                />
              </div>

              <button type="submit" className="auth-submit-btn auth-submit-btn-red auth-hover-btn" disabled={loading || transitioning}>
                {transitioning ? (
                  <><i className="bi bi-check-circle-fill"></i> Welcome!</>
                ) : loading ? (
                  <><span className="auth-spinner"></span> Signing in...</>
                ) : (
                  <>Corporate Sign In <i className="bi bi-arrow-right"></i></>
                )}
              </button>
            </form>
          )}

          <div className="auth-register-prompt" style={{ marginTop: '1.5rem' }}>
            {isSignup ? (
              <>Already have a corporate account? <a href="#" onClick={(e) => { e.preventDefault(); setIsSignup(false); setError(''); setSuccess(''); }} className="auth-link">Sign in here</a></>
            ) : (
              <>New to Corporate Portal? <a href="#" onClick={(e) => { e.preventDefault(); setIsSignup(true); setError(''); setSuccess(''); }} className="auth-link">Register now</a></>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); navigate('/corporate/choose-plan'); }}
              style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}
            >
              <i className="bi bi-arrow-left" style={{ marginRight: '4px' }}></i>
              Change Plan
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporateLogin;
