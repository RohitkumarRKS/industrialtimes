import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../config/api';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [corporateRequests, setCorporateRequests] = useState([]);
  const [reporterRequests, setReporterRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reporters');

  const [showModal, setShowModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch article notifications
        const { data } = await axios.get(`${API_BASE}/api/articles`);
        const articles = data || [];
        
        const recentArticles = [...articles].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
        const trendingArticles = [...articles].sort((a,b) => (b.views || 0) - (a.views || 0)).slice(0, 3);

        const articleNotifications = recentArticles.map(article => ({
          id: `new-${article.id}`,
          type: 'New Article',
          message: article.title,
          user: article.author || 'System',
          date: article.createdAt,
          status: 'Active',
          role: 'Publisher',
          rawArticle: article
        }));

        const trendingNotifications = trendingArticles.map(article => ({
          id: `trend-${article.id}`,
          type: 'Trending',
          message: `Trending Post: ${article.title.substring(0,40)}...`,
          user: 'System Admin',
          date: article.updatedAt || article.createdAt,
          status: 'Active',
          role: 'System',
          rawArticle: article
        }));

        const combined = [...articleNotifications, ...trendingNotifications];
        const unique = Array.from(new Map(combined.map(item => [item.rawArticle.id, item])).values());
        unique.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setNotifications(unique);

        // Fetch corporate requests
        const corpRes = await axios.get(`${API_BASE}/api/auth/corporate-requests`);
        setCorporateRequests(corpRes.data || []);

        // Fetch reporter requests
        const repRes = await axios.get(`${API_BASE}/api/auth/reporter-requests`);
        setReporterRequests(repRes.data || []);

      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRemove = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleApproveCorporate = async (userId) => {
    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/approve-corporate`, { userId });
      setActionMsg(data.message);
      setCorporateRequests(corporateRequests.filter(r => r.id !== userId));
      setTimeout(() => setActionMsg(''), 5000);
    } catch (err) {
      setActionMsg('Failed to approve account.');
      setTimeout(() => setActionMsg(''), 5000);
    }
  };

  const handleRejectCorporate = async (userId) => {
    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/reject-corporate`, { userId });
      setActionMsg(data.message);
      setCorporateRequests(corporateRequests.filter(r => r.id !== userId));
      setTimeout(() => setActionMsg(''), 5000);
    } catch (err) {
      setActionMsg('Failed to reject account.');
      setTimeout(() => setActionMsg(''), 5000);
    }
  };

  const handleApproveReporter = async (userId) => {
    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/approve-reporter`, { userId });
      setActionMsg(data.message);
      setReporterRequests(reporterRequests.filter(r => r.id !== userId));
      setTimeout(() => setActionMsg(''), 5000);
    } catch (err) {
      setActionMsg('Failed to approve reporter.');
      setTimeout(() => setActionMsg(''), 5000);
    }
  };

  const handleRejectReporter = async (userId) => {
    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/reject-reporter`, { userId });
      setActionMsg(data.message);
      setReporterRequests(reporterRequests.filter(r => r.id !== userId));
      setTimeout(() => setActionMsg(''), 5000);
    } catch (err) {
      setActionMsg('Failed to reject reporter.');
      setTimeout(() => setActionMsg(''), 5000);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const planLabels = {
    basic: 'Starter',
    standard: 'Business',
    premium: 'Enterprise',
    pro: 'Executive'
  };

  const totalPending = corporateRequests.length + reporterRequests.length;

  return (
    <div className="admin-light-page p-4 fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="new-page-title mb-1">System Notifications</h2>
          {totalPending > 0 && (
            <p className="text-muted small mb-0">
              <span className="badge bg-danger rounded-pill me-1">{totalPending}</span>
              pending approval{totalPending > 1 ? 's' : ''} require your attention
            </p>
          )}
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        <button
          className={`btn btn-sm fw-bold rounded-pill px-4 ${activeTab === 'reporters' ? 'btn-success' : 'btn-outline-secondary'}`}
          onClick={() => setActiveTab('reporters')}
        >
          <i className="bi bi-pencil-square me-2"></i>
          Reporter Requests
          {reporterRequests.length > 0 && (
            <span className="badge bg-white text-success ms-2 rounded-pill">{reporterRequests.length}</span>
          )}
        </button>
        <button
          className={`btn btn-sm fw-bold rounded-pill px-4 ${activeTab === 'corporate' ? 'btn-danger' : 'btn-outline-secondary'}`}
          onClick={() => setActiveTab('corporate')}
        >
          <i className="bi bi-building me-2"></i>
          Corporate Requests
          {corporateRequests.length > 0 && (
            <span className="badge bg-white text-danger ms-2 rounded-pill">{corporateRequests.length}</span>
          )}
        </button>
        <button
          className={`btn btn-sm fw-bold rounded-pill px-4 ${activeTab === 'articles' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setActiveTab('articles')}
        >
          <i className="bi bi-newspaper me-2"></i>
          Article Notifications
        </button>
      </div>

      {/* Action Messages */}
      {actionMsg && (
        <div className="alert alert-success alert-dismissible fade show py-2 fw-bold small rounded-3" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {actionMsg}
          <button type="button" className="btn-close" onClick={() => setActionMsg('')}></button>
        </div>
      )}

      {/* REPORTER REQUESTS TAB */}
      {activeTab === 'reporters' && (
        <div className="modern-table-container shadow-sm bg-white rounded-4 overflow-hidden border border-light">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status"></div>
            </div>
          ) : reporterRequests.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-pencil-square text-muted" style={{ fontSize: '3rem', display: 'block', marginBottom: '12px', opacity: 0.3 }}></i>
              <p className="text-muted fw-bold mb-1">No Pending Reporter Applications</p>
              <p className="text-muted small">All reporter applications have been processed.</p>
            </div>
          ) : (
            <table className="table modern-table mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="text-muted small fw-bold text-uppercase py-3 ps-4 border-0">Applicant</th>
                  <th className="text-muted small fw-bold text-uppercase py-3 border-0">Expertise</th>
                  <th className="text-muted small fw-bold text-uppercase py-3 border-0">Bio</th>
                  <th className="text-muted small fw-bold text-uppercase py-3 border-0">Contact</th>
                  <th className="text-muted small fw-bold text-uppercase py-3 border-0">Applied On</th>
                  <th className="text-muted small fw-bold text-uppercase py-3 pe-4 text-center border-0">Action</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {reporterRequests.map((req) => (
                  <tr key={req.id} className="border-bottom">
                    <td className="ps-4 py-3">
                      <p className="mb-0 fw-bold text-dark">{req.name}</p>
                      <small className="text-muted">{req.email}</small>
                    </td>
                    <td className="py-3">
                      <span className="badge bg-success bg-opacity-10 text-success fw-bold px-3 py-2 rounded-pill">
                        {req.expertise || 'General'}
                      </span>
                    </td>
                    <td className="py-3">
                      <p className="mb-0 text-muted small" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {req.bio || 'No bio provided'}
                      </p>
                      {req.portfolio && (
                        <a href={req.portfolio} target="_blank" rel="noopener noreferrer" className="small text-primary fw-bold">
                          <i className="bi bi-link-45deg"></i> Portfolio
                        </a>
                      )}
                    </td>
                    <td className="py-3 text-secondary fw-medium">
                      {req.phone || 'N/A'}
                    </td>
                    <td className="py-3 text-muted small fw-bold">{formatDate(req.createdAt)}</td>
                    <td className="py-3 pe-4 text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button 
                          className="btn btn-sm btn-success rounded-pill px-3 fw-bold shadow-sm"
                          style={{ fontSize: '0.78rem' }}
                          onClick={() => handleApproveReporter(req.id)}
                          title="Approve Reporter"
                        >
                          <i className="bi bi-check-lg me-1"></i> Approve
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold"
                          style={{ fontSize: '0.78rem' }}
                          onClick={() => handleRejectReporter(req.id)}
                          title="Reject Reporter"
                        >
                          <i className="bi bi-x-lg me-1"></i> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CORPORATE REQUESTS TAB */}
      {activeTab === 'corporate' && (
        <div className="modern-table-container shadow-sm bg-white rounded-4 overflow-hidden border border-light">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : corporateRequests.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-building text-muted" style={{ fontSize: '3rem', display: 'block', marginBottom: '12px', opacity: 0.3 }}></i>
              <p className="text-muted fw-bold mb-1">No Pending Corporate Requests</p>
              <p className="text-muted small">All corporate accounts have been processed.</p>
            </div>
          ) : (
            <table className="table modern-table mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="text-muted small fw-bold text-uppercase py-3 ps-4 border-0">Applicant</th>
                  <th className="text-muted small fw-bold text-uppercase py-3 border-0">Company</th>
                  <th className="text-muted small fw-bold text-uppercase py-3 border-0">Contact</th>
                  <th className="text-muted small fw-bold text-uppercase py-3 border-0">Selected Plan</th>
                  <th className="text-muted small fw-bold text-uppercase py-3 border-0">Applied On</th>
                  <th className="text-muted small fw-bold text-uppercase py-3 pe-4 text-center border-0">Action</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {corporateRequests.map((req) => (
                  <tr key={req.id} className="border-bottom">
                    <td className="ps-4 py-3">
                      <p className="mb-0 fw-bold text-dark">{req.name}</p>
                      <small className="text-muted">{req.email}</small>
                    </td>
                    <td className="py-3">
                      <span className="fw-bold text-dark">{req.companyName || 'N/A'}</span>
                      {req.designation && <small className="d-block text-muted">{req.designation}</small>}
                    </td>
                    <td className="py-3 text-secondary fw-medium">
                      {req.phone || 'N/A'}
                    </td>
                    <td className="py-3">
                      <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-2 rounded-pill">
                        {planLabels[req.selectedPlan] || req.selectedPlan || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 text-muted small fw-bold">{formatDate(req.createdAt)}</td>
                    <td className="py-3 pe-4 text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button 
                          className="btn btn-sm btn-success rounded-pill px-3 fw-bold shadow-sm"
                          style={{ fontSize: '0.78rem' }}
                          onClick={() => handleApproveCorporate(req.id)}
                          title="Approve Corporate Account"
                        >
                          <i className="bi bi-check-lg me-1"></i> Approve
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold"
                          style={{ fontSize: '0.78rem' }}
                          onClick={() => handleRejectCorporate(req.id)}
                          title="Reject Corporate Account"
                        >
                          <i className="bi bi-x-lg me-1"></i> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ARTICLES NOTIFICATIONS TAB */}
      {activeTab === 'articles' && (
        <div className="modern-table-container shadow-sm bg-white rounded-4 overflow-hidden border border-light">
          <table className="table modern-table mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th className="text-muted small fw-bold text-uppercase py-3 ps-4 border-0">Name / Event</th>
                <th className="text-muted small fw-bold text-uppercase py-3 border-0">Email / Source</th>
                <th className="text-muted small fw-bold text-uppercase py-3 border-0">Status</th>
                <th className="text-muted small fw-bold text-uppercase py-3 border-0">Role / Type</th>
                <th className="text-muted small fw-bold text-uppercase py-3 pe-4 text-center border-0">Action</th>
              </tr>
            </thead>
            <tbody className="border-top-0">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">No notifications found.</td>
                </tr>
              ) : (
                notifications.map((note) => (
                  <tr key={note.id} className="border-bottom">
                    <td className="ps-4 py-3">
                      <p className="mb-0 fw-bold text-dark">{note.message}</p>
                      <small className="text-muted">{formatDate(note.date)}</small>
                    </td>
                    <td className="py-3 text-secondary fw-medium">{note.user}</td>
                    <td className="py-3">
                      <span className={`status-pill ${note.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                        {note.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="bg-light text-dark fw-medium px-3 py-1 border rounded-2 small">
                        {note.role}
                      </span>
                    </td>
                    <td className="py-3 pe-4 text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button 
                          className="btn btn-sm btn-light rounded-circle shadow-sm hover-scale" 
                          style={{width: '32px', height: '32px'}}
                          onClick={() => {
                            setSelectedNotification(note);
                            setShowModal(true);
                          }}
                          title="View Details"
                        >
                          <i className="bi bi-eye-fill text-primary" style={{fontSize: '0.9rem'}}></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-light rounded-circle shadow-sm hover-scale" 
                          style={{width: '32px', height: '32px'}}
                          onClick={() => handleRemove(note.id)}
                          title="Dismiss Notification"
                        >
                          <i className="bi bi-trash3-fill text-danger" style={{fontSize: '0.9rem'}}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Details Modal */}
      {showModal && selectedNotification && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden fade-in">
              <div className="modal-header bg-primary text-white border-0 p-4">
                <h5 className="modal-title fw-bold"><i className="bi bi-info-circle-fill me-2"></i> Notification Details</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <span className="badge bg-light text-primary border border-primary mb-3 px-3 py-2 rounded-pill">
                  {selectedNotification.type}
                </span>
                <h4 className="fw-bold text-dark mb-2">{selectedNotification.rawArticle.title}</h4>
                <p className="text-muted small mb-4">Published on {formatDate(selectedNotification.date)}</p>
                
                <div className="row g-3">
                  <div className="col-6">
                    <div className="p-3 bg-light rounded-3 text-center">
                      <p className="mb-1 text-muted small fw-bold text-uppercase">Category</p>
                      <h6 className="mb-0 fw-bold">{selectedNotification.rawArticle.category || 'News'}</h6>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-light rounded-3 text-center">
                      <p className="mb-1 text-muted small fw-bold text-uppercase">Total Views</p>
                      <h6 className="mb-0 fw-bold">{selectedNotification.rawArticle.views || 0}</h6>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="p-3 bg-light rounded-3 text-center">
                      <p className="mb-1 text-muted small fw-bold text-uppercase">Author</p>
                      <h6 className="mb-0 fw-bold">{selectedNotification.rawArticle.author || 'System Admin'}</h6>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light border-0 p-3">
                <button type="button" className="btn btn-outline-secondary px-4 fw-bold rounded-pill shadow-sm hover-scale" onClick={() => setShowModal(false)}>Close Window</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
