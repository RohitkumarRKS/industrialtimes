import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, ListGroup, Card } from 'react-bootstrap';

const PaymentGatewayModal = ({ show, onHide, amount, planName, billingCycle, onPaymentSuccess }) => {
  const [step, setStep] = useState('methods'); // 'methods', 'card', 'upi', 'processing', 'success'
  const [loading, setLoading] = useState(false);

  const handlePayment = () => {
    setLoading(true);
    setStep('processing');
    setTimeout(() => {
      setLoading(false);
      setStep('success');
      setTimeout(() => {
        onPaymentSuccess();
      }, 1500);
    }, 2000);
  };

  const renderContent = () => {
    switch (step) {
      case 'methods':
        return (
          <div className="payment-methods p-3">
            <div className="text-center mb-4">
              <h5 className="fw-bold mb-1">Pay ₹{amount.toLocaleString()}</h5>
              <p className="text-muted small">Industrial Times {planName} Upgrade</p>
            </div>
            
            <ListGroup variant="flush" className="border rounded-3 overflow-hidden">
              <ListGroup.Item action onClick={() => setStep('card')} className="py-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <i className="bi bi-credit-card fs-4 text-primary"></i>
                  <div>
                    <div className="fw-bold">Cards (Credit/Debit)</div>
                    <div className="x-small text-muted">Visa, Mastercard, RuPay & more</div>
                  </div>
                </div>
                <i className="bi bi-chevron-right text-muted"></i>
              </ListGroup.Item>
              
              <ListGroup.Item action onClick={() => setStep('upi')} className="py-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <i className="bi bi-qr-code-scan fs-4 text-success"></i>
                  <div>
                    <div className="fw-bold">UPI (PhonePe, Google Pay)</div>
                    <div className="x-small text-muted">Pay using any UPI app</div>
                  </div>
                </div>
                <i className="bi bi-chevron-right text-muted"></i>
              </ListGroup.Item>

              <ListGroup.Item action onClick={handlePayment} className="py-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <i className="bi bi-bank fs-4 text-info"></i>
                  <div>
                    <div className="fw-bold">Netbanking</div>
                    <div className="x-small text-muted">All major Indian banks</div>
                  </div>
                </div>
                <i className="bi bi-chevron-right text-muted"></i>
              </ListGroup.Item>

              <ListGroup.Item action onClick={handlePayment} className="py-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <i className="bi bi-wallet2 fs-4 text-warning"></i>
                  <div>
                    <div className="fw-bold">Wallets</div>
                    <div className="x-small text-muted">Paytm, MobiKwik & more</div>
                  </div>
                </div>
                <i className="bi bi-chevron-right text-muted"></i>
              </ListGroup.Item>
            </ListGroup>

            <div className="text-center mt-4 pt-2 border-top">
                <img src="https://img.icons8.com/color/48/000000/visa.png" width="30" className="mx-1" alt="visa" />
                <img src="https://img.icons8.com/color/48/000000/mastercard.png" width="30" className="mx-1" alt="mastercard" />
                <img src="https://img.icons8.com/color/48/000000/rupay.png" width="30" className="mx-1" alt="rupay" />
                <p className="x-small text-muted mt-2"><i className="bi bi-shield-lock-fill me-1"></i>Secure 256-bit SSL Encrypted Payment</p>
            </div>
          </div>
        );

      case 'card':
        return (
          <div className="p-3">
             <Button variant="link" className="p-0 text-muted mb-3 text-decoration-none" onClick={() => setStep('methods')}>
                <i className="bi bi-arrow-left me-1"></i> Back to methods
             </Button>
             <h5 className="fw-bold mb-4">Card Details</h5>
             <Form>
                <Form.Group className="mb-3">
                    <Form.Label className="x-small fw-bold text-muted">CARD NUMBER</Form.Label>
                    <Form.Control type="text" placeholder="XXXX XXXX XXXX XXXX" className="py-2" />
                </Form.Group>
                <Row>
                    <Col>
                        <Form.Group className="mb-3">
                            <Form.Label className="x-small fw-bold text-muted">EXPIRY</Form.Label>
                            <Form.Control type="text" placeholder="MM / YY" className="py-2" />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group className="mb-3">
                            <Form.Label className="x-small fw-bold text-muted">CVV</Form.Label>
                            <Form.Control type="password" placeholder="XXX" className="py-2" />
                        </Form.Group>
                    </Col>
                </Row>
                <Button variant="danger" className="w-100 py-2 fw-bold mt-3 shadow-sm" onClick={handlePayment}>
                    Pay ₹{amount.toLocaleString()}
                </Button>
             </Form>
          </div>
        );

      case 'upi':
        return (
          <div className="p-3 text-center">
            <Button variant="link" className="p-0 text-muted mb-3 text-decoration-none w-100 text-start" onClick={() => setStep('methods')}>
                <i className="bi bi-arrow-left me-1"></i> Back
             </Button>
             <h5 className="fw-bold mb-3">UPI Payment</h5>
             <div className="bg-light p-4 rounded-3 mb-4 d-inline-block border">
                <i className="bi bi-qr-code fs-1 opacity-25"></i>
                <p className="x-small text-muted mt-2 mb-0">Scan QR or enter VPA</p>
             </div>
             <Form.Group className="mb-4">
                <Form.Control type="text" placeholder="e.g. user@okaxis" className="text-center py-2" />
             </Form.Group>
             <Button variant="success" className="w-100 py-2 fw-bold shadow-sm" onClick={handlePayment}>
                Verify & Pay
             </Button>
          </div>
        );

      case 'processing':
        return (
          <div className="p-5 text-center">
            <div className="spinner-border text-danger mb-4" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <h5 className="fw-bold">Processing your payment...</h5>
            <p className="text-muted">Please do not refresh or close this window.</p>
          </div>
        );

      case 'success':
        return (
          <div className="p-5 text-center animate__animated animate__fadeIn">
            <div className="success-icon mb-4">
              <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '5rem' }}></i>
            </div>
            <h4 className="fw-bold">Payment Successful!</h4>
            <p className="text-muted">Your account is being upgraded.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered className="payment-gateway-modal" backdrop="static">
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="x-small fw-bold text-uppercase opacity-50 letter-spacing-1">SECURE CHECKOUT</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        {renderContent()}
      </Modal.Body>
      <Modal.Footer className="border-0 bg-light p-2 justify-content-center">
         <div className="d-flex align-items-center gap-2 x-small text-muted">
            <i className="bi bi-lock-fill"></i>
            <span>Powering Industrial Times Secure Payments</span>
         </div>
      </Modal.Footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .payment-gateway-modal {
          z-index: 20001 !important;
        }
        .payment-gateway-modal .modal-backdrop {
          z-index: 20000 !important;
        }
        .payment-gateway-modal .modal-content {
          border-radius: 12px;
          border: none;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .letter-spacing-1 { letter-spacing: 1px; }
      `}} />
    </Modal>
  );
};

export default PaymentGatewayModal;
