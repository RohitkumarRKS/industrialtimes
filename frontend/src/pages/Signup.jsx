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
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAcceptedReporterTerms, setHasAcceptedReporterTerms] = useState(false);
  const [isCheckedRead, setIsCheckedRead] = useState(false);
  const [isCheckedConfirm, setIsCheckedConfirm] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUser, setPaymentUser] = useState(null);
  const [reporterSettings, setReporterSettings] = useState({ fee: 999, gst: 18, benefits: [] });
  const [paying, setPaying] = useState(false);
  const [pendingPopup, setPendingPopup] = useState({ show: false, message: '' });

  // Promo code states
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoDiscountAmount, setPromoDiscountAmount] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setValidatingPromo(true);
    setPromoError('');
    const totalPayable = Math.round(reporterSettings.fee * (1 + reporterSettings.gst / 100));
    try {
      const res = await axios.post(`${API_BASE}/api/promo-codes/validate`, {
        code: promoCodeInput.trim().toUpperCase(),
        platform: 'reporter',
        originalAmount: totalPayable
      });
      if (res.data.valid) {
        setAppliedPromo(res.data);
        setPromoDiscountAmount(res.data.discountAmount);
        setPromoError('');
      } else {
        setPromoError(res.data.error || 'Invalid promo code');
        setAppliedPromo(null);
        setPromoDiscountAmount(0);
      }
    } catch (err) {
      setPromoError(err.response?.data?.error || 'Invalid promo code');
      setAppliedPromo(null);
      setPromoDiscountAmount(0);
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoDiscountAmount(0);
    setPromoCodeInput('');
    setPromoError('');
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Check if scrolled near the bottom (within 20px)
    if (scrollHeight - scrollTop - clientHeight < 20) {
      setHasScrolledToBottom(true);
    }
  };

  const isReporter = formData.role === 'author';

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
        userId: paymentUser.id,
        promoCode: appliedPromo?.code || ''
      });

      const options = {
        key: 'rzp_live_SwnZMgoy1Uy9zu',
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
              razorpay_signature: response.razorpay_signature,
              promoCode: appliedPromo?.code || ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/signup`, formData);

      if (typeof data !== 'object' || data === null) {
        throw new Error('Server returned an invalid response (expected JSON, got HTML). This indicates that the Nginx Reverse Proxy for the backend API (/api) is missing or incorrectly configured on your aaPanel production server.');
      }

      if (isReporter) {
        setFormData({ name: '', email: '', password: '', role: 'author', phone: '', bio: '', expertise: '', portfolio: '' });
        setLoading(false);
        setPaymentUser({
          id: data.id,
          name: data.name,
          email: data.email
        });

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
      } else {
        // Reader - instant login redirect
        setTransitioning(true);
        setTimeout(() => navigate('/login', { state: { message: 'Registration successful! Please login.' } }), 800);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
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
      {/* Terms of Use Modal for Reporter Registration */}
      {showTermsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, color: '#fff', padding: '1rem'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1e293b, #0f172a)',
            padding: '2rem', borderRadius: '24px', maxWidth: '600px', width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)',
            display: 'flex', flexDirection: 'column', maxHeight: '95vh'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
                Author &amp; Reporter Terms of Use
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setShowTermsModal(false);
                  setFormData({ ...formData, role: 'user' }); // Reset role back to reader
                }}
                style={{
                  background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer'
                }}
              >
                &times;
              </button>
            </div>

            <div 
              onScroll={handleScroll}
              style={{
                overflowY: 'auto', maxHeight: '50vh', padding: '1.2rem',
                background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left'
              }}
            >
              <style dangerouslySetInnerHTML={{ __html: `
                .reporter-terms-box p, .reporter-terms-box ul, .reporter-terms-box li, .reporter-terms-box span {
                  font-size: 8pt !important;
                  line-height: 1.4;
                  color: #cbd5e1 !important;
                }
                .reporter-terms-box h2, .reporter-terms-box h3, .reporter-terms-box h4 {
                  font-size: 10pt !important;
                  font-weight: bold;
                  margin-top: 15px;
                  margin-bottom: 8px;
                  color: #f8fafc !important;
                }
              ` }} />
              <div className="reporter-terms-box">
                <h2>Author and Reporter Terms of Use</h2>
                <p><strong>Last Updated: June 2026</strong></p>
                <p>Welcome to Industrial Times. These Author and Reporter Terms of Use govern the submission, publication, and management of content contributed by authors, reporters, journalists, freelancers, guest writers, and contributors on Industrial Times. By submitting content to Industrial Times, you agree to comply with these terms.</p>

                <h2>1. Eligibility</h2>
                <p>Contributors must:</p>
                <ul>
                  <li>Be at least 18 years of age.</li>
                  <li>Provide accurate personal and contact information.</li>
                  <li>Possess the necessary rights and permissions to submit content.</li>
                  <li>Comply with all applicable laws and regulations.</li>
                </ul>

                <h2>2. Original Content Requirement</h2>
                <p>Authors and reporters must ensure that:</p>
                <ul>
                  <li>All submitted content is original and created by them.</li>
                  <li>Content does not infringe upon copyrights, trademarks, or intellectual property rights of any third party.</li>
                  <li>Plagiarism, content scraping, and unauthorized reproduction are strictly prohibited.</li>
                  <li>AI-assisted content, if used, must be reviewed, verified, and edited by the contributor before submission.</li>
                </ul>

                <h2>3. Accuracy and Verification</h2>
                <p>Contributors are responsible for:</p>
                <ul>
                  <li>Verifying facts, statistics, quotes, and sources before submission.</li>
                  <li>Ensuring information is accurate to the best of their knowledge.</li>
                  <li>Promptly notifying Industrial Times if any published information requires correction.</li>
                </ul>
                <p>Industrial Times reserves the right to edit, update, correct, or remove content when necessary.</p>

                <h2>4. Editorial Rights</h2>
                <p>Industrial Times reserves the right to:</p>
                <ul>
                  <li>Edit content for clarity, grammar, formatting, style, SEO, and compliance.</li>
                  <li>Modify headlines, images, excerpts, and metadata.</li>
                  <li>Reject, suspend, or remove any submission without prior notice.</li>
                  <li>Update content to maintain accuracy and relevance.</li>
                </ul>
                <p>Publication is not guaranteed for any submitted content.</p>

                <h2>5. Prohibited Content</h2>
                <p>Contributors must not submit content that:</p>
                <ul>
                  <li>Contains false, misleading, or defamatory information.</li>
                  <li>Promotes hate speech, discrimination, violence, or illegal activities.</li>
                  <li>Violates privacy or confidentiality rights.</li>
                  <li>Contains malware, spam, or malicious links.</li>
                  <li>Includes unauthorized copyrighted material.</li>
                </ul>

                <h2>6. Intellectual Property Rights</h2>
                <p>Authors retain ownership of their original work. By submitting content, contributors grant Industrial Times a non-exclusive, worldwide, royalty-free license to:</p>
                <ul>
                  <li>Publish, distribute, display, and archive the content.</li>
                  <li>Promote the content through websites, newsletters, social media platforms, and digital channels.</li>
                  <li>Edit and republish content when necessary.</li>
                </ul>

                <h2>7. Conflict of Interest</h2>
                <p>Contributors must disclose any financial, professional, or personal interests that may influence the objectivity of their content. Failure to disclose conflicts of interest may result in content removal and termination of contributor privileges.</p>

                <h2>8. Corrections Policy</h2>
                <p>If factual errors are identified:</p>
                <ul>
                  <li>Contributors should immediately notify the editorial team.</li>
                  <li>Industrial Times may issue corrections, updates, clarifications, or retractions where appropriate.</li>
                </ul>

                <h2>9. Contributor Conduct</h2>
                <p>Authors and reporters are expected to:</p>
                <ul>
                  <li>Maintain professional standards.</li>
                  <li>Respect journalistic ethics.</li>
                  <li>Avoid misrepresentation or fabrication of information.</li>
                  <li>Conduct interviews and reporting activities responsibly and lawfully.</li>
                </ul>

                <h2>10. Limitation of Liability</h2>
                <p>Contributors are solely responsible for the content they submit. Industrial Times shall not be liable for any claims, damages, losses, or legal disputes arising from contributor-submitted content.</p>

                <h2>11. Termination</h2>
                <p>Industrial Times reserves the right to suspend or terminate contributor access at any time for violations of these terms or applicable laws.</p>

                <h2>12. Contact Information</h2>
                <p>For contributor inquiries, corrections, or editorial matters, please contact:</p>
                <p>
                  <strong>Industrial Times</strong><br/>
                  Website: https://industrialtimes.in<br/>
                  Email: editorial@industrialtimes.in<br/>
                  Contact Page: https://industrialtimes.in/contact
                </p>

                <h2>13. Acceptance of Terms</h2>
                <p>By submitting content to Industrial Times, contributors acknowledge that they have read, understood, and agreed to these Author and Reporter Terms of Use.</p>
              </div>
            </div>

            {/* Scroll Notice */}
            {!hasScrolledToBottom && (
              <div style={{ fontSize: '0.75rem', color: '#fbbf24', textAlign: 'center', marginTop: '0.8rem' }}>
                <i className="bi bi-arrow-down-circle me-1"></i> Please scroll to the bottom to confirm terms.
              </div>
            )}

            {/* Verification Checkboxes - Displayed only when user has scrolled to the bottom */}
            {hasScrolledToBottom && (
              <div style={{
                display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1rem',
                textAlign: 'left', width: '100%', padding: '10px 15px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.75rem', cursor: 'pointer', color: '#cbd5e1', marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    checked={isCheckedRead}
                    onChange={(e) => setIsCheckedRead(e.target.checked)}
                    style={{ width: '16px', height: '16px', marginTop: '1px', cursor: 'pointer', accentColor: '#10b981' }}
                  />
                  <span>I have read the Author &amp; Reporter Terms of Use.</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.75rem', cursor: 'pointer', color: '#cbd5e1', marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    checked={isCheckedConfirm}
                    onChange={(e) => setIsCheckedConfirm(e.target.checked)}
                    style={{ width: '16px', height: '16px', marginTop: '1px', cursor: 'pointer', accentColor: '#10b981' }}
                  />
                  <span>I agree to confirm and abide by all platform policies.</span>
                </label>
              </div>
            )}

            {/* Action Buttons - Enabled only when scrolled to bottom and checkboxes checked */}
            <div style={{
              display: 'flex', marginTop: '1.2rem', width: '100%',
              opacity: (hasScrolledToBottom && isCheckedRead && isCheckedConfirm) ? 1 : 0.5,
              pointerEvents: (hasScrolledToBottom && isCheckedRead && isCheckedConfirm) ? 'auto' : 'none',
              transition: 'all 0.3s ease'
            }}>
              <button
                type="button"
                onClick={() => {
                  setHasAcceptedReporterTerms(true);
                  setFormData({ ...formData, role: 'author' });
                  setShowTermsModal(false);
                }}
                style={{
                  background: '#10b981', color: '#fff', border: 'none',
                  padding: '12px 24px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)', width: '100%', textAlign: 'center',
                  transition: 'background 0.2s'
                }}
              >
                Confirm &amp; Accept
              </button>
            </div>
          </div>
        </div>
      )}

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
              Our Superadmin will review your account within 24 hours. You will receive an email confirmation once the editorial team approves your profile.
            </p>
            <button
              onClick={() => {
                setPendingPopup({ show: false, message: '' });
                navigate('/login');
              }}
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
                  navigate('/login', { state: { message: 'Registration completed. Please sign in to activate your reporter account.' } });
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

            {/* Promo Code Input Block */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.05)', padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              {appliedPromo ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#10b981', fontSize: '0.85rem' }}>
                  <div>
                    <i className="bi bi-tag-fill me-2"></i>
                    <strong>{appliedPromo.code}</strong> applied
                  </div>
                  <button type="button" className="btn btn-link btn-sm text-danger p-0 ms-2 text-decoration-none fw-bold" onClick={handleRemovePromo}>Remove</button>
                </div>
              ) : (
                <div>
                  <div className="input-group input-group-sm">
                    <input 
                      type="text" 
                      className="form-control bg-dark border-secondary text-white" 
                      placeholder="Have a promo code?" 
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      disabled={validatingPromo}
                      style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <button 
                      className="btn btn-sm fw-bold px-3" 
                      type="button" 
                      onClick={handleApplyPromo}
                      disabled={validatingPromo || !promoCodeInput.trim()}
                      style={{ background: '#10b981', color: '#fff', border: 'none' }}
                    >
                      {validatingPromo ? <span className="spinner-border spinner-border-sm"></span> : 'Apply'}
                    </button>
                  </div>
                  {promoError && <div className="text-danger small mt-1 fw-medium" style={{ fontSize: '0.75rem' }}><i className="bi bi-exclamation-circle me-1"></i>{promoError}</div>}
                </div>
              )}
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
                  {promoDiscountAmount > 0 ? (
                    <>
                      <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '1rem', marginRight: '8px' }}>₹{Math.round(reporterSettings.fee * (1 + reporterSettings.gst / 100))}</span>
                      <span>₹{Math.max(0, Math.round(reporterSettings.fee * (1 + reporterSettings.gst / 100)) - promoDiscountAmount)}</span>
                    </>
                  ) : `₹${Math.round(reporterSettings.fee * (1 + reporterSettings.gst / 100))}`}
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
                {paying ? 'Processing Payment...' : `Pay ₹${Math.max(0, Math.round(reporterSettings.fee * (1 + reporterSettings.gst / 100)) - promoDiscountAmount)} →`}
              </button>
            </div>
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
                  onClick={() => {
                    if (!hasAcceptedReporterTerms) {
                      setShowTermsModal(true);
                      setHasScrolledToBottom(false);
                      setIsCheckedRead(false);
                      setIsCheckedConfirm(false);
                    } else {
                      setFormData({ ...formData, role: 'author' });
                    }
                    setError('');
                    setSuccess('');
                  }}
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
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="off"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
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
