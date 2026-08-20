import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../config/api';

const ManageManagers = ({ adminInfo: propAdminInfo }) => {
  const [managers, setManagers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [actionMsg, setActionMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [showLogsModal, setShowLogsModal] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsSearchQuery, setLogsSearchQuery] = useState('');
  const [selectedLogManager, setSelectedLogManager] = useState('all');

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

  const fetchActivityLogs = async () => {
    setShowLogsModal(true);
    setLoadingLogs(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/users/managers/activities`, config);
      setActivityLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch activity logs', err);
      setActivityLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const allPermissions = [
    { key: 'dashboard', label: 'Dashboard', icon: 'bi-grid-1x2-fill' },
    { key: 'news', label: 'Manage Media News', icon: 'bi-newspaper' },
    { key: 'analytics', label: 'Analytics', icon: 'bi-graph-up-arrow' },
    { key: 'profile', label: 'Editorial Profile', icon: 'bi-person-badge-fill' },
    { key: 'ads', label: 'Ad Management', icon: 'bi-megaphone-fill' },
    { key: 'ad_calendar', label: 'Ad Calendar', icon: 'bi-calendar-check' },
    { key: 'podcast', label: 'Podcast Guests', icon: 'bi-mic-fill' },
    { key: 'webinars', label: 'Manage Webinars', icon: 'bi-laptop' },
    { key: 'email_settings', label: 'Email Settings', icon: 'bi-envelope-at-fill' },
    { key: 'seo', label: 'SEO & Tags', icon: 'bi-search' },
    { key: 'plans', label: 'Corporate Plans', icon: 'bi-credit-card-2-front-fill' },
    { key: 'ad_requests', label: 'Ad Requests', icon: 'bi-envelope-paper-fill' },
    { key: 'ad_pricing', label: 'Ad Pricing', icon: 'bi-cash-coin' },
    { key: 'revenue', label: 'Revenue & Billing', icon: 'bi-currency-rupee' },
    { key: 'verifications', label: 'Bank Approvals', icon: 'bi-shield-check' },
    { key: 'notifications', label: 'Notifications', icon: 'bi-bell-fill' },
    { key: 'breaking_news', label: 'Breaking News', icon: 'bi-broadcast' },
    { key: 'users', label: 'Manage Users', icon: 'bi-people-fill' }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mgrRes, usrRes] = await Promise.all([
        axios.get(`${API_BASE}/api/users/managers/list`, config),
        axios.get(`${API_BASE}/api/users/all`, config)
      ]);
      const mgrData = Array.isArray(mgrRes.data) ? mgrRes.data : [];
      const usrData = Array.isArray(usrRes.data) ? usrRes.data : [];
      setManagers(mgrData);
      setUsers(usrData.filter(u => !u.isManager && u.role !== 'superadmin'));
    } catch (err) {
      console.error('Failed to fetch data', err);
      setManagers([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTogglePermission = (key) => {
    setSelectedPermissions(prev => 
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    setSelectedPermissions(allPermissions.map(p => p.key));
  };

  const handleClearAll = () => {
    setSelectedPermissions([]);
  };

  const handleEditManager = (manager) => {
    setSelectedUser(manager);
    let perms = [];
    if (Array.isArray(manager.managerPermissions)) {
      perms = manager.managerPermissions;
    } else if (typeof manager.managerPermissions === 'string') {
      try {
        perms = JSON.parse(manager.managerPermissions);
      } catch (e) {}
    }
    setSelectedPermissions(perms);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setSelectedUser(null);
    setSelectedPermissions([]);
    setIsEditing(false);
    setSearchQuery('');
  };

  const handleAssignManager = async () => {
    if (!selectedUser) return alert('Please select a user first.');
    if (selectedPermissions.length === 0) return alert('Please select at least one permission.');

    try {
      await axios.post(`${API_BASE}/api/users/${selectedUser.id}/assign-manager`, { permissions: selectedPermissions }, config);
      setActionMsg(`✅ ${selectedUser.name}'s manager rights updated successfully.`);
      setSelectedUser(null);
      setSelectedPermissions([]);
      setSearchQuery('');
      setIsEditing(false);
      fetchData();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      setActionMsg(`❌ Failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleRevokeManager = async (manager) => {
    if (!window.confirm(`Are you sure you want to revoke manager access from ${manager.name}?`)) return;
    try {
      await axios.post(`${API_BASE}/api/users/${manager.id}/revoke-manager`, {}, config);
      setActionMsg(`✅ Manager access revoked from ${manager.name}.`);
      if (selectedUser?.id === manager.id) {
        handleCancelEdit();
      }
      fetchData();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      setActionMsg(`❌ Failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  });

  return (
    <>
    <div className="admin-home-content reveal">
      {/* Page Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '16px', padding: '24px 30px', color: '#fff', marginBottom: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0 }}><i className="bi bi-person-check-fill me-2"></i>Assign Manager</h2>
          <p style={{ margin: '6px 0 0', opacity: 0.7, fontSize: '0.88rem' }}>Delegate admin permissions to specific users</p>
        </div>
        <button className="btn btn-light fw-bold rounded-pill px-4 shadow-sm border" onClick={fetchActivityLogs}>
          <i className="bi bi-activity text-danger me-2"></i>View Manager Activity Logs
        </button>
      </div>

      {actionMsg && (
        <div className={`alert ${actionMsg.startsWith('✅') ? 'alert-success' : 'alert-danger'} py-2 rounded-3 fw-bold small`} style={{ animation: 'fadeIn 0.3s' }}>
          {actionMsg}
        </div>
      )}

      <div className="row g-4">
        {/* Assign New Manager */}
        <div className="col-lg-6">
          <div className="admin-card h-100">
            <div className="admin-card-header">
              <h5 className="admin-card-title m-0">{isEditing ? 'Edit Manager Permissions' : 'Assign New Manager'}</h5>
            </div>
            <div className="admin-card-body">
              {/* Step 1: Select User */}
              <div className="mb-4">
                <label className="form-label fw-bold small text-muted">1. Select User</label>
                {selectedUser ? (
                  <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3 border">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                        {(selectedUser.name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="fw-bold">{selectedUser.name}</div>
                        <div className="text-muted small">{selectedUser.email} • {selectedUser.role}</div>
                      </div>
                    </div>
                    <button className="btn btn-sm btn-outline-secondary rounded-pill" onClick={handleCancelEdit}>{isEditing ? 'Cancel Edit' : 'Change'}</button>
                  </div>
                ) : (
                  <div>
                    <div className="input-group mb-3">
                      <span className="input-group-text bg-white border-end-0"><i className="bi bi-envelope text-muted"></i></span>
                      <input
                        type="text"
                        className="form-control border-start-0 bg-white"
                        placeholder="Type email to search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    {searchQuery && (
                      <div className="border rounded-3 bg-white shadow-sm" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {filteredUsers.length === 0 ? (
                          <div className="p-3 text-center text-muted small">No registered users found matching "{searchQuery}"</div>
                        ) : (
                          filteredUsers.map(u => (
                            <div 
                              key={u.id} 
                              className="d-flex align-items-center p-2 border-bottom hover-bg-light"
                              style={{ cursor: 'pointer' }}
                              onClick={() => { setSelectedUser(u); setSearchQuery(''); }}
                            >
                              <div>
                                <div className="fw-bold small">{u.name}</div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>{u.email} • {u.role}</div>
                              </div>
                              <i className="bi bi-plus-circle text-primary ms-auto me-2"></i>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Select Permissions */}
              <div className={`mb-4 ${!selectedUser ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label fw-bold small text-muted m-0">2. Select Permissions</label>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-link text-primary p-0 text-decoration-none" style={{ fontSize: '0.75rem' }} onClick={handleSelectAll}>Select All</button>
                    <button className="btn btn-sm btn-link text-danger p-0 text-decoration-none" style={{ fontSize: '0.75rem' }} onClick={handleClearAll}>Clear</button>
                  </div>
                </div>
                
                <div className="row g-2">
                  {allPermissions.map(perm => (
                    <div key={perm.key} className="col-6">
                      <div 
                        className={`p-2 border rounded-3 d-flex align-items-center gap-2 ${selectedPermissions.includes(perm.key) ? 'bg-primary text-white border-primary' : 'bg-light text-dark hover-border-primary'}`}
                        style={{ cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.8rem' }}
                        onClick={() => handleTogglePermission(perm.key)}
                      >
                        <i className={`bi ${perm.icon}`}></i>
                        <span className="fw-bold text-truncate">{perm.label}</span>
                        {selectedPermissions.includes(perm.key) && <i className="bi bi-check-circle-fill ms-auto"></i>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                className="btn btn-primary w-100 fw-bold py-2 rounded-pill shadow-sm mt-auto"
                disabled={!selectedUser || selectedPermissions.length === 0}
                onClick={handleAssignManager}
              >
                {isEditing ? 'Update Manager Rights' : 'Assign Manager Rights'}
              </button>
            </div>
          </div>
        </div>

        {/* Current Managers */}
        <div className="col-lg-6">
          <div className="admin-card h-100">
            <div className="admin-card-header d-flex justify-content-between align-items-center">
              <h5 className="admin-card-title m-0">Current Managers ({managers.length})</h5>
            </div>
            <div className="admin-card-body p-0">
              {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
              ) : managers.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-shield-lock fs-1 d-block mb-2"></i>
                  <span>No managers assigned yet.</span>
                </div>
              ) : (
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {managers.map(manager => (
                    <div key={manager.id} className="p-3 border-bottom">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                            {(manager.name || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-bold">{manager.name}</div>
                            <div className="text-muted small">{manager.email}</div>
                          </div>
                        </div>
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm btn-outline-primary rounded-pill px-3" onClick={() => handleEditManager(manager)}>
                            <i className="bi bi-pencil-square me-1"></i>Edit
                          </button>
                          <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => handleRevokeManager(manager)}>
                            Revoke
                          </button>
                        </div>
                      </div>
                      
                      {/* Permission Badges */}
                      <div className="d-flex flex-wrap gap-1 mt-2">
                        {(() => {
                          let perms = [];
                          if (Array.isArray(manager.managerPermissions)) {
                            perms = manager.managerPermissions;
                          } else if (typeof manager.managerPermissions === 'string') {
                            try {
                              perms = JSON.parse(manager.managerPermissions);
                            } catch (e) {}
                          }
                          return (Array.isArray(perms) ? perms : []).map(permKey => {
                            const permInfo = allPermissions.find(p => p.key === permKey);
                            if (!permInfo) return null;
                            return (
                              <span key={permKey} className="badge bg-light text-dark border" style={{ fontSize: '0.65rem' }}>
                                <i className={`bi ${permInfo.icon} me-1`}></i>{permInfo.label}
                              </span>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Manager Activity Logs Modal */}
    {showLogsModal && (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered modal-xl" style={{ maxWidth: '85%' }}>
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header bg-dark text-white border-0 p-4">
              <h5 className="modal-title fw-bold"><i className="bi bi-activity text-danger me-2"></i> Manager Activity Audit Logs</h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowLogsModal(false)}></button>
            </div>
            
            <div className="modal-body p-4" style={{ overflowY: 'auto', flex: 1 }}>
              {/* Filter Bar */}
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold small text-muted">Search Action or Details</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
                    <input
                      type="text"
                      className="form-control border-start-0 bg-white"
                      placeholder="Search for keywords, IDs, or reasons..."
                      value={logsSearchQuery}
                      onChange={(e) => setLogsSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small text-muted">Filter By Manager</label>
                  <select
                    className="form-select bg-white"
                    value={selectedLogManager}
                    onChange={(e) => setSelectedLogManager(e.target.value)}
                  >
                    <option value="all">All Managers</option>
                    {managers.map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {loadingLogs ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-danger" role="status"></div>
                  <p className="text-muted mt-2 small">Loading manager audit history...</p>
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-5 bg-light rounded-3">
                  <i className="bi bi-journal-text text-muted" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                  <p className="text-muted mt-2 mb-0">No manager activities recorded yet.</p>
                  <p className="text-muted small">Logs will automatically populate when managers perform tasks.</p>
                </div>
              ) : (() => {
                const filteredLogs = activityLogs.filter(log => {
                  const matchesSearch = (log.action || '').toLowerCase().includes(logsSearchQuery.toLowerCase()) ||
                                        (log.details || '').toLowerCase().includes(logsSearchQuery.toLowerCase());
                  const matchesManager = selectedLogManager === 'all' || log.managerName === selectedLogManager;
                  return matchesSearch && matchesManager;
                });

                if (filteredLogs.length === 0) {
                  return (
                    <div className="text-center py-5 bg-light rounded-3">
                      <p className="text-muted mb-0">No logs found matching your filters.</p>
                    </div>
                  );
                }

                return (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#fafafa' }}>
                          <th className="py-3 px-3 fw-bold text-muted border-0" style={{ width: '180px' }}>Date & Time</th>
                          <th className="py-3 px-3 fw-bold text-muted border-0" style={{ width: '180px' }}>Manager Name</th>
                          <th className="py-3 px-3 fw-bold text-muted border-0" style={{ width: '160px' }}>Action Type</th>
                          <th className="py-3 px-3 fw-bold text-muted border-0">Details</th>
                          <th className="py-3 px-3 fw-bold text-muted border-0 text-center" style={{ width: '120px' }}>IP Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLogs.map(log => (
                          <tr key={log.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td className="py-3 px-3 text-muted fw-medium">
                              {new Date(log.createdAt).toLocaleString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </td>
                            <td className="py-3 px-3 fw-bold text-dark">
                              <div className="d-flex align-items-center gap-2">
                                <div className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                                  {(log.managerName || '?')[0].toUpperCase()}
                                </div>
                                <span>{log.managerName}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="badge bg-danger bg-opacity-10 text-danger fw-bold py-1.5 px-2.5 rounded-pill" style={{ fontSize: '0.72rem' }}>
                                {log.action}
                              </span>
                            </td>
                            <td className="py-3 px-3 fw-medium text-muted" style={{ maxWidth: '400px', wordBreak: 'break-word' }}>
                              {log.details}
                            </td>
                            <td className="py-3 px-3 text-center text-muted fw-bold">
                              {log.ipAddress || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
            
            <div className="modal-footer bg-light border-0 p-3">
              <button type="button" className="btn btn-dark px-4 fw-bold rounded-pill" onClick={() => setShowLogsModal(false)}>Close Log Reader</button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default ManageManagers;
