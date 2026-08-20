import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Form, Button, Badge } from 'react-bootstrap';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navigation from '../components/Navigation';
import API_BASE from '../config/api';

const PodcastApply = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFormOnly = searchParams.get('form') === 'true';
  const resumeGuestId = searchParams.get('guestId');

  const formRef = useRef(null);
  const [episodes, setEpisodes] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(true);

  // Video player modal state
  const [activeVideo, setActiveVideo] = useState(null); // { url, title, thumbnail }

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    website: '',
    background: ''
  });
  const [customData, setCustomData] = useState({});
  const [dynamicFields, setDynamicFields] = useState([]);
  const [pageSettings, setPageSettings] = useState({
    title: 'Industrial Times Podcast',
    description: "Join industry leaders on the Industrial Times podcast. Share your insights, experiences, and vision with our global audience of manufacturing professionals."
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [redirectCount, setRedirectCount] = useState(5);

  // Payment state
  const [paymentSettings, setPaymentSettings] = useState({
    entryFee: 999,
    gstRate: 18,
    paymentEnabled: true
  });
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [savedGuestId, setSavedGuestId] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

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
    try {
      const res = await axios.post(`${API_BASE}/api/promo-codes/validate`, {
        code: promoCodeInput.trim().toUpperCase(),
        platform: 'podcast',
        originalAmount: totalFee
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

  // Fetch episodes and form fields
  useEffect(() => {
    window.scrollTo(0, 0);

    if (!isFormOnly) {
      const fetchEpisodes = async () => {
        try {
          const res = await axios.get(`${API_BASE}/api/podcast/episodes`);
          setEpisodes(res.data || []);
        } catch (err) {
          console.error('Failed to load episodes', err);
        } finally {
          setLoadingEpisodes(false);
        }
      };
      fetchEpisodes();
    }

    const fetchFields = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/podcast/fields`);
        setDynamicFields(res.data);
        const initialCustom = {};
        res.data.forEach(f => { initialCustom[f.name] = ''; });
        setCustomData(initialCustom);

        const seoRes = await axios.get(`${API_BASE}/api/settings/seo`);
        if (seoRes.data) {
          setPageSettings({
            title: seoRes.data.podcastHeaderTitle || 'Industrial Times Podcast',
            description: seoRes.data.podcastHeaderDescription || "Join industry leaders on the Industrial Times podcast. Share your insights, experiences, and vision with our global audience of manufacturing professionals."
          });
        }
      } catch (err) {
        console.error("Failed to load fields or settings", err);
      }
    };
    fetchFields();

    // Fetch payment settings
    const fetchPaymentSettings = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/podcast/payment-settings`);
        if (res.data) {
          setPaymentSettings({
            entryFee: res.data.entryFee || 999,
            gstRate: res.data.gstRate || 18,
            paymentEnabled: res.data.paymentEnabled !== false
          });
        }
      } catch (err) {
        console.error("Failed to load payment settings", err);
      }
    };
    fetchPaymentSettings();

    // Check if resuming payment for a guest
    if (resumeGuestId) {
      const fetchResumeGuest = async () => {
        try {
          const res = await axios.get(`${API_BASE}/api/podcast/guest/${resumeGuestId}`);
          if (res.data && res.data.paymentStatus === 'pending') {
            setSavedGuestId(resumeGuestId);
            setFormData({
              firstName: res.data.firstName || '',
              lastName: res.data.lastName || '',
              email: res.data.email || '',
              phone: res.data.phone || '',
              website: res.data.website || '',
              background: res.data.background || ''
            });
            if (res.data.customData) {
              setCustomData(res.data.customData);
            }
            setShowPaymentPopup(true);
          }
        } catch (err) {
          console.error("Failed to load resume guest details", err);
        }
      };
      fetchResumeGuest();
    }
  }, [isFormOnly, resumeGuestId]);

  useEffect(() => {
    let timer;
    if (success && redirectCount > 0) {
      timer = setTimeout(() => setRedirectCount(redirectCount - 1), 1000);
    } else if (success && redirectCount === 0) {
      // If opened as form-only tab, close it; otherwise go home
      if (isFormOnly && window.opener) {
        window.close();
      } else {
        navigate('/podcast-apply');
      }
    }
    return () => clearTimeout(timer);
  }, [success, redirectCount, navigate, isFormOnly]);

  const handleChange = (e) => {
    let val = e.target.value;
    if (e.target.name === 'phone') {
      val = val.replace(/\D/g, '');
    }
    setFormData({ ...formData, [e.target.name]: val });
  };

  const handleCustomChange = (e, fieldName) => {
    setCustomData({ ...customData, [fieldName]: e.target.value });
  };

  const handleApplyClick = () => {
    window.open('/podcast-apply?form=true', '_blank');
  };

  const handleEpisodeClick = (ep) => {
    if (ep.audioUrl) {
      const videoUrl = ep.audioUrl.startsWith('/uploads/')
        ? `${API_BASE}${ep.audioUrl}`
        : ep.audioUrl;
      const thumbUrl = ep.thumbnailUrl
        ? (ep.thumbnailUrl.startsWith('/') ? `${API_BASE}${ep.thumbnailUrl}` : ep.thumbnailUrl)
        : null;
      setActiveVideo({ url: videoUrl, title: ep.title, thumbnail: thumbUrl, isUploaded: ep.audioUrl.startsWith('/uploads/') });
    }
  };

  // Load Razorpay script dynamically
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

  // Handle payment initiation
  const handleInitiatePayment = async () => {
    setProcessingPayment(true);
    setPaymentError('');

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Payment gateway failed to load. Please check your internet connection.');
      }

      // Create Razorpay order
      const { data: order } = await axios.post(`${API_BASE}/api/podcast/create-razorpay-order`, {
        promoCode: appliedPromo?.code || ''
      });

      if (order.amount === 0) {
        // Bypass Razorpay for 100% discount
        await axios.post(`${API_BASE}/api/podcast/verify-payment`, {
          razorpay_order_id: order.id,
          razorpay_payment_id: 'FREE_ENTRY_' + Date.now(),
          razorpay_signature: 'dummy_signature',
          guestId: savedGuestId,
          promoCode: appliedPromo?.code || ''
        });
        setShowPaymentPopup(false);
        setSuccess(true);
        setRedirectCount(5);
        setFormData({ firstName: '', lastName: '', email: '', phone: '', website: '', background: '' });
        window.scrollTo(0, 0);
        return;
      }

      // Open Razorpay checkout
      const options = {
        key: 'rzp_live_SwnZMgoy1Uy9zu',
        amount: order.amount,
        currency: order.currency,
        name: 'Industrial Times',
        description: 'Podcast Guest Application Fee',
        order_id: order.id,
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: '#da251d'
        },
        handler: async (response) => {
          setProcessingPayment(true);
          try {
            // Verify payment on backend
            await axios.post(`${API_BASE}/api/podcast/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              guestId: savedGuestId,
              promoCode: appliedPromo?.code || ''
            });
            setShowPaymentPopup(false);
            setSuccess(true);
            setRedirectCount(5);
            setFormData({ firstName: '', lastName: '', email: '', phone: '', website: '', background: '' });
            window.scrollTo(0, 0);
          } catch (verifErr) {
            setPaymentError(verifErr.response?.data?.error || 'Payment verification failed. Please contact support.');
          } finally {
            setProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPayment(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Payment initiation failed:', err);
      setPaymentError(err.response?.data?.error || err.message || 'An unexpected error occurred.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await axios.post(`${API_BASE}/api/podcast`, { ...formData, customData });
      const { guest, paymentRequired } = res.data;

      if (paymentRequired) {
        // Payment is required — show payment popup
        setSavedGuestId(guest.id);
        setShowPaymentPopup(true);
      } else {
        // No payment — direct success
        setSuccess(true);
        setRedirectCount(5);
        setFormData({ firstName: '', lastName: '', email: '', phone: '', website: '', background: '' });
        window.scrollTo(0, 0);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit application. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const renderDynamicField = (field) => {
    switch (field.type) {
      case 'textarea':
        return <Form.Control as="textarea" rows={4} required={field.required} value={customData[field.name] || ''} onChange={(e) => handleCustomChange(e, field.name)} className="podcast-form-input" placeholder={`Enter ${field.label.toLowerCase()}...`} />;
      case 'select':
        const options = Array.isArray(field.options) ? field.options : [];
        return (
          <Form.Select required={field.required} value={customData[field.name] || ''} onChange={(e) => handleCustomChange(e, field.name)} className="podcast-form-input">
            <option value="">Select an option...</option>
            {options.map((opt, idx) => <option key={idx} value={opt}>{opt}</option>)}
          </Form.Select>
        );
      case 'checkbox':
        return <Form.Check type="checkbox" label="Yes, I confirm" required={field.required} checked={customData[field.name] === 'Yes'} onChange={(e) => handleCustomChange({ target: { value: e.target.checked ? 'Yes' : 'No' } }, field.name)} />;
      default:
        return <Form.Control type={field.type || 'text'} required={field.required} value={customData[field.name] || ''} onChange={(e) => handleCustomChange(e, field.name)} className="podcast-form-input" placeholder={`Enter ${field.label.toLowerCase()}...`} />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const baseFee = paymentSettings.entryFee;
  const gstAmount = baseFee * (paymentSettings.gstRate / 100);
  const totalFee = Math.round(baseFee + gstAmount);

  // ─── PAYMENT POPUP MODAL ───
  const renderPaymentPopup = () => {
    if (!showPaymentPopup) return null;

    return (
      <div className="podcast-payment-overlay" onClick={() => { if (!processingPayment) setShowPaymentPopup(false); }}>
        <div className="podcast-payment-modal" onClick={(e) => e.stopPropagation()}>
          {/* Close button */}
          {!processingPayment && (
            <button className="podcast-payment-close" onClick={() => setShowPaymentPopup(false)}>
              <i className="bi bi-x-lg"></i>
            </button>
          )}

          {/* Left: Summary */}
          <div className="podcast-payment-left">
            <div className="podcast-payment-logo">
              <img src="/industrialtimes_white.png" alt="Industrial Times" style={{ height: '32px' }} onError={(e) => { e.target.style.display = 'none'; }} />
              <span className="podcast-payment-secure-badge">
                <i className="bi bi-shield-lock-fill"></i> SECURE PAYMENT
              </span>
            </div>

            <h2 className="podcast-payment-title">Complete Your Application</h2>
            <p className="podcast-payment-desc">
              Finalize your podcast guest application by completing the payment below.
            </p>

            <div className="podcast-payment-applicant-box">
              <div className="podcast-payment-applicant-icon">
                <i className="bi bi-mic-fill"></i>
              </div>
              <div>
                <h4 className="podcast-payment-applicant-name">{formData.firstName} {formData.lastName}</h4>
                <p className="podcast-payment-applicant-info">
                  <i className="bi bi-envelope-fill me-1"></i> {formData.email}
                </p>
                <p className="podcast-payment-applicant-info">
                  <i className="bi bi-telephone-fill me-1"></i> {formData.phone}
                </p>
              </div>
            </div>

            {paymentError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px', padding: '12px 16px', marginTop: '16px',
                color: '#fca5a5', fontWeight: 600, fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{paymentError}</span>
              </div>
            )}
          </div>

          {/* Right: Checkout */}
          <div className="podcast-payment-right">
            <div className="podcast-payment-order-badge">ORDER SUMMARY</div>

            <div className="podcast-payment-bill">
              <div className="podcast-payment-bill-row">
                <span className="podcast-payment-bill-label">Applicant</span>
                <span className="podcast-payment-bill-value">{formData.firstName} {formData.lastName}</span>
              </div>
              <div className="podcast-payment-bill-row">
                <span className="podcast-payment-bill-label">Service</span>
                <span className="podcast-payment-bill-value" style={{ fontSize: '0.75rem' }}>
                  <span className="badge bg-danger py-1 px-2 text-uppercase">Podcast Guest Fee</span>
                </span>
              </div>
              <div className="podcast-payment-bill-row">
                <span className="podcast-payment-bill-label">Base Registration Fee</span>
                <span className="podcast-payment-bill-value">₹{baseFee.toFixed(2)}</span>
              </div>
              <div className="podcast-payment-bill-row">
                <span className="podcast-payment-bill-label">CGST + SGST ({paymentSettings.gstRate}%)</span>
                <span className="podcast-payment-bill-value">₹{gstAmount.toFixed(2)}</span>
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
                <div className="podcast-payment-bill-row text-success small">
                  <span>Promo Discount Applied</span>
                  <span>-₹{promoDiscountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="podcast-payment-bill-divider"></div>

              <div className="podcast-payment-bill-row podcast-payment-total-row">
                <span className="podcast-payment-total-label">Total (GST Included)</span>
                <span className="podcast-payment-total-amount">
                  {promoDiscountAmount > 0 ? (
                    <>
                      <span className="text-muted text-decoration-line-through me-2" style={{ fontSize: '0.9rem' }}>₹{totalFee}</span>
                      <span>₹{Math.max(0, totalFee - promoDiscountAmount)}</span>
                    </>
                  ) : `₹${totalFee}`}
                </span>
              </div>
            </div>

            <div className="podcast-payment-actions">
              <button
                className="podcast-payment-pay-btn"
                onClick={handleInitiatePayment}
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-shield-lock-fill me-2"></i>
                    Pay ₹{Math.max(0, totalFee - promoDiscountAmount)} & Submit
                  </>
                )}
              </button>

              {!processingPayment && (
                <button className="podcast-payment-cancel-btn" onClick={() => setShowPaymentPopup(false)}>
                  <i className="bi bi-arrow-left me-1"></i> Cancel & Go Back
                </button>
              )}
            </div>

            <div className="podcast-payment-footer-note">
              <p><i className="bi bi-patch-check-fill text-success"></i> 100% Secure SSL Gateway • Powered by Razorpay</p>
            </div>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          .podcast-payment-overlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: rgba(2, 6, 23, 0.85);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            animation: ppFadeIn 0.3s ease;
          }
          @keyframes ppFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .podcast-payment-modal {
            width: 100%;
            max-width: 960px;
            background: rgba(30, 41, 59, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            box-shadow: 0 40px 80px rgba(0, 0, 0, 0.5);
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            overflow: hidden;
            position: relative;
            animation: ppSlideUp 0.4s ease;
          }
          @keyframes ppSlideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @media (max-width: 768px) {
            .podcast-payment-modal {
              grid-template-columns: 1fr;
              max-height: 90vh;
              overflow-y: auto;
            }
          }
          .podcast-payment-close {
            position: absolute;
            top: 16px;
            right: 16px;
            z-index: 10;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.1);
            color: #94a3b8;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.85rem;
          }
          .podcast-payment-close:hover {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
            border-color: rgba(239, 68, 68, 0.3);
          }
          .podcast-payment-left {
            padding: 40px;
            border-right: 1px solid rgba(255,255,255,0.06);
            color: #f8fafc;
          }
          @media (max-width: 768px) {
            .podcast-payment-left { padding: 24px 20px; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.06); }
          }
          .podcast-payment-logo {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 28px;
            flex-wrap: wrap;
            gap: 10px;
          }
          .podcast-payment-secure-badge {
            font-size: 0.62rem;
            font-weight: 800;
            letter-spacing: 1.5px;
            background: rgba(16, 185, 129, 0.15);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.3);
            padding: 4px 12px;
            border-radius: 30px;
          }
          .podcast-payment-title {
            font-size: 1.6rem;
            font-weight: 900;
            letter-spacing: -0.5px;
            margin-bottom: 8px;
            color: #fff;
          }
          .podcast-payment-desc {
            font-size: 0.88rem;
            color: #94a3b8;
            line-height: 1.5;
            margin-bottom: 24px;
          }
          .podcast-payment-applicant-box {
            display: flex;
            align-items: center;
            gap: 16px;
            background: rgba(255,255,255,0.03);
            padding: 20px;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.04);
          }
          .podcast-payment-applicant-icon {
            width: 48px;
            height: 48px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 1.3rem;
            flex-shrink: 0;
            background: #da251d;
          }
          .podcast-payment-applicant-name {
            font-size: 1rem;
            font-weight: 800;
            margin-bottom: 4px;
            color: #fff;
          }
          .podcast-payment-applicant-info {
            font-size: 0.78rem;
            color: #94a3b8;
            margin-bottom: 2px;
          }
          .podcast-payment-right {
            background: rgba(15, 23, 42, 0.5);
            padding: 40px;
            display: flex;
            flex-direction: column;
          }
          @media (max-width: 768px) {
            .podcast-payment-right { padding: 24px 20px; }
          }
          .podcast-payment-order-badge {
            font-size: 0.7rem;
            font-weight: 800;
            letter-spacing: 1.5px;
            color: #475569;
            margin-bottom: 20px;
          }
          .podcast-payment-bill {
            display: flex;
            flex-direction: column;
            gap: 14px;
            flex: 1;
          }
          .podcast-payment-bill-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.82rem;
          }
          .podcast-payment-bill-label {
            color: #94a3b8;
            font-weight: 600;
          }
          .podcast-payment-bill-value {
            color: #f8fafc;
            font-weight: 700;
          }
          .podcast-payment-bill-divider {
            height: 1px;
            background: rgba(255,255,255,0.06);
            margin: 8px 0;
          }
          .podcast-payment-total-row {
            margin-top: 10px;
            align-items: flex-end;
          }
          .podcast-payment-total-label {
            font-size: 0.88rem;
            font-weight: 900;
            color: #cbd5e1;
          }
          .podcast-payment-total-amount {
            font-size: 2rem;
            font-weight: 900;
            line-height: 1;
            color: #da251d;
          }
          .podcast-payment-actions {
            margin-top: 32px;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .podcast-payment-pay-btn {
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
          .podcast-payment-pay-btn:hover {
            transform: translateY(-2px);
            filter: brightness(1.1);
            box-shadow: 0 8px 24px rgba(218, 37, 29, 0.3);
          }
          .podcast-payment-pay-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
            filter: none;
          }
          .podcast-payment-cancel-btn {
            width: 100%;
            background: transparent;
            border: 1px solid rgba(255,255,255,0.08);
            padding: 12px;
            border-radius: 12px;
            color: #64748b;
            font-size: 0.85rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            text-align: center;
          }
          .podcast-payment-cancel-btn:hover {
            color: #cbd5e1;
            border-color: rgba(255,255,255,0.15);
            background: rgba(255,255,255,0.02);
          }
          .podcast-payment-footer-note {
            text-align: center;
            margin-top: 16px;
            font-size: 0.7rem;
            color: #475569;
            font-weight: 600;
          }
          .podcast-payment-footer-note p {
            margin: 0;
          }
        `}} />
      </div>
    );
  };

  // ─── Success Screen ───
  if (success) {
    return (
      <div className="podcast-landing podcast-apply-page">
        <Navigation />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px' }}>
          <div style={{
            background: '#fff', borderRadius: '24px', padding: '3rem', maxWidth: '550px', width: '90%',
            boxShadow: '0 25px 60px rgba(0,0,0,0.12)', textAlign: 'center'
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
              color: '#10b981', fontSize: '2.5rem'
            }}>
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <h2 style={{ fontWeight: 900, marginBottom: '0.75rem' }}>Application Submitted!</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Thank you for your interest in the Industrial Times Podcast. Our editorial team will review your application and get back to you shortly.
              {paymentSettings.paymentEnabled && (
                <><br /><span style={{ color: '#10b981', fontWeight: 700 }}>✅ Payment has been verified successfully.</span></>
              )}
            </p>
            <p style={{ color: '#da251d', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {isFormOnly ? `Closing in ${redirectCount}s...` : `Returning in ${redirectCount}s...`}
            </p>
            <button
              onClick={() => { if (isFormOnly && window.opener) window.close(); else navigate('/podcast-apply'); }}
              style={{
                background: 'linear-gradient(135deg, #da251d, #b91d17)', color: '#fff', border: 'none',
                padding: '12px 40px', borderRadius: '50px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer'
              }}
            >
              <i className="bi bi-check-lg" style={{ marginRight: '8px' }}></i>{isFormOnly ? 'Close Tab' : 'Back to Podcast'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render form fields (reused in both form-only and landing) ───
  const renderFormContent = () => (
    <>
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px',
          padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px',
          color: '#dc2626', fontWeight: 600
        }}>
          <i className="bi bi-exclamation-triangle-fill"></i>
          <span>{error}</span>
        </div>
      )}

      <Form onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Form.Group as={Col} md={6} className="mb-3 mb-md-0">
            <Form.Label className="podcast-form-label">First Name <span style={{ color: '#da251d' }}>*</span></Form.Label>
            <Form.Control type="text" name="firstName" placeholder="John" required value={formData.firstName} onChange={handleChange} className="podcast-form-input" />
          </Form.Group>
          <Form.Group as={Col} md={6}>
            <Form.Label className="podcast-form-label">Last Name <span style={{ color: '#da251d' }}>*</span></Form.Label>
            <Form.Control type="text" name="lastName" placeholder="Doe" required value={formData.lastName} onChange={handleChange} className="podcast-form-input" />
          </Form.Group>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label className="podcast-form-label">Email Address <span style={{ color: '#da251d' }}>*</span></Form.Label>
          <Form.Control type="email" name="email" placeholder="john@company.com" required value={formData.email} onChange={handleChange} className="podcast-form-input" />
          <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>We'll send a confirmation to this address.</Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="podcast-form-label">Phone Number <span style={{ color: '#da251d' }}>*</span></Form.Label>
          <Form.Control type="tel" name="phone" placeholder="+91 98765 43210" required value={formData.phone} onChange={handleChange} className="podcast-form-input" />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="podcast-form-label">Website / LinkedIn</Form.Label>
          <Form.Control type="url" name="website" placeholder="https://linkedin.com/in/username" value={formData.website} onChange={handleChange} className="podcast-form-input" />
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label className="podcast-form-label">Background & Topic Idea <span style={{ color: '#da251d' }}>*</span></Form.Label>
          <Form.Control
            as="textarea" name="background" rows={5}
            placeholder="Tell us about your background, expertise, and what topics you'd like to discuss on the podcast..."
            required value={formData.background} onChange={handleChange} className="podcast-form-input"
          />
        </Form.Group>

        {dynamicFields.length > 0 && (
          <>
            <hr style={{ margin: '2rem 0', opacity: 0.15 }} />
            <h5 style={{ fontWeight: 800, marginBottom: '1rem' }}>Additional Information</h5>
            {dynamicFields.map((field) => (
              <Form.Group className="mb-3" key={field.id}>
                <Form.Label className="podcast-form-label">
                  {field.label} {field.required && <span style={{ color: '#da251d' }}>*</span>}
                </Form.Label>
                {renderDynamicField(field)}
              </Form.Group>
            ))}
          </>
        )}

        <div style={{ marginTop: '2rem' }}>
          <Button type="submit" disabled={loading} className="podcast-form-submit-btn">
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-2"></span> Submitting...</>
            ) : (
              <><i className="bi bi-send-fill me-2"></i> Submit Application</>
            )}
          </Button>
        </div>
      </Form>
    </>
  );

  // ─── FORM-ONLY MODE (opened in new tab) ───
  if (isFormOnly) {
    return (
      <div className="podcast-landing podcast-apply-page">
        <Navigation />
        <section className="podcast-form-section" style={{ paddingTop: '120px' }}>
          <div className="podcast-section-container">
            <div className="podcast-section-header">
              <div className="podcast-section-badge" style={{ background: 'rgba(218, 37, 29, 0.1)', color: '#da251d' }}>
                <i className="bi bi-pencil-square"></i>
                <span>GUEST APPLICATION</span>
              </div>
              <h2 className="podcast-section-title">Podcast Guest Application</h2>
              <p className="podcast-section-desc">
                Fill out the form below and our editorial team will review your application. We'll get back to you within 48 hours.
              </p>
            </div>

            <div className="podcast-form-card">
              {renderFormContent()}
            </div>
          </div>
        </section>

        <footer className="podcast-footer">
          <div className="podcast-section-container">
            <p>© {new Date().getFullYear()} Industrial Times. All rights reserved.</p>
          </div>
        </footer>

        {renderPaymentPopup()}
      </div>
    );
  }

  // ─── MAIN LANDING PAGE ───
  return (
    <div className="podcast-landing">
      <Navigation />

      {/* ─── HERO SECTION ─── */}
      <section className="podcast-hero">
        <div className="podcast-hero-bg">
          <div className="podcast-hero-gradient"></div>
          <div className="podcast-hero-pattern"></div>
        </div>
        <div className="podcast-hero-content">
          <div className="podcast-hero-badge">
            <i className="bi bi-mic-fill"></i>
            <span>INDUSTRIAL TIMES PODCAST</span>
          </div>
          <h1 className="podcast-hero-title">
            {pageSettings.title && pageSettings.title !== 'Podcast Guest Application' 
              ? pageSettings.title 
              : 'Industrial Times Podcast'}
          </h1>
          <p className="podcast-hero-desc">{pageSettings.description}</p>
          <div className="podcast-hero-actions">
            <button className="podcast-cta-btn" onClick={handleApplyClick}>
              <i className="bi bi-broadcast"></i>
              Apply for Podcast
            </button>
            {episodes.length > 0 && (
              <button
                className="podcast-cta-btn-outline"
                onClick={() => document.getElementById('podcast-episodes')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <i className="bi bi-play-circle"></i>
                Watch Episodes
              </button>
            )}
          </div>
          <div className="podcast-hero-stats">
            <div className="podcast-stat">
              <span className="podcast-stat-value">{episodes.length}+</span>
              <span className="podcast-stat-label">Episodes</span>
            </div>
            <div className="podcast-stat-divider"></div>
            <div className="podcast-stat">
              <span className="podcast-stat-value">100K+</span>
              <span className="podcast-stat-label">Listeners</span>
            </div>
            <div className="podcast-stat-divider"></div>
            <div className="podcast-stat">
              <span className="podcast-stat-value">50+</span>
              <span className="podcast-stat-label">Industry Guests</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LATEST EPISODES SECTION ─── */}
      <section className="podcast-episodes-section" id="podcast-episodes">
        <div className="podcast-section-container">
          <div className="podcast-section-header">
            <div className="podcast-section-badge">
              <i className="bi bi-collection-play-fill"></i>
              <span>LATEST EPISODES</span>
            </div>
            <h2 className="podcast-section-title">Recent Podcast Episodes</h2>
            <p className="podcast-section-desc">
              Catch up on our latest conversations with industry leaders, innovators, and manufacturing professionals.
            </p>
          </div>

          {episodes.length > 0 ? (
            <div className="podcast-episodes-grid">
              {episodes.map((ep) => (
                <div
                  className="podcast-episode-card"
                  key={ep.id}
                  onClick={() => handleEpisodeClick(ep)}
                  style={{ cursor: ep.audioUrl ? 'pointer' : 'default' }}
                >
                  <div className="podcast-episode-thumb">
                    {ep.thumbnailUrl ? (
                      <img src={ep.thumbnailUrl.startsWith('/') ? `${API_BASE}${ep.thumbnailUrl}` : ep.thumbnailUrl} alt={ep.title} />
                    ) : ep.audioUrl && ep.audioUrl.startsWith('/uploads/') ? (
                      <video
                        muted
                        preload="metadata"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        src={`${API_BASE}${ep.audioUrl}#t=1`}
                      />
                    ) : (
                      <div className="podcast-episode-thumb-placeholder">
                        <i className="bi bi-mic-fill"></i>
                      </div>
                    )}
                    {ep.duration && (
                      <span className="podcast-episode-duration">
                        <i className="bi bi-clock"></i> {ep.duration}
                      </span>
                    )}
                    {ep.episodeNumber && (
                      <span className="podcast-episode-number">EP {ep.episodeNumber}</span>
                    )}
                    {/* Play overlay icon */}
                    {ep.audioUrl && (
                      <div className="podcast-episode-play-overlay">
                        <i className="bi bi-play-circle-fill"></i>
                      </div>
                    )}
                  </div>
                  <div className="podcast-episode-body">
                    <h3 className="podcast-episode-title">{ep.title}</h3>
                    {ep.guestName && (
                      <div className="podcast-episode-guest">
                        <i className="bi bi-person-fill"></i>
                        <span>{ep.guestName}</span>
                      </div>
                    )}
                    {ep.description && (
                      <p className="podcast-episode-desc">{ep.description.length > 120 ? ep.description.substring(0, 120) + '...' : ep.description}</p>
                    )}
                    <div className="podcast-episode-footer">
                      <span className="podcast-episode-date">
                        <i className="bi bi-calendar3"></i> {formatDate(ep.publishedAt)}
                      </span>
                      {ep.audioUrl && (
                        <span className="podcast-episode-play-btn">
                          <i className="bi bi-play-fill"></i> Watch
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
              <i className="bi bi-mic" style={{ fontSize: '3rem', opacity: 0.2, display: 'block', marginBottom: '1rem' }}></i>
              <p style={{ fontWeight: 600 }}>No episodes published yet. Stay tuned!</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── VIDEO PLAYER MODAL ─── */}
      {activeVideo && (
        <div className="podcast-video-modal" onClick={() => setActiveVideo(null)}>
          <div className="podcast-video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="podcast-video-modal-close" onClick={() => setActiveVideo(null)}>
              <i className="bi bi-x-lg"></i>
            </button>
            <h3 className="podcast-video-modal-title">{activeVideo.title}</h3>
            {activeVideo.isUploaded ? (
              <video
                controls
                autoPlay
                style={{ width: '100%', borderRadius: '12px', maxHeight: '70vh', background: '#000' }}
                poster={activeVideo.thumbnail || undefined}
              >
                <source src={activeVideo.url} />
                Your browser does not support the video tag.
              </video>
            ) : (
              // For external URLs (YouTube, etc.), try to embed
              activeVideo.url.includes('youtube.com') || activeVideo.url.includes('youtu.be') ? (
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYouTubeId(activeVideo.url)}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&playlist=${extractYouTubeId(activeVideo.url)}`}
                    title={activeVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '12px' }}
                  ></iframe>
                </div>
              ) : (
                <video
                  controls
                  autoPlay
                  style={{ width: '100%', borderRadius: '12px', maxHeight: '70vh', background: '#000' }}
                  poster={activeVideo.thumbnail || undefined}
                >
                  <source src={activeVideo.url} />
                  Your browser does not support the video tag.
                </video>
              )
            )}
          </div>
        </div>
      )}

      {/* ─── PAYMENT POPUP ─── */}
      {renderPaymentPopup()}

      {/* ─── FOOTER ─── */}
      <footer className="podcast-footer">
        <div className="podcast-section-container">
          <p>© {new Date().getFullYear()} Industrial Times. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

// Helper to extract YouTube video ID
function extractYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    return u.searchParams.get('v') || '';
  } catch {
    return '';
  }
}

export default PodcastApply;
