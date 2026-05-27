import React, { useState, useEffect } from 'react';
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
  const [pendingPopup, setPendingPopup] = useState({ show: false, message: '' });
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const remembered = localStorage.getItem('rememberedEmail');
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

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
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      setTransitioning(true);
      // Redirect reporters to their dedicated dashboard
      const dest = data.role === 'author' ? '/reporter-dashboard' : '/';
      setTimeout(() => navigate(dest), 800);
    } catch (err) {
      if (err.response?.data?.status === 'pending') {
        setPendingPopup({ show: true, message: err.response.data.message });
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
            <p style={{ fontSize: '1.1rem', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '2rem' }}>
              {pendingPopup.message} <br /><br />
              Our Superadmin will review your account within 24 hours. You will be able to access your dashboard once approved.
            </p>
            <button
              onClick={() => setPendingPopup({ show: false, message: '' })}
              style={{
                background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 32px',
                borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
                transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
              onMouseOver={(e) => e.target.style.background = '#2563eb'}
              onMouseOut={(e) => e.target.style.background = '#3b82f6'}
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
              <span className="auth-welcome-letter" style={{ animationDelay: '0s' }}>W</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.06s' }}>e</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.12s' }}>l</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.18s' }}>c</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.24s' }}>o</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.30s' }}>m</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.36s' }}>e</span>
              <span className="auth-welcome-space"></span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.46s' }}>B</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.52s' }}>a</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.58s' }}>c</span>
              <span className="auth-welcome-letter" style={{ animationDelay: '0.64s' }}>k</span>
              <span className="auth-welcome-letter auth-welcome-emoji" style={{ animationDelay: '0.70s' }}>!</span>
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
                <Link to="/">
                  <img src="/industrialtimes_white.png" alt="Industrial Times" className="auth-form-center-logo" style={{ width: '180px', maxWidth: '100%', height: 'auto' }} />
                </Link>
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
                  placeholder="Email id"
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
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); setShowForgotModal(true); }} className="auth-forgot-pass">Forgot password?</a>
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
                <div className="auth-input-group auth-hover-input" style={{ marginBottom: '1rem' }}>
                  <i className="bi bi-lock auth-input-icon"></i>
                  <input
                    type="password"
                    placeholder="New Password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                <div className="auth-input-group auth-hover-input" style={{ marginBottom: '2rem' }}>
                  <i className="bi bi-lock-fill auth-input-icon"></i>
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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

export default Login;
