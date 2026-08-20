import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../config/api';

const ManageAdRequests = ({ adminInfo: propAdminInfo }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [actionMsg, setActionMsg] = useState({ text: '', type: '' });
  const [rejectNotes, setRejectNotes] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [overridePrice, setOverridePrice] = useState('');

  const adminInfo = (() => {
    if (propAdminInfo) return propAdminInfo;
    try {
      const mode = sessionStorage.getItem('portalMode');
      const saved = mode === 'user'
        ? localStorage.getItem('userInfo')
        : (localStorage.getItem('adminInfo') || localStorage.getItem('userInfo'));
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.role === 'superadmin' || parsed.isManager)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  })();
  const config = { headers: { Authorization: `Bearer ${adminInfo?.token}` } };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/api/ad-requests/all`, config);
      setRequests(data || []);
    } catch (err) {
      console.error('Failed to fetch ad requests', err);
      setActionMsg({ text: '❌ Failed to load ad requests: ' + (err.response?.data?.message || err.message), type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  useEffect(() => {
    if (selectedRequest) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedRequest]);

  const handleApprove = async (id, finalPrice) => {
    try {
      await axios.patch(
        `${API_BASE}/api/ad-requests/${id}/approve`,
        {
          adminNotes: rejectNotes[id] || 'Approved and pricing confirmed',
          finalAmount: finalPrice !== undefined ? parseFloat(finalPrice) : undefined
        },
        config
      );
      setActionMsg({ text: '✅ Ad request approved and is now live!', type: 'success' });
      fetchRequests();
      setSelectedRequest(null);
      setRejectNotes({ ...rejectNotes, [id]: '' });
      setTimeout(() => setActionMsg({ text: '', type: '' }), 4000);
    } catch (err) {
      setActionMsg({ text: err.response?.data?.message || 'Failed to approve', type: 'danger' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to completely delete this ad request? This action cannot be undone.")) return;
    try {
      await axios.delete(`${API_BASE}/api/ad-requests/${id}`, config);
      setActionMsg({ text: 'Ad request completely deleted.', type: 'success' });
      fetchRequests();
      setSelectedRequest(null);
      setTimeout(() => setActionMsg({ text: '', type: '' }), 4000);
    } catch (err) {
      setActionMsg({ text: err.response?.data?.message || 'Failed to delete', type: 'danger' });
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm("Are you sure you want to disable and remove this ad?")) return;
    try {
      await axios.patch(`${API_BASE}/api/ad-requests/${id}/revoke`, { adminNotes: rejectNotes[id] || 'Disabled by admin' }, config);
      setActionMsg({ text: 'Ad request disabled and ad banner removed.', type: 'warning' });
      fetchRequests();
      setSelectedRequest(null);
      setRejectNotes({ ...rejectNotes, [id]: '' });
      setTimeout(() => setActionMsg({ text: '', type: '' }), 4000);
    } catch (err) {
      setActionMsg({ text: 'Failed to revoke', type: 'danger' });
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.patch(`${API_BASE}/api/ad-requests/${id}/reject`, { adminNotes: rejectNotes[id] || 'Rejected by admin' }, config);
      setActionMsg({ text: 'Ad request rejected.', type: 'warning' });
      fetchRequests();
      setSelectedRequest(null);
      setTimeout(() => setActionMsg({ text: '', type: '' }), 4000);
    } catch (err) {
      setActionMsg({ text: 'Failed to reject', type: 'danger' });
    }
  };

  const handleEnable = async (id) => {
    try {
      await axios.patch(
        `${API_BASE}/api/ad-requests/${id}/enable`,
        { adminNotes: rejectNotes[id] || 'Re-enabled by admin' },
        config
      );
      setActionMsg({ text: '✅ Ad request re-enabled and campaign is now live!', type: 'success' });
      fetchRequests();
      setSelectedRequest(null);
      setRejectNotes({ ...rejectNotes, [id]: '' });
      setTimeout(() => setActionMsg({ text: '', type: '' }), 4000);
    } catch (err) {
      setActionMsg({ text: err.response?.data?.message || 'Failed to enable ad', type: 'danger' });
    }
  };

  const filtered = requests.filter(r => {
    let matchesStatus = true;
    if (filter === 'pending') {
      matchesStatus = r.status === 'pending' || (r.status === 'paid' && !r.linkedAdId);
    } else if (filter === 'approved') {
      matchesStatus = r.status === 'approved' || (r.status === 'paid' && r.linkedAdId);
    } else if (filter === 'paid') {
      matchesStatus = r.status === 'paid';
    } else if (filter === 'rejected') {
      matchesStatus = r.status === 'rejected';
    } else if (filter === 'disabled') {
      matchesStatus = r.status === 'disabled';
    }

    let matchesUserType = true;
    if (userTypeFilter === 'corporate') {
      matchesUserType = r.userRole === 'corporate';
    } else if (userTypeFilter === 'reporter') {
      matchesUserType = r.userRole === 'author' || r.userRole === 'reporter';
    }
    return matchesStatus && matchesUserType;
  });

  const pendingCount = requests.filter(r => r.status === 'pending' || (r.status === 'paid' && !r.linkedAdId)).length;
  const approvedCount = requests.filter(r => r.status === 'approved' || (r.status === 'paid' && r.linkedAdId)).length;
  const paidCount = requests.filter(r => r.status === 'paid').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;
  const disabledCount = requests.filter(r => r.status === 'disabled').length;

  const SLOT_LABELS = {
    'leaderboard': 'Header Leaderboard (728×90)',
    'right-half-page': 'Right Sidebar (300×600)',
    'article-inline': 'Article Inline (728×90)'
  };

  return (
    <div className="manage-ads-light">
      <div className="manage-ads-header">
        <div>
          <h2 className="manage-ads-title">
            <i className="bi bi-megaphone-fill me-2" style={{ color: '#da251d' }}></i>
            Ad Requests
            {pendingCount > 0 && <span style={{ background: '#da251d', color: '#fff', fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px', marginLeft: '10px', fontWeight: 700 }}>{pendingCount} Pending</span>}
          </h2>
          <p className="manage-ads-subtitle">Review details, adjust quotes, and approve or reject advertisement requests.</p>
        </div>
      </div>

      {actionMsg.text && (
        <div style={{ padding: '12px 20px', borderRadius: '10px', marginBottom: '1rem', fontWeight: 600, fontSize: '0.85rem', background: actionMsg.type === 'success' ? '#f0fdf4' : actionMsg.type === 'warning' ? '#fefce8' : '#fef2f2', color: actionMsg.type === 'success' ? '#15803d' : actionMsg.type === 'warning' ? '#a16207' : '#dc2626', border: `1px solid ${actionMsg.type === 'success' ? '#bbf7d0' : actionMsg.type === 'warning' ? '#fef08a' : '#fecaca'}` }}>
          {actionMsg.text}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'All', count: requests.length },
          { id: 'pending', label: 'Pending', count: pendingCount, isNotification: true },
          { id: 'approved', label: 'Approved & Live', count: approvedCount },
          { id: 'paid', label: 'Paid', count: paidCount },
          { id: 'rejected', label: 'Rejected', count: rejectedCount },
          { id: 'disabled', label: 'Disabled', count: disabledCount }
        ].map(tab => {
          const isSelected = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: isSelected ? '2px solid #da251d' : '1px solid #e5e7eb',
                background: isSelected ? '#da251d' : '#fff',
                color: isSelected ? '#fff' : '#374151',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {tab.label}
              <span
                style={{
                  background: isSelected 
                    ? '#fff' 
                    : (tab.isNotification && tab.count > 0 ? '#da251d' : '#f3f4f6'),
                  color: isSelected 
                    ? '#da251d' 
                    : (tab.isNotification && tab.count > 0 ? '#fff' : '#6b7280'),
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 800
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* User Type Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#4b5563', marginRight: '6px' }}>User Type:</span>
        {[
          { id: 'all', label: 'All Requests', icon: 'bi-people-fill' },
          { id: 'corporate', label: 'Corporate Ads Only', icon: 'bi-building' },
          { id: 'reporter', label: 'Reporter Ads Only', icon: 'bi-person-badge' }
        ].map(ut => (
          <button
            key={ut.id}
            onClick={() => setUserTypeFilter(ut.id)}
            style={{
              padding: '6px 16px', borderRadius: '20px',
              border: userTypeFilter === ut.id ? '1.5px solid #2563eb' : '1px solid #e5e7eb',
              background: userTypeFilter === ut.id ? '#eff6ff' : '#fff',
              color: userTypeFilter === ut.id ? '#2563eb' : '#4b5563',
              fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '6px'
            }}
          >
            <i className={`bi ${ut.icon}`}></i>
            {ut.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
          <p>No {filter !== 'all' ? filter : ''} ad requests found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(req => (
            <div key={req.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '1.2rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{req.adTitle}</h4>
                    <span style={{
                      padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                      background: req.status === 'pending' ? '#fefce8' : req.status === 'approved' ? '#eff6ff' : req.status === 'paid' ? (req.linkedAdId ? '#f0fdf4' : '#fef2f2') : req.status === 'disabled' ? '#f3f4f6' : '#fef2f2',
                      color: req.status === 'pending' ? '#a16207' : req.status === 'approved' ? '#2563eb' : req.status === 'paid' ? (req.linkedAdId ? '#15803d' : '#dc2626') : req.status === 'disabled' ? '#4b5563' : '#dc2626',
                      border: `1px solid ${req.status === 'pending' ? '#fef08a' : req.status === 'approved' ? '#bfdbfe' : req.status === 'paid' ? (req.linkedAdId ? '#bbf7d0' : '#fecaca') : req.status === 'disabled' ? '#e5e7eb' : '#fecaca'}`
                    }}>
                      {req.status === 'paid' 
                        ? (req.linkedAdId ? 'paid (live)' : 'paid (pending approval)') 
                        : req.status === 'approved' 
                          ? 'approved (awaiting payment)' 
                          : req.status}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.82rem', color: '#6b7280' }}>{req.adDescription || 'No description provided.'}</p>
                  
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.78rem', color: '#9ca3af', marginBottom: '10px' }}>
                    <span><i className="bi bi-building me-1"></i>{req.companyName || 'N/A'}</span>
                    <span><i className="bi bi-envelope me-1"></i>{req.contactEmail}</span>
                    <span><i className="bi bi-layout-text-window me-1"></i>{SLOT_LABELS[req.slot] || req.slot}</span>
                    {req.targetState && <span><i className="bi bi-geo-alt-fill me-1"></i>{req.targetCity ? `${req.targetCity}, ${req.targetState}` : req.targetState}</span>}
                    {req.startDate && <span><i className="bi bi-calendar-range me-1"></i>{req.startDate} → {req.endDate}</span>}
                    {req.pricing?.totalAmount && <span><i className="bi bi-currency-rupee me-1"></i>₹{parseFloat(req.pricing.totalAmount).toLocaleString()}</span>}
                    <span><i className="bi bi-calendar3 me-1"></i>{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedRequest(req);
                      setOverridePrice(req.pricing ? req.pricing.baseAmount : '0');
                    }}
                    style={{
                      padding: '6px 14px', borderRadius: '8px', border: '1px solid #3b82f6',
                      background: '#eff6ff', color: '#2563eb', fontWeight: 700, fontSize: '0.78rem',
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    <i className="bi bi-eye-fill"></i> View Details & Actions
                  </button>
                </div>
                {req.imageUrl && (
                  <div style={{ flexShrink: 0, cursor: 'pointer' }} onClick={() => { setSelectedRequest(req); setOverridePrice(req.pricing ? req.pricing.baseAmount : '0'); }}>
                    <img src={req.imageUrl.startsWith('http') ? req.imageUrl : `${API_BASE}${req.imageUrl}`} alt="Ad Preview" style={{ width: '120px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── DETAILS & ACTION MODAL ── */}
      {selectedRequest && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden" style={{ background: '#fff' }}>
              <div className="modal-header bg-danger text-white border-0 p-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h5 className="modal-title fw-bold text-white mb-0" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <i className="bi bi-info-circle-fill"></i>
                  Ad Campaign Review
                </h5>
                <button 
                  type="button" 
                  onClick={() => setSelectedRequest(null)} 
                  style={{ 
                    border: 'none', 
                    background: 'none', 
                    color: '#fff', 
                    fontSize: '1.5rem', 
                    cursor: 'pointer',
                    opacity: 0.85,
                    transition: 'opacity 0.25s',
                    padding: '0',
                    lineHeight: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.85'}
                >
                  <i className="bi bi-x-lg" style={{ WebkitTextStroke: '1px' }}></i>
                </button>
              </div>
              <div className="modal-body p-4 text-dark" style={{ overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Ad Title</span>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#111827' }}>{selectedRequest.adTitle}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Status</span>
                    <div>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                        background: selectedRequest.status === 'pending' ? '#fefce8' : selectedRequest.status === 'approved' ? '#eff6ff' : selectedRequest.status === 'paid' ? (selectedRequest.linkedAdId ? '#f0fdf4' : '#fef2f2') : selectedRequest.status === 'disabled' ? '#f3f4f6' : '#fef2f2',
                        color: selectedRequest.status === 'pending' ? '#a16207' : selectedRequest.status === 'approved' ? '#2563eb' : selectedRequest.status === 'paid' ? (selectedRequest.linkedAdId ? '#15803d' : '#dc2626') : selectedRequest.status === 'disabled' ? '#4b5563' : '#dc2626',
                        border: `1px solid ${selectedRequest.status === 'pending' ? '#fef08a' : selectedRequest.status === 'approved' ? '#bfdbfe' : selectedRequest.status === 'paid' ? (selectedRequest.linkedAdId ? '#bbf7d0' : '#fecaca') : selectedRequest.status === 'disabled' ? '#e5e7eb' : '#fecaca'}`
                      }}>
                        {selectedRequest.status === 'paid' 
                          ? (selectedRequest.linkedAdId ? 'paid (live)' : 'paid (pending approval)') 
                          : selectedRequest.status === 'approved' 
                            ? 'approved (awaiting payment)' 
                            : selectedRequest.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Company / Advertiser</span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{selectedRequest.companyName || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Contact Email</span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{selectedRequest.contactEmail}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Placement Slot</span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{SLOT_LABELS[selectedRequest.slot] || selectedRequest.slot}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Target Location</span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                      {selectedRequest.targetCity ? `${selectedRequest.targetCity}, ${selectedRequest.targetState}` : selectedRequest.targetState || 'All India'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Dates & Duration</span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                      {selectedRequest.startDate ? `${selectedRequest.startDate} → ${selectedRequest.endDate}` : 'Not Specified'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Click-Through Link</span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                      {selectedRequest.link ? (
                        <a href={selectedRequest.link} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>{selectedRequest.link}</a>
                      ) : 'No URL link provided'}
                    </div>
                  </div>
                </div>

                {selectedRequest.adDescription && (
                  <div style={{ marginBottom: '1.2rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Description</span>
                    <div style={{ fontSize: '0.84rem', color: '#4b5563', whiteSpace: 'pre-line' }}>{selectedRequest.adDescription}</div>
                  </div>
                )}

                {/* Campaign Banner Image */}
                {selectedRequest.imageUrl && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Ad Banner Image</span>
                    <a href={selectedRequest.imageUrl.startsWith('http') ? selectedRequest.imageUrl : `${API_BASE}${selectedRequest.imageUrl}`} target="_blank" rel="noreferrer">
                      <img
                        src={selectedRequest.imageUrl.startsWith('http') ? selectedRequest.imageUrl : `${API_BASE}${selectedRequest.imageUrl}`}
                        alt="Ad Banner Preview"
                        style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fafafa', cursor: 'zoom-in' }}
                      />
                    </a>
                    <span style={{ fontSize: '0.7rem', color: '#9ca3af', display: 'block', marginTop: '4px', textAlign: 'center' }}>
                      <i className="bi bi-zoom-in"></i> Click image to open in a new tab
                    </span>
                  </div>
                )}

                {/* Price Override Section (Only for Pending) */}
                {selectedRequest.status === 'pending' && (
                  <div style={{
                    background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '12px',
                    padding: '1.2rem', marginBottom: '1.5rem'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', fontWeight: 800, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="bi bi-currency-rupee" style={{ color: '#10b981' }}></i>
                      Confirm or Adjust Price Quote
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4b5563', marginBottom: '4px', display: 'block' }}>Base Price (INR)</label>
                        <input
                          type="number"
                          min="0"
                          value={overridePrice}
                          onChange={e => setOverridePrice(e.target.value)}
                          style={{
                            width: '100%', padding: '8px 12px', borderRadius: '8px',
                            border: '1.5px solid #d1d5db', fontSize: '0.9rem', fontWeight: 700,
                            outline: 'none', background: '#fff'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4b5563', marginBottom: '4px', display: 'block' }}>Total (Base + 18% GST)</label>
                        <div style={{ padding: '8px 12px', fontSize: '1rem', fontWeight: 900, color: '#059669' }}>
                          ₹{Math.round((parseFloat(overridePrice) || 0) * 1.18).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '8px', fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600 }}>
                      {selectedRequest.pricing ? (
                        <>• Default calculated rate: ₹{parseFloat(selectedRequest.pricing.baseAmount).toLocaleString()} base + 18% GST = ₹{parseFloat(selectedRequest.pricing.totalAmount).toLocaleString()} total.</>
                      ) : (
                        <>• No default pricing was set for this location. Please enter a base price.</>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="modal-footer bg-light border-0 p-3" style={{ display: 'block' }}>
                <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', width: '100%' }}>
                  {selectedRequest.status === 'pending' && (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4b5563' }}>Admin Notes (Visible to advertiser)</label>
                        <input
                          type="text"
                          placeholder="Add any instructions, pricing logic or approvals here..."
                          value={rejectNotes[selectedRequest.id] || ''}
                          onChange={e => setRejectNotes({ ...rejectNotes, [selectedRequest.id]: e.target.value })}
                          style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.82rem', width: '100%' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '0.8rem' }}>
                        <button
                          className="btn btn-outline-secondary px-4 fw-bold rounded-pill"
                          onClick={() => setSelectedRequest(null)}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReject(selectedRequest.id)}
                          className="btn btn-danger px-4 fw-bold rounded-pill shadow-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <i className="bi bi-x-circle-fill"></i> Reject Request
                        </button>
                        <button
                          onClick={() => handleApprove(selectedRequest.id, overridePrice)}
                          className="btn btn-success px-4 fw-bold rounded-pill shadow-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <i className="bi bi-check-circle-fill"></i> Approve & Publish Live
                        </button>
                      </div>
                    </>
                  )}

                  {selectedRequest.status === 'paid' && (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4b5563' }}>Admin Notes (Visible to advertiser)</label>
                        <input
                          type="text"
                          placeholder="Add any instructions, approvals or sync details here..."
                          value={rejectNotes[selectedRequest.id] || ''}
                          onChange={e => setRejectNotes({ ...rejectNotes, [selectedRequest.id]: e.target.value })}
                          style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.82rem', width: '100%' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '0.8rem', width: '100%' }}>
                        <button
                          className="btn btn-outline-secondary px-4 fw-bold rounded-pill"
                          onClick={() => setSelectedRequest(null)}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleRevoke(selectedRequest.id)}
                          className="btn btn-warning px-4 fw-bold rounded-pill shadow-sm text-dark"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <i className="bi bi-pause-circle-fill"></i> Disable Ad
                        </button>
                        <button
                          onClick={() => handleApprove(selectedRequest.id, overridePrice)}
                          className="btn btn-success px-4 fw-bold rounded-pill shadow-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <i className="bi bi-check-circle-fill"></i> Approve & Go Live
                        </button>
                      </div>
                    </>
                  )}

                  {selectedRequest.status === 'approved' && (
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.78rem', color: '#4b5563', fontWeight: 700, marginBottom: '4px' }}>Force Sync / Publish Live</div>
                        <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '8px' }}>If the ad is missing from the website, click the button below to force sync the details and publish it.</div>
                        <button
                          onClick={() => handleApprove(selectedRequest.id, overridePrice)}
                          className="btn btn-success px-4 fw-bold rounded-pill shadow-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}
                        >
                          <i className="bi bi-arrow-repeat"></i> Force Publish / Sync to Live
                        </button>

                        <div style={{ fontSize: '0.78rem', color: '#4b5563', fontWeight: 700, marginBottom: '4px', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>Remove or Disable Live Ad Campaign</div>
                        <input
                          type="text"
                          placeholder="Specify reason for disabling (optional)"
                          value={rejectNotes[selectedRequest.id] || ''}
                          onChange={e => setRejectNotes({ ...rejectNotes, [selectedRequest.id]: e.target.value })}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.75rem' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '3.2rem' }}>
                        <button
                          className="btn btn-outline-secondary px-4 fw-bold rounded-pill"
                          onClick={() => setSelectedRequest(null)}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleRevoke(selectedRequest.id)}
                          className="btn btn-warning px-4 fw-bold rounded-pill shadow-sm text-dark"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <i className="bi bi-pause-circle-fill"></i> Disable Ad
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedRequest.status === 'disabled' && (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4b5563' }}>Admin Notes (Visible to advertiser)</label>
                        <input
                          type="text"
                          placeholder="Add any instructions, approvals or sync details here..."
                          value={rejectNotes[selectedRequest.id] || ''}
                          onChange={e => setRejectNotes({ ...rejectNotes, [selectedRequest.id]: e.target.value })}
                          style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.82rem', width: '100%' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '0.8rem', width: '100%' }}>
                        <button
                          className="btn btn-outline-secondary px-4 fw-bold rounded-pill"
                          onClick={() => setSelectedRequest(null)}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleEnable(selectedRequest.id)}
                          className="btn btn-success px-4 fw-bold rounded-pill shadow-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <i className="bi bi-play-circle-fill"></i> Enable Ad
                        </button>
                      </div>
                    </>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                    <button
                      onClick={() => handleDelete(selectedRequest.id)}
                      className="btn btn-danger px-4 fw-bold rounded-pill shadow-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <i className="bi bi-trash-fill"></i> Permanently Delete Ad Request
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAdRequests;
