import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/articles');
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
        
        // Remove duplicates if same article is recent and trending
        const unique = Array.from(new Map(combined.map(item => [item.rawArticle.id, item])).values());
        
        // Sort by date descending
        unique.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setNotifications(unique);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleRemove = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="admin-light-page p-4 fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="new-page-title mb-0">System Notifications</h2>
      </div>

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
