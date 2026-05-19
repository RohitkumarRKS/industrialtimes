import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../config/api';

const ManageAdRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionMsg, setActionMsg] = useState({ text: '', type: '' });
  const [rejectNotes, setRejectNotes] = useState({});

  const adminInfo = JSON.parse(sessionStorage.getItem('adminInfo'));
  const config = { headers: { Authorization: `Bearer ${adminInfo?.token}` } };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/api/ad-requests/all`, config);
      setRequests(data || []);
    } catch (err) { console.error('Failed to fetch ad requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleApprove = async (id) => {
    try {
      await axios.patch(`${API_BASE}/api/ad-requests/${id}/approve`, { adminNotes: 'Approved and published' }, config);
      setActionMsg({ text: '✅ Ad request approved and published live!', type: 'success' });
      fetchRequests();
      setTimeout(() => setActionMsg({ text: '', type: '' }), 4000);
    } catch (err) {
      setActionMsg({ text: 'Failed to approve', type: 'danger' });
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.patch(`${API_BASE}/api/ad-requests/${id}/reject`, { adminNotes: rejectNotes[id] || 'Rejected by admin' }, config);
      setActionMsg({ text: 'Ad request rejected.', type: 'warning' });
      fetchRequests();
      setTimeout(() => setActionMsg({ text: '', type: '' }), 4000);
    } catch (err) {
      setActionMsg({ text: 'Failed to reject', type: 'danger' });
    }
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const SLOT_LABELS = { 'leaderboard': 'Header (728×90)', 'right-half-page': 'Right Sidebar (300×600)', 'left-skyscraper': 'Left Sidebar (160×600)' };

  return (
    <div className="manage-ads-light">
      <div className="manage-ads-header">
        <div>
          <h2 className="manage-ads-title">
            <i className="bi bi-megaphone-fill me-2" style={{ color: '#da251d' }}></i>
            Corporate Ad Requests
            {pendingCount > 0 && <span style={{ background: '#da251d', color: '#fff', fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px', marginLeft: '10px', fontWeight: 700 }}>{pendingCount} Pending</span>}
          </h2>
          <p className="manage-ads-subtitle">Review, approve, or reject advertisement requests from corporate partners.</p>
        </div>
      </div>

      {actionMsg.text && (
        <div style={{ padding: '12px 20px', borderRadius: '10px', marginBottom: '1rem', fontWeight: 600, fontSize: '0.85rem', background: actionMsg.type === 'success' ? '#f0fdf4' : actionMsg.type === 'warning' ? '#fefce8' : '#fef2f2', color: actionMsg.type === 'success' ? '#15803d' : actionMsg.type === 'warning' ? '#a16207' : '#dc2626', border: `1px solid ${actionMsg.type === 'success' ? '#bbf7d0' : actionMsg.type === 'warning' ? '#fef08a' : '#fecaca'}` }}>
          {actionMsg.text}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '8px 20px', borderRadius: '8px', border: filter === f ? '2px solid #da251d' : '1px solid #e5e7eb', background: filter === f ? '#da251d' : '#fff', color: filter === f ? '#fff' : '#374151', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', textTransform: 'capitalize' }}>
            {f} {f === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
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
                    <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', background: req.status === 'pending' ? '#fefce8' : req.status === 'approved' ? '#f0fdf4' : '#fef2f2', color: req.status === 'pending' ? '#a16207' : req.status === 'approved' ? '#15803d' : '#dc2626', border: `1px solid ${req.status === 'pending' ? '#fef08a' : req.status === 'approved' ? '#bbf7d0' : '#fecaca'}` }}>{req.status}</span>
                  </div>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.82rem', color: '#6b7280' }}>{req.adDescription || 'No description provided.'}</p>
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.78rem', color: '#9ca3af' }}>
                    <span><i className="bi bi-building me-1"></i>{req.companyName || 'N/A'}</span>
                    <span><i className="bi bi-envelope me-1"></i>{req.contactEmail}</span>
                    <span><i className="bi bi-layout-text-window me-1"></i>{SLOT_LABELS[req.slot] || req.slot}</span>
                    <span><i className="bi bi-clock me-1"></i>{req.duration}</span>
                    {req.budget && <span><i className="bi bi-currency-rupee me-1"></i>{req.budget}</span>}
                    <span><i className="bi bi-calendar3 me-1"></i>{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {req.imageUrl && (
                  <div style={{ flexShrink: 0 }}>
                    <img src={req.imageUrl.startsWith('http') ? req.imageUrl : `${API_BASE}${req.imageUrl}`} alt="Ad Preview" style={{ width: '120px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  </div>
                )}
              </div>

              {/* Action Buttons for Pending */}
              {req.status === 'pending' && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => handleApprove(req.id)} style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', background: '#10b981', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                    <i className="bi bi-check-circle-fill me-1"></i>Approve & Publish
                  </button>
                  <input type="text" placeholder="Rejection reason (optional)" value={rejectNotes[req.id] || ''} onChange={e => setRejectNotes({ ...rejectNotes, [req.id]: e.target.value })} style={{ flex: 1, minWidth: '200px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.82rem' }} />
                  <button onClick={() => handleReject(req.id)} style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                    <i className="bi bi-x-circle-fill me-1"></i>Reject
                  </button>
                </div>
              )}

              {/* Admin Notes for processed */}
              {req.status !== 'pending' && req.adminNotes && (
                <div style={{ marginTop: '0.8rem', padding: '8px 14px', borderRadius: '8px', background: '#f9fafb', fontSize: '0.8rem', color: '#6b7280' }}>
                  <i className="bi bi-chat-left-text me-1"></i> <strong>Admin:</strong> {req.adminNotes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageAdRequests;
