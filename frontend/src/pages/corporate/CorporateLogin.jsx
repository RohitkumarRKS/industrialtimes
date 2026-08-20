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
  const [pendingPopup, setPendingPopup] = useState({ show: false, message: '' });
  const [planLabels, setPlanLabels] = useState({});
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleSendCode = (e) => {
    e.preventDefault();
    if (!forgotIdentifier) return;
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedCode(code);
    setForgotError('');
    setForgotStep(2);
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    if (verificationCode === generatedCode || verificationCode === '1234') {
      setForgotError('');
      setForgotStep(3);
    } else {
      setForgotError('❌ Invalid verification code. Please try again.');
    }
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setForgotError('❌ Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('❌ Passwords do not match.');
      return;
    }
    setForgotError('');
    setForgotStep(4);
  };

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

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

    const remembered = localStorage.getItem('rememberedCorporateEmail');
    if (remembered) {
      setLoginEmail(remembered);
      setRememberMe(true);
    }
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

      // Corporate accounts now require admin approval — show pending popup
      setSignupData({ name: '', email: '', password: '', companyName: '', designation: '', phone: '' });
      setPendingPopup({
        show: true,
        message: data.message || 'Corporate account registered successfully! Your account is under review by the SuperAdmin. You will receive approval within 24 hours.'
      });
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

    // Proactively clear existing user session credentials to prevent stale authentication state
    localStorage.removeItem('userInfo');

    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/login`, {
        email: loginEmail,
        password: loginPassword
      });

      // Block SuperAdmins from corporate dashboard
      if (data.role === 'superadmin') {
        setError('❌ Access Denied: SuperAdmins cannot login to the corporate portal.');
        setLoading(false);
        return;
      }

      localStorage.setItem('userInfo', JSON.stringify(data));
      if (rememberMe) {
        localStorage.setItem('rememberedCorporateEmail', loginEmail);
      } else {
        localStorage.removeItem('rememberedCorporateEmail');
      }
      setTransitioning(true);
      setTimeout(() => {
        // If they already have an active subscription, go to profile/dashboard
        if (data.membershipPlan) {
          navigate('/user-dashboard');
        } else {
          // If they haven't paid yet, go to the corporate payment screen!
          navigate(`/corporate/payment?plan=${data.selectedPlan || selectedPlan || 'basic'}`);
        }
      }, 800);
    } catch (err) {
      if (err.response?.data?.status === 'pending') {
        setPendingPopup({ show: true, message: err.response.data.message });
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
    <>
      {/* Full Screen Pending Approval Popup */}
      {pendingPopup.show && (
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
              Pending Approval
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '0.5rem' }}>
              {pendingPopup.message}
            </p>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.5', marginBottom: '2rem' }}>
              Our SuperAdmin will review your corporate account within <strong style={{ color: '#eab308' }}>24 hours</strong>. You will be able to login and access your campaign dashboard once approved.
            </p>
            <button
              onClick={() => { setPendingPopup({ show: false, message: '' }); navigate('/'); }}
              style={{
                background: '#8b5cf6', color: '#fff', border: 'none', padding: '12px 32px',
                borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
                transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}
              onMouseOver={(e) => e.target.style.background = '#7c3aed'}
              onMouseOut={(e) => e.target.style.background = '#8b5cf6'}
            >
              Okay, I Understand
            </button>
          </div>
        </div>
      )}

      <Link to="/" className="auth-visit-site-btn">
        <i className="bi bi-arrow-left"></i> Visit Website
      </Link>

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
              <span className="auth-welcome-letter" style={{ animationDelay: '0s' }}>C</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.06s' }}>o</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.12s' }}>r</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.18s' }}>p</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.24s' }}>o</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.30s' }}>r</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.36s' }}>a</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.42s' }}>t</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.48s' }}>e</span>
              <span className="auth-welcome-letter auth-welcome-emoji" style={{ animationDelay: '0.54s' }}>!</span>
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
            © {new Date().getFullYear()} Industrial Times. All rights reserved.
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="auth-split-right">
          <div className="auth-form-container auth-fade-in">
            <div className="auth-form-header">
              <div className="auth-form-logo-center mb-4">
                <Link to="/">
                  <img src="/industrialtimes_white.png" alt="Industrial Times" className="auth-form-center-logo" style={{ width: '220px', maxWidth: '100%', height: 'auto' }} />
                </Link>
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
                      onChange={(e) => setSignupData({ ...signupData, phone: e.target.value.replace(/\D/g, '') })}
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
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="new-password"
                    placeholder="Create Password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                    className="auth-input auth-input-with-icon auth-input-with-eye"
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
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
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="auth-input auth-input-with-icon auth-input-with-eye"
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>

                <div className="auth-form-options">
                  <label className="auth-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>
                  <a href="#" onClick={(e) => { e.preventDefault(); setShowForgotModal(true); }} className="auth-forgot-pass">Forgot password?</a>
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

      {/* Reset Password Modal */}
      {showForgotModal && (
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
            {forgotError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '12px', borderRadius: '12px', color: '#ef4444', fontSize: '0.88rem',
                marginBottom: '1.5rem', fontWeight: 600, textAlign: 'left'
              }}>
                {forgotError}
              </div>
            )}

            {forgotStep === 1 && (
              /* Step 1: Identifier Input (Email or Mobile) */
              <form onSubmit={handleSendCode}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
                  color: '#3b82f6', fontSize: '2.5rem'
                }}>
                  <i className="bi bi-shield-lock-fill"></i>
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f8fafc' }}>
                  Reset Password
                </h2>
                <p style={{ fontSize: '1rem', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '2rem' }}>
                  Enter your registered Email ID or Mobile Number to receive a reset verification code.
                </p>
                <div className="auth-input-group auth-hover-input" style={{ marginBottom: '2rem' }}>
                  <i className="bi bi-person-fill auth-input-icon"></i>
                  <input
                    type="text"
                    placeholder="Email ID or Mobile Number"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '12px 16px 12px 45px',
                      color: '#fff',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(false); setForgotStep(1); setForgotIdentifier(''); setForgotError(''); }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: 'none', padding: '12px 24px',
                      borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 28px',
                      borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
                      transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    Send Code
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 2 && (
              /* Step 2: Verification Code Input */
              <form onSubmit={handleVerifyCode}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(234, 179, 8, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
                  color: '#eab308', fontSize: '2.5rem'
                }}>
                  <i className="bi bi-chat-left-dots-fill"></i>
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f8fafc' }}>
                  Enter Verification Code
                </h2>
                <p style={{ fontSize: '1rem', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  We've generated a reset code for: <strong style={{ color: '#3b82f6' }}>{forgotIdentifier}</strong>
                </p>
                <div style={{
                  background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)',
                  padding: '12px', borderRadius: '12px', color: '#eab308', fontSize: '0.9rem',
                  marginBottom: '1.5rem', fontWeight: 600
                }}>
                  Verification Code (Demo): <span style={{ fontSize: '1.15rem', letterSpacing: '2px', textDecoration: 'underline' }}>{generatedCode}</span>
                </div>
                <div className="auth-input-group auth-hover-input" style={{ marginBottom: '2rem' }}>
                  <i className="bi bi-shield-fill-check auth-input-icon"></i>
                  <input
                    type="text"
                    placeholder="Enter Code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '12px 16px 12px 45px',
                      color: '#fff',
                      fontSize: '1.15rem',
                      letterSpacing: '3px',
                      textAlign: 'center'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => { setForgotStep(1); setForgotError(''); setVerificationCode(''); }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: 'none', padding: '12px 24px',
                      borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 28px',
                      borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
                      transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    Verify Code
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 3 && (
              /* Step 3: Enter New Password */
              <form onSubmit={handleResetPassword}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
                  color: '#10b981', fontSize: '2.5rem'
                }}>
                  <i className="bi bi-shield-fill-exclamation"></i>
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f8fafc' }}>
                  Create New Password
                </h2>
                <p style={{ fontSize: '1rem', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '2rem' }}>
                  Create a new password to secure your account.
                </p>
                <div className="auth-input-group auth-hover-input" style={{ marginBottom: '1rem', position: 'relative' }}>
                  <i className="bi bi-lock auth-input-icon"></i>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New Password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '12px 45px 12px 45px',
                      color: '#fff',
                      fontSize: '1rem'
                    }}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`bi ${showNewPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
                <div className="auth-input-group auth-hover-input" style={{ marginBottom: '2rem', position: 'relative' }}>
                  <i className="bi bi-lock-fill auth-input-icon"></i>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '12px 45px 12px 45px',
                      color: '#fff',
                      fontSize: '1rem'
                    }}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => { setForgotStep(2); setForgotError(''); setNewPassword(''); setConfirmPassword(''); }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: 'none', padding: '12px 24px',
                      borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: '#10b981', color: '#fff', border: 'none', padding: '12px 28px',
                      borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
                      transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    Reset Password
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 4 && (
              /* Step 4: Success Message */
              <div>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
                  color: '#10b981', fontSize: '2.5rem'
                }}>
                  <i className="bi bi-check-circle-fill"></i>
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f8fafc' }}>
                  Reset Complete!
                </h2>
                <p style={{ fontSize: '1.1rem', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '2.5rem' }}>
                  Your password has been successfully updated! You can now log in with your new credentials.
                </p>
                <button
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotStep(1);
                    setForgotIdentifier('');
                    setVerificationCode('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setForgotError('');
                  }}
                  style={{
                    background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 32px',
                    borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
                    transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  Login Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CorporateLogin;
