import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Modal, Form, Spinner, Row, Col, Tabs, Tab, Card } from 'react-bootstrap';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import API_BASE from '../../config/api';

const ManagePodcast = () => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyData, setReplyData] = useState({ subject: '', message: '' });
  const [sendingReply, setSendingReply] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Form Builder state
  const [formFields, setFormFields] = useState([]);
  const [newField, setNewField] = useState({ name: '', label: '', type: 'text', required: false, options: '' });
  const [loadingFields, setLoadingFields] = useState(false);

  const podcastApplyUrl = `${window.location.origin}/podcast-apply`;

  const fetchGuests = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/podcast`);
      setGuests(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching podcast guests:', err);
      setLoading(false);
    }
  };

  const fetchFields = async () => {
    try {
      setLoadingFields(true);
      const res = await axios.get(`${API_BASE}/api/podcast/fields`);
      setFormFields(res.data);
    } catch (err) {
      console.error("Error fetching fields", err);
    } finally {
      setLoadingFields(false);
    }
  };

  useEffect(() => {
    fetchGuests();
    fetchFields();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.put(`${API_BASE}/api/podcast/${id}/status`, { status });
      fetchGuests();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this registration?')) {
      try {
        await axios.delete(`${API_BASE}/api/podcast/${id}`);
        fetchGuests();
      } catch (err) {
        alert('Failed to delete registration');
      }
    }
  };

  const handleAddField = async (e) => {
    e.preventDefault();
    try {
      // Process options
      let optionsArray = [];
      if (newField.type === 'select' && newField.options) {
        optionsArray = newField.options.split(',').map(s => s.trim()).filter(s => s);
      }
      
      const payload = {
        name: newField.name.replace(/\s+/g, '_').toLowerCase(),
        label: newField.label,
        type: newField.type,
        required: newField.required,
        options: optionsArray,
        order: formFields.length + 1
      };
      await axios.post(`${API_BASE}/api/podcast/fields`, payload);
      setNewField({ name: '', label: '', type: 'text', required: false, options: '' });
      fetchFields();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add field');
    }
  };

  const handleDeleteField = async (id) => {
    if (window.confirm('Delete this form field? It will no longer appear on the application form.')) {
      try {
        await axios.delete(`${API_BASE}/api/podcast/fields/${id}`);
        fetchFields();
      } catch (err) {
        alert('Failed to delete field');
      }
    }
  };

  const openDetails = (guest) => {
    setSelectedGuest(guest);
    setShowModal(true);
  };

  const handleOpenReply = (guest) => {
    setSelectedGuest(guest);
    setReplyData({ 
      subject: `Re: Your Podcast Application - Industrial Times`, 
      message: `Hi ${guest.firstName},\n\n` 
    });
    setShowReplyModal(true);
    setShowModal(false);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    setSendingReply(true);
    try {
      await axios.post(`${API_BASE}/api/podcast/${selectedGuest.id}/reply`, replyData);
      alert('Reply sent successfully!');
      setShowReplyModal(false);
    } catch (err) {
      alert('Failed to send reply. Please check SMTP settings.');
    } finally {
      setSendingReply(false);
    }
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('podcast-qr-code');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'podcast_qr_code.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleShareSystem = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Industrial Times Podcast',
          text: 'Apply to be a guest on the Industrial Times Podcast!',
          url: podcastApplyUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <Badge bg="success">Approved</Badge>;
      case 'rejected': return <Badge bg="danger">Rejected</Badge>;
      default: return <Badge bg="warning" text="dark">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-black mb-1">Podcast Guest Management</h2>
          <p className="text-muted small">Review and manage guest requests for the Industrial Times Podcast</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-danger" onClick={() => setShowShareModal(true)} className="rounded-pill shadow-sm">
            <i className="bi bi-qr-code me-2"></i> Share Link
          </Button>
          <Badge bg="danger" className="p-2 px-3 rounded-pill shadow-sm d-flex align-items-center">
            {guests.filter(g => g.status === 'pending').length} Pending Requests
          </Badge>
        </div>
      </div>

      <Tabs defaultActiveKey="submissions" className="mb-4 custom-tabs">
        <Tab eventKey="submissions" title="Submissions">
          <div className="bg-white rounded-4 shadow-sm overflow-hidden border">
            <Table hover responsive className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 px-4 py-3 small text-uppercase fw-bold">Guest Name</th>
                  <th className="border-0 py-3 small text-uppercase fw-bold">Contact Info</th>
                  <th className="border-0 py-3 small text-uppercase fw-bold">Availability</th>
                  <th className="border-0 py-3 small text-uppercase fw-bold">Status</th>
                  <th className="border-0 px-4 py-3 small text-uppercase fw-bold text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {guests.length > 0 ? (
                  guests.map((guest) => (
                    <tr key={guest.id} className="align-middle">
                      <td className="px-4">
                        <div className="fw-bold">{guest.firstName} {guest.lastName}</div>
                        <div className="x-small text-muted">{guest.website || 'No website'}</div>
                      </td>
                      <td>
                        <div className="small"><i className="bi bi-envelope-fill text-danger me-1"></i> {guest.email}</div>
                        <div className="small"><i className="bi bi-telephone-fill text-muted me-1"></i> {guest.phone}</div>
                      </td>
                      <td className="small fw-bold">
                        {new Date(guest.earliestAvailability).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td>{getStatusBadge(guest.status)}</td>
                      <td className="px-4 text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          <Button variant="outline-dark" size="sm" onClick={() => openDetails(guest)}>
                            View Details
                          </Button>
                          <Button variant="outline-primary" size="sm" onClick={() => handleOpenReply(guest)}>
                            <i className="bi bi-reply-fill"></i> Reply
                          </Button>
                          {guest.status === 'pending' && (
                            <>
                              <Button variant="success" size="sm" onClick={() => handleStatusUpdate(guest.id, 'approved')}>
                                Approve
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => handleStatusUpdate(guest.id, 'rejected')}>
                                Reject
                              </Button>
                            </>
                          )}
                          <Button variant="link" className="text-danger p-0 ms-2" onClick={() => handleDelete(guest.id)}>
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted italic">
                      No podcast guest registrations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="builder" title="Form Builder">
          <Row>
            <Col md={4}>
              <Card className="border-0 shadow-sm rounded-4 mb-4">
                <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
                  <h5 className="fw-black mb-0">Add Custom Field</h5>
                  <p className="text-muted small">Dynamically add fields to your application form</p>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleAddField}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">Field Label</Form.Label>
                      <Form.Control type="text" required placeholder="e.g. LinkedIn URL" value={newField.label} onChange={(e) => setNewField({...newField, label: e.target.value, name: e.target.value})} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">Input Type</Form.Label>
                      <Form.Select required value={newField.type} onChange={(e) => setNewField({...newField, type: e.target.value})}>
                        <option value="text">Short Text</option>
                        <option value="textarea">Long Text (Paragraph)</option>
                        <option value="select">Dropdown (Select)</option>
                        <option value="checkbox">Checkbox (Yes/No)</option>
                        <option value="url">URL</option>
                      </Form.Select>
                    </Form.Group>
                    {newField.type === 'select' && (
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">Options (Comma separated)</Form.Label>
                        <Form.Control type="text" required placeholder="Option 1, Option 2" value={newField.options} onChange={(e) => setNewField({...newField, options: e.target.value})} />
                      </Form.Group>
                    )}
                    <Form.Group className="mb-4">
                      <Form.Check type="switch" label="Make this field required" checked={newField.required} onChange={(e) => setNewField({...newField, required: e.target.checked})} />
                    </Form.Group>
                    <Button variant="danger" type="submit" className="w-100 rounded-pill fw-bold">
                      Add Form Field
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
            <Col md={8}>
              <div className="bg-white rounded-4 shadow-sm overflow-hidden border p-4">
                <h5 className="fw-black mb-4">Active Custom Fields</h5>
                {loadingFields ? (
                  <div className="text-center py-4"><Spinner animation="border" variant="danger" /></div>
                ) : formFields.length > 0 ? (
                  <Table hover responsive>
                    <thead className="bg-light">
                      <tr>
                        <th className="border-0 px-3 py-2 small fw-bold">Label</th>
                        <th className="border-0 py-2 small fw-bold">Type</th>
                        <th className="border-0 py-2 small fw-bold">Required</th>
                        <th className="border-0 px-3 py-2 small fw-bold text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formFields.map(field => (
                        <tr key={field.id} className="align-middle">
                          <td className="px-3 fw-bold">{field.label}</td>
                          <td><Badge bg="secondary" className="text-uppercase">{field.type}</Badge></td>
                          <td>{field.required ? <Badge bg="danger">Yes</Badge> : <Badge bg="light" text="dark">No</Badge>}</td>
                          <td className="px-3 text-end">
                            <Button variant="link" className="text-danger p-0" onClick={() => handleDeleteField(field.id)}>
                              <i className="bi bi-trash-fill"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-center py-5 text-muted border border-dashed rounded-3">
                    <i className="bi bi-ui-checks display-6 d-block mb-3 opacity-25"></i>
                    No custom fields added yet. The default form only asks for basic contact info and background.
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Tab>
      </Tabs>

      {/* Guest Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered className="podcast-modal">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-black">Guest Profile Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedGuest && (
            <div className="row g-4">
              <div className="col-md-6">
                <label className="text-muted small text-uppercase fw-bold mb-1">Full Name</label>
                <div className="h5 fw-bold">{selectedGuest.firstName} {selectedGuest.lastName}</div>
              </div>
              <div className="col-md-6">
                <label className="text-muted small text-uppercase fw-bold mb-1">Email Address</label>
                <div className="h5 fw-bold text-danger">{selectedGuest.email}</div>
              </div>
              <div className="col-md-6">
                <label className="text-muted small text-uppercase fw-bold mb-1">Phone Number</label>
                <div className="h6 fw-bold">{selectedGuest.phone}</div>
              </div>
              <div className="col-md-6">
                <label className="text-muted small text-uppercase fw-bold mb-1">Website</label>
                <div className="h6 fw-bold">
                  {selectedGuest.website ? (
                    <a href={selectedGuest.website.startsWith('http') ? selectedGuest.website : `https://${selectedGuest.website}`} target="_blank" rel="noreferrer">
                      {selectedGuest.website}
                    </a>
                  ) : 'N/A'}
                </div>
              </div>
              <div className="col-12">
                <label className="text-muted small text-uppercase fw-bold mb-1">Background & Topic Idea</label>
                <div className="p-3 bg-light rounded-3 border lh-lg">
                  {selectedGuest.background}
                </div>
              </div>

              {selectedGuest.customData && Object.keys(selectedGuest.customData).length > 0 && (
                <div className="col-12 mt-4">
                  <h6 className="fw-black border-bottom pb-2 mb-3">Additional Information</h6>
                  <div className="row g-3">
                    {Object.entries(selectedGuest.customData).map(([key, value]) => (
                      <div className="col-md-6" key={key}>
                        <label className="text-muted small text-uppercase fw-bold mb-1">{key}</label>
                        <div className="h6 fw-bold bg-light p-2 rounded border">{value || 'N/A'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="col-md-6 mt-4">
                <label className="text-muted small text-uppercase fw-bold mb-1">Available From</label>
                <div className="h6 fw-bold">{selectedGuest.earliestAvailability}</div>
              </div>
              <div className="col-md-6">
                <label className="text-muted small text-uppercase fw-bold mb-1">Current Status</label>
                <div>{getStatusBadge(selectedGuest.status)}</div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="primary" onClick={() => handleOpenReply(selectedGuest)}>
            <i className="bi bi-reply-fill"></i> Reply to Guest
          </Button>
          <Button variant="dark" onClick={() => setShowModal(false)}>Close Details</Button>
        </Modal.Footer>
      </Modal>

      {/* Reply Modal */}
      <Modal show={showReplyModal} onHide={() => setShowReplyModal(false)} size="lg" centered className="podcast-modal">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-black">Reply via Email</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedGuest && (
            <Form onSubmit={handleSendReply}>
              <div className="mb-3">
                <span className="text-muted small fw-bold">To: </span>
                <span className="fw-bold">{selectedGuest.firstName} {selectedGuest.lastName}</span> &lt;{selectedGuest.email}&gt;
              </div>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">Subject</Form.Label>
                <Form.Control 
                  type="text" 
                  required 
                  value={replyData.subject}
                  onChange={(e) => setReplyData({...replyData, subject: e.target.value})}
                />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold small">Message</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={8} 
                  required 
                  value={replyData.message}
                  onChange={(e) => setReplyData({...replyData, message: e.target.value})}
                />
              </Form.Group>
              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={() => setShowReplyModal(false)}>Cancel</Button>
                <Button variant="danger" type="submit" disabled={sendingReply}>
                  {sendingReply ? 'Sending...' : 'Send Email'}
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      {/* Share Modal */}
      <Modal show={showShareModal} onHide={() => setShowShareModal(false)} centered className="podcast-modal">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-black">Share Podcast Application</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-4">
          <p className="text-muted mb-4">Have guests scan this QR code or use the link/social options below to apply for the podcast.</p>
          
          <div className="bg-white p-4 rounded-4 d-inline-block mb-4 shadow-sm border">
            <QRCodeSVG id="podcast-qr-code" value={podcastApplyUrl} size={200} />
          </div>

          <div className="d-flex justify-content-center gap-2 mb-4">
            <Button 
              variant="outline-danger" 
              onClick={downloadQRCode}
              className="rounded-pill px-3 shadow-sm d-flex align-items-center gap-2 btn-sm fw-bold"
            >
              <i className="bi bi-download"></i> Download QR Code
            </Button>
            {navigator.share && (
              <Button 
                variant="outline-primary" 
                onClick={handleShareSystem}
                className="rounded-pill px-3 shadow-sm d-flex align-items-center gap-2 btn-sm fw-bold"
              >
                <i className="bi bi-share-fill"></i> Share via System
              </Button>
            )}
          </div>

          <div className="input-group mb-4 shadow-sm rounded">
            <input type="text" className="form-control bg-light border-end-0 small fw-bold" value={podcastApplyUrl} readOnly />
            <Button 
              variant={copied ? "success" : "dark"}
              className="px-4 fw-bold border-start-0"
              onClick={() => {
                navigator.clipboard.writeText(podcastApplyUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'}`}></i> {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>

          <div className="border-top pt-4 mt-3">
            <h6 className="fw-black mb-3 small text-muted text-uppercase letter-spacing-2">Share to Social Media</h6>
            <div className="d-flex justify-content-center gap-3">
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Apply to be a guest on the Industrial Times Podcast! Fill out the application here: ' + podcastApplyUrl)}`}
                target="_blank" 
                rel="noreferrer"
                className="btn btn-outline-success rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-sm"
                style={{ width: '48px', height: '48px', fontSize: '1.4rem' }}
                title="Share on WhatsApp"
              >
                <i className="bi bi-whatsapp"></i>
              </a>
              <a 
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Apply to be a guest on the Industrial Times Podcast! ')}&url=${encodeURIComponent(podcastApplyUrl)}`}
                target="_blank" 
                rel="noreferrer"
                className="btn btn-outline-dark rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-sm"
                style={{ width: '48px', height: '48px', fontSize: '1.4rem' }}
                title="Share on X (Twitter)"
              >
                <i className="bi bi-twitter-x"></i>
              </a>
              <a 
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(podcastApplyUrl)}`}
                target="_blank" 
                rel="noreferrer"
                className="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-sm"
                style={{ width: '48px', height: '48px', fontSize: '1.4rem' }}
                title="Share on LinkedIn"
              >
                <i className="bi bi-linkedin"></i>
              </a>
              <a 
                href={`mailto:?subject=${encodeURIComponent('Apply to be a guest on the Industrial Times Podcast')}&body=${encodeURIComponent('Hi,\n\nHere is the link to apply for the Industrial Times Podcast:\n\n' + podcastApplyUrl)}`}
                className="btn btn-outline-danger rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-sm"
                style={{ width: '48px', height: '48px', fontSize: '1.4rem' }}
                title="Share via Email"
              >
                <i className="bi bi-envelope"></i>
              </a>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ManagePodcast;
