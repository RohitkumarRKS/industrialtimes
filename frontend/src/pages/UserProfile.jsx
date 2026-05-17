import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PaymentGatewayModal from '../components/PaymentGatewayModal';
import API_BASE from '../config/api';

const UserProfile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = sessionStorage.getItem('userInfo');
    if (saved) {
      setUserInfo(JSON.parse(saved));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    // Fetch articles for author dashboard
    const fetchArticles = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/articles`);
        setArticles(data || []);
      } catch (e) {
        console.error('Failed to fetch articles');
      }
    };
    fetchArticles();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const updatedUser = { ...userInfo, profilePic: data.imageUrl };
      setUserInfo(updatedUser);
      sessionStorage.setItem('userInfo', JSON.stringify(updatedUser));
      alert('Profile picture updated!');
    } catch (err) {
      alert('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('userInfo');
    navigate('/login');
  };

  const planPrices = {
    basic: { monthly: 2500 },
    standard: { monthly: 4500 },
    premium: { monthly: 9500 },
    pro: { monthly: 20000 }
  };

  const planLabels = {
    basic: 'STARTER',
    standard: 'BUSINESS',
    premium: 'ENTERPRISE',
    pro: 'EXECUTIVE'
  };

  const onPaymentSuccess = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/membership/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userInfo.id,
          planId: userInfo.selectedPlan,
          billingCycle: 'monthly',
          razorpay_payment_id: 'mock_pay_' + Date.now(),
          mock: true
        })
      });

      if (res.ok) {
        const updatedUser = { ...userInfo, membershipPlan: userInfo.selectedPlan };
        setUserInfo(updatedUser);
        sessionStorage.setItem('userInfo', JSON.stringify(updatedUser));
        setShowPayment(false);
        alert(`Success! You are now a ${planLabels[userInfo.selectedPlan] || userInfo.selectedPlan} member.`);
      }
    } catch (e) {
      alert("Payment recorded. Please refresh.");
      setShowPayment(false);
    }
  };

  if (!userInfo) return null;

  const role = userInfo.role;
  const myArticles = articles.filter(a => 
    a.author && a.author.toLowerCase() === userInfo.name.toLowerCase()
  );
  const totalViews = myArticles.reduce((sum, a) => sum + (a.views || 0), 0);

  // Role-specific accent colors
  const roleColors = {
    user: { primary: '#3b82f6', gradient: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)' },
    author: { primary: '#10b981', gradient: 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)' },
    corporate: { primary: '#8b5cf6', gradient: 'linear-gradient(135deg, #3b1f7a 0%, #0f172a 100%)' },
    superadmin: { primary: '#da251d', gradient: 'linear-gradient(135deg, #7f1d1d 0%, #0f172a 100%)' }
  };
  const accent = roleColors[role] || roleColors.user;

  const roleLabel = {
    user: 'Reader',
    author: 'Author / Reporter',
    corporate: 'Corporate Account',
    superadmin: 'Super Admin'
  };

  return (
    <div className="profile-page py-5" style={{ background: '#f4f7f6', minHeight: '90vh' }}>
      <Container>
        <Row className="justify-content-center">
          <Col lg={10}>
            <Card className="border-0 shadow-sm overflow-hidden" style={{ borderRadius: '20px' }}>
              {/* Profile Header */}
              <div className="profile-header p-5 text-center text-white position-relative" style={{ background: accent.gradient }}>
                <div className="profile-avatar-wrapper mx-auto mb-3 position-relative" style={{ width: '130px', height: '130px' }}>
                  <img 
                    src={userInfo.profilePic || 'https://via.placeholder.com/150'} 
                    alt={userInfo.name}
                    className="rounded-circle border border-4 border-white shadow-lg w-100 h-100 object-fit-cover"
                  />
                  <label htmlFor="profile-upload" className="avatar-edit-btn position-absolute bottom-0 end-0 text-white rounded-circle d-flex align-items-center justify-content-center cursor-pointer shadow" style={{ width: '38px', height: '38px', background: accent.primary }}>
                    <i className="bi bi-camera-fill"></i>
                    <input type="file" id="profile-upload" className="d-none" onChange={handleFileChange} accept="image/*" />
                  </label>
                </div>
                <h2 className="fw-black mb-1">{userInfo.name}</h2>
                <Badge style={{ background: accent.primary }} className="text-uppercase mb-2" pill>{roleLabel[role]}</Badge>
                {role === 'corporate' && userInfo.companyName && (
                  <p className="mb-0 mt-1 text-white-50" style={{ fontSize: '0.9rem' }}>
                    <i className="bi bi-building me-1"></i>{userInfo.companyName}
                    {userInfo.designation && <span className="ms-2">• {userInfo.designation}</span>}
                  </p>
                )}
              </div>

              <Card.Body className="p-4 p-md-5">
                {/* === STATS ROW === */}
                <Row className="g-3 mb-4">
                  {role === 'user' && (
                    <>
                      <Col md={4}>
                        <div className="stat-box p-3 rounded-4 text-center" style={{ background: '#f0f9ff', border: '1px solid #bfdbfe' }}>
                          <h3 className="fw-black mb-0" style={{ color: '#3b82f6' }}>
                            {userInfo.membershipPlan ? planLabels[userInfo.membershipPlan] || 'Basic' : 'Free'}
                          </h3>
                          <small className="text-muted fw-bold">Current Plan</small>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="stat-box p-3 rounded-4 text-center" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                          <h3 className="fw-black mb-0" style={{ color: '#10b981' }}>∞</h3>
                          <small className="text-muted fw-bold">Articles Read</small>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="stat-box p-3 rounded-4 text-center" style={{ background: '#fefce8', border: '1px solid #fef08a' }}>
                          <h3 className="fw-black mb-0" style={{ color: '#eab308' }}>
                            {new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          </h3>
                          <small className="text-muted fw-bold">Member Since</small>
                        </div>
                      </Col>
                    </>
                  )}

                  {role === 'author' && (
                    <>
                      <Col md={3}>
                        <div className="stat-box p-3 rounded-4 text-center" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                          <h3 className="fw-black mb-0" style={{ color: '#10b981' }}>{myArticles.length}</h3>
                          <small className="text-muted fw-bold">Published</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="stat-box p-3 rounded-4 text-center" style={{ background: '#f0f9ff', border: '1px solid #bfdbfe' }}>
                          <h3 className="fw-black mb-0" style={{ color: '#3b82f6' }}>{totalViews.toLocaleString()}</h3>
                          <small className="text-muted fw-bold">Total Views</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="stat-box p-3 rounded-4 text-center" style={{ background: '#fdf4ff', border: '1px solid #f0abfc' }}>
                          <h3 className="fw-black mb-0" style={{ color: '#a855f7' }}>
                            {myArticles.length > 0 ? Math.round(totalViews / myArticles.length) : 0}
                          </h3>
                          <small className="text-muted fw-bold">Avg Views</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="stat-box p-3 rounded-4 text-center" style={{ background: '#fefce8', border: '1px solid #fef08a' }}>
                          <h3 className="fw-black mb-0" style={{ color: '#eab308' }}>
                            {[...new Set(myArticles.map(a => a.category))].length}
                          </h3>
                          <small className="text-muted fw-bold">Categories</small>
                        </div>
                      </Col>
                    </>
                  )}

                  {role === 'corporate' && (
                    <>
                      <Col md={3}>
                        <div className="stat-box p-3 rounded-4 text-center" style={{ background: '#faf5ff', border: '1px solid #e9d5ff' }}>
                          <h3 className="fw-black mb-0" style={{ color: '#8b5cf6' }}>
                            {userInfo.membershipPlan ? planLabels[userInfo.membershipPlan] : 'None'}
                          </h3>
                          <small className="text-muted fw-bold">Active Plan</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="stat-box p-3 rounded-4 text-center" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                          <h3 className="fw-black mb-0" style={{ color: '#10b981' }}>
                            <i className="bi bi-check-circle-fill"></i>
                          </h3>
                          <small className="text-muted fw-bold">Verified</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="stat-box p-3 rounded-4 text-center" style={{ background: '#f0f9ff', border: '1px solid #bfdbfe' }}>
                          <h3 className="fw-black mb-0" style={{ color: '#3b82f6' }}>
                            {planLabels[userInfo.selectedPlan] || 'Starter'}
                          </h3>
                          <small className="text-muted fw-bold">Selected Plan</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="stat-box p-3 rounded-4 text-center" style={{ background: '#fefce8', border: '1px solid #fef08a' }}>
                          <h3 className="fw-black mb-0" style={{ color: '#eab308' }}>
                            {new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          </h3>
                          <small className="text-muted fw-bold">Member Since</small>
                        </div>
                      </Col>
                    </>
                  )}
                </Row>

                {/* === ACCOUNT INFORMATION === */}
                <div className="profile-details">
                  <h5 className="fw-bold border-bottom pb-3 mb-4">
                    <i className="bi bi-person-lines-fill me-2"></i>Account Information
                  </h5>
                  
                  <Row className="g-4">
                    <Col md={6}>
                      <div className="detail-item">
                        <label className="text-muted x-small fw-bold text-uppercase">Full Name</label>
                        <p className="fw-bold fs-5 mb-0">{userInfo.name}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="detail-item">
                        <label className="text-muted x-small fw-bold text-uppercase">Email Address</label>
                        <p className="fw-bold fs-5 mb-0">{userInfo.email}</p>
                      </div>
                    </Col>
                    {role === 'corporate' && (
                      <>
                        <Col md={6}>
                          <div className="detail-item">
                            <label className="text-muted x-small fw-bold text-uppercase">Company</label>
                            <p className="fw-bold fs-5 mb-0">{userInfo.companyName || 'N/A'}</p>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="detail-item">
                            <label className="text-muted x-small fw-bold text-uppercase">Designation</label>
                            <p className="fw-bold fs-5 mb-0">{userInfo.designation || 'N/A'}</p>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="detail-item">
                            <label className="text-muted x-small fw-bold text-uppercase">Phone</label>
                            <p className="fw-bold fs-5 mb-0">{userInfo.phone || 'N/A'}</p>
                          </div>
                        </Col>
                      </>
                    )}
                    <Col md={6}>
                      <div className="detail-item">
                        <label className="text-muted x-small fw-bold text-uppercase">Account Type</label>
                        <div className="d-flex align-items-center gap-2">
                          <p className="fw-bold fs-5 mb-0 text-uppercase">{roleLabel[role]}</p>
                          <Badge bg="success">Active</Badge>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="detail-item">
                        <label className="text-muted x-small fw-bold text-uppercase">Current Plan</label>
                        <div className="d-flex align-items-center gap-2">
                          <p className="fw-bold fs-5 mb-0 text-uppercase">
                            {userInfo.membershipPlan ? planLabels[userInfo.membershipPlan] || userInfo.membershipPlan : 'Free'}
                          </p>
                          {userInfo.membershipPlan && <Badge bg="success">Active</Badge>}
                        </div>
                      </div>
                    </Col>
                  </Row>

                  {/* === CORPORATE: Purchase Plan CTA === */}
                  {role === 'corporate' && !userInfo.membershipPlan && userInfo.selectedPlan && (
                    <div className="mt-4 p-4 rounded-4" style={{ background: 'linear-gradient(135deg, #faf5ff, #ede9fe)', border: '2px solid #e9d5ff' }}>
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                        <div>
                          <h5 className="fw-black mb-1" style={{ color: '#7c3aed' }}>
                            <i className="bi bi-gift-fill me-2"></i>
                            Activate Your {planLabels[userInfo.selectedPlan]} Plan
                          </h5>
                          <p className="text-muted mb-0 small">
                            Your corporate account is approved! Complete your membership purchase to unlock all features.
                          </p>
                        </div>
                        <Button 
                          onClick={() => setShowPayment(true)}
                          style={{ background: '#7c3aed', border: 'none', fontWeight: 800, padding: '12px 30px', borderRadius: '12px' }}
                          className="shadow-sm"
                        >
                          <i className="bi bi-credit-card me-2"></i>
                          Purchase Plan — ₹{planPrices[userInfo.selectedPlan]?.monthly?.toLocaleString() || '2,500'}/mo
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* === AUTHOR: Recent Articles === */}
                  {role === 'author' && myArticles.length > 0 && (
                    <div className="mt-4">
                      <h5 className="fw-bold border-bottom pb-3 mb-3">
                        <i className="bi bi-file-earmark-text me-2"></i>Your Recent Articles
                      </h5>
                      <div className="d-flex flex-column gap-2">
                        {myArticles.slice(0, 5).map((article) => (
                          <div key={article.id} className="d-flex align-items-center gap-3 p-3 rounded-3 bg-light">
                            <div className="flex-shrink-0" style={{ width: '50px', height: '50px', borderRadius: '10px', overflow: 'hidden', background: '#e5e7eb' }}>
                              {article.imageUrl ? (
                                <img src={`${API_BASE}${article.imageUrl}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div className="d-flex align-items-center justify-content-center w-100 h-100 text-muted">
                                  <i className="bi bi-image"></i>
                                </div>
                              )}
                            </div>
                            <div className="flex-grow-1 min-w-0">
                              <p className="fw-bold mb-0 text-truncate" style={{ fontSize: '0.9rem' }}>{article.title}</p>
                              <small className="text-muted">
                                <Badge bg="light" text="dark" className="me-2">{article.category}</Badge>
                                {article.views || 0} views
                              </small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* === ACTION BUTTONS === */}
                  <div className="mt-5 pt-4 border-top d-flex flex-wrap gap-2">
                    <Button variant="outline-danger" className="fw-bold px-4 rounded-pill">
                      <i className="bi bi-pencil me-2"></i>Edit Profile
                    </Button>
                    {role !== 'corporate' && (
                      <Button variant="danger" className="fw-bold px-4 rounded-pill" onClick={() => navigate('/upgrade')}>
                        <i className="bi bi-rocket-takeoff me-2"></i>Upgrade Membership
                      </Button>
                    )}
                    {role === 'corporate' && !userInfo.membershipPlan && userInfo.selectedPlan && (
                      <Button style={{ background: '#7c3aed', border: 'none' }} className="fw-bold px-4 rounded-pill" onClick={() => setShowPayment(true)}>
                        <i className="bi bi-credit-card me-2"></i>Activate Plan
                      </Button>
                    )}
                    <Button variant="outline-dark" className="fw-bold px-4 rounded-pill" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>Logout
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Payment Gateway Modal for Corporate */}
      {showPayment && userInfo.selectedPlan && (
        <PaymentGatewayModal 
          show={showPayment} 
          onHide={() => setShowPayment(false)}
          amount={planPrices[userInfo.selectedPlan]?.monthly || 2500}
          planName={planLabels[userInfo.selectedPlan] || 'STARTER'}
          billingCycle="monthly"
          onPaymentSuccess={onPaymentSuccess}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .avatar-edit-btn:hover {
          transform: scale(1.1);
          filter: brightness(1.2);
        }
        .letter-spacing-1 { letter-spacing: 1px; }
        .detail-item p { color: #333; }
        .stat-box { transition: all 0.3s ease; }
        .stat-box:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
      `}} />
    </div>
  );
};

export default UserProfile;
