import React, { useState, useEffect } from 'react';
import { Container, Spinner, Alert, Form } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import API_BASE from '../config/api';

const WebinarRegisterPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [webinar, setWebinar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', designation: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [gstRate, setGstRate] = useState(18);

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
    const originalTotal = Math.round(webinar.entryFee * (1 + gstRate / 100));
    try {
      const res = await axios.post(`${API_BASE}/api/promo-codes/validate`, {
        code: promoCodeInput.trim().toUpperCase(),
        platform: 'webinar',
        originalAmount: originalTotal
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

  useEffect(() => {
    const fetchWebinar = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/webinars/${id}`);
        setWebinar(data);
      } catch (err) {
        console.error('Error fetching webinar details:', err);
        setError('Webinar details could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    const fetchGst = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/platform-settings/public`);
        if (data && data.webinarGstRate !== undefined) {
          setGstRate(data.webinarGstRate);
        }
      } catch (err) {
        console.error('Failed to load GST rate:', err);
      }
    };
    fetchWebinar();
    fetchGst();
  }, [id]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      if (!webinar.isPaymentEnabled) {
        // Free registration route
        await axios.post(`${API_BASE}/api/webinars/${id}/register`, form);
        setSuccess(true);
      } else {
        // Paid registration - Razorpay flow
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
        }

        // 1. Create Razorpay order on backend
        const { data: order } = await axios.post(`${API_BASE}/api/webinars/${id}/create-razorpay-order`, {
          promoCode: appliedPromo?.code || ''
        });

        if (order.amount === 0) {
          await axios.post(`${API_BASE}/api/webinars/${id}/verify-payment`, {
            razorpay_order_id: order.id,
            razorpay_payment_id: 'FREE_ENTRY_' + Date.now(),
            razorpay_signature: 'dummy_signature',
            promoCode: appliedPromo?.code || '',
            ...form
          });
          setSuccess(true);
          setSubmitting(false);
          return;
        }
 
        // 2. Open Razorpay payment gateway
        const options = {
          key: 'rzp_live_SwnZMgoy1Uy9zu',
          amount: order.amount,
          currency: order.currency,
          name: 'Industrial Times',
          description: `Registration: ${webinar.title}`,
          order_id: order.id,
          prefill: {
            name: form.name,
            email: form.email,
            contact: form.phone
          },
          theme: {
            color: '#da251d'
          },
          handler: async (response) => {
            setSubmitting(true);
            try {
              // 3. Send payment details to backend for verification and DB registration
              await axios.post(`${API_BASE}/api/webinars/${id}/verify-payment`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                promoCode: appliedPromo?.code || '',
                ...form
              });
              setSuccess(true);
            } catch (verifErr) {
              setSubmitError(verifErr.response?.data?.error || 'Payment verification failed. Please contact support.');
            } finally {
              setSubmitting(false);
            }
          },
          modal: {
            ondismiss: () => {
              setSubmitting(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      console.error('Registration/Payment failed:', err);
      setSubmitError(err.response?.data?.error || err.message || 'An unexpected error occurred.');
      setSubmitting(false);
    }
  };

  const parseVideoUrl = (url) => {
    if (!url) return { type: null, url: '' };
    const trimmed = url.trim();
    
    // YouTube regex pattern
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = trimmed.match(ytRegex);
    if (ytMatch && ytMatch[1]) {
      return {
        type: 'youtube',
        url: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`
      };
    }
    
    // Vimeo regex pattern
    const vimeoRegex = /(?:vimeo\.com\/)(?:channels\/[^\/]+\/|groups\/[^\/]+\/|album\/[^\/]+\/video\/|video\/|showcase\/[^\/]+\/video\/)?([0-9]+)/;
    const vimeoMatch = trimmed.match(vimeoRegex);
    if (vimeoMatch && vimeoMatch[1]) {
      return {
        type: 'vimeo',
        url: `https://player.vimeo.com/video/${vimeoMatch[1]}`
      };
    }
    
    // Direct/Uploaded Video
    const fullUrl = trimmed.startsWith('http') ? trimmed : `${API_BASE}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
    return {
      type: 'direct',
      url: fullUrl
    };
  };

  const formatWebinarDateRange = (startStr, endStr) => {
    if (!startStr) return '';
    const start = new Date(startStr);
    const optionsDate = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    const optionsTime = { hour: '2-digit', minute: '2-digit' };
    
    if (!endStr) {
      return `${start.toLocaleDateString(undefined, optionsDate)} at ${start.toLocaleTimeString(undefined, optionsTime)}`;
    }
    
    const end = new Date(endStr);
    if (start.toDateString() === end.toDateString()) {
      return `${start.toLocaleDateString(undefined, optionsDate)} (${start.toLocaleTimeString(undefined, optionsTime)} - ${end.toLocaleTimeString(undefined, optionsTime)})`;
    } else {
      return `${start.toLocaleDateString(undefined, optionsDate)} ${start.toLocaleTimeString(undefined, optionsTime)} - ${end.toLocaleDateString(undefined, optionsDate)} ${end.toLocaleTimeString(undefined, optionsTime)}`;
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
        <Spinner animation="border" variant="danger" />
        <p className="mt-3" style={{ color: '#cbd5e1' }}>Securing billing terminal...</p>
      </div>
    );
  }

  if (error || !webinar) {
    return (
      <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ffffff', padding: '20px' }}>
        <Container className="text-center" style={{ maxWidth: '600px' }}>
          <Alert variant="danger">{error || 'Event details not found.'}</Alert>
          <Link to="/webinars" className="btn btn-danger rounded-pill px-4 py-2 mt-3" style={{ backgroundColor: '#da251d', border: 'none' }}>Back to Webinars</Link>
        </Container>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Webinar Registration: {webinar.title} | Industrial Times</title>
      </Helmet>

      <div className="webinar-payment-page">
        {/* Decorative accent */}
        <div className="pay-bg-accent"></div>

        <div className="payment-card-container">
          
          {/* Left Column: Registration Form */}
          <div className="invoice-section">
            <div className="invoice-logo">
              <img src="/industrialtimes_white.png" alt="Industrial Times" style={{ height: '36px' }} />
              <span className="billing-badge">SECURE TERMINAL</span>
            </div>

            {success ? (
              <div className="text-center py-5">
                <div className="mb-4">
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4.5rem' }}></i>
                </div>
                <h2 className="invoice-title text-success">Registration Confirmed!</h2>
                <p className="invoice-desc mt-3" style={{ fontSize: '0.98rem' }}>
                  {webinar.isPaymentEnabled ? (
                    <>
                      We have successfully verified your payment of <strong>₹{Math.round(webinar.entryFee * (1 + gstRate / 100))}</strong> (Base: ₹{parseFloat(webinar.entryFee || 99).toFixed(2)} + GST: ₹{(webinar.entryFee * (gstRate / 100)).toFixed(2)}). A confirmation email has been dispatched. We will share the joining instructions before the session starts.
                    </>
                  ) : (
                    <>
                      Your registration has been successfully received. We will email you the webinar access credentials shortly before the start.
                    </>
                  )}
                </p>

                {webinar.videoUrl && (() => {
                  const parsed = parseVideoUrl(webinar.videoUrl);
                  return (
                    <div className="mt-4 mb-4 text-start mx-auto" style={{ maxWidth: '640px' }}>
                      <h5 className="fw-bold mb-3 text-white">
                        <i className="bi bi-play-circle-fill text-danger me-2"></i>
                        Webinar Video / Session Recording
                      </h5>
                      {parsed.type === 'direct' ? (
                        <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <video
                            src={parsed.url}
                            controls
                            className="w-100"
                            style={{ maxHeight: '360px', objectFit: 'cover' }}
                          />
                        </div>
                      ) : (parsed.type === 'youtube' || parsed.type === 'vimeo') && parsed.url ? (
                        <div className="ratio ratio-16x9" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <iframe
                            src={parsed.url}
                            title={webinar.title}
                            allowFullScreen
                            style={{ border: 'none', width: '100%', height: '100%' }}
                          ></iframe>
                        </div>
                      ) : null}
                    </div>
                  );
                })()}

                <div className="mt-5">
                  <Link to="/webinars" className="pay-now-btn text-decoration-none" style={{ display: 'inline-flex', width: 'auto', padding: '12px 36px' }}>
                    Browse More Webinars
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <h2 className="invoice-title">Webinar Registration</h2>
                <p className="invoice-desc">
                  Please complete the form below to book your seat. A secure payment screen will follow for paid events.
                </p>

                <div className="plan-summary-box">
                  <div className="d-flex align-items-center gap-3">
                    <div className="plan-avatar-icon">
                      <i className="bi bi-broadcast"></i>
                    </div>
                    <div>
                      <h4 className="plan-title-name">{webinar.title}</h4>
                      <p className="plan-title-sub">
                        <i className="bi bi-person-badge me-1"></i> Speaker: {webinar.speaker || 'Presenter'}
                      </p>
                      <p className="plan-title-sub mt-1">
                        <i className="bi bi-calendar3 me-1"></i> Date: {formatWebinarDateRange(webinar.dateTime, webinar.dateTimeEnd)}
                      </p>
                    </div>
                  </div>
                </div>

                <Form onSubmit={handleSubmit} className="pe-md-3">
                  {submitError && <Alert variant="danger" className="mb-4">{submitError}</Alert>}

                  <div className="mb-3">
                    <Form.Label className="fw-bold small">Full Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleInputChange}
                      required
                      placeholder=""
                      className="form-control-light py-2"
                    />
                  </div>

                  <div className="mb-3">
                    <Form.Label className="fw-bold small">Email Address <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleInputChange}
                      required
                      placeholder=""
                      className="form-control-light py-2"
                    />
                  </div>

                  <div className="mb-3">
                    <Form.Label className="fw-bold small">Phone Number <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleInputChange}
                      required
                      placeholder=""
                      className="form-control-light py-2"
                    />
                  </div>

                  <div className="mb-3">
                    <Form.Label className="fw-bold small">Company / Institution</Form.Label>
                    <Form.Control
                      type="text"
                      name="company"
                      value={form.company}
                      onChange={handleInputChange}
                      placeholder=""
                      className="form-control-light py-2"
                    />
                  </div>

                  <div className="mb-3">
                    <Form.Label className="fw-bold small">Designation / Profession</Form.Label>
                    <Form.Control
                      type="text"
                      name="designation"
                      value={form.designation}
                      onChange={handleInputChange}
                      placeholder=""
                      className="form-control-light py-2"
                    />
                  </div>

                  {/* Submit Button for Mobile view or primary submit */}
                  <div className="d-block d-md-none mt-4">
                    <button 
                      type="submit" 
                      disabled={submitting} 
                      className="pay-now-btn"
                    >
                      {submitting ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" /> Processing...
                        </>
                      ) : (
                        webinar.isPaymentEnabled ? `Proceed to Pay ₹${Math.max(0, Math.round(webinar.entryFee * (1 + gstRate / 100)) - promoDiscountAmount)}` : 'Confirm Free Registration'
                      )}
                    </button>
                  </div>
                </Form>
              </>
            )}
          </div>

          {/* Right Column: Checkout Summary (Prefills in real-time) */}
          <div className="checkout-summary-section">
            <div className="checkout-header-badge">ORDER SUMMARY</div>

            <div className="billing-details-table">
              <div className="bill-row">
                <span className="bill-label">Attendee Name</span>
                <span className="bill-value">{form.name || <span className="text-muted italic small" style={{ fontStyle: 'italic' }}>—</span>}</span>
              </div>
              <div className="bill-row">
                <span className="bill-label">Contact Email</span>
                <span className="bill-value">{form.email || <span className="text-muted italic small" style={{ fontStyle: 'italic' }}>—</span>}</span>
              </div>
              <div className="bill-row animate-row">
                <span className="bill-label">Event Type</span>
                <span className="bill-value badge bg-danger py-1 px-2 text-uppercase" style={{ fontSize: '0.7rem' }}>
                  {webinar.isPaymentEnabled ? 'Paid Webinar' : 'Free Entry'}
                </span>
              </div>

              {webinar.isPaymentEnabled && (
                <>
                  <div className="bill-row">
                    <span className="bill-label">Base Registration Fee</span>
                    <span className="bill-value">₹{parseFloat(webinar.entryFee || 99).toFixed(2)}</span>
                  </div>
                  <div className="bill-row">
                    <span className="bill-label">CGST + SGST ({gstRate}%)</span>
                    <span className="bill-value">₹{(webinar.entryFee * (gstRate / 100)).toFixed(2)}</span>
                  </div>

                  {/* Promo Code Input Block */}
                  <div className="my-3 p-3 rounded-4" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    {appliedPromo ? (
                      <div className="d-flex align-items-center justify-content-between text-success small">
                        <div>
                          <i className="bi bi-tag-fill me-2"></i>
                          <strong style={{ letterSpacing: '0.5px' }}>{appliedPromo.code}</strong> applied
                        </div>
                        <button type="button" className="btn btn-link btn-sm text-danger p-0 ms-2 text-decoration-none fw-bold" onClick={handleRemovePromo}>Remove</button>
                      </div>
                    ) : (
                      <div>
                        <div className="d-flex gap-2">
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Enter Promo Code" 
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value)}
                            disabled={validatingPromo}
                            style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                          <button 
                            className="btn btn-danger px-3 fw-bold" 
                            type="button" 
                            onClick={handleApplyPromo}
                            disabled={validatingPromo || !promoCodeInput.trim()}
                          >
                            {validatingPromo ? <span className="spinner-border spinner-border-sm"></span> : 'Apply'}
                          </button>
                        </div>
                        {promoError && <div className="text-danger small mt-2 fw-medium"><i className="bi bi-exclamation-circle me-1"></i>{promoError}</div>}
                      </div>
                    )}
                  </div>

                  {promoDiscountAmount > 0 && (
                    <div className="bill-row text-success small">
                      <span>Promo Discount Applied</span>
                      <span>-₹{promoDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
              
              <div className="bill-divider"></div>
 
              <div className="bill-row total-row">
                <span className="total-label">Total Fee (GST Included)</span>
                <span className="total-price-amount">
                  {webinar.isPaymentEnabled ? (
                    promoDiscountAmount > 0 ? (
                      <>
                        <span className="text-muted text-decoration-line-through me-2" style={{ fontSize: '0.9rem' }}>₹{Math.round(webinar.entryFee * (1 + gstRate / 100))}</span>
                        <span>₹{Math.max(0, Math.round(webinar.entryFee * (1 + gstRate / 100)) - promoDiscountAmount)}</span>
                      </>
                    ) : `₹${Math.round(webinar.entryFee * (1 + gstRate / 100))}`
                  ) : '0'}
                </span>
              </div>
            </div>

            {!success && (
              <div className="checkout-action-box">
                {/* Submit trigger for desktop */}
                <button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !form.name || !form.email || !form.phone}
                  className="pay-now-btn shadow-lg"
                >
                  <i className="bi bi-shield-lock-fill me-2"></i>
                  {submitting ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    webinar.isPaymentEnabled ? `Pay & Register` : 'Register Now'
                  )}
                </button>

                <Link to="/webinars" className="cancel-billing-btn">
                  <i className="bi bi-arrow-left me-1"></i> Cancel & Return
                </Link>
              </div>
            )}

            <div className="checkout-footer-notes">
              <p className="mb-0">
                <i className="bi bi-patch-check-fill text-success"></i> Instant Activation • 100% Secure SSL Gateway
              </p>
            </div>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .webinar-payment-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #020617 0%, #0f172a 100%);
          color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .pay-bg-accent {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: rgba(218, 37, 29, 0.08);
          filter: blur(120px);
          top: -150px;
          right: -150px;
          pointer-events: none;
        }

        .payment-card-container {
          width: 100%;
          max-width: 1080px;
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 24px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          overflow: hidden;
          backdrop-filter: blur(15px);
          z-index: 10;
        }

        @media (max-width: 900px) {
          .payment-card-container {
            grid-template-columns: 1fr;
          }
        }

        .invoice-section {
          padding: 40px;
          border-right: 1px solid rgba(255, 255, 255, 0.06);
        }

        @media (max-width: 768px) {
          .invoice-section {
            padding: 24px 16px;
            border-right: none;
          }
        }

        .invoice-logo {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 12px;
        }

        @media (max-width: 480px) {
          .invoice-logo {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        .billing-badge {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
          padding: 4px 12px;
          border-radius: 30px;
        }

        .invoice-title {
          font-size: 1.8rem;
          font-weight: 900;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
          color: #ffffff;
        }

        .invoice-desc {
          font-size: 0.9rem;
          color: #94a3b8;
          line-height: 1.5;
          margin-bottom: 25px;
        }

        .plan-summary-box {
          background: rgba(255, 255, 255, 0.03);
          padding: 20px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.04);
          margin-bottom: 30px;
        }

        .plan-avatar-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 1.2rem;
          flex-shrink: 0;
          background: #da251d;
        }

        .plan-title-name {
          font-size: 1rem;
          font-weight: 800;
          margin-bottom: 2px;
          color: #ffffff;
        }

        .plan-title-sub {
          font-size: 0.8rem;
          color: #94a3b8;
          margin-bottom: 0;
          line-height: 1.3;
        }

        .checkout-summary-section {
          background: rgba(15, 23, 42, 0.4);
          padding: 40px;
          display: flex;
          flex-direction: column;
        }

        .checkout-header-badge {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: #475569;
          margin-bottom: 25px;
        }

        .billing-details-table {
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
        }

        .bill-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.82rem;
        }

        .bill-label {
          color: #94a3b8;
          font-weight: 600;
        }

        .bill-value {
          color: #f8fafc;
          font-weight: 700;
        }

        .bill-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
          margin: 10px 0;
        }

        .total-row {
          margin-top: 15px;
          align-items: flex-end;
        }

        .total-label {
          font-size: 0.9rem;
          font-weight: 900;
          color: #cbd5e1;
        }

        .total-price-amount {
          font-size: 2rem;
          font-weight: 900;
          line-height: 1;
          color: #da251d;
        }

        .checkout-action-box {
          margin-top: 40px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .pay-now-btn {
          width: 100%;
          border: none;
          padding: 16px;
          border-radius: 12px;
          color: #fff;
          font-size: 0.95rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #da251d;
        }

        .pay-now-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
          box-shadow: 0 8px 24px rgba(218, 37, 29, 0.25);
        }

        .pay-now-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          filter: none;
        }

        .cancel-billing-btn {
          width: 100%;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 12px;
          border-radius: 12px;
          color: #64748b;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          text-align: center;
          text-decoration: none;
          display: inline-block;
        }

        .cancel-billing-btn:hover {
          color: #cbd5e1;
          border-color: rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.02);
        }

        .checkout-footer-notes {
          text-align: center;
          margin-top: 20px;
          font-size: 0.72rem;
          color: #475569;
          font-weight: 600;
        }

        .form-control-light {
          background: rgba(0, 0, 0, 0.25) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
          border-radius: 10px !important;
          font-size: 0.9rem !important;
          transition: all 0.2s ease !important;
        }

        .form-control-light::placeholder {
          color: rgba(255, 255, 255, 0.3) !important;
        }

        .form-control-light:focus {
          background: rgba(0, 0, 0, 0.35) !important;
          border-color: #da251d !important;
          box-shadow: 0 0 0 0.2rem rgba(218, 37, 29, 0.25) !important;
          color: #ffffff !important;
        }

        .webinar-payment-page label,
        .webinar-payment-page .form-label {
          color: #cbd5e1 !important;
          font-weight: 600 !important;
          font-size: 0.82rem !important;
          letter-spacing: 0.3px;
        }
      `}} />
    </>
  );
};

export default WebinarRegisterPage;
