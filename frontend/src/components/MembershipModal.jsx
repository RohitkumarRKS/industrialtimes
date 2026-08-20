import React, { useState } from 'react';
import { Modal, Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../config/api';

const MembershipModal = ({ show, onHide, userInfo }) => {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly', 'quarterly', 'yearly'
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Promo code states
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setValidatingPromo(true);
    setPromoError('');
    try {
      const res = await fetch(`${API_BASE}/api/promo-codes/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCodeInput.trim().toUpperCase(),
          platform: 'membership',
          originalAmount: 10000
        })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedPromo(data);
        setPromoError('');
      } else {
        setPromoError(data.error || 'Invalid promo code');
        setAppliedPromo(null);
      }
    } catch (err) {
      setPromoError('Invalid promo code');
      setAppliedPromo(null);
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
    setPromoError('');
  };

  const plans = [
    {
      id: 'basic',
      name: 'BASIC',
      price: { monthly: 2500, quarterly: 7499, yearly: 29999 },
      features: ['3 Articles'],
      color: '#60a5fa'
    },
    {
      id: 'standard',
      name: 'STANDARD',
      price: { monthly: 4500, quarterly: 13499, yearly: 53999 },
      features: [
        '5 Articles',
        'Promotion',
        'Times of India',
        'Economics Times',
        'Business Insider',
        'MX Player',
        'NBT Network',
        'Colombia Group'
      ],
      color: '#3b82f6'
    },
    {
      id: 'premium',
      name: 'PREMIUM',
      price: { monthly: 9500, quarterly: 28499, yearly: 113999 },
      features: [
        '7 Articles',
        'Promotion',
        'Times of India',
        'Economics Times',
        'Business Insider',
        'MX Player',
        'NBT Network',
        'Colombia Group',
        '2 Banner Ads'
      ],
      color: '#8b5cf6',
      recommended: true
    },
    {
      id: 'pro',
      name: 'PRO',
      price: { monthly: 20000, quarterly: 59999, yearly: 239999 },
      features: [
        'Unlimited Articles',
        'Promotion',
        'Times of India',
        'Economics Times',
        'Business Insider',
        'MX Player',
        'NBT Network',
        'Colombia Group',
        '4 Banner Ads',
        'Become Author',
        '1 E-paper'
      ],
      color: '#da251d'
    }
  ];

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async (plan) => {
    if (!userInfo) {
      onHide();
      navigate('/login');
      return;
    }

    setLoading(true);
    const res = await loadRazorpayScript();

    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      setLoading(false);
      return;
    }

    try {
      const amount = plan.price[billingCycle];
      
      const orderResponse = await fetch(`${API_BASE}/api/membership/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token}` },
        body: JSON.stringify({ amount, planId: plan.id, billingCycle, promoCode: appliedPromo?.code || '' })
      });
      const orderData = await orderResponse.json();

      if (!orderResponse.ok) throw new Error(orderData.error);

      const options = {
        key: 'rzp_live_SwnZMgoy1Uy9zu',
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Industrial Times",
        description: `Upgrade to ${plan.name} (${billingCycle})`,
        image: "/industrialtimes_logo.png",
        order_id: orderData.id,
        handler: async function (response) {
          const verifyRes = await fetch(`${API_BASE}/api/membership/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token}` },
            body: JSON.stringify({
              ...response,
              userId: userInfo.id,
              planId: plan.id,
              billingCycle,
              promoCode: appliedPromo?.code || ''
            })
          });
          const verifyData = await verifyRes.json();

          if (verifyRes.ok) {
            alert(`Success! You are now a ${plan.name} member.`);
            window.location.reload();
          } else {
            alert(verifyData.error || "Payment verification failed.");
          }
        },
        prefill: { name: userInfo.name, email: userInfo.email },
        theme: { color: plan.color || "#da251d" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Something went wrong with the payment process.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" centered className="membership-modal" backdrop="static">
        <Modal.Header closeButton className="border-0 px-4 pt-4">
          <Modal.Title className="fw-black fs-2 mx-auto">Choose Your Plan</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pb-5">
          <div className="text-center mb-4">
            <p className="text-muted">Empower your industrial reach with our premium publication plans.</p>
            
            {/* Promo Code Input Block */}
            <div className="mx-auto my-3 p-2 rounded-3 border border-secondary border-opacity-25" style={{ maxWidth: '400px', background: 'rgba(0,0,0,0.05)' }}>
              {appliedPromo ? (
                <div className="d-flex align-items-center justify-content-between text-success small p-1">
                  <div>
                    <i className="bi bi-tag-fill me-2"></i>
                    <strong>{appliedPromo.code}</strong> applied
                    <span className="ms-2">
                      ({appliedPromo.discountType === 'percentage' ? `${appliedPromo.discountValue}% Off` : `₹${appliedPromo.discountValue} Off`})
                    </span>
                  </div>
                  <button type="button" className="btn btn-link btn-sm text-danger p-0 ms-2 text-decoration-none fw-bold" onClick={handleRemovePromo}>Remove</button>
                </div>
              ) : (
                <div>
                  <div className="input-group input-group-sm">
                    <input 
                      type="text" 
                      className="form-control" 
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

            <div className="d-flex justify-content-center align-items-center gap-2 mt-4">
              <Button variant={billingCycle === 'monthly' ? 'danger' : 'outline-secondary'} size="sm" className="rounded-pill px-3 fw-bold" onClick={() => setBillingCycle('monthly')}>Monthly</Button>
              <Button variant={billingCycle === 'quarterly' ? 'danger' : 'outline-secondary'} size="sm" className="rounded-pill px-3 fw-bold position-relative" onClick={() => setBillingCycle('quarterly')}>Quarterly<Badge bg="success" className="position-absolute top-0 start-100 translate-middle rounded-pill" style={{ fontSize: '0.5rem' }}>5% OFF</Badge></Button>
              <Button variant={billingCycle === 'yearly' ? 'danger' : 'outline-secondary'} size="sm" className="rounded-pill px-3 fw-bold position-relative" onClick={() => setBillingCycle('yearly')}>Yearly<Badge bg="success" className="position-absolute top-0 start-100 translate-middle rounded-pill" style={{ fontSize: '0.5rem' }}>10% OFF</Badge></Button>
            </div>
          </div>

          <Row className="g-3">
            {plans.map((plan) => (
              <Col key={plan.id} lg={3} md={6}>
                <Card className={`h-100 border-0 shadow-sm plan-card-modal ${plan.recommended ? 'recommended' : ''}`} style={{ borderRadius: '15px', overflow: 'hidden', transition: 'all 0.3s ease' }}>
                  {plan.recommended && <div className="bg-warning text-center py-1 fw-bold x-small text-uppercase">Recommended</div>}
                  <Card.Body className="p-3 d-flex flex-column">
                    <div className="mb-3">
                      <h6 className="fw-black text-muted mb-1 small">{plan.name}</h6>
                      <div className="d-flex align-items-baseline gap-1">
                        <span className="fs-4 fw-black">₹{plan.price[billingCycle].toLocaleString()}</span>
                        <span className="text-muted x-small">/{billingCycle.replace('ly', '')}</span>
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <ul className="list-unstyled mb-3">
                        {plan.features.map((feature, fIdx) => (
                          <li key={fIdx} className="d-flex align-items-center gap-2 mb-1 x-small fw-medium">
                            <i className="bi bi-check2 text-success"></i>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button variant={plan.recommended ? 'danger' : 'outline-danger'} size="sm" className="w-100 rounded-pill fw-bold mt-auto" onClick={() => handleUpgrade(plan)} disabled={loading}>{loading ? 'Processing...' : 'Upgrade Now'}</Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Modal.Body>
      </Modal>


      <style dangerouslySetInnerHTML={{ __html: `
        .membership-modal { z-index: 10001 !important; }
        .modal-backdrop { z-index: 10000 !important; }
        .plan-card-modal:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important; }
        .plan-card-modal.recommended .btn-danger {
          background: linear-gradient(135deg, #da251d, #f44336);
          border: none;
          box-shadow: 0 4px 15px rgba(218, 37, 29, 0.4);
          animation: pulse-recommended 2s infinite;
        }
        @keyframes pulse-recommended {
          0% { box-shadow: 0 0 0 0 rgba(218, 37, 29, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(218, 37, 29, 0); }
          100% { box-shadow: 0 0 0 0 rgba(218, 37, 29, 0); }
        }
        .membership-modal .modal-content { border-radius: 20px; border: none; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
      `}} />
    </>
  );
};

export default MembershipModal;
