import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../config/api';

const iconOptions = [
  'bi-briefcase', 'bi-building', 'bi-stars', 'bi-trophy', 'bi-gem',
  'bi-rocket-takeoff', 'bi-lightning-charge', 'bi-award', 'bi-shield-check',
  'bi-crown', 'bi-diamond', 'bi-globe', 'bi-graph-up-arrow', 'bi-cpu'
];

const ManagePlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [actionMsg, setActionMsg] = useState({ text: '', type: '' });
  const [featureInput, setFeatureInput] = useState('');

  const emptyPlan = {
    planKey: '',
    name: '',
    priceMonthly: 0,
    priceQuarterly: 0,
    priceYearly: 0,
    features: [],
    color: '#3b82f6',
    icon: 'bi-briefcase',
    recommended: false,
    active: true,
    sortOrder: 0,
    description: ''
  };

  const [formData, setFormData] = useState(emptyPlan);

  const fetchPlans = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/plans`);
      setPlans(data || []);
    } catch (err) {
      console.error('Failed to fetch plans', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const showMessage = (text, type = 'success') => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg({ text: '', type: '' }), 4000);
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({ ...emptyPlan, sortOrder: plans.length + 1 });
    setFeatureInput('');
    setShowModal(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setFormData({
      planKey: plan.planKey,
      name: plan.name,
      priceMonthly: plan.priceMonthly,
      priceQuarterly: plan.priceQuarterly,
      priceYearly: plan.priceYearly,
      features: plan.features || [],
      color: plan.color,
      icon: plan.icon,
      recommended: plan.recommended,
      active: plan.active,
      sortOrder: plan.sortOrder,
      description: plan.description || ''
    });
    setFeatureInput('');
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingPlan) {
        await axios.put(`${API_BASE}/api/plans/${editingPlan.id}`, formData);
        showMessage(`Plan "${formData.name}" updated successfully!`);
      } else {
        await axios.post(`${API_BASE}/api/plans`, formData);
        showMessage(`Plan "${formData.name}" created successfully!`);
      }
      setShowModal(false);
      fetchPlans();
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to save plan', 'error');
    }
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`Are you sure you want to delete the "${plan.name}" plan?`)) return;
    try {
      await axios.delete(`${API_BASE}/api/plans/${plan.id}`);
      showMessage(`Plan "${plan.name}" deleted.`);
      fetchPlans();
    } catch (err) {
      showMessage('Failed to delete plan', 'error');
    }
  };

  const handleToggleRecommended = async (plan) => {
    try {
      await axios.put(`${API_BASE}/api/plans/${plan.id}`, {
        recommended: !plan.recommended
      });
      showMessage(plan.recommended
        ? `"${plan.name}" is no longer recommended.`
        : `"${plan.name}" is now marked as RECOMMENDED!`
      );
      fetchPlans();
    } catch (err) {
      showMessage('Failed to update', 'error');
    }
  };

  const handleToggleActive = async (plan) => {
    try {
      await axios.put(`${API_BASE}/api/plans/${plan.id}`, {
        active: !plan.active
      });
      showMessage(plan.active
        ? `"${plan.name}" plan deactivated.`
        : `"${plan.name}" plan activated.`
      );
      fetchPlans();
    } catch (err) {
      showMessage('Failed to update', 'error');
    }
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData({ ...formData, features: [...formData.features, featureInput.trim()] });
      setFeatureInput('');
    }
  };

  const removeFeature = (idx) => {
    setFormData({ ...formData, features: formData.features.filter((_, i) => i !== idx) });
  };

  return (
    <div className="admin-light-page p-4 fade-in">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="new-page-title mb-1">Corporate Plans Management</h2>
          <p className="text-muted small mb-0">Create, edit, and manage corporate subscription plans</p>
        </div>
        <button className="btn btn-danger fw-bold rounded-pill px-4 shadow-sm" onClick={openCreateModal}>
          <i className="bi bi-plus-lg me-2"></i>Create New Plan
        </button>
      </div>

      {/* Action Messages */}
      {actionMsg.text && (
        <div className={`alert ${actionMsg.type === 'error' ? 'alert-danger' : 'alert-success'} alert-dismissible fade show py-2 fw-bold small rounded-3`}>
          <i className={`bi ${actionMsg.type === 'error' ? 'bi-x-circle-fill' : 'bi-check-circle-fill'} me-2`}></i>
          {actionMsg.text}
          <button type="button" className="btn-close" onClick={() => setActionMsg({ text: '', type: '' })}></button>
        </div>
      )}

      {/* Plans Grid */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
      ) : plans.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-4 shadow-sm">
          <i className="bi bi-collection text-muted" style={{ fontSize: '3rem', display: 'block', marginBottom: '12px', opacity: 0.3 }}></i>
          <p className="text-muted fw-bold mb-1">No Plans Created Yet</p>
          <p className="text-muted small mb-3">Create your first corporate plan to get started.</p>
          <button className="btn btn-danger btn-sm fw-bold rounded-pill px-4" onClick={openCreateModal}>
            <i className="bi bi-plus-lg me-1"></i>Create Plan
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {plans.map((plan) => (
            <div key={plan.id} className="col-lg-3 col-md-6">
              <div
                className="bg-white rounded-4 shadow-sm overflow-hidden h-100 d-flex flex-column position-relative"
                style={{
                  border: plan.recommended ? `2px solid ${plan.color}` : '1px solid #e5e7eb',
                  opacity: plan.active ? 1 : 0.6,
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Recommended Banner */}
                {plan.recommended && (
                  <div className="text-center py-2 text-white fw-bold small" style={{ background: plan.color, letterSpacing: '1.5px', fontSize: '0.7rem' }}>
                    <i className="bi bi-star-fill me-1"></i> RECOMMENDED
                  </div>
                )}

                {/* Card Header */}
                <div className="p-4 pb-3">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px', background: plan.color, color: '#fff', fontSize: '1.2rem' }}>
                      <i className={`bi ${plan.icon}`}></i>
                    </div>
                    <div>
                      <h6 className="mb-0 fw-black text-muted" style={{ fontSize: '0.78rem', letterSpacing: '1.5px' }}>{plan.name}</h6>
                      <small className="text-muted" style={{ fontSize: '0.7rem' }}>Key: {plan.planKey}</small>
                    </div>
                    {!plan.active && <span className="badge bg-secondary ms-auto">INACTIVE</span>}
                  </div>

                  {/* Prices */}
                  <div className="mb-3">
                    <div className="d-flex align-items-baseline gap-1 mb-1">
                      <span className="fw-black" style={{ fontSize: '1.8rem', lineHeight: 1 }}>₹{plan.priceMonthly?.toLocaleString()}</span>
                      <span className="text-muted small">/mo</span>
                    </div>
                    <div className="d-flex gap-3 text-muted" style={{ fontSize: '0.72rem' }}>
                      <span>₹{plan.priceQuarterly?.toLocaleString()}/qtr</span>
                      <span>₹{plan.priceYearly?.toLocaleString()}/yr</span>
                    </div>
                  </div>

                  {/* Description */}
                  {plan.description && (
                    <p className="text-muted small mb-3" style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>{plan.description}</p>
                  )}
                </div>

                {/* Features */}
                <div className="px-4 pb-3 flex-grow-1">
                  <h6 className="fw-bold small text-muted text-uppercase mb-2" style={{ fontSize: '0.68rem', letterSpacing: '1px' }}>Features</h6>
                  <div className="d-flex flex-column gap-1">
                    {(plan.features || []).map((f, idx) => (
                      <div key={idx} className="d-flex align-items-center gap-2" style={{ fontSize: '0.8rem' }}>
                        <i className="bi bi-check-circle-fill" style={{ color: plan.color, fontSize: '0.75rem' }}></i>
                        <span className="text-dark">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-3 border-top d-flex gap-2 flex-wrap">
                  <button className="btn btn-sm btn-outline-primary rounded-pill fw-bold flex-grow-1" style={{ fontSize: '0.75rem' }} onClick={() => openEditModal(plan)}>
                    <i className="bi bi-pencil me-1"></i>Edit
                  </button>
                  <button
                    className={`btn btn-sm rounded-pill fw-bold ${plan.recommended ? 'btn-warning' : 'btn-outline-warning'}`}
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => handleToggleRecommended(plan)}
                    title={plan.recommended ? 'Remove Recommended' : 'Set as Recommended'}
                  >
                    <i className={`bi ${plan.recommended ? 'bi-star-fill' : 'bi-star'}`}></i>
                  </button>
                  <button
                    className={`btn btn-sm rounded-pill fw-bold ${plan.active ? 'btn-outline-success' : 'btn-success'}`}
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => handleToggleActive(plan)}
                    title={plan.active ? 'Deactivate' : 'Activate'}
                  >
                    <i className={`bi ${plan.active ? 'bi-eye-fill' : 'bi-eye-slash'}`}></i>
                  </button>
                  <button className="btn btn-sm btn-outline-danger rounded-pill fw-bold" style={{ fontSize: '0.75rem' }} onClick={() => handleDelete(plan)}>
                    <i className="bi bi-trash3"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-0 p-4" style={{ background: formData.color }}>
                <h5 className="modal-title fw-bold text-white">
                  <i className={`bi ${editingPlan ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
                  {editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create New Plan'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body p-4">

                {/* Basic Info */}
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-muted text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Plan Key (unique)</label>
                    <input type="text" className="form-control" placeholder="e.g. premium_plus" value={formData.planKey} onChange={e => setFormData({ ...formData, planKey: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-muted text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Display Name</label>
                    <input type="text" className="form-control" placeholder="e.g. ENTERPRISE" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-muted text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Sort Order</label>
                    <input type="number" className="form-control" value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="form-label fw-bold small text-muted text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Description</label>
                  <input type="text" className="form-control" placeholder="Short description of this plan" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>

                {/* Pricing */}
                <h6 className="fw-bold mb-3"><i className="bi bi-currency-rupee me-1"></i>Pricing</h6>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-muted">Monthly (₹)</label>
                    <input type="number" className="form-control" value={formData.priceMonthly} onChange={e => setFormData({ ...formData, priceMonthly: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-muted">Quarterly (₹)</label>
                    <input type="number" className="form-control" value={formData.priceQuarterly} onChange={e => setFormData({ ...formData, priceQuarterly: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-muted">Yearly (₹)</label>
                    <input type="number" className="form-control" value={formData.priceYearly} onChange={e => setFormData({ ...formData, priceYearly: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>

                {/* Appearance */}
                <h6 className="fw-bold mb-3"><i className="bi bi-palette me-1"></i>Appearance</h6>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-muted">Brand Color</label>
                    <div className="d-flex align-items-center gap-2">
                      <input type="color" className="form-control form-control-color border-0 shadow-sm" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} style={{ width: '50px', height: '38px' }} />
                      <input type="text" className="form-control" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} />
                    </div>
                  </div>
                  <div className="col-md-8">
                    <label className="form-label fw-bold small text-muted">Icon</label>
                    <div className="d-flex flex-wrap gap-2">
                      {iconOptions.map(ic => (
                        <button
                          key={ic}
                          className={`btn btn-sm rounded-3 ${formData.icon === ic ? 'text-white' : 'btn-outline-secondary'}`}
                          style={formData.icon === ic ? { background: formData.color, borderColor: formData.color } : {}}
                          onClick={() => setFormData({ ...formData, icon: ic })}
                        >
                          <i className={`bi ${ic}`}></i>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Features */}
                <h6 className="fw-bold mb-3"><i className="bi bi-list-check me-1"></i>Features</h6>
                <div className="mb-3">
                  <div className="d-flex gap-2 mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Type a feature and press Add"
                      value={featureInput}
                      onChange={e => setFeatureInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                    />
                    <button className="btn btn-primary fw-bold px-4" onClick={addFeature}>
                      <i className="bi bi-plus"></i> Add
                    </button>
                  </div>
                  <div className="d-flex flex-column gap-1">
                    {formData.features.map((f, idx) => (
                      <div key={idx} className="d-flex align-items-center gap-2 bg-light rounded-3 px-3 py-2">
                        <i className="bi bi-check-circle-fill" style={{ color: formData.color }}></i>
                        <span className="flex-grow-1 small fw-medium">{f}</span>
                        <button className="btn btn-sm p-0 text-danger border-0" onClick={() => removeFeature(idx)}>
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                    ))}
                    {formData.features.length === 0 && <p className="text-muted small mb-0">No features added yet.</p>}
                  </div>
                </div>

                {/* Toggles */}
                <h6 className="fw-bold mb-3"><i className="bi bi-toggles me-1"></i>Settings</h6>
                <div className="d-flex gap-4 flex-wrap">
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="toggleRecommended" checked={formData.recommended} onChange={e => setFormData({ ...formData, recommended: e.target.checked })} />
                    <label className="form-check-label fw-bold small" htmlFor="toggleRecommended">
                      <i className="bi bi-star-fill text-warning me-1"></i>Recommended / Best Plan
                    </label>
                  </div>
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="toggleActive" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} />
                    <label className="form-check-label fw-bold small" htmlFor="toggleActive">
                      <i className="bi bi-eye-fill text-success me-1"></i>Active (visible to users)
                    </label>
                  </div>
                </div>

                {/* Live Preview */}
                <div className="mt-4 p-4 rounded-4" style={{ background: '#0f172a' }}>
                  <h6 className="fw-bold small text-white mb-3">
                    <i className="bi bi-eye me-1"></i>Live Preview
                  </h6>
                  <div className="rounded-4 overflow-hidden" style={{ background: 'rgba(30,41,59,0.8)', border: `1px solid ${formData.recommended ? formData.color : 'rgba(255,255,255,0.08)'}`, maxWidth: '280px' }}>
                    {formData.recommended && (
                      <div className="text-center py-2 text-white fw-bold" style={{ background: formData.color, fontSize: '0.65rem', letterSpacing: '2px' }}>
                        <i className="bi bi-star-fill me-1"></i> MOST POPULAR
                      </div>
                    )}
                    <div className="p-4">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: formData.color, color: '#fff' }}>
                          <i className={`bi ${formData.icon}`}></i>
                        </div>
                      </div>
                      <h6 className="text-white-50 fw-black mb-2" style={{ fontSize: '0.78rem', letterSpacing: '1.5px' }}>{formData.name || 'PLAN NAME'}</h6>
                      <div className="d-flex align-items-baseline gap-1 mb-3">
                        <span className="text-white fw-black" style={{ fontSize: '1.5rem' }}>₹{(formData.priceMonthly || 0).toLocaleString()}</span>
                        <span className="text-white-50 small">/mo</span>
                      </div>
                      {formData.features.slice(0, 4).map((f, i) => (
                        <div key={i} className="d-flex align-items-center gap-2 mb-1" style={{ fontSize: '0.75rem' }}>
                          <i className="bi bi-check-circle-fill" style={{ color: formData.color }}></i>
                          <span className="text-white-50">{f}</span>
                        </div>
                      ))}
                      {formData.features.length > 4 && (
                        <span className="text-white-50" style={{ fontSize: '0.7rem' }}>+{formData.features.length - 4} more features</span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
              <div className="modal-footer bg-light border-0 p-3 d-flex justify-content-between">
                <button className="btn btn-outline-secondary px-4 fw-bold rounded-pill" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-danger px-5 fw-bold rounded-pill shadow-sm" onClick={handleSave}>
                  <i className={`bi ${editingPlan ? 'bi-check-lg' : 'bi-plus-lg'} me-1`}></i>
                  {editingPlan ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePlans;
