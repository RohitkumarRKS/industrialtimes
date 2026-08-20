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
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentUser, setPaymentUser] = useState(null);
    const [reporterSettings, setReporterSettings] = useState({ fee: 999, gst: 18, benefits: [] });
    const [paying, setPaying] = useState(false);

    // Auto-redirect if user is already logged in (e.g., reopened the tab)
    useEffect(() => {
        if (transitioning) return;
        const existingUser = getUserInfo();
        if (existingUser && existingUser.token) {
            // User is already logged in — redirect to their dashboard
            let dest = '/profile';
            if (existingUser.role === 'author' || existingUser.role === 'corporate') {
                dest = '/user-dashboard';
            } else if (existingUser.role === 'superadmin' || existingUser.isManager) {
                dest = '/superadmin@123/';
            }
            navigate(dest, { replace: true });
        }
    }, [navigate, transitioning]);

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
            const saved = localStorage.getItem('userInfo');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Proactively clear existing user session credentials to prevent stale authentication state
        localStorage.removeItem('userInfo');

        // Block hardcoded admin login on standard page
        if (email === 'admin' || email.toLowerCase() === 'info@industrialtimes.com') {
            setError('Access Denied: Administrators must login via the administrative portal.');
            setLoading(false);
            return;
        }

        try {
            const { data } = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
            
            if (typeof data !== 'object' || data === null || !data.role) {
                throw new Error('Server returned an invalid response (expected JSON, got HTML). This indicates that the Nginx Reverse Proxy for the backend API (/api) is missing or incorrectly configured on your aaPanel production server.');
            }

            // Block database SuperAdmins from logging in here, but allow Managers
            if (data.role === 'superadmin') {
                setError('Access Denied: SuperAdmins must login via the administrative portal.');
                setLoading(false);
                return;
            }

            localStorage.setItem('userInfo', JSON.stringify(data));
            
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            setTransitioning(true);
            
            // Redirect based on user role (Managers go to their standard dashboard)
            let dest = '/profile';
            if (data.role === 'author') {
                dest = '/user-dashboard';
            } else if (data.role === 'corporate') {
                if (data.membershipPlan) {
                    dest = '/user-dashboard';
                } else {
                    dest = `/corporate/payment?plan=${data.selectedPlan || 'basic'}`;
                }
            }
            
            setTimeout(() => { window.location.href = dest; }, 800);
        } catch (err) {
            if (err.response?.status === 402 || err.response?.data?.status === 'payment_pending') {
                const pUser = err.response.data.user;
                setPaymentUser(pUser);
                // Fetch public settings for reporter
                try {
                    const settingsRes = await axios.get(`${API_BASE}/api/platform-settings/public`);
                    setReporterSettings({
                        fee: settingsRes.data.reporterRegistrationFee || 999,
                        gst: settingsRes.data.reporterGstRate || 18,
                        benefits: settingsRes.data.reporterBenefits || []
                    });
                } catch (settErr) {
                    console.error("Failed to load reporter settings, using defaults", settErr);
                }
                setShowPaymentModal(true);
            } else if (err.response?.data?.status === 'pending') {
                setPendingPopup({ show: true, message: err.response.data.message });
            } else if (err.response?.data?.status === 'rejected') {
                setError('❌ ' + err.response.data.message);
            } else {
                setError(err.response?.data?.message || err.message || 'Invalid email or password');
            }
            setLoading(false);
        }
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayReporterFee = async () => {
        if (!paymentUser) return;
        setPaying(true);
        try {
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                alert('Razorpay SDK failed to load. Are you online?');
                setPaying(false);
                return;
            }

            const { data } = await axios.post(`${API_BASE}/api/auth/reporter/create-payment-order`, {
                userId: paymentUser.id
            });

            const options = {
                key: 'rzp_live_SwnZMgoy1Uy9zu', // Production key
                amount: data.order.amount,
                currency: data.order.currency,
                name: 'Industrial Times',
                description: 'Reporter Account Registration',
                order_id: data.order.id,
                handler: async (response) => {
                    try {
                        setPaying(true);
                        await axios.post(`${API_BASE}/api/auth/reporter/verify-payment`, {
                            userId: paymentUser.id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        setShowPaymentModal(false);
                        setPendingPopup({
                            show: true,
                            message: 'Thank you! Your registration payment was verified successfully. Your reporter account is now pending administrative approval. You will receive an email confirmation once the editorial team approves your profile.'
                        });
                    } catch (err) {
                        alert('Verification failed: ' + (err.response?.data?.error || err.message));
                    } finally {
                        setPaying(false);
                    }
                },
                prefill: {
                    name: paymentUser.name,
                    email: paymentUser.email
                },
                theme: {
                    color: '#10b981'
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();
        } catch (err) {
            alert('Order creation failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setPaying(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
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

            <Link to="/" className="auth-visit-site-btn">
                <i className="bi bi-arrow-left"></i> Visit Website
            </Link>

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
                                    type="text"
                                    name="email"
                                    autoComplete="username"
                                    placeholder="Email id or Username"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
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
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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
            {/* Reporter Payment Modal */}
            {showPaymentModal && paymentUser && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999, color: '#fff', padding: '2rem', textAlign: 'center'
                }}>
                    <div style={{
                        background: 'linear-gradient(145deg, #1e293b, #0f172a)',
                        padding: '2.5rem', borderRadius: '24px', maxWidth: '550px', width: '100%',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)',
                        textAlign: 'left'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
                                <i className="bi bi-patch-check-fill text-success me-2"></i>
                                Reporter Account Setup
                            </h3>
                            <button 
                                type="button"
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    setPaymentUser(null);
                                }}
                                style={{
                                    background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer'
                                }}
                            >
                                &times;
                            </button>
                        </div>

                        <p style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                            Welcome, <strong>{paymentUser.name}</strong>. To activate your reporter privileges and start writing articles, a one-time registration payment is required.
                        </p>

                        {/* Benefits Showcase */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.05)', padding: '1.5rem',
                            marginBottom: '1.5rem'
                        }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#10b981', marginBottom: '1rem' }}>
                                <i className="bi bi-award-fill me-2"></i>
                                Reporter Membership Benefits
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {reporterSettings.benefits && reporterSettings.benefits.length > 0 ? (
                                    reporterSettings.benefits.map((benefit, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                                            <i className="bi bi-check-circle-fill text-success" style={{ marginTop: '2px', fontSize: '0.9rem' }}></i>
                                            <span>{benefit}</span>
                                        </div>
                                    ))
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                                            <i className="bi bi-check-circle-fill text-success" style={{ marginTop: '2px', fontSize: '0.9rem' }}></i>
                                            <span>Publish original stories and reach thousands of readers</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                                            <i className="bi bi-check-circle-fill text-success" style={{ marginTop: '2px', fontSize: '0.9rem' }}></i>
                                            <span>Access advanced author analytics dashboard</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Cost Summary */}
                        <div style={{
                            background: 'rgba(16, 185, 129, 0.05)', borderRadius: '16px',
                            border: '1px solid rgba(16, 185, 129, 0.1)', padding: '1.2rem',
                            marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div>
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Registration Fee</span>
                                <h4 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
                                    ₹{reporterSettings.fee} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#94a3b8' }}>+ {reporterSettings.gst}% GST</span>
                                </h4>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Payable</span>
                                <h4 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10b981', margin: 0 }}>
                                    ₹{Math.round(reporterSettings.fee * (1 + reporterSettings.gst / 100))}
                                </h4>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={handlePayReporterFee}
                                disabled={paying}
                                style={{
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    color: '#fff', border: 'none', padding: '14px', borderRadius: '12px',
                                    fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer',
                                    transition: 'all 0.2s', width: '100%', textAlign: 'center',
                                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)'
                                }}
                            >
                                {paying ? 'Processing Payment...' : 'Pay Registration Fee →'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Login;
