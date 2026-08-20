import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Modal, Form, Spinner, Row, Col, Card } from 'react-bootstrap';
import axios from 'axios';
import API_BASE from '../../config/api';

const ManagePromoCodes = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    applicableTo: 'all',
    maxUses: '',
    minOrderAmount: '0',
    startDate: '',
    endDate: '',
    isActive: true
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const getHeaders = () => {
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || localStorage.getItem('userInfo'));
      return adminInfo?.token ? { headers: { Authorization: `Bearer ${adminInfo.token}` } } : {};
    } catch (e) {
      return {};
    }
  };

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/promo-codes`, getHeaders());
      setPromos(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching promo codes:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleOpenCreate = () => {
    setEditingPromo(null);
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      applicableTo: 'all',
      maxUses: '',
      minOrderAmount: '0',
      startDate: '',
      endDate: '',
      isActive: true
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      applicableTo: promo.applicableTo,
      maxUses: promo.maxUses === null ? '' : promo.maxUses,
      minOrderAmount: promo.minOrderAmount,
      startDate: promo.startDate ? new Date(promo.startDate).toISOString().split('T')[0] : '',
      endDate: promo.endDate ? new Date(promo.endDate).toISOString().split('T')[0] : '',
      isActive: promo.isActive
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleToggleStatus = async (promo) => {
    try {
      const updated = { ...promo, isActive: !promo.isActive };
      await axios.put(`${API_BASE}/api/promo-codes/${promo.id}`, updated, getHeaders());
      fetchPromos();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this promo code? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_BASE}/api/promo-codes/${id}`, getHeaders());
        fetchPromos();
      } catch (err) {
        alert('Failed to delete promo code.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minOrderAmount: parseFloat(formData.minOrderAmount),
        maxUses: formData.maxUses === '' ? null : parseInt(formData.maxUses)
      };

      if (editingPromo) {
        await axios.put(`${API_BASE}/api/promo-codes/${editingPromo.id}`, payload, getHeaders());
      } else {
        await axios.post(`${API_BASE}/api/promo-codes`, payload, getHeaders());
      }

      setShowModal(false);
      fetchPromos();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to save promo code.');
    } finally {
      setSaving(false);
    }
  };

  const getServiceBadge = (applicableTo) => {
    switch (applicableTo) {
      case 'podcast': return <Badge bg="success" className="px-2 py-1">Podcast</Badge>;
      case 'webinar': return <Badge bg="primary" className="px-2 py-1">Webinar</Badge>;
      case 'membership': return <Badge bg="warning" text="dark" className="px-2 py-1">Membership</Badge>;
      case 'reporter': return <Badge bg="info" text="dark" className="px-2 py-1">Reporter</Badge>;
      case 'ad': return <Badge bg="danger" className="px-2 py-1">Ad Banner</Badge>;
      default: return <Badge bg="secondary" className="px-2 py-1">All Platforms</Badge>;
    }
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-black mb-1">Set Promo Codes</h2>
          <p className="text-muted small">Configure coupons and discount offers across all payment touchpoints</p>
        </div>
        <Button variant="danger" onClick={handleOpenCreate} className="rounded-pill shadow-sm px-4 fw-bold">
          <i className="bi bi-plus-circle me-2"></i> Create Promo Code
        </Button>
      </div>

      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="d-flex align-items-center gap-3">
              <div className="bg-danger-subtle text-danger rounded-3 p-3 fs-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                <i className="bi bi-ticket-perforated-fill"></i>
              </div>
              <div>
                <h6 className="text-muted mb-0 small">Total Codes</h6>
                <h4 className="fw-black mb-0">{promos.length}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="d-flex align-items-center gap-3">
              <div className="bg-success-subtle text-success rounded-3 p-3 fs-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                <i className="bi bi-patch-check-fill"></i>
              </div>
              <div>
                <h6 className="text-muted mb-0 small">Active Codes</h6>
                <h4 className="fw-black mb-0">{promos.filter(p => p.isActive).length}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="bg-white rounded-4 shadow-sm overflow-hidden border">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="danger" />
            <p className="text-muted mt-2 small">Loading promo codes...</p>
          </div>
        ) : promos.length > 0 ? (
          <Table hover responsive className="mb-0">
            <thead className="bg-light">
              <tr className="align-middle">
                <th className="border-0 px-4 py-3 small text-uppercase fw-bold">Promo Code</th>
                <th className="border-0 py-3 small text-uppercase fw-bold">Discount Details</th>
                <th className="border-0 py-3 small text-uppercase fw-bold">Applicability</th>
                <th className="border-0 py-3 small text-uppercase fw-bold">Usage Count</th>
                <th className="border-0 py-3 small text-uppercase fw-bold">Validity Period</th>
                <th className="border-0 py-3 small text-uppercase fw-bold">Min Order</th>
                <th className="border-0 py-3 small text-uppercase fw-bold">Status</th>
                <th className="border-0 px-4 py-3 small text-uppercase fw-bold text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((promo) => {
                const now = new Date();
                const isExpired = promo.endDate && new Date(promo.endDate) < now;
                return (
                  <tr key={promo.id} className="align-middle" style={{ opacity: promo.isActive ? 1 : 0.6 }}>
                    <td className="px-4">
                      <span className="font-monospace fw-bold bg-dark text-white px-2 py-1 rounded" style={{ fontSize: '0.9rem', letterSpacing: '1px' }}>
                        {promo.code}
                      </span>
                    </td>
                    <td>
                      <span className="fw-bold fs-6">
                        {promo.discountType === 'percentage' ? `${promo.discountValue}% Off` : `₹${parseFloat(promo.discountValue).toLocaleString()} Flat`}
                      </span>
                    </td>
                    <td>{getServiceBadge(promo.applicableTo)}</td>
                    <td>
                      <span className="fw-medium">
                        {promo.usedCount} / {promo.maxUses === null ? '∞' : promo.maxUses}
                      </span>
                    </td>
                    <td>
                      <span className="small text-muted d-block">
                        {promo.startDate ? new Date(promo.startDate).toLocaleDateString('en-IN') : 'Start Immediately'}
                      </span>
                      <span className="small text-muted d-block fw-bold">
                        {promo.endDate ? (
                          <span className={isExpired ? "text-danger" : ""}>
                            Expires: {new Date(promo.endDate).toLocaleDateString('en-IN')} {isExpired && '(Expired)'}
                          </span>
                        ) : 'Never Expires'}
                      </span>
                    </td>
                    <td>
                      <span className="fw-bold">
                        {parseFloat(promo.minOrderAmount) > 0 ? `₹${parseFloat(promo.minOrderAmount).toLocaleString()}` : 'None'}
                      </span>
                    </td>
                    <td>
                      <Form.Check 
                        type="switch"
                        id={`promo-toggle-${promo.id}`}
                        checked={promo.isActive}
                        onChange={() => handleToggleStatus(promo)}
                      />
                    </td>
                    <td className="px-4 text-end">
                      <div className="d-flex gap-2 justify-content-end">
                        <Button variant="outline-dark" size="sm" className="rounded-pill" onClick={() => handleOpenEdit(promo)}>
                          <i className="bi bi-pencil-fill me-1"></i> Edit
                        </Button>
                        <Button variant="outline-danger" size="sm" className="rounded-pill" onClick={() => handleDelete(promo.id)}>
                          <i className="bi bi-trash-fill"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <div className="text-center py-5 text-muted border border-dashed rounded-3 m-4">
            <i className="bi bi-ticket-perforated display-6 d-block mb-3 opacity-25"></i>
            No promo codes have been created yet. Click "+ Create Promo Code" above to make one.
          </div>
        )}
      </div>

      {/* CREATE / EDIT PROMO CODE MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton className="px-4">
            <Modal.Title className="fw-black">{editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="px-4">
            {errorMsg && <div className="alert alert-danger py-2 small fw-bold">{errorMsg}</div>}
            
            <Row className="g-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Promo Code String (e.g. SAVE20) *</Form.Label>
                  <Form.Control 
                    type="text" 
                    required 
                    placeholder="Enter coupon code (case-insensitive)" 
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  />
                  <Form.Text className="text-muted">No spaces or special characters.</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Platform / Service Target *</Form.Label>
                  <Form.Select 
                    value={formData.applicableTo}
                    onChange={(e) => setFormData({ ...formData, applicableTo: e.target.value })}
                  >
                    <option value="all">All Platforms (Universal)</option>
                    <option value="membership">Corporate Memberships</option>
                    <option value="podcast">Podcast Guest Application</option>
                    <option value="webinar">Webinar Registrations</option>
                    <option value="reporter">Reporter Signup Fee</option>
                    <option value="ad">Ad Request Payments</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Discount Type *</Form.Label>
                  <Form.Select 
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  >
                    <option value="percentage">Percentage (%) Off</option>
                    <option value="flat_amount">Flat Amount (₹) Off</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Discount Value *</Form.Label>
                  <Form.Control 
                    type="number" 
                    required 
                    min="0" 
                    step="0.01"
                    placeholder={formData.discountType === 'percentage' ? "e.g. 15" : "e.g. 500"} 
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Maximum Uses</Form.Label>
                  <Form.Control 
                    type="number" 
                    min="1"
                    placeholder="Unlimited" 
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  />
                  <Form.Text className="text-muted">Total number of times this code can be successfully used. Leave blank for unlimited.</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Minimum Order Amount (₹)</Form.Label>
                  <Form.Control 
                    type="number" 
                    min="0"
                    placeholder="0" 
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                  />
                  <Form.Text className="text-muted">Minimum original amount required to apply this coupon.</Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Start Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                  <Form.Text className="text-muted">Optional. Leave blank to activate immediately.</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">End Date (Expiration Date)</Form.Label>
                  <Form.Control 
                    type="date" 
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                  <Form.Text className="text-muted">Optional. Leave blank for lifetime validity.</Form.Text>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Check 
                    type="switch"
                    id="modal-isActive-switch"
                    label="Promo Code is Active"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="px-4">
            <Button variant="outline-secondary" className="rounded-pill px-3" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" className="rounded-pill px-4 fw-bold" disabled={saving}>
              {saving ? 'Saving...' : editingPromo ? 'Save Changes' : 'Create Promo Code'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ManagePromoCodes;
