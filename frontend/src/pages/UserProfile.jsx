import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UserProfile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = sessionStorage.getItem('userInfo');
    if (saved) {
      setUserInfo(JSON.parse(saved));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:5000/api/upload', formData, {
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

  if (!userInfo) return null;

  return (
    <div className="profile-page py-5" style={{ background: '#f4f7f6', minHeight: '90vh' }}>
      <Container>
        <Row className="justify-content-center">
          <Col lg={8}>
            <Card className="border-0 shadow-sm overflow-hidden" style={{ borderRadius: '20px' }}>
              <div className="profile-header bg-dark p-5 text-center text-white position-relative">
                <div className="profile-avatar-wrapper mx-auto mb-3 position-relative" style={{ width: '150px', height: '150px' }}>
                  <img 
                    src={userInfo.profilePic || 'https://via.placeholder.com/150'} 
                    alt={userInfo.name}
                    className="rounded-circle border border-4 border-white shadow-lg w-100 h-100 object-fit-cover"
                  />
                  <label htmlFor="profile-upload" className="avatar-edit-btn position-absolute bottom-0 end-0 bg-danger text-white rounded-circle d-flex align-items-center justify-content-center cursor-pointer shadow" style={{ width: '40px', height: '40px' }}>
                    <i className="bi bi-camera-fill"></i>
                    <input type="file" id="profile-upload" className="d-none" onChange={handleFileChange} accept="image/*" />
                  </label>
                </div>
                <h2 className="fw-black mb-1">{userInfo.name}</h2>
                <Badge bg="danger" className="text-uppercase letter-spacing-1">{userInfo.role}</Badge>
              </div>

              <Card.Body className="p-4 p-md-5">
                <div className="profile-details">
                  <h5 className="fw-bold border-bottom pb-3 mb-4"><i className="bi bi-person-lines-fill me-2"></i>Account Information</h5>
                  
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
                    <Col md={6}>
                      <div className="detail-item">
                        <label className="text-muted x-small fw-bold text-uppercase">Current Plan</label>
                        <div className="d-flex align-items-center gap-2">
                            <p className="fw-bold fs-5 mb-0 text-uppercase">{userInfo.membershipPlan || 'Basic'}</p>
                            {userInfo.membershipPlan && <Badge bg="success">Active</Badge>}
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="detail-item">
                        <label className="text-muted x-small fw-bold text-uppercase">Member Since</label>
                        <p className="fw-bold fs-5 mb-0">{new Date().toLocaleDateString()}</p>
                      </div>
                    </Col>
                  </Row>

                  <div className="mt-5 pt-4 border-top">
                    <Button variant="outline-danger" className="fw-bold px-4 rounded-pill me-2">
                        Edit Profile
                    </Button>
                    <Button variant="danger" className="fw-bold px-4 rounded-pill" onClick={() => navigate('/upgrade')}>
                        Upgrade Membership
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <style dangerouslySetInnerHTML={{ __html: `
        .profile-header {
          background: linear-gradient(135deg, #111 0%, #333 100%) !important;
        }
        .avatar-edit-btn:hover {
          transform: scale(1.1);
          background: #b91c1c !important;
        }
        .letter-spacing-1 { letter-spacing: 1px; }
        .detail-item p { color: #333; }
      `}} />
    </div>
  );
};

export default UserProfile;
