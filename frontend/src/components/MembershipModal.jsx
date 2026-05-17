import React, { useState } from 'react';
import { Modal, Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import PaymentGatewayModal from './PaymentGatewayModal';
import API_BASE from '../config/api';

const MembershipModal = ({ show, onHide, userInfo }) => {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly', 'quarterly', 'yearly'
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const navigate = useNavigate();

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

  const handleUpgrade = (plan) => {
    if (!userInfo) {
      onHide();
      navigate('/login');
      return;
    }
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const onPaymentSuccess = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/membership/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userInfo.id,
          planId: selectedPlan.id,
          billingCycle,
          razorpay_payment_id: 'mock_pay_' + Date.now(),
          mock: true
        })
      });

      if (res.ok) {
        setShowPayment(false);
        onHide();
        alert(`Success! You are now a ${selectedPlan.name} member.`);
        window.location.reload();
      }
    } catch (e) {
      alert("Account updated. Please refresh.");
      setShowPayment(false);
      onHide();
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
            <div className="d-flex justify-content-center align-items-center gap-2 mt-4">
              <Button variant={billingCycle === 'monthly' ? 'danger' : 'outline-secondary'} size="sm" className="rounded-pill px-3 fw-bold" onClick={() => setBillingCycle('monthly')}>Monthly</Button>
              <Button variant={billingCycle === 'quarterly' ? 'danger' : 'outline-secondary'} size="sm" className="rounded-pill px-3 fw-bold position-relative" onClick={() => setBillingCycle('quarterly')}>Quarterly<Badge bg="success" className="position-absolute top-0 start-100 translate-middle rounded-pill" style={{ fontSize: '0.5rem' }}>5% OFF</Badge></Button>
              <Button variant={billingCycle === 'yearly' ? 'danger' : 'outline-secondary'} size="sm" className="rounded-pill px-3 fw-bold position-relative" onClick={() => setBillingCycle('yearly')}>Yearly<Badge bg="success" className="position-absolute top-0 start-100 translate-middle rounded-pill" style={{ fontSize: '0.5rem' }}>8% OFF</Badge></Button>
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
                    <Button variant={plan.recommended ? 'danger' : 'outline-danger'} size="sm" className="w-100 rounded-pill fw-bold mt-auto" onClick={() => handleUpgrade(plan)}>Upgrade Now</Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Modal.Body>
      </Modal>

      {selectedPlan && (
        <PaymentGatewayModal 
          show={showPayment} 
          onHide={() => setShowPayment(false)}
          amount={selectedPlan.price[billingCycle]}
          planName={selectedPlan.name}
          billingCycle={billingCycle}
          onPaymentSuccess={onPaymentSuccess}
        />
      )}
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
