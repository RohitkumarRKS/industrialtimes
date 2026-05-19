import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config/api';

const PodcastApply = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    website: '',
    background: '',
    earliestAvailability: ''
  });
  const [customData, setCustomData] = useState({});
  const [dynamicFields, setDynamicFields] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [redirectCount, setRedirectCount] = useState(5);

  // Scroll to top and fetch dynamic fields on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchFields = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/podcast/fields`);
        setDynamicFields(res.data);
        
        // Initialize customData state
        const initialCustom = {};
        res.data.forEach(f => {
          initialCustom[f.name] = '';
        });
        setCustomData(initialCustom);
      } catch (err) {
        console.error("Failed to load dynamic fields", err);
      }
    };
    fetchFields();
  }, []);

  useEffect(() => {
    let timer;
    if (success && redirectCount > 0) {
      timer = setTimeout(() => setRedirectCount(redirectCount - 1), 1000);
    } else if (success && redirectCount === 0) {
      navigate('/');
    }
    return () => clearTimeout(timer);
  }, [success, redirectCount, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCustomChange = (e, fieldName) => {
    setCustomData({ ...customData, [fieldName]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await axios.post(`${API_BASE}/api/podcast`, { ...formData, customData });
      setSuccess(true);
      setRedirectCount(5);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        website: '',
        background: '',
        earliestAvailability: ''
      });
      // Scroll to top to see success message
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit application. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container className="py-5 text-center podcast-apply-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="podcast-success-card shadow-lg rounded-4 p-5 bg-white border border-light" style={{ maxWidth: '600px', width: '100%' }}>
          <div className="success-icon mb-4">
            <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '5rem', dropShadow: '0 10px 15px rgba(25, 135, 84, 0.2)' }}></i>
          </div>
          <h2 className="fw-black mb-3">Application Submitted!</h2>
          <p className="text-muted mb-4 fs-5">Thank you for your interest in the Industrial Times Podcast.</p>
          <div className="bg-light p-4 rounded-4 mb-4 text-start">
            <p className="text-muted mb-0 small">
              We have sent a confirmation email to <strong className="text-dark">{formData.email}</strong>. Our editorial team will review your application and background details. We will be in touch shortly regarding the next steps.
            </p>
          </div>
          <p className="small text-danger fw-bold mb-4">Redirecting to home page in {redirectCount} seconds...</p>
          <Button variant="danger" className="px-5 py-3 fw-bold rounded-pill shadow-sm podcast-submit-btn w-100" onClick={() => navigate('/')}>
            <i className="bi bi-house-door-fill me-2"></i> Return to Home Now
          </Button>
        </div>
      </Container>
    );
  }

  const renderDynamicField = (field) => {
    switch (field.type) {
      case 'textarea':
        return (
          <Form.Control as="textarea" rows={4} required={field.required} value={customData[field.name] || ''} onChange={(e) => handleCustomChange(e, field.name)} className="py-2 bg-light border-0 shadow-none podcast-input" placeholder={`Enter ${field.label.toLowerCase()}...`} />
        );
      case 'select':
        const options = Array.isArray(field.options) ? field.options : [];
        return (
          <Form.Select required={field.required} value={customData[field.name] || ''} onChange={(e) => handleCustomChange(e, field.name)} className="py-2 bg-light border-0 shadow-none podcast-input">
            <option value="">Select an option...</option>
            {options.map((opt, idx) => <option key={idx} value={opt}>{opt}</option>)}
          </Form.Select>
        );
      case 'checkbox':
        return (
          <Form.Check type="checkbox" label="Yes, I confirm" required={field.required} checked={customData[field.name] === 'Yes'} onChange={(e) => handleCustomChange({ target: { value: e.target.checked ? 'Yes' : 'No' } }, field.name)} className="podcast-checkbox" />
        );
      default:
        return (
          <Form.Control type={field.type || 'text'} required={field.required} value={customData[field.name] || ''} onChange={(e) => handleCustomChange(e, field.name)} className="py-2 bg-light border-0 shadow-none podcast-input" placeholder={`Enter ${field.label.toLowerCase()}...`} />
        );
    }
  };

  return (
    <div className="podcast-apply-page bg-light py-5">
      <Container>
        <Row className="justify-content-center">
          <Col lg={8} xl={7}>
            <div className="podcast-apply-header text-center mb-5 reveal-up">
              <Badge className="bg-danger text-white mb-3 px-4 py-2 rounded-pill shadow-sm fs-6" style={{ letterSpacing: '2px' }}>BE OUR GUEST</Badge>
              <h1 className="fw-black display-4 mb-3 text-dark">Join The Podcast</h1>
              <p className="lead text-muted px-md-5">
                Share your expertise, innovations, and insights with our global audience of industry professionals. Let us know what topic you'd like to discuss!
              </p>
            </div>

            <div className="podcast-apply-card bg-white p-4 p-md-5 rounded-4 shadow border border-light reveal-up-delayed">
              {error && (
                <div className="alert alert-danger d-flex align-items-center mb-4">
                  <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
                  <div>{error}</div>
                </div>
              )}

              <Form onSubmit={handleSubmit}>
                <Row className="mb-4">
                  <Form.Group as={Col} md={6} className="mb-4 mb-md-0">
                    <Form.Label className="fw-bold small mb-2 text-uppercase text-muted">First Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      type="text" 
                      name="firstName"
                      placeholder="e.g. Sarah" 
                      required 
                      value={formData.firstName}
                      onChange={handleChange}
                      className="py-2 bg-light border-0 shadow-none"
                    />
                  </Form.Group>
                  <Form.Group as={Col} md={6}>
                    <Form.Label className="fw-bold small mb-2 text-uppercase text-muted">Last Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      type="text" 
                      name="lastName"
                      placeholder="e.g. Kirkwold" 
                      required 
                      value={formData.lastName}
                      onChange={handleChange}
                      className="py-2 bg-light border-0 shadow-none"
                    />
                  </Form.Group>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold small mb-2 text-uppercase text-muted">Email Address <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    type="email" 
                    name="email"
                    placeholder="sarah.k@example.com" 
                    required 
                    value={formData.email}
                    onChange={handleChange}
                    className="py-2 bg-light border-0 shadow-none"
                  />
                  <Form.Text className="text-muted x-small">We'll send a confirmation to this address.</Form.Text>
                </Form.Group>

                <Row className="mb-4">
                  <Form.Group as={Col} md={6} className="mb-4 mb-md-0">
                    <Form.Label className="fw-bold small mb-2 text-uppercase text-muted">Phone Number <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      type="tel" 
                      name="phone"
                      placeholder="+1 (555) 000-0000" 
                      required 
                      value={formData.phone}
                      onChange={handleChange}
                      className="py-2 bg-light border-0 shadow-none"
                    />
                  </Form.Group>
                  <Form.Group as={Col} md={6}>
                    <Form.Label className="fw-bold small mb-2 text-uppercase text-muted">Earliest Availability <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      type="date" 
                      name="earliestAvailability"
                      required 
                      value={formData.earliestAvailability}
                      onChange={handleChange}
                      className="py-2 bg-light border-0 shadow-none"
                    />
                  </Form.Group>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold small mb-2 text-uppercase text-muted">Your Website / LinkedIn Profile</Form.Label>
                  <Form.Control 
                    type="url" 
                    name="website"
                    placeholder="https://linkedin.com/in/username" 
                    value={formData.website}
                    onChange={handleChange}
                    className="py-2 bg-light border-0 shadow-none"
                  />
                </Form.Group>

                <Form.Group className="mb-5">
                    <Form.Label className="fw-bold small mb-2 text-uppercase text-muted">Background & Topic Idea <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    as="textarea" 
                    name="background"
                    rows={6} 
                    placeholder="Tell us about your background, expertise, and what topics you'd like to discuss on the podcast..." 
                    required 
                    value={formData.background}
                    onChange={handleChange}
                    className="py-2 bg-light border-0 shadow-none podcast-input"
                  />
                </Form.Group>

                {dynamicFields.length > 0 && (
                  <>
                    <hr className="my-5 text-muted opacity-25" />
                    <h5 className="fw-black mb-4 text-dark">Additional Information</h5>
                    {dynamicFields.map((field) => (
                      <Form.Group className="mb-4" key={field.id}>
                        <Form.Label className="fw-bold small mb-2 text-uppercase text-muted">
                          {field.label} {field.required && <span className="text-danger">*</span>}
                        </Form.Label>
                        {renderDynamicField(field)}
                      </Form.Group>
                    ))}
                  </>
                )}

                <div className="d-grid gap-2 mt-5">
                  <Button 
                    variant="danger" 
                    type="submit" 
                    size="lg" 
                    className="fw-bold py-3 text-uppercase podcast-submit-btn" 
                    disabled={loading}
                  >
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Submitting Application...</>
                    ) : (
                      'Submit Application'
                    )}
                  </Button>
                </div>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default PodcastApply;

// Inject isolated CSS for this component
const style = document.createElement('style');
style.innerHTML = `
  .podcast-apply-page { 
    background-color: #f8f9fa; 
    min-height: 100vh;
  }
  .podcast-apply-card {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .podcast-apply-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 1rem 3rem rgba(0,0,0,.1) !important;
  }
  .podcast-input {
    transition: all 0.3s ease !important;
    border: 2px solid transparent !important;
  }
  .podcast-input:focus {
    background-color: #fff !important;
    border-color: #da251d !important;
    box-shadow: 0 0 0 0.25rem rgba(218, 37, 29, 0.1) !important;
  }
  .podcast-submit-btn { 
    transition: all 0.3s ease; 
    letter-spacing: 1px; 
    border: none;
    background: linear-gradient(135deg, #da251d, #b91d17);
  }
  .podcast-submit-btn:hover { 
    transform: translateY(-3px); 
    box-shadow: 0 10px 20px rgba(218, 37, 29, 0.3) !important; 
    background: linear-gradient(135deg, #b91d17, #da251d);
  }
  .reveal-up {
    animation: revealUp 0.6s ease-out forwards;
  }
  .reveal-up-delayed {
    animation: revealUp 0.6s ease-out 0.2s forwards;
    opacity: 0;
  }
  @keyframes revealUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);
