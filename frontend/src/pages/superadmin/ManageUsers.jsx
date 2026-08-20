import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../config/api';

const ManageUsers = ({ adminInfo: propAdminInfo }) => {
  const [activeTab, setActiveTab] = useState('user');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionMsg, setActionMsg] = useState('');

  const getAdminInfo = () => {
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
  };
  const adminInfo = getAdminInfo();
  const config = adminInfo?.token ? { headers: { Authorization: `Bearer ${adminInfo.token}` } } : {};

  const roleMap = {
    user: { label: 'Readers', icon: 'bi-person-fill', color: '#6366f1' },
    author: { label: 'Reporters', icon: 'bi-pencil-square', color: '#10b981' },
    corporate: { label: 'Corporate Users', icon: 'bi-building', color: '#f59e0b' }
  };

  const fetchUsers = async (role) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/users/all?role=${role}`, config);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch users', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(activeTab);
  }, [activeTab]);

  const handleViewDetails = async (userId) => {
    setDetailsLoading(true);
    setSelectedUser(userId);
    try {
      const { data } = await axios.get(`${API_BASE}/api/users/${userId}/details`, config);
      setUserDetails(data);
    } catch (err) {
      console.error('Failed to fetch user details', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'user',
      status: user.status || 'approved',
      bio: user.bio || '',
      expertise: user.expertise || '',
      companyName: user.companyName || '',
      designation: user.designation || '',
      isManager: user.isManager || false
    });
    setEditModal(user);
  };

  const handleEditSubmit = async () => {
    try {
      await axios.put(`${API_BASE}/api/users/${editModal.id}`, editForm, config);
      setActionMsg(`✅ User "${editForm.name}" updated successfully.`);
      setEditModal(null);
      fetchUsers(activeTab);
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      setActionMsg(`❌ Failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDelete = async (userId, deleteContent = false) => {
    try {
      await axios.delete(`${API_BASE}/api/users/${userId}?deleteContent=${deleteContent}`, config);
      setActionMsg('✅ User deleted successfully.');
      setDeleteConfirm(null);
      setSelectedUser(null);
      setUserDetails(null);
      fetchUsers(activeTab);
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      setActionMsg(`❌ Failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDeleteArticle = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      await axios.delete(`${API_BASE}/api/users/content/article/${articleId}`, config);
      setActionMsg('✅ Article deleted.');
      handleViewDetails(selectedUser);
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      setActionMsg(`❌ Failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) ||
           (u.email || '').toLowerCase().includes(q) ||
           (u.phone || '').toLowerCase().includes(q);
  });

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

  return (
    <div className="admin-home-content reveal">
      {/* Page Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', borderRadius: '16px', padding: '24px 30px', color: '#fff', marginBottom: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0 }}><i className="bi bi-people-fill me-2"></i>Manage Users</h2>
        <p style={{ margin: '6px 0 0', opacity: 0.7, fontSize: '0.88rem' }}>View, edit, and manage all platform users</p>
      </div>

      {actionMsg && (
        <div className={`alert ${actionMsg.startsWith('✅') ? 'alert-success' : 'alert-danger'} py-2 rounded-3 fw-bold small`} style={{ animation: 'fadeIn 0.3s' }}>
          {actionMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {Object.entries(roleMap).map(([role, info]) => (
          <button
            key={role}
            onClick={() => { setActiveTab(role); setSelectedUser(null); setUserDetails(null); }}
            className="btn fw-bold px-4 py-2 rounded-pill shadow-sm"
            style={{
              background: activeTab === role ? info.color : '#f1f5f9',
              color: activeTab === role ? '#fff' : '#475569',
              border: 'none',
              fontSize: '0.85rem',
              transition: 'all 0.2s'
            }}
          >
            <i className={`bi ${info.icon} me-2`}></i>{info.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="input-group" style={{ maxWidth: '400px' }}>
          <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
          <input
            type="text"
            className="form-control border-start-0 bg-white"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="row g-4">
        {/* Users List */}
        <div className={selectedUser ? 'col-lg-5' : 'col-12'}>
          <div className="admin-card">
            <div className="admin-card-header d-flex justify-content-between align-items-center">
              <h5 className="admin-card-title m-0">{roleMap[activeTab].label} ({filteredUsers.length})</h5>
            </div>
            <div className="admin-card-body p-0">
              {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                  <span>No {roleMap[activeTab].label.toLowerCase()} found.</span>
                </div>
              ) : (
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {filteredUsers.map(user => (
                    <div
                      key={user.id}
                      className="d-flex align-items-center justify-content-between p-3 border-bottom"
                      style={{
                        cursor: 'pointer',
                        background: selectedUser === user.id ? '#f0f9ff' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                      onClick={() => handleViewDetails(user.id)}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                          style={{ width: '40px', height: '40px', background: roleMap[activeTab].color, fontSize: '0.9rem', flexShrink: 0 }}
                        >
                          {(user.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-bold" style={{ fontSize: '0.9rem' }}>{user.name}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{user.email}</div>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className={`badge rounded-pill ${user.status === 'approved' ? 'bg-success' : user.status === 'pending' ? 'bg-warning text-dark' : 'bg-danger'}`} style={{ fontSize: '0.65rem' }}>
                          {user.status}
                        </span>
                        {user.isManager && <span className="badge bg-primary rounded-pill" style={{ fontSize: '0.6rem' }}>Manager</span>}
                        <button className="btn btn-sm btn-outline-secondary border-0 p-1" onClick={(e) => { e.stopPropagation(); handleEdit(user); }} title="Edit">
                          <i className="bi bi-pencil-fill" style={{ fontSize: '0.75rem' }}></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger border-0 p-1" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(user); }} title="Delete">
                          <i className="bi bi-trash-fill" style={{ fontSize: '0.75rem' }}></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Details Panel */}
        {selectedUser && (
          <div className="col-lg-7">
            <div className="admin-card">
              <div className="admin-card-body">
                {detailsLoading ? (
                  <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
                ) : userDetails ? (
                  <>
                    {/* User Info Header */}
                    <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
                      <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white" style={{ width: '60px', height: '60px', background: roleMap[activeTab].color, fontSize: '1.3rem', flexShrink: 0 }}>
                        {(userDetails.user.name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <h5 className="fw-black mb-0">{userDetails.user.name}</h5>
                        <div className="text-muted small">{userDetails.user.email} {userDetails.user.phone ? `• ${userDetails.user.phone}` : ''}</div>
                        <div className="d-flex gap-2 mt-1">
                          <span className="badge bg-secondary rounded-pill" style={{ fontSize: '0.65rem' }}>{userDetails.user.role}</span>
                          <span className={`badge rounded-pill ${userDetails.user.status === 'approved' ? 'bg-success' : 'bg-warning text-dark'}`} style={{ fontSize: '0.65rem' }}>{userDetails.user.status}</span>
                          <span className="text-muted" style={{ fontSize: '0.65rem' }}>Joined {formatDate(userDetails.user.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="row g-2 mb-4">
                      {[
                        { label: 'Articles', value: userDetails.stats.totalArticles, icon: 'bi-newspaper', color: '#6366f1' },
                        { label: 'Views', value: userDetails.stats.totalViews, icon: 'bi-eye', color: '#10b981' },
                        { label: 'Likes', value: userDetails.stats.totalLikes, icon: 'bi-heart', color: '#ef4444' },
                        { label: 'Ads', value: userDetails.stats.totalAds, icon: 'bi-megaphone', color: '#f59e0b' }
                      ].map((s, i) => (
                        <div key={i} className="col-3">
                          <div className="text-center p-2 rounded-3" style={{ background: `${s.color}10` }}>
                            <i className={`bi ${s.icon} d-block mb-1`} style={{ color: s.color, fontSize: '1.1rem' }}></i>
                            <div className="fw-black" style={{ fontSize: '1.1rem' }}>{(s.value || 0).toLocaleString()}</div>
                            <div className="text-muted" style={{ fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: 700 }}>{s.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bio */}
                    {userDetails.user.bio && (
                      <div className="mb-4 p-3 bg-light rounded-3">
                        <h6 className="fw-bold small text-uppercase text-muted mb-1">Bio</h6>
                        <p className="mb-0 small">{userDetails.user.bio}</p>
                      </div>
                    )}

                    {/* Company Info */}
                    {userDetails.user.companyName && (
                      <div className="mb-4 p-3 bg-light rounded-3">
                        <h6 className="fw-bold small text-uppercase text-muted mb-1">Company Info</h6>
                        <p className="mb-0 small"><strong>Company:</strong> {userDetails.user.companyName}</p>
                        {userDetails.user.designation && <p className="mb-0 small"><strong>Designation:</strong> {userDetails.user.designation}</p>}
                        {userDetails.user.selectedPlan && <p className="mb-0 small"><strong>Plan:</strong> {userDetails.user.selectedPlan}</p>}
                      </div>
                    )}

                    {/* Articles */}
                    <div className="mb-3">
                      <h6 className="fw-bold small text-uppercase text-muted mb-2"><i className="bi bi-newspaper me-1"></i>Articles ({userDetails.articles.length})</h6>
                      {userDetails.articles.length === 0 ? (
                        <p className="text-muted small">No articles published.</p>
                      ) : (
                        <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                          {userDetails.articles.slice(0, 20).map(a => (
                            <div key={a.id} className="d-flex align-items-center justify-content-between p-2 border-bottom" style={{ fontSize: '0.82rem' }}>
                              <div style={{ flex: 1 }}>
                                <div className="fw-bold text-truncate" style={{ maxWidth: '300px' }}>{a.title}</div>
                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>{a.category} • {(a.views || 0).toLocaleString()} views • {formatDate(a.createdAt)}</div>
                              </div>
                              <button className="btn btn-sm btn-outline-danger border-0 p-1" onClick={() => handleDeleteArticle(a.id)} title="Delete Article">
                                <i className="bi bi-trash" style={{ fontSize: '0.75rem' }}></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-5 text-muted">Failed to load user details.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-primary text-white border-0 p-4">
                <h5 className="modal-title fw-bold"><i className="bi bi-pencil-square me-2"></i>Edit User</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setEditModal(null)}></button>
              </div>
              <div className="modal-body p-4">
                {[
                  { key: 'name', label: 'Name', type: 'text' },
                  { key: 'email', label: 'Email', type: 'email' },
                  { key: 'phone', label: 'Phone', type: 'text' },
                  { key: 'bio', label: 'Bio', type: 'textarea' },
                  { key: 'expertise', label: 'Expertise', type: 'text' }
                ].map(field => (
                  <div key={field.key} className="mb-3">
                    <label className="form-label fw-bold small text-muted">{field.label}</label>
                    {field.type === 'textarea' ? (
                      <textarea className="form-control bg-light border-0" rows={3} value={editForm[field.key]} onChange={e => setEditForm({...editForm, [field.key]: e.target.value})} />
                    ) : (
                      <input type={field.type} className="form-control bg-light border-0" value={editForm[field.key]} onChange={e => setEditForm({...editForm, [field.key]: e.target.value})} />
                    )}
                  </div>
                ))}
                <div className="mb-3">
                  <label className="form-label fw-bold small text-muted">Role</label>
                  <select className="form-select bg-light border-0" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}>
                    <option value="user">Reader</option>
                    <option value="author">Reporter</option>
                    <option value="corporate">Corporate User</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold small text-muted">Status</label>
                  <select className="form-select bg-light border-0" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="mb-3 d-flex align-items-center gap-2">
                  <input
                    type="checkbox"
                    id="editUserIsManager"
                    className="form-check-input"
                    style={{ cursor: 'pointer' }}
                    checked={editForm.isManager || false}
                    onChange={e => setEditForm({ ...editForm, isManager: e.target.checked })}
                  />
                  <label htmlFor="editUserIsManager" className="form-check-label fw-bold small text-muted mb-0" style={{ cursor: 'pointer' }}>
                    Grant Manager Privileges (Admin Access)
                  </label>
                </div>
                {editModal.role === 'corporate' && (
                  <>
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-muted">Company Name</label>
                      <input type="text" className="form-control bg-light border-0" value={editForm.companyName} onChange={e => setEditForm({...editForm, companyName: e.target.value})} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-muted">Designation</label>
                      <input type="text" className="form-control bg-light border-0" value={editForm.designation} onChange={e => setEditForm({...editForm, designation: e.target.value})} />
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer bg-light border-0 p-3">
                <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setEditModal(null)}>Cancel</button>
                <button className="btn btn-primary rounded-pill px-4 fw-bold" onClick={handleEditSubmit}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-danger text-white border-0 p-4">
                <h5 className="modal-title fw-bold"><i className="bi bi-exclamation-triangle-fill me-2"></i>Delete User</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setDeleteConfirm(null)}></button>
              </div>
              <div className="modal-body p-4 text-center">
                <p className="fw-bold mb-1">Are you sure you want to delete</p>
                <p className="text-danger fw-black fs-5 mb-3">"{deleteConfirm.name}"?</p>
                <p className="text-muted small">This action cannot be undone.</p>
              </div>
              <div className="modal-footer border-0 p-3 d-flex flex-column gap-2">
                <button className="btn btn-danger w-100 fw-bold rounded-pill" onClick={() => handleDelete(deleteConfirm.id, true)}>
                  Delete User + All Content
                </button>
                <button className="btn btn-outline-danger w-100 fw-bold rounded-pill" onClick={() => handleDelete(deleteConfirm.id, false)}>
                  Delete User Only (Keep Content)
                </button>
                <button className="btn btn-outline-secondary w-100 rounded-pill" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
