import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../config/api';

const ManageBreakingNews = () => {
  const [headlines, setHeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editPriority, setEditPriority] = useState(0);
  const [saving, setSaving] = useState(false);
  const [speed, setSpeed] = useState(35);
  const [updatingSpeed, setUpdatingSpeed] = useState(false);

  const fetchHeadlines = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/settings/breaking-news/all`);
      setHeadlines(data || []);
    } catch (err) {
      console.error('Failed to fetch breaking news', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/settings/seo`);
      setSpeed(data.breakingNewsSpeed || 35);
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  useEffect(() => {
    fetchHeadlines();
    fetchSettings();
  }, []);

  const handleAdd = async () => {
    if (!newText.trim()) return;
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/api/settings/breaking-news`, {
        text: newText.trim(),
        priority: newPriority,
        isActive: true
      });
      setNewText('');
      setNewPriority(0);
      await fetchHeadlines();
    } catch (err) {
      console.error('Failed to add headline', err);
      alert('Failed to add headline');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await axios.put(`${API_BASE}/api/settings/breaking-news/${item.id}`, {
        isActive: !item.isActive
      });
      await fetchHeadlines();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleUpdate = async (id) => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      await axios.put(`${API_BASE}/api/settings/breaking-news/${id}`, {
        text: editText.trim(),
        priority: editPriority
      });
      setEditingId(null);
      setEditText('');
      setEditPriority(0);
      await fetchHeadlines();
    } catch (err) {
      console.error('Failed to update headline', err);
      alert('Failed to update headline');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this headline?')) return;
    try {
      await axios.delete(`${API_BASE}/api/settings/breaking-news/${id}`);
      await fetchHeadlines();
    } catch (err) {
      console.error('Failed to delete headline', err);
      alert('Failed to delete headline');
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditText(item.text);
    setEditPriority(item.priority || 0);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditPriority(0);
  };

  const handleUpdateSpeed = async () => {
    setUpdatingSpeed(true);
    try {
      await axios.put(`${API_BASE}/api/settings/seo`, {
        breakingNewsSpeed: speed
      });
      alert('Speed updated successfully!');
    } catch (err) {
      console.error('Failed to update speed', err);
      alert('Failed to update speed');
    } finally {
      setUpdatingSpeed(false);
    }
  };

  return (
    <div className="admin-home-content reveal">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#111' }}>
            <i className="bi bi-broadcast text-danger me-2"></i>
            Breaking News Manager
          </h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
            Add live breaking news headlines that scroll across the top of the website.
          </p>
        </div>
        <span className="badge bg-danger bg-opacity-10 text-danger px-3 py-2 rounded-pill fw-bold">
          <i className="bi bi-lightning-fill me-1"></i>
          {headlines.filter(h => h.isActive).length} Active
        </span>
      </div>

      {/* Speed Control */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
        <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold">
            <i className="bi bi-speedometer2 me-2 text-muted"></i>Scroll Speed
          </h6>
        </div>
        <div className="card-body p-4">
          <div className="row g-3 align-items-center">
            <div className="col-md-9">
              <label className="form-label fw-bold small text-muted">Adjust Speed (Seconds per cycle: {speed}s)</label>
              <input
                type="range"
                className="form-range"
                min="5"
                max="120"
                step="1"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value))}
              />
              <div className="d-flex justify-content-between text-muted small">
                <span>Fast (5s)</span>
                <span>Slow (120s)</span>
              </div>
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-primary w-100 fw-bold rounded-3 py-2 shadow-sm"
                onClick={handleUpdateSpeed}
                disabled={updatingSpeed}
                style={{ height: '48px' }}
              >
                {updatingSpeed ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                ) : (
                  <i className="bi bi-save me-2"></i>
                )}
                Save Speed
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Headline */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
        <div className="card-header bg-danger bg-opacity-10 border-0 py-3 px-4">
          <h6 className="mb-0 fw-bold text-danger">
            <i className="bi bi-plus-circle me-2"></i>Add New Headline
          </h6>
        </div>
        <div className="card-body p-4">
          <div className="row g-3 align-items-end">
            <div className="col-md-7">
              <label className="form-label fw-bold small text-muted">Headline Text</label>
              <input
                type="text"
                className="form-control form-control-lg bg-light border-0 rounded-3"
                placeholder="e.g., PM Modi launches new industrial corridor..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                maxLength={500}
              />
              <div className="form-text mt-1">{newText.length}/500 characters</div>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-bold small text-muted">Priority</label>
              <input
                type="number"
                className="form-control form-control-lg bg-light border-0 rounded-3"
                value={newPriority}
                onChange={(e) => setNewPriority(parseInt(e.target.value) || 0)}
                min={0}
                max={100}
              />
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-danger w-100 fw-bold rounded-3 py-2 shadow-sm"
                onClick={handleAdd}
                disabled={saving || !newText.trim()}
                style={{ height: '48px' }}
              >
                {saving ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                ) : (
                  <i className="bi bi-broadcast me-2"></i>
                )}
                Publish Headline
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Headlines List */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold">
            <i className="bi bi-list-ul me-2 text-muted"></i>All Headlines
          </h6>
          <span className="text-muted small">{headlines.length} total</span>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-danger" role="status"></div>
              <p className="text-muted mt-2 small">Loading headlines...</p>
            </div>
          ) : headlines.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-broadcast text-muted" style={{ fontSize: '2.5rem', opacity: 0.3 }}></i>
              <p className="text-muted mt-2 mb-0">No breaking news headlines yet.</p>
              <p className="text-muted small">Add your first headline above to get started.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead>
                  <tr style={{ background: '#fafafa' }}>
                    <th className="py-3 px-4 fw-bold small text-muted border-0" style={{ width: '50px' }}>#</th>
                    <th className="py-3 px-4 fw-bold small text-muted border-0">Headline</th>
                    <th className="py-3 px-4 fw-bold small text-muted border-0 text-center" style={{ width: '80px' }}>Priority</th>
                    <th className="py-3 px-4 fw-bold small text-muted border-0 text-center" style={{ width: '100px' }}>Status</th>
                    <th className="py-3 px-4 fw-bold small text-muted border-0 text-center" style={{ width: '160px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {headlines.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td className="py-3 px-4 fw-bold text-muted">{idx + 1}</td>
                      <td className="py-3 px-4">
                        {editingId === item.id ? (
                          <div className="d-flex gap-2 align-items-center">
                            <input
                              type="text"
                              className="form-control form-control-sm bg-light border-0"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleUpdate(item.id)}
                              autoFocus
                            />
                            <input
                              type="number"
                              className="form-control form-control-sm bg-light border-0"
                              style={{ width: '70px' }}
                              value={editPriority}
                              onChange={(e) => setEditPriority(parseInt(e.target.value) || 0)}
                              min={0}
                            />
                            <button
                              className="btn btn-success btn-sm rounded-pill px-3"
                              onClick={() => handleUpdate(item.id)}
                              disabled={saving}
                            >
                              <i className="bi bi-check-lg"></i>
                            </button>
                            <button
                              className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                              onClick={cancelEdit}
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </div>
                        ) : (
                          <span className={`fw-medium ${!item.isActive ? 'text-muted text-decoration-line-through' : ''}`}>
                            {item.text}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="badge bg-light text-dark fw-bold rounded-pill">{item.priority || 0}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div
                          className="form-check form-switch d-flex justify-content-center mb-0"
                          style={{ cursor: 'pointer' }}
                        >
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={item.isActive}
                            onChange={() => handleToggleActive(item)}
                            style={{
                              width: '40px',
                              height: '20px',
                              cursor: 'pointer',
                              backgroundColor: item.isActive ? '#da251d' : '#e5e7eb',
                              borderColor: item.isActive ? '#da251d' : '#d1d5db'
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {editingId !== item.id && (
                          <div className="d-flex gap-1 justify-content-center">
                            <button
                              className="btn btn-outline-primary btn-sm rounded-pill px-3"
                              onClick={() => startEdit(item)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil-fill small"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm rounded-pill px-3"
                              onClick={() => handleDelete(item.id)}
                              title="Delete"
                            >
                              <i className="bi bi-trash-fill small"></i>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Preview Section */}
      {headlines.filter(h => h.isActive).length > 0 && (
        <div className="card border-0 shadow-sm rounded-4 mt-4 overflow-hidden">
          <div className="card-header bg-white border-bottom py-3 px-4">
            <h6 className="mb-0 fw-bold">
              <i className="bi bi-eye me-2 text-muted"></i>Live Preview
            </h6>
          </div>
          <div className="card-body p-0">
            <div
              style={{
                width: '100%',
                background: 'linear-gradient(90deg, #b91c1c 0%, #da251d 30%, #ef4444 60%, #da251d 80%, #b91c1c 100%)',
                boxShadow: '0 0 12px rgba(218, 37, 29, 0.5)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                height: '36px',
                borderRadius: '0'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '0 14px 0 16px',
                  background: 'rgba(0,0,0,0.35)',
                  height: '100%',
                  flexShrink: 0,
                  borderRight: '2px solid rgba(255,255,255,0.15)'
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#fff',
                    animation: 'breakingDotPulse 1s ease-in-out infinite'
                  }}
                ></span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    color: '#fff',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Breaking News
                </span>
              </div>
              <div style={{ flex: 1, overflow: 'hidden', height: '100%', display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    whiteSpace: 'nowrap',
                    animation: `tickerScroll ${speed}s linear infinite`,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#fff',
                    letterSpacing: '0.3px',
                    padding: '0 16px'
                  }}
                >
                  {headlines.filter(h => h.isActive).map(h => h.text).join('    ●    ')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline keyframe styles for preview */}
      <style>{`
        @keyframes breakingDotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }
        @keyframes tickerScroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};

export default ManageBreakingNews;
