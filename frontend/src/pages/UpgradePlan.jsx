import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../config/api';

const UpgradePlan = () => {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly', 'quarterly', 'yearly'
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Get User Info from LocalStorage (standard in this app)
  const userInfo = (() => {
    try {
      const saved = localStorage.getItem('userInfo');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  })();

  // Pricing Data based on reference image
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

  // Load Razorpay Script
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
      navigate('/login', { state: { from: '/upgrade' } });
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
      
      // 1. Create order on backend
      const orderResponse = await fetch(`${API_BASE}/api/membership/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, planId: plan.id, billingCycle })
      });
      const orderData = await orderResponse.json();

      if (!orderResponse.ok) throw new Error(orderData.error);

      // 2. Open Razorpay Checkout
      const options = {
        key: 'rzp_live_SwnZMgoy1Uy9zu', 
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Industrial Times",
        description: `Upgrade to ${plan.name} (${billingCycle})`,
        image: "/industrialtimes_logo.png",
        order_id: orderData.id,
        handler: async function (response) {
          // 3. Verify payment on backend
          const verifyRes = await fetch(`${API_BASE}/api/membership/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              userId: userInfo.id,
              planId: plan.id,
              billingCycle
            })
          });
          const verifyData = await verifyRes.json();

          if (verifyRes.ok) {
            alert("Payment Successful! Your account has been upgraded.");
            // Update local user state if needed
            window.location.href = '/';
          } else {
            alert(verifyData.error || "Payment verification failed.");
          }
        },
        prefill: {
          name: userInfo.name,
          email: userInfo.email,
        },
        theme: {
          color: "#da251d",
        },
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
    <div className="upgrade-page py-5" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <Container>
        <div className="text-center mb-5">
          <h1 className="fw-black display-4 mb-2">Our Plans</h1>
          <p className="text-muted lead">Choose the perfect plan for your professional industrial presence</p>

          <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
            <Button 
              variant={billingCycle === 'monthly' ? 'danger' : 'outline-secondary'} 
              className="rounded-pill px-4 py-2 fw-bold"
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </Button>
            <Button 
              variant={billingCycle === 'quarterly' ? 'danger' : 'outline-secondary'} 
              className="rounded-pill px-4 py-2 fw-bold position-relative"
              onClick={() => setBillingCycle('quarterly')}
            >
              Quarterly
              <Badge bg="success" className="position-absolute top-0 start-100 translate-middle rounded-pill" style={{ fontSize: '0.6rem' }}>5% OFF</Badge>
            </Button>
            <Button 
              variant={billingCycle === 'yearly' ? 'danger' : 'outline-secondary'} 
              className="rounded-pill px-4 py-2 fw-bold position-relative"
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly
              <Badge bg="success" className="position-absolute top-0 start-100 translate-middle rounded-pill" style={{ fontSize: '0.6rem' }}>10% OFF</Badge>
            </Button>
          </div>
        </div>

        <Row className="g-4 justify-content-center">
          {plans.map((plan, idx) => (
            <Col key={plan.id} lg={3} md={6}>
              <Card className={`h-100 border-0 shadow-sm plan-card ${plan.recommended ? 'recommended' : ''}`} style={{ borderRadius: '20px', overflow: 'hidden', transition: 'all 0.3s ease' }}>
                  {plan.recommended && (
                    <div className="bg-warning text-center py-1 fw-bold small text-uppercase letter-spacing-1">
                      Recommended
                    </div>
                  )}
                  <Card.Body className="p-4 d-flex flex-column">
                    <div className="mb-4">
                      <h5 className="fw-black text-muted mb-1" style={{ fontSize: '0.9rem', letterSpacing: '1px' }}>{plan.name}</h5>
                      <div className="d-flex align-items-baseline gap-1">
                        <span className="fs-3 fw-black">₹{plan.price[billingCycle].toLocaleString()}</span>
                        <span className="text-muted small">/{billingCycle.replace('ly', '')}</span>
                      </div>
                      <div className="text-muted x-small mt-1">+ GST Applicable</div>
                    </div>

                    <div className="flex-grow-1">
                      <ul className="list-unstyled mb-4">
                        {plan.features.map((feature, fIdx) => (
                          <li key={fIdx} className="d-flex align-items-center gap-2 mb-2 small fw-medium">
                            <i className="bi bi-check2-circle text-success fs-5"></i>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button 
                      variant={plan.recommended ? 'danger' : 'outline-danger'} 
                      className="w-100 rounded-pill py-2 fw-bold mt-auto upgrade-btn"
                      onClick={() => handleUpgrade(plan)}
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Choose Plan'}
                    </Button>
                  </Card.Body>
                </Card>
            </Col>
          ))}
        </Row>

        <div className="text-center mt-5">
            <p className="text-muted small">
                All plans include access to our standard industrial portal features. 
                <br />For custom enterprise solutions, please <a href="/contact" className="text-danger fw-bold">Contact Us</a>.
            </p>
        </div>
      </Container>

      <style dangerouslySetInnerHTML={{ __html: `
        .plan-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1) !important;
        }
        .plan-card.recommended {
          border: 2px solid #ffc107 !important;
          transform: scale(1.05);
          z-index: 10;
        }
        .plan-card.recommended:hover {
          transform: scale(1.05) translateY(-10px);
        }
        .upgrade-btn {
          transition: all 0.3s ease;
        }
        .plan-card:hover .upgrade-btn {
          transform: scale(1.05);
        }
        .letter-spacing-1 { letter-spacing: 1px; }
      `}} />
    </div>
  );
};

export default UpgradePlan;
