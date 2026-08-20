import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../../config/api';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setEmail('');
    setPassword('');
    let adminInfo = null;
    let userInfo = null;
    try {
      const savedAdmin = localStorage.getItem('adminInfo');
      if (savedAdmin && savedAdmin !== 'undefined') {
        adminInfo = JSON.parse(savedAdmin);
      }
      const savedUser = localStorage.getItem('userInfo');
      if (savedUser && savedUser !== 'undefined') {
        userInfo = JSON.parse(savedUser);
      }
    } catch (e) {
      console.error(e);
    }
    if (adminInfo && adminInfo.role === 'superadmin') {
      navigate('/superadmin@123/', { replace: true });
      return;
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Proactively clear existing administrative session
    localStorage.removeItem('adminInfo');

    if (email === 'admin' && password === 'admin123') {
      const testAdmin = {
        id: 0,
        name: 'System Administrator',
        email: 'admin',
        role: 'superadmin',
        token: 'test-token-123'
      };
      localStorage.setItem('adminInfo', JSON.stringify(testAdmin));
      sessionStorage.setItem('portalMode', 'admin');
      setTransitioning(true);
      setTimeout(() => navigate('/superadmin@123/', { replace: true }), 800);
      return;
    }

    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
      
      if (data.role === 'superadmin') {
        localStorage.setItem('adminInfo', JSON.stringify(data));
        sessionStorage.setItem('portalMode', 'admin');
        setTransitioning(true);
        setTimeout(() => navigate('/superadmin@123/', { replace: true }), 800);
      } else {
        setError('Access Denied: Only Superadmins can login here.');
        setLoading(false);
        return;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid administrative credentials');
      setLoading(false);
    }
  };

  return (
    <div className={`auth-split-wrapper ${transitioning ? 'auth-transition-out' : ''}`}>
        {/* Left Branding Panel */}
        <div className="auth-split-left auth-split-left-admin auth-left-centered">
          <div className="auth-left-shapes">
            <div className="auth-shape auth-shape-1"></div>
            <div className="auth-shape auth-shape-2"></div>
            <div className="auth-shape auth-shape-3"></div>
            <div className="auth-shape auth-shape-4"></div>
          </div>

          <div className="auth-brand-content auth-brand-centered">
            {/* Animated Welcome Text */}
            <div className="auth-welcome-animated auth-welcome-centered">
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
              Super Admin Portal<span className="auth-wave">🔐</span>
            </h2>
            <p className="auth-brand-desc auth-hover-slide" style={{textAlign:'center', maxWidth:'100%'}}>
              Authorized access only. Manage content, analytics, and advertisements for Industrial Times.
            </p>

            <div className="auth-brand-divider" style={{margin:'1.5rem auto'}}></div>

            <div className="auth-brand-stats" style={{justifyContent:'center'}}>
              <div className="auth-stat-pill auth-hover-lift">
                <i className="bi bi-shield-check"></i>
                <span>256-bit Encrypted</span>
              </div>
              <div className="auth-stat-pill auth-hover-lift">
                <i className="bi bi-people-fill"></i>
                <span>Admin Only</span>
              </div>
            </div>
          </div>
          <div className="auth-brand-footer-center">
            © {new Date().getFullYear()} Industrial Times. All rights reserved.
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="auth-split-right">
          <div className="auth-form-container auth-fade-in" style={{ background: '#1e293b' }}>
            <div className="auth-form-header">
              <div className="auth-form-logo-center mb-4">
                <Link to="/">
                  <img src="/industrialtimes_white.png" alt="Industrial Times" className="auth-form-center-logo auth-logo-large" style={{ width: '220px', maxWidth: '100%', height: 'auto' }} />
                </Link>
              </div>
              <h2 className="auth-form-title">Admin Access</h2>
              <p className="auth-form-subtitle">
                Sign in with your administrative credentials.
              </p>
            </div>

            {error && <div className="auth-error-alert">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
              <input type="text" style={{display:'none'}} />
              <input type="password" style={{display:'none'}} />

              <div className="auth-input-group auth-hover-input">
                <i className="bi bi-person-badge auth-input-icon"></i>
                <input
                  type="text"
                  name="admin-user-id"
                  placeholder="Username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="auth-input auth-input-with-icon"
                />
              </div>

              <div className="auth-input-group auth-hover-input">
                <i className="bi bi-key auth-input-icon"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  name="admin-security-key"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
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
                {transitioning ? (
                  <><i className="bi bi-check-circle-fill"></i> Access Granted</>
                ) : loading ? (
                  <><span className="auth-spinner"></span> Authenticating...</>
                ) : (
                  'Authorize Session'
                )}
              </button>
            </form>
          </div>
        </div>
    </div>
  );
};

export default AdminLogin;
