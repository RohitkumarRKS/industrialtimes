import React, { useState, useEffect, Component } from 'react';
import axios from 'axios';
import API_BASE from '../../config/api';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ManageVerifications Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-5">
          <h2 className="text-danger">Component Crashed!</h2>
          <pre>{this.state.error && this.state.error.toString()}</pre>
          <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const ManageVerificationsContent = ({ adminInfo: propAdminInfo }) => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'approved'
  
  // Edit User Modal state
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: '' });
  
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

  const fetchVerifications = async () => {
    if (!adminInfo || !adminInfo.token) {
      setErrorMsg('Admin token not found.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/auth/bank-verifications?status=${activeTab}`, {
        headers: { Authorization: `Bearer ${adminInfo.token}` }
      });
      setVerifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching verifications', error);
      setErrorMsg(error.response?.data?.message || 'Failed to fetch verifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [activeTab]);

  const handleApprove = async (userId) => {
    if (!window.confirm('Are you sure you want to approve this bank account?')) return;
    try {
      await axios.post(`${API_BASE}/api/auth/approve-bank`, { userId }, {
        headers: { Authorization: `Bearer ${adminInfo?.token}` }
      });
      fetchVerifications();
    } catch (error) {
      alert('Failed to approve');
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm('Are you sure you want to reject this bank account?')) return;
    try {
      await axios.post(`${API_BASE}/api/auth/reject-bank`, { userId }, {
        headers: { Authorization: `Bearer ${adminInfo?.token}` }
      });
      fetchVerifications();
    } catch (error) {
      alert('Failed to reject');
    }
  };

  const handleClearDetails = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently clear/delete bank and KYC details for this user? This will reset their verification status to Not Verified.')) return;
    try {
      await axios.post(`${API_BASE}/api/auth/clear-bank-details`, { userId }, {
        headers: { Authorization: `Bearer ${adminInfo?.token}` }
      });
      alert('User bank details and KYC records cleared successfully.');
      fetchVerifications();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to clear bank details.');
    }
  };

  const handleToggleBlock = async (user) => {
    const newStatus = user.status === 'suspended' ? 'approved' : 'suspended';
    if (!window.confirm(`Are you sure you want to ${newStatus === 'suspended' ? 'block/suspend' : 'unblock'} ${user.name}?`)) return;
    try {
      await axios.put(`${API_BASE}/api/users/${user.id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${adminInfo?.token}` }
      });
      alert(`User status changed to ${newStatus}.`);
      fetchVerifications();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle block status');
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete user "${name}"? This action is irreversible.`)) return;
    const deleteContent = window.confirm(`Do you also want to delete all articles/content associated with "${name}"?`);
    try {
      await axios.delete(`${API_BASE}/api/users/${userId}?deleteContent=${deleteContent}`, {
        headers: { Authorization: `Bearer ${adminInfo?.token}` }
      });
      alert(`User ${name} has been deleted successfully.`);
      fetchVerifications();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE}/api/users/${editingUser.id}`, editForm, {
        headers: { Authorization: `Bearer ${adminInfo?.token}` }
      });
      alert('User details updated successfully.');
      setEditingUser(null);
      fetchVerifications();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save changes');
    }
  };

  const parseDetails = (details) => {
    if (!details) return {};
    if (typeof details === 'string') {
      try {
        return JSON.parse(details);
      } catch (e) {
        return {};
      }
    }
    return details;
  };

  return (
    <div className="admin-content-wrapper">
      <div className="admin-header">
        <h2 className="admin-page-title"><i className="bi bi-shield-check me-2"></i>Bank & KYC Verifications</h2>
        <p className="admin-page-subtitle">Review and manage bank details submitted by Reporters and Corporate accounts.</p>
      </div>

      {/* Tabs Navigation */}
      <div className="d-flex border-bottom mb-4">
        <button 
          className={`btn px-4 py-2 border-0 fw-bold position-relative ${activeTab === 'pending' ? 'text-primary' : 'text-muted'}`} 
          style={{ background: 'none', borderBottom: activeTab === 'pending' ? '3px solid #0d6efd' : '3px solid transparent', borderRadius: '0' }}
          onClick={() => setActiveTab('pending')}
        >
          <i className="bi bi-hourglass-split me-1"></i> Pending Requests
        </button>
        <button 
          className={`btn px-4 py-2 border-0 fw-bold position-relative ${activeTab === 'approved' ? 'text-primary' : 'text-muted'}`} 
          style={{ background: 'none', borderBottom: activeTab === 'approved' ? '3px solid #0d6efd' : '3px solid transparent', borderRadius: '0' }}
          onClick={() => setActiveTab('approved')}
        >
          <i className="bi bi-patch-check-fill me-1"></i> Approved Accounts
        </button>
        <button 
          className={`btn px-4 py-2 border-0 fw-bold position-relative ${activeTab === 'rejected' ? 'text-primary' : 'text-muted'}`} 
          style={{ background: 'none', borderBottom: activeTab === 'rejected' ? '3px solid #0d6efd' : '3px solid transparent', borderRadius: '0' }}
          onClick={() => setActiveTab('rejected')}
        >
          <i className="bi bi-x-circle-fill me-1"></i> Rejected / Deleted
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-card-body">
          {errorMsg ? (
            <div className="alert alert-danger">{errorMsg}</div>
          ) : loading ? (
            <div className="text-center p-5 text-muted">Loading verifications...</div>
          ) : verifications.length === 0 ? (
            <div className="text-center p-5 text-muted">
              <i className="bi bi-check2-circle mb-3" style={{ fontSize: '3rem', color: '#10b981' }}></i>
              <p>{activeTab === 'pending' ? 'No pending bank verifications found.' : activeTab === 'rejected' ? 'No rejected bank verifications found.' : 'No verified bank accounts found.'}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Bank Details</th>
                    <th>Aadhar Details</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.map(user => {
                    const bank = parseDetails(user.bankDetails);
                    const aadhar = parseDetails(user.aadharDetails);
                    return (
                      <tr key={user.id}>
                        <td>
                          <strong>{user.name}</strong>
                          {user.status === 'suspended' && (
                            <span className="badge bg-danger ms-2" style={{ fontSize: '0.65rem' }}>Blocked</span>
                          )}
                          <br />
                          <small className="text-muted">{user.email}</small>
                          {user.phone && (
                            <>
                              <br />
                              <small className="text-muted"><i className="bi bi-telephone-fill me-1"></i>{user.phone}</small>
                            </>
                          )}
                        </td>
                        <td><span className="admin-badge">{user.role}</span></td>
                        <td>
                          <div style={{ fontSize: '0.85rem' }}>
                            <strong>Name:</strong> {bank?.accountName || 'N/A'}<br />
                            <strong>Bank:</strong> {bank?.bankName || 'N/A'}<br />
                            {bank?.branchName && <><strong>Branch:</strong> {bank.branchName}<br /></>}
                            <strong>A/C:</strong> {bank?.accountNo || 'N/A'}<br />
                            <strong>IFSC:</strong> {bank?.ifsc || 'N/A'}<br />
                            {bank?.passbookUrl && typeof bank.passbookUrl === 'string' && (
                              <a href={`${bank.passbookUrl.startsWith('http') ? '' : API_BASE}${bank.passbookUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-info mt-1" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                                <i className="bi bi-journal-text me-1"></i>View Passbook
                              </a>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem' }}>
                            <strong>No:</strong> {aadhar?.number || 'N/A'}<br />
                            {aadhar?.documentUrl && typeof aadhar.documentUrl === 'string' && (
                              <a href={`${aadhar.documentUrl.startsWith('http') ? '' : API_BASE}${aadhar.documentUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary mt-1" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                                <i className="bi bi-file-earmark-image me-1"></i>View Document
                              </a>
                            )}
                          </div>
                        </td>
                        <td>
                          {activeTab === 'pending' ? (
                            <div className="d-flex gap-2">
                              <button onClick={() => handleApprove(user.id)} className="btn btn-success btn-sm d-flex align-items-center">
                                <i className="bi bi-check-lg me-1"></i> Approve
                              </button>
                              <button onClick={() => handleReject(user.id)} className="btn btn-danger btn-sm d-flex align-items-center">
                                <i className="bi bi-x-lg me-1"></i> Reject
                              </button>
                            </div>
                          ) : activeTab === 'rejected' ? (
                            <div className="d-flex gap-2">
                              <button onClick={() => handleClearDetails(user.id)} className="btn btn-warning btn-sm d-flex align-items-center" title="Reset bank details to unverified">
                                <i className="bi bi-trash-fill me-1"></i> Clear Details
                              </button>
                              <button onClick={() => handleDeleteUser(user.id, user.name)} className="btn btn-danger btn-sm d-flex align-items-center" title="Permanently delete user">
                                <i className="bi bi-trash me-1"></i> Delete User
                              </button>
                            </div>
                          ) : (
                            <div className="d-flex gap-2">
                              <button onClick={() => handleOpenEditModal(user)} className="btn btn-primary btn-sm d-flex align-items-center" title="Edit user details">
                                <i className="bi bi-pencil-square me-1"></i> Edit
                              </button>
                              <button 
                                onClick={() => handleToggleBlock(user)} 
                                className={`btn btn-sm d-flex align-items-center ${user.status === 'suspended' ? 'btn-outline-success' : 'btn-warning'}`}
                                title={user.status === 'suspended' ? 'Unblock account' : 'Block/Suspend account'}
                              >
                                {user.status === 'suspended' ? (
                                  <><i className="bi bi-unlock-fill me-1"></i> Unblock</>
                                ) : (
                                  <><i className="bi bi-shield-slash me-1"></i> Block</>
                                )}
                              </button>
                              <button onClick={() => handleDeleteUser(user.id, user.name)} className="btn btn-danger btn-sm d-flex align-items-center" title="Permanently delete user">
                                <i className="bi bi-trash me-1"></i> Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
              <div className="modal-header border-bottom-0 pb-0" style={{ padding: '24px 24px 8px' }}>
                <h5 className="modal-title fw-bold text-dark"><i className="bi bi-pencil-square me-2 text-primary"></i>Edit User Details</h5>
                <button type="button" className="btn-close" onClick={() => setEditingUser(null)} aria-label="Close"></button>
              </div>
              <form onSubmit={handleSaveEdit}>
                <div className="modal-body" style={{ padding: '8px 24px 24px' }}>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-muted">Full Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editForm.name} 
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-muted">Email Address</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      value={editForm.email} 
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-muted">Phone Number</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editForm.phone} 
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })} 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-muted">System Role</label>
                    <select 
                      className="form-select" 
                      value={editForm.role} 
                      onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                      required
                    >
                      <option value="user">Reader / User</option>
                      <option value="author">Reporter</option>
                      <option value="corporate">Corporate User</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top-0 pt-0" style={{ padding: '0 24px 24px' }}>
                  <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setEditingUser(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ManageVerifications = ({ adminInfo }) => (
  <ErrorBoundary>
    <ManageVerificationsContent adminInfo={adminInfo} />
  </ErrorBoundary>
);

export default ManageVerifications;
