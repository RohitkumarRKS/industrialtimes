import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../config/api';

const allCategories = ['Articles','Interviews','Trending','Manufacturing','Automation','Acquisitions','Startups','Events','Videos','Media Kit','Magazine'];

/* ─── SLOT CONFIG ─── */
const AD_SLOTS = [
  { id: 'leaderboard', label: 'Header Leaderboard', dim: '728 × 90' },
  { id: 'right-half-page', label: 'Right Sidebar', dim: '300 × 600' },
  { id: 'left-skyscraper', label: 'Left Sidebar', dim: '160 × 600' },
];

const planLabels = { basic: 'STARTER', standard: 'BUSINESS', premium: 'ENTERPRISE', pro: 'EXECUTIVE' };

const UserDashboard = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem('userInfo');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.role !== 'corporate' && parsed.role !== 'author') {
        return 'profile';
      }
    }
    return 'dashboard';
  });
  const [articles, setArticles] = useState([]);
  const [adRequests, setAdRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Ad Request Form
  const [adForm, setAdForm] = useState({ adTitle: '', adDescription: '', slot: 'leaderboard', link: '', duration: '1 month', budget: '', imageFile: null });
  const [adFormMsg, setAdFormMsg] = useState({ text: '', type: '' });
  const [submittingAd, setSubmittingAd] = useState(false);

  // Profile pic
  const [uploadingPic, setUploadingPic] = useState(false);

  // Publish form (for reporters/authors/corporates)
  const [articleForm, setArticleForm] = useState({ title: '', content: '', category: 'Articles', image: null, highlights: '' });
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    const saved = sessionStorage.getItem('userInfo');
    if (saved) { setUserInfo(JSON.parse(saved)); }
    else { navigate('/login'); }
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/articles`);
        setArticles(data || []);
      } catch (e) { console.error('Failed to fetch articles'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (userInfo?.role === 'corporate' && userInfo?.token) {
      fetchMyAdRequests();
    }
  }, [userInfo]);

  const fetchMyAdRequests = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/ad-requests/my`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setAdRequests(data || []);
    } catch (e) { console.error('Failed to fetch ad requests'); }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('userInfo');
    navigate('/');
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    setPublishing(true);
    setPublishMsg({ text: '', type: '' });
    try {
      let imageUrl = '';
      if (articleForm.image) {
        const fd = new FormData(); fd.append('image', articleForm.image);
        const upRes = await axios.post(`${API_BASE}/api/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        imageUrl = upRes.data.imageUrl;
      }
      await axios.post(`${API_BASE}/api/articles`, { 
        title: articleForm.title, 
        content: articleForm.content, 
        category: articleForm.category, 
        author: userInfo.name, 
        image: imageUrl,
        highlights: articleForm.highlights ? articleForm.highlights.split('\n').filter(h => h.trim() !== '') : null 
      }, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token}` } });
      setPublishMsg({ text: 'Article published successfully!', type: 'success' });
      setArticleForm({ title: '', content: '', category: 'Articles', image: null, highlights: '' });
      const fi = document.getElementById('ud-article-image'); if (fi) fi.value = '';
      const { data } = await axios.get(`${API_BASE}/api/articles`); setArticles(data || []);
    } catch (err) { setPublishMsg({ text: err.response?.data?.message || 'Failed to publish', type: 'danger' }); }
    finally { setPublishing(false); }
  };

  const handleProfilePic = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPic(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await axios.post(`${API_BASE}/api/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const updated = { ...userInfo, profilePic: data.imageUrl };
      
      // Persist to database
      await axios.put(`${API_BASE}/api/auth/update-profile`, {
        userId: userInfo.id,
        profilePic: data.imageUrl
      });

      setUserInfo(updated);
      sessionStorage.setItem('userInfo', JSON.stringify(updated));
    } catch (err) { alert('Failed to upload image'); }
    finally { setUploadingPic(false); }
  };

  const handleAdSubmit = async (e) => {
    e.preventDefault();
    setSubmittingAd(true);
    setAdFormMsg({ text: '', type: '' });

    try {
      let imageUrl = '';
      if (adForm.imageFile) {
        const fd = new FormData();
        fd.append('image', adForm.imageFile);
        const upRes = await axios.post(`${API_BASE}/api/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        imageUrl = upRes.data.imageUrl;
      }

      await axios.post(`${API_BASE}/api/ad-requests`, {
        adTitle: adForm.adTitle,
        adDescription: adForm.adDescription,
        slot: adForm.slot,
        imageUrl,
        link: adForm.link,
        duration: adForm.duration,
        budget: adForm.budget,
        companyName: userInfo.companyName,
        contactEmail: userInfo.email,
        phone: userInfo.phone
      }, { headers: { Authorization: `Bearer ${userInfo.token}` } });

      setAdFormMsg({ text: '✅ Ad request submitted successfully! Awaiting SuperAdmin approval.', type: 'success' });
      setAdForm({ adTitle: '', adDescription: '', slot: 'leaderboard', link: '', duration: '1 month', budget: '', imageFile: null });
      const fi = document.getElementById('ud-ad-image');
      if (fi) fi.value = '';
      fetchMyAdRequests();
    } catch (err) {
      setAdFormMsg({ text: err.response?.data?.message || 'Failed to submit ad request', type: 'danger' });
    } finally { setSubmittingAd(false); }
  };

  if (!userInfo) return null;

  const role = userInfo.role;
  const isCorporate = role === 'corporate';
  const isReporter = role === 'author';
  const myArticles = articles.filter(a =>
    (a.authorId && parseInt(a.authorId) === parseInt(userInfo.id)) ||
    (a.author && a.author.toLowerCase() === userInfo.name.toLowerCase())
  );
  const totalViews = myArticles.reduce((sum, a) => sum + (a.views || 0), 0);

  const roleLabel = isCorporate ? 'Corporate User' : isReporter ? 'Author / Reporter' : 'Reader';
  const accentColor = isCorporate ? '#8b5cf6' : isReporter ? '#10b981' : '#3b82f6';

  const menuItems = [
    ...(isCorporate || isReporter ? [
      { name: 'Dashboard', id: 'dashboard', icon: 'bi-grid-1x2-fill' },
      { name: 'Analytics', id: 'analytics', icon: 'bi-graph-up-arrow' },
      { name: 'My Articles', id: 'articles', icon: 'bi-newspaper' }
    ] : []),
    ...(isReporter || isCorporate ? [{ name: 'Publish Article', id: 'publish', icon: 'bi-pencil-square' }] : []),
    ...(isCorporate && userInfo.membershipPlan ? [{ name: 'Ad Requests', id: 'ads', icon: 'bi-megaphone-fill' }] : []),
    { name: 'Profile', id: 'profile', icon: 'bi-person-fill' },
    ...(isCorporate ? [{ name: 'Upgrade Plan', id: 'upgrade', icon: 'bi-arrow-up-circle-fill' }] : []),
  ];

  return (
    <div className="ud-layout">
      {/* MOBILE OVERLAY */}
      <div className={`ud-mobile-overlay ${sidebarOpen ? 'ud-overlay-show' : ''}`} onClick={() => setSidebarOpen(false)}></div>
      {/* SIDEBAR */}
      <aside className={`ud-sidebar ${sidebarOpen ? 'ud-sidebar-open' : ''}`} style={{ '--ud-accent': accentColor }}>
        <div className="ud-sidebar-logo">
          <img src="/industrialtimes_white.png" alt="Industrial Times" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
        </div>
        <nav className="ud-sidebar-nav">
          {menuItems.map(item => (
            <button key={item.id} className={`ud-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}>
              <i className={`bi ${item.icon} ud-nav-icon`}></i>
              <span className="ud-nav-label">{item.name}</span>
              {item.id === 'ads' && adRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="ud-nav-badge">{adRequests.filter(r => r.status === 'pending').length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="ud-sidebar-bottom">
          <button className="ud-view-site-btn" onClick={() => navigate('/')}>
            <i className="bi bi-globe2"></i><span>View Website</span>
          </button>
          <button className="ud-logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i><span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="ud-main">
        {/* TOPBAR */}
        <header className="ud-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="ud-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}><i className="bi bi-list"></i></button>
            <h1 className="ud-page-title">{menuItems.find(m => m.id === activeTab)?.name || 'Dashboard'}</h1>
          </div>
          <div className="ud-topbar-right">
            <span className="ud-role-tag" style={{ background: accentColor }}>{roleLabel}</span>
            <div className="ud-profile-chip">
              <img src={userInfo.profilePic || 'https://via.placeholder.com/40'} alt="" className="ud-profile-avatar" />
              <div className="ud-profile-info">
                <span className="ud-profile-name">{userInfo.name}</span>
                <span className="ud-profile-role">{roleLabel} <span className="text-success" style={{ fontSize: '0.6rem' }}>● Active</span></span>
              </div>
            </div>
            <button className="ud-topbar-site-link" onClick={() => navigate('/')}><i className="bi bi-globe2"></i> Website</button>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="ud-content">

          {/* ── DASHBOARD TAB ── */}
          {activeTab === 'dashboard' && (
            <div className="ud-dashboard-home">
              <div className="ud-stats-row">
                <div className="ud-stat-card"><div className="ud-stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><i className="bi bi-file-earmark-text"></i></div><div><div className="ud-stat-value">{myArticles.length}</div><div className="ud-stat-label">Total Articles</div></div></div>
                <div className="ud-stat-card"><div className="ud-stat-icon" style={{ background: '#f0fdf4', color: '#10b981' }}><i className="bi bi-eye"></i></div><div><div className="ud-stat-value">{totalViews.toLocaleString()}</div><div className="ud-stat-label">Total Views</div></div></div>
                <div className="ud-stat-card"><div className="ud-stat-icon" style={{ background: '#faf5ff', color: '#8b5cf6' }}><i className="bi bi-credit-card"></i></div><div><div className="ud-stat-value">{userInfo.membershipPlan ? planLabels[userInfo.membershipPlan] || 'Active' : 'Free'}</div><div className="ud-stat-label">Current Plan</div></div></div>
                <div className="ud-stat-card"><div className="ud-stat-icon" style={{ background: '#fefce8', color: '#eab308' }}><i className="bi bi-calendar3"></i></div><div><div className="ud-stat-value">{userInfo.createdAt ? new Date(userInfo.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</div><div className="ud-stat-label">Member Since</div></div></div>
              </div>

              {/* Recent Articles */}
              <div className="ud-card">
                <div className="ud-card-header"><h3>Recent Publications</h3></div>
                <div className="ud-card-body">
                  {myArticles.length === 0 ? (
                    <p className="text-muted">No articles published yet.</p>
                  ) : (
                    <table className="ud-table">
                      <thead><tr><th>Title</th><th>Category</th><th>Date</th><th>Views</th></tr></thead>
                      <tbody>
                        {myArticles.slice(0, 5).map(a => (
                          <tr key={a.id}>
                            <td style={{ fontWeight: 600 }}>{a.title}</td>
                            <td><span className="ud-badge">{a.category}</span></td>
                            <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                            <td style={{ fontWeight: 700 }}>{(a.views || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── ANALYTICS TAB ── */}
          {activeTab === 'analytics' && (
            <div className="ud-dashboard-home">
              <div className="ud-stats-row">
                <div className="ud-stat-card"><div className="ud-stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><i className="bi bi-eye"></i></div><div><div className="ud-stat-value">{totalViews.toLocaleString()}</div><div className="ud-stat-label">Page Views</div></div></div>
                <div className="ud-stat-card"><div className="ud-stat-icon" style={{ background: '#f0fdf4', color: '#10b981' }}><i className="bi bi-person-check"></i></div><div><div className="ud-stat-value">{Math.max(1, Math.floor(totalViews * 0.6)).toLocaleString()}</div><div className="ud-stat-label">Unique Readers</div></div></div>
                <div className="ud-stat-card"><div className="ud-stat-icon" style={{ background: '#fef2f2', color: '#ef4444' }}><i className="bi bi-arrow-return-left"></i></div><div><div className="ud-stat-value">{myArticles.length > 0 ? `${(28.4 + (totalViews % 15) / 2).toFixed(1)}%` : '0%'}</div><div className="ud-stat-label">Bounce Rate</div></div></div>
                <div className="ud-stat-card"><div className="ud-stat-icon" style={{ background: '#fefce8', color: '#eab308' }}><i className="bi bi-stopwatch"></i></div><div><div className="ud-stat-value">{myArticles.length > 0 ? `3m ${(15 + (totalViews % 45))}s` : '0s'}</div><div className="ud-stat-label">Avg. Duration</div></div></div>
              </div>
              <div className="ud-card">
                <div className="ud-card-header"><h3>Category Breakdown</h3></div>
                <div className="ud-card-body">
                  {[...new Set(myArticles.map(a => a.category))].map(cat => {
                    const count = myArticles.filter(a => a.category === cat).length;
                    return (
                      <div key={cat} className="ud-progress-item">
                        <div className="ud-progress-label"><span>{cat}</span><span>{count} articles</span></div>
                        <div className="ud-progress-bar"><div className="ud-progress-fill" style={{ width: `${Math.min(100, (count / Math.max(1, myArticles.length)) * 100)}%`, background: accentColor }}></div></div>
                      </div>
                    );
                  })}
                  {myArticles.length === 0 && <p className="text-muted">No data yet. Publish articles to see analytics.</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── MY ARTICLES TAB ── */}
          {activeTab === 'articles' && (
            <div className="ud-card">
              <div className="ud-card-header"><h3>All Your Articles ({myArticles.length})</h3></div>
              <div className="ud-card-body">
                {myArticles.length === 0 ? (
                  <div className="text-center py-5"><i className="bi bi-file-earmark-text" style={{ fontSize: '3rem', color: '#ccc' }}></i><p className="text-muted mt-2">No articles published yet.</p></div>
                ) : (
                  <table className="ud-table">
                    <thead><tr><th>#</th><th>Title</th><th>Category</th><th>Published</th><th>Views</th></tr></thead>
                    <tbody>
                      {myArticles.map((a, i) => (
                        <tr key={a.id}>
                          <td>{i + 1}</td>
                          <td style={{ fontWeight: 600 }}>{a.title}</td>
                          <td><span className="ud-badge">{a.category}</span></td>
                          <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                          <td style={{ fontWeight: 700 }}>{(a.views || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── PUBLISH ARTICLE TAB (Reporter/Author/Corporate Only) ── */}
          {activeTab === 'publish' && (isReporter || isCorporate) && (
            <div className="ud-card">
              <div className="ud-card-header"><h3><i className="bi bi-pencil-square me-2" style={{ color: accentColor }}></i>Publish New Article</h3></div>
              <div className="ud-card-body">
                {publishMsg.text && (<div className={`ud-alert ${publishMsg.type}`}>{publishMsg.text}</div>)}
                <form onSubmit={handlePublish}>
                  <div className="ud-form-field"><label>Article Title *</label><input type="text" placeholder="Enter a compelling headline..." value={articleForm.title} onChange={e => setArticleForm({ ...articleForm, title: e.target.value })} required /></div>
                  <div className="ud-form-grid">
                    <div className="ud-form-field"><label>Category *</label>
                      <select value={articleForm.category} onChange={e => setArticleForm({ ...articleForm, category: e.target.value })}>
                        {allCategories.map(c => (<option key={c} value={c}>{c}</option>))}
                      </select>
                    </div>
                    <div className="ud-form-field"><label>Featured Image</label><input type="file" id="ud-article-image" accept="image/*" onChange={e => setArticleForm({ ...articleForm, image: e.target.files[0] || null })} /></div>
                  </div>
                  <div className="ud-form-field"><label>Industry Highlights / Important Points</label><textarea rows={3} placeholder="Enter key points (one per line)..." value={articleForm.highlights} onChange={e => setArticleForm({ ...articleForm, highlights: e.target.value })} /></div>
                  <div className="ud-form-field"><label>Article Content *</label><textarea rows={10} placeholder="Write your article content here..." value={articleForm.content} onChange={e => setArticleForm({ ...articleForm, content: e.target.value })} required /></div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" className="ud-submit-btn" disabled={publishing} style={{ background: accentColor }}>
                      <i className="bi bi-send-fill me-2"></i>{publishing ? 'Publishing...' : 'Publish Article'}
                    </button>
                    <button type="button" className="ud-submit-btn" style={{ background: '#6b7280' }} onClick={() => setArticleForm({ title: '', content: '', category: 'Articles', image: null, highlights: '' })}>Clear</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── AD REQUESTS TAB (Corporate Only) ── */}
          {activeTab === 'ads' && isCorporate && (
            <div>
              {/* Submit Ad Request Form */}
              <div className="ud-card" style={{ marginBottom: '1.5rem' }}>
                <div className="ud-card-header"><h3><i className="bi bi-megaphone-fill me-2" style={{ color: accentColor }}></i>Submit New Ad Request</h3></div>
                <div className="ud-card-body">
                  <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.2rem' }}>Submit your advertisement request with all details. It will be reviewed and approved by the SuperAdmin before going live on the website.</p>

                  {adFormMsg.text && (<div className={`ud-alert ${adFormMsg.type}`}>{adFormMsg.text}</div>)}

                  <form onSubmit={handleAdSubmit}>
                    <div className="ud-form-grid">
                      <div className="ud-form-field"><label>Ad Title *</label><input type="text" placeholder="e.g. Summer Sale Campaign" value={adForm.adTitle} onChange={e => setAdForm({ ...adForm, adTitle: e.target.value })} required /></div>
                      <div className="ud-form-field"><label>Ad Placement Slot *</label>
                        <select value={adForm.slot} onChange={e => setAdForm({ ...adForm, slot: e.target.value })}>
                          {AD_SLOTS.map(s => (<option key={s.id} value={s.id}>{s.label} ({s.dim})</option>))}
                        </select>
                      </div>
                    </div>
                    <div className="ud-form-field"><label>Ad Description</label><textarea rows={3} placeholder="Describe your advertisement campaign..." value={adForm.adDescription} onChange={e => setAdForm({ ...adForm, adDescription: e.target.value })} /></div>
                    <div className="ud-form-grid">
                      <div className="ud-form-field"><label>Click-Through URL</label><input type="url" placeholder="https://yourcompany.com" value={adForm.link} onChange={e => setAdForm({ ...adForm, link: e.target.value })} /></div>
                      <div className="ud-form-field"><label>Duration</label>
                        <select value={adForm.duration} onChange={e => setAdForm({ ...adForm, duration: e.target.value })}>
                          <option value="1 month">1 Month</option><option value="3 months">3 Months</option><option value="6 months">6 Months</option><option value="1 year">1 Year</option>
                        </select>
                      </div>
                    </div>
                    <div className="ud-form-grid">
                      <div className="ud-form-field"><label>Budget (Optional)</label><input type="text" placeholder="e.g. ₹25,000" value={adForm.budget} onChange={e => setAdForm({ ...adForm, budget: e.target.value })} /></div>
                      <div className="ud-form-field"><label>Ad Banner Image *</label><input type="file" id="ud-ad-image" accept="image/*" onChange={e => setAdForm({ ...adForm, imageFile: e.target.files[0] || null })} required /></div>
                    </div>
                    <button type="submit" className="ud-submit-btn" disabled={submittingAd} style={{ background: accentColor }}>
                      <i className="bi bi-send-fill me-2"></i>{submittingAd ? 'Submitting...' : 'Submit Ad Request for Approval'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Ad Request History */}
              <div className="ud-card">
                <div className="ud-card-header"><h3>Your Ad Requests</h3></div>
                <div className="ud-card-body">
                  {adRequests.length === 0 ? (
                    <p className="text-muted">No ad requests submitted yet.</p>
                  ) : (
                    <table className="ud-table">
                      <thead><tr><th>Ad Title</th><th>Slot</th><th>Duration</th><th>Status</th><th>Date</th><th>Admin Notes</th></tr></thead>
                      <tbody>
                        {adRequests.map(r => (
                          <tr key={r.id}>
                            <td style={{ fontWeight: 600 }}>{r.adTitle}</td>
                            <td>{AD_SLOTS.find(s => s.id === r.slot)?.label || r.slot}</td>
                            <td>{r.duration}</td>
                            <td><span className={`ud-status-badge ${r.status}`}>{r.status.toUpperCase()}</span></td>
                            <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                            <td className="text-muted" style={{ fontSize: '0.8rem' }}>{r.adminNotes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <div className="ud-card">
              <div className="ud-card-header"><h3><i className="bi bi-person-lines-fill me-2"></i>Account Information</h3></div>
              <div className="ud-card-body">
                <div className="ud-profile-section">
                  <div className="ud-profile-avatar-big">
                    <img src={userInfo.profilePic || 'https://via.placeholder.com/120'} alt={userInfo.name} />
                    <label htmlFor="ud-pic-upload" className="ud-pic-edit" style={{ background: accentColor }}><i className="bi bi-camera-fill"></i></label>
                    <input type="file" id="ud-pic-upload" className="d-none" onChange={handleProfilePic} accept="image/*" />
                  </div>
                  <div className="ud-profile-details-grid">
                    <div className="ud-detail"><label>Full Name</label><p>{userInfo.name}</p></div>
                    <div className="ud-detail"><label>Email</label><p>{userInfo.email}</p></div>
                    {isCorporate && <div className="ud-detail"><label>Company</label><p>{userInfo.companyName || 'N/A'}</p></div>}
                    {isCorporate && <div className="ud-detail"><label>Designation</label><p>{userInfo.designation || 'N/A'}</p></div>}
                    {isCorporate && <div className="ud-detail"><label>Phone</label><p>{userInfo.phone || 'N/A'}</p></div>}
                    <div className="ud-detail"><label>Account Type</label><p style={{ textTransform: 'uppercase' }}>{role === 'corporate' ? 'Corporate Account' : role === 'author' ? 'Author / Reporter' : 'Reader'}</p></div>
                    <div className="ud-detail"><label>Current Plan</label><p>{userInfo.membershipPlan ? planLabels[userInfo.membershipPlan] || userInfo.membershipPlan : 'Free'}</p></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── UPGRADE PLAN TAB ── */}
          {activeTab === 'upgrade' && (
            <div className="ud-card">
              <div className="ud-card-header"><h3><i className="bi bi-arrow-up-circle-fill me-2" style={{ color: accentColor }}></i>Upgrade Your Plan</h3></div>
              <div className="ud-card-body">
                <div className="ud-upgrade-current">
                  <div className="ud-upgrade-badge" style={{ background: accentColor }}>{userInfo.membershipPlan ? planLabels[userInfo.membershipPlan] || 'ACTIVE' : 'FREE'}</div>
                  <p>Your current plan</p>
                </div>
                <div className="ud-upgrade-grid">
                  {[
                    { key: 'basic', name: 'STARTER', price: '₹2,500/mo', features: ['3 Articles/month', 'Basic Analytics', 'Email Support'] },
                    { key: 'standard', name: 'BUSINESS', price: '₹4,500/mo', features: ['5 Articles/month', 'Advanced Analytics', 'Priority Support'], recommended: true },
                    { key: 'premium', name: 'ENTERPRISE', price: '₹9,500/mo', features: ['7 Articles/month', '2 Ad Campaigns', 'Dedicated Manager'] },
                    { key: 'pro', name: 'EXECUTIVE', price: '₹20,000/mo', features: ['Unlimited Articles', '4 Ad Campaigns', 'Full Campaign Suite'] },
                  ].map(plan => (
                    <div key={plan.key} className={`ud-plan-card ${plan.recommended ? 'recommended' : ''} ${userInfo.membershipPlan === plan.key ? 'current' : ''}`}>
                      {plan.recommended && <div className="ud-plan-rec">RECOMMENDED</div>}
                      {userInfo.membershipPlan === plan.key && <div className="ud-plan-current-tag">CURRENT</div>}
                      <h4>{plan.name}</h4>
                      <div className="ud-plan-price">{plan.price}</div>
                      <ul>{plan.features.map((f, i) => <li key={i}><i className="bi bi-check-circle-fill"></i>{f}</li>)}</ul>
                      <button className="ud-plan-btn" style={{ background: userInfo.membershipPlan === plan.key ? '#6b7280' : accentColor }} disabled={userInfo.membershipPlan === plan.key}
                        onClick={() => navigate(isCorporate ? `/corporate/payment?plan=${plan.key}` : `/corporate/choose-plan`)}>
                        {userInfo.membershipPlan === plan.key ? 'Current Plan' : 'Upgrade Now'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
