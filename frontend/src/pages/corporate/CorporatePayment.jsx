import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../../config/api';

const CorporatePayment = () => {
  const [searchParams] = useSearchParams();
  const planKey = searchParams.get('plan') || 'basic';
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [upiId, setUpiId] = useState('');
  const navigate = useNavigate();

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
        platform: 'membership',
        originalAmount: getPrice()
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

  // Reset coupon if billing cycle changes
  useEffect(() => {
    handleRemovePromo();
  }, [billingCycle]);

  useEffect(() => {
    // Force authentication check
    const saved = localStorage.getItem('userInfo');
    if (!saved) {
      navigate(`/corporate/login?plan=${planKey}`);
      return;
    }
    try {
      const user = JSON.parse(saved);
      if (user.role !== 'corporate') {
        navigate('/profile');
        return;
      }
      setUserInfo(user);
    } catch (e) {
      console.error(e);
      localStorage.removeItem('userInfo');
      navigate(`/corporate/login?plan=${planKey}`);
    }
  }, [navigate, planKey]);

  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/plans`);
        const found = (data || []).find(p => p.planKey === planKey);
        setPlan(found || (data || [])[0]);
      } catch (err) {
        console.error('Failed to load plan details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlanDetails();
  }, [planKey]);

  if (loading || !userInfo || !plan) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <div className="spinner-border text-danger" role="status"></div>
        <p className="mt-3 text-muted">Securing billing terminal...</p>
      </div>
    );
  }

  const getPrice = () => {
    if (billingCycle === 'monthly') return plan.priceMonthly;
    if (billingCycle === 'quarterly') return plan.priceQuarterly;
    return plan.priceYearly;
  };

  const getDiscount = () => {
    if (billingCycle === 'monthly') return 0;
    if (billingCycle === 'quarterly') return Math.round(plan.priceMonthly * 3 - plan.priceQuarterly);
    return Math.round(plan.priceMonthly * 12 - plan.priceYearly);
  };

  const getCycleLabel = () => {
    if (billingCycle === 'monthly') return 'Monthly Billing';
    if (billingCycle === 'quarterly') return 'Quarterly Billing (5% Off)';
    return 'Annual Billing (10% Off)';
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePaymentInitiation = async () => {
    try {
      const res = await loadRazorpayScript();
      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        return;
      }

      // Create Order
      const { data: order } = await axios.post(`${API_BASE}/api/membership/create-order`, {
        amount: getPrice(),
        planId: plan.planKey,
        billingCycle,
        promoCode: appliedPromo?.code || ''
      }, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
 
      const options = {
        key: 'rzp_live_SwnZMgoy1Uy9zu', // Production ready test key
        amount: order.amount,
        currency: order.currency,
        name: 'Industrial Times',
        description: `${plan.name} Corporate Plan`,
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post(`${API_BASE}/api/membership/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: userInfo.id,
              planId: plan.planKey,
              billingCycle,
              promoCode: appliedPromo?.code || ''
            }, {
              headers: { Authorization: `Bearer ${userInfo.token}` }
            });

            if (verifyRes.data.message) {
              localStorage.removeItem('userInfo');
              alert(`🎉 Subscription Activated! Welcome to Industrial Times Corporate Portal as a ${plan.name} Partner. Please log in to access your dashboard.`);
              navigate('/corporate/login');
            }
          } catch (e) {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: userInfo.companyName || userInfo.name,
          email: userInfo.email,
          ...(upiId && {
            contact: userInfo.phone || '9999999999',
            method: 'upi',
            vpa: upiId
          })
        },
        theme: {
          color: plan.color || '#DA251D'
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (e) {
      console.error(e);
      alert('Network error initializing payment gateway.');
    }
  };

  return (
    <div className="corporate-payment-page">
      {/* Dynamic BG */}
      <div className="pay-bg-blur"></div>

      <div className="payment-card-container">
        {/* Left column: Invoice details */}
        <div className="invoice-section">
          <div className="invoice-logo">
            <img src="/industrialtimes_white.png" alt="Industrial Times" style={{ height: '36px' }} />
            <span className="billing-badge">SECURE TERMINAL</span>
          </div>

          <h2 className="invoice-title">Corporate Billing Statement</h2>
          <p className="invoice-desc">
            Complete your subscription to unlock premium enterprise tools on India's premier industrial news network.
          </p>

          <div className="plan-summary-box" style={{ borderLeft: `4px solid ${plan.color}` }}>
            <div className="d-flex align-items-center gap-3">
              <div className="plan-avatar-icon" style={{ background: plan.color }}>
                <i className={`bi ${plan.icon}`}></i>
              </div>
              <div>
                <h4 className="plan-title-name">{plan.name} Plan</h4>
                <p className="plan-title-sub">{plan.description}</p>
              </div>
            </div>
          </div>

          {/* Billing Cycle Selection */}
          <div className="billing-select-container">
            <label className="billing-section-label">Select Subscription Period</label>
            <div className="billing-cycle-toggle-grid">
              <div 
                className={`cycle-card ${billingCycle === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                <div className="cycle-header">
                  <span className="cycle-title">Monthly</span>
                  {billingCycle === 'monthly' && <i className="bi bi-check-circle-fill"></i>}
                </div>
                <div className="cycle-price">₹{plan.priceMonthly.toLocaleString()}/mo</div>
              </div>

              <div 
                className={`cycle-card ${billingCycle === 'quarterly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('quarterly')}
              >
                <span className="save-badge">Save 5%</span>
                <div className="cycle-header">
                  <span className="cycle-title">Quarterly</span>
                  {billingCycle === 'quarterly' && <i className="bi bi-check-circle-fill"></i>}
                </div>
                <div className="cycle-price">₹{plan.priceQuarterly.toLocaleString()}/qtr</div>
              </div>

              <div 
                className={`cycle-card ${billingCycle === 'yearly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('yearly')}
              >
                <span className="save-badge bg-success">Save 10%</span>
                <div className="cycle-header">
                  <span className="cycle-title">Yearly</span>
                  {billingCycle === 'yearly' && <i className="bi bi-check-circle-fill"></i>}
                </div>
                <div className="cycle-price">₹{plan.priceYearly.toLocaleString()}/yr</div>
              </div>
            </div>
          </div>

          {/* Features check list */}
          <div className="invoice-features-container">
            <label className="billing-section-label">Included deliverables in this plan:</label>
            <div className="features-list-grid">
              {(plan.features || []).map((feature, idx) => (
                <div key={idx} className="feat-check-item">
                  <i className="bi bi-check2-all" style={{ color: plan.color }}></i>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Payment checkout summary */}
        <div className="checkout-summary-section">
          <div className="checkout-header-badge">ORDER SUMMARY</div>
          
          <div className="billing-details-table">
            <div className="bill-row">
              <span className="bill-label">Enterprise Account</span>
              <span className="bill-value fw-black">{userInfo.companyName}</span>
            </div>
            <div className="bill-row">
              <span className="bill-label">Corporate Email</span>
              <span className="bill-value">{userInfo.email}</span>
            </div>
            <div className="bill-row">
              <span className="bill-label">Selected Package</span>
              <span className="bill-value">{plan.name}</span>
            </div>
            <div className="bill-row animate-row">
              <span className="bill-label">Billing Cycle</span>
              <span className="bill-value badge bg-danger py-1 px-2 text-uppercase">{getCycleLabel()}</span>
            </div>

            {/* Promo Code Input Block */}
            <div className="my-3 p-2 bg-dark bg-opacity-25 rounded-3 border border-secondary border-opacity-25">
              {appliedPromo ? (
                <div className="d-flex align-items-center justify-content-between text-success small p-1">
                  <div>
                    <i className="bi bi-tag-fill me-2"></i>
                    <strong>{appliedPromo.code}</strong> applied
                  </div>
                  <button type="button" className="btn btn-link btn-sm text-danger p-0 ms-2 text-decoration-none fw-bold" onClick={() => { setAppliedPromo(null); setPromoDiscountAmount(0); }}>Remove</button>
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
                    />
                    <button 
                      className="btn btn-danger btn-sm fw-bold px-3" 
                      type="button" 
                      onClick={handleApplyPromo}
                      disabled={validatingPromo || !promoCodeInput.trim()}
                    >
                      {validatingPromo ? <span className="spinner-border spinner-border-sm"></span> : 'Apply'}
                    </button>
                  </div>
                  {promoError && <div className="text-danger small mt-1 fw-medium" style={{ fontSize: '0.75rem' }}><i className="bi bi-exclamation-circle me-1"></i>{promoError}</div>}
                </div>
              )}
            </div>

            {promoDiscountAmount > 0 && (
              <div className="bill-row text-success small">
                <span>Promo Discount</span>
                <span>- ₹{promoDiscountAmount.toLocaleString()}</span>
              </div>
            )}
            
            <div className="bill-divider"></div>

            {getDiscount() > 0 && (
              <div className="bill-row discount-row">
                <span className="bill-label text-success">Plan Discount Saved</span>
                <span className="bill-value text-success">- ₹{getDiscount().toLocaleString()}</span>
              </div>
            )}

            <div className="bill-row total-row">
              <span className="total-label">Total Payable Amount</span>
              <span className="total-price-amount" style={{ color: plan.color }}>
                {promoDiscountAmount > 0 ? (
                  <>
                    <span className="text-muted text-decoration-line-through me-2" style={{ fontSize: '0.9rem' }}>₹{getPrice().toLocaleString()}</span>
                    <span>₹{Math.max(0, getPrice() - promoDiscountAmount).toLocaleString()}</span>
                  </>
                ) : `₹${getPrice().toLocaleString()}`}
              </span>
            </div>
          </div>

          {/* Direct UPI Input Option */}
          <div className="mb-4">
            <label className="bill-label d-block mb-2">
              <i className="bi bi-phone me-2"></i>Direct UPI Payment (Optional)
            </label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. yourname@upi" 
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            />
            <small className="text-muted" style={{ fontSize: '0.75rem' }}>Enter your UPI ID to skip the payment method selection screen.</small>
          </div>

          {/* Payment execution buttons */}
          <div className="checkout-action-box">
            <button 
              className="pay-now-btn shadow-lg"
              style={{ background: plan.color }}
              onClick={handlePaymentInitiation}
            >
              <i className="bi bi-shield-lock-fill me-2"></i>
              Proceed to Payment
            </button>

            <button 
              className="cancel-billing-btn"
              onClick={() => {
                localStorage.removeItem('userInfo');
                navigate('/');
              }}
            >
              <i className="bi bi-arrow-left me-1"></i> Cancel & Sign Out
            </button>
          </div>

          <div className="checkout-footer-notes">
            <p className="mb-0">
              <i className="bi bi-patch-check-fill text-success"></i> Instant Activation • 100% Secure SSL Gateway
            </p>
          </div>
        </div>
      </div>


      <style dangerouslySetInnerHTML={{ __html: `
        .corporate-payment-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #020617 0%, #0f172a 100%);
          color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        .pay-bg-blur {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: rgba(218, 37, 29, 0.1);
          filter: blur(100px);
          top: -100px;
          left: -100px;
          pointer-events: none;
        }

        .payment-card-container {
          width: 100%;
          max-width: 1080px;
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 24px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.4);
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

        /* Invoice Section */
        .invoice-section {
          padding: 40px;
          border-right: 1px solid rgba(255,255,255,0.06);
        }

        .invoice-logo {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 30px;
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
        }

        .invoice-desc {
          font-size: 0.9rem;
          color: #94a3b8;
          line-height: 1.5;
          margin-bottom: 25px;
        }

        .plan-summary-box {
          background: rgba(255,255,255,0.03);
          padding: 20px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.04);
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
        }

        .plan-title-name {
          font-size: 1rem;
          font-weight: 800;
          margin-bottom: 2px;
        }

        .plan-title-sub {
          font-size: 0.8rem;
          color: #64748b;
          margin-bottom: 0;
          line-height: 1.3;
        }

        /* Billing cycle selections */
        .billing-section-label {
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 1px;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 12px;
          display: block;
        }

        .billing-cycle-toggle-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 30px;
        }

        .cycle-card {
          background: rgba(255,255,255,0.02);
          border: 2px solid rgba(255,255,255,0.05);
          border-radius: 14px;
          padding: 16px;
          cursor: pointer;
          position: relative;
          transition: all 0.3s;
        }

        .cycle-card:hover {
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.04);
        }

        .cycle-card.active {
          border-color: #da251d;
          background: rgba(218, 37, 29, 0.05);
        }

        .cycle-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .cycle-title {
          font-size: 0.8rem;
          font-weight: 800;
          color: #cbd5e1;
        }

        .cycle-header i {
          color: #da251d;
          font-size: 0.9rem;
        }

        .cycle-price {
          font-size: 0.95rem;
          font-weight: 900;
          color: #f8fafc;
        }

        .save-badge {
          position: absolute;
          top: -8px;
          right: 10px;
          background: #8b5cf6;
          color: #fff;
          font-size: 0.55rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 6px;
          text-transform: uppercase;
        }

        /* Features */
        .features-list-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .feat-check-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: #94a3b8;
          font-weight: 500;
        }

        /* Checkout summary */
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
          color: #64748b;
          font-weight: 600;
        }

        .bill-value {
          color: #f8fafc;
          font-weight: 700;
        }

        .bill-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
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
        }

        /* Action Buttons */
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
        }

        .pay-now-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }

        .cancel-billing-btn {
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
        }

        .cancel-billing-btn:hover {
          color: #cbd5e1;
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.02);
        }

        .checkout-footer-notes {
          text-align: center;
          margin-top: 20px;
          font-size: 0.72rem;
          color: #475569;
          font-weight: 600;
        }
      `}} />
    </div>
  );
};

export default CorporatePayment;
