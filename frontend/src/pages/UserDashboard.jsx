import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import API_BASE from '../config/api';
import { INDIAN_STATES, INDIAN_STATES_CITIES } from '../data/indianStatesAndCities';
import AdAvailabilityCalendar from '../components/AdAvailabilityCalendar';

const allCategories = [
  'News', 'Articles', 'Trending', 'OEM', 'Automation',
  'Interviews', 'Startups', 'Business', 'Events', 'Videos',
  'Entertainment', 'Sports', 'Education', 'Manufacturing',
  'Acquisitions', 'Media Kit', 'Magazine'
];

/* ─── SLOT CONFIG ─── */
const AD_SLOTS = [
  { id: 'leaderboard', label: 'Header Leaderboard', dim: '728 × 90' },
  { id: 'right-half-page', label: 'Right Sidebar', dim: '300 × 600' },
  { id: 'article-inline', label: 'Article Inline', dim: '728 × 90' },
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
  const [adForm, setAdForm] = useState({ adTitle: '', adDescription: '', slot: 'leaderboard', link: '', duration: '1 month', budget: '', imageFile: null, targetState: '', targetCity: '', startDate: '', endDate: '' });
  const [adFormMsg, setAdFormMsg] = useState({ text: '', type: '' });
  const [submittingAd, setSubmittingAd] = useState(false);

  // Profile pic
  const [uploadingPic, setUploadingPic] = useState(false);

  // Publish form (for reporters/authors/corporates)
  const [articleForm, setArticleForm] = useState({ title: '', content: '', category: 'Articles', image: null, highlights: '', tags: '' });
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState({ text: '', type: '' });

  // Real analytics data from backend
  const [authorStats, setAuthorStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('userInfo');
    if (saved) { setUserInfo(JSON.parse(saved)); }
    else { navigate('/login'); }
  }, [navigate]);

  useEffect(() => {
    if (userInfo?.id) {
      const fetchLatestStats = async () => {
        try {
          const { data } = await axios.get(`${API_BASE}/api/auth/user/${userInfo.id}`);
          setUserInfo(prev => {
            const updated = { ...prev, ...data };
            sessionStorage.setItem('userInfo', JSON.stringify(updated));
            return updated;
          });
        } catch (err) {
          console.error('Failed to fetch latest stats', err);
        }
      };
      fetchLatestStats();
    }
  }, [userInfo?.id]);

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
    if ((userInfo?.role === 'corporate' || userInfo?.role === 'author') && userInfo?.token) {
      fetchMyAdRequests();
      fetchAuthorStats();
    }
  }, [userInfo]);

  const fetchAuthorStats = async () => {
    if (!userInfo?.id) return;
    setStatsLoading(true);
    try {
      const { data } = await axios.get(
        `${API_BASE}/api/articles/author-stats/${userInfo.id}?authorName=${encodeURIComponent(userInfo.name || '')}`,
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );
      setAuthorStats(data);
    } catch (err) {
      console.error('Failed to fetch author stats', err);
    } finally {
      setStatsLoading(false);
    }
  };

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
        highlights: articleForm.highlights ? articleForm.highlights.split('\n').filter(h => h.trim() !== '') : null,
        tags: articleForm.tags
      }, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token}` } });
      setPublishMsg({ text: 'Article published successfully!', type: 'success' });
      setArticleForm({ title: '', content: '', category: 'Articles', image: null, highlights: '', tags: '' });
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
      const picUrl = data.imageUrl.includes('?') ? `${data.imageUrl}&t=${Date.now()}` : `${data.imageUrl}?t=${Date.now()}`;
      const updated = { ...userInfo, profilePic: picUrl };
      
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
        targetState: adForm.targetState,
        targetCity: adForm.targetCity,
        startDate: adForm.startDate,
        endDate: adForm.endDate,
        companyName: userInfo.companyName || userInfo.name,
        contactEmail: userInfo.email,
        phone: userInfo.phone || ''
      }, { headers: { Authorization: `Bearer ${userInfo.token}` } });

      setAdFormMsg({ text: '✅ Ad request submitted successfully! Awaiting SuperAdmin approval (reviewed within 24 hours).', type: 'success' });
      setAdForm({ adTitle: '', adDescription: '', slot: 'leaderboard', link: '', duration: '1 month', budget: '', imageFile: null, targetState: '', targetCity: '', startDate: '', endDate: '' });
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
    (a.authorId && userInfo.id && parseInt(a.authorId) === parseInt(userInfo.id)) ||
    (a.author && userInfo.name && a.author.toLowerCase() === userInfo.name.toLowerCase())
  );
  const totalViews = myArticles.reduce((sum, a) => sum + (a.views || 0), 0);

  const roleLabel = isCorporate ? 'Corporate User' : isReporter ? 'Author / Reporter' : 'Reader';
  const accentColor = isCorporate ? '#8b5cf6' : isReporter ? '#10b981' : '#3b82f6';

  const AD_LIMITS = { basic: 1, standard: 2, premium: 3, pro: 5 };
  const adLimit = AD_LIMITS[userInfo.membershipPlan] || 0;
  const approvedAdsCount = adRequests.filter(r => r.status === 'approved').length;

  const menuItems = [
    ...(isCorporate || isReporter ? [
      { name: 'Dashboard', id: 'dashboard', icon: 'bi-grid-1x2-fill' },
      { name: 'Analytics', id: 'analytics', icon: 'bi-graph-up-arrow' },
      { name: 'My Articles', id: 'articles', icon: 'bi-newspaper' }
    ] : []),
    ...(isReporter || isCorporate ? [{ name: 'Publish Article', id: 'publish', icon: 'bi-pencil-square' }] : []),
    ...(isCorporate && userInfo.membershipPlan ? [{ name: 'Upload Ad', id: 'upload-ad', icon: 'bi-cloud-upload' }] : []),
    ...(isCorporate || isReporter ? [{ name: 'Ad Requests', id: 'ads', icon: 'bi-megaphone-fill' }] : []),
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
          <Link to="/">
            <img src="/industrialtimes_white.png" alt="Industrial Times" />
          </Link>
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
              <img src={userInfo.profilePic ? (userInfo.profilePic.startsWith('http') ? userInfo.profilePic : `${API_BASE}${userInfo.profilePic.startsWith('/') ? '' : '/'}${userInfo.profilePic}`) : 'https://via.placeholder.com/40'} alt="" className="ud-profile-avatar" />
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
                <div className="ud-stat-card"><div className="ud-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}><i className="bi bi-people-fill"></i></div><div><div className="ud-stat-value">{userInfo.followersCount || 0}</div><div className="ud-stat-label">Followers</div></div></div>
                <div className="ud-stat-card"><div className="ud-stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}><i className="bi bi-star-fill text-warning"></i></div><div><div className="ud-stat-value">{userInfo.averageRating ? `${userInfo.averageRating.toFixed(1)} / 5` : '0.0 / 5'}</div><div className="ud-stat-label">Rating ({userInfo.ratingsCount || 0})</div></div></div>
                <div className="ud-stat-card"><div className="ud-stat-icon" style={{ background: '#faf5ff', color: '#8b5cf6' }}><i className="bi bi-credit-card"></i></div><div><div className="ud-stat-value" style={{ fontSize: '1.05rem', letterSpacing: '-0.2px' }}>{userInfo.membershipPlan ? planLabels[userInfo.membershipPlan] || 'Active' : 'Free'}</div><div className="ud-stat-label">Current Plan</div>{isCorporate && adLimit > 0 && <div style={{ fontSize: '0.65rem', color: '#8b5cf6', fontWeight: 800, marginTop: '4px', background: '#f3e8ff', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>{adLimit - approvedAdsCount} ADS LEFT</div>}</div></div>
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

          {/* ── ANALYTICS TAB (Real Data) ── */}
          {activeTab === 'analytics' && (
            <div className="ud-dashboard-home">
              {statsLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                  <i className="bi bi-arrow-repeat" style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}></i>
                  <p style={{ marginTop: '0.5rem' }}>Loading your analytics...</p>
                </div>
              ) : !authorStats ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                  <i className="bi bi-graph-up" style={{ fontSize: '2.5rem' }}></i>
                  <p style={{ marginTop: '0.5rem' }}>No analytics data available yet. Start publishing to see your stats!</p>
                </div>
              ) : (
                <>
                  {/* Top Stats Row */}
                  <div className="ud-stats-row">
                    <div className="ud-stat-card">
                      <div className="ud-stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><i className="bi bi-eye"></i></div>
                      <div><div className="ud-stat-value">{(authorStats.totalViews || 0).toLocaleString()}</div><div className="ud-stat-label">Total Views</div></div>
                    </div>
                    <div className="ud-stat-card">
                      <div className="ud-stat-icon" style={{ background: '#fef2f2', color: '#ef4444' }}><i className="bi bi-heart-fill"></i></div>
                      <div><div className="ud-stat-value">{(authorStats.totalLikes || 0).toLocaleString()}</div><div className="ud-stat-label">Total Likes</div></div>
                    </div>
                    <div className="ud-stat-card">
                      <div className="ud-stat-icon" style={{ background: '#f0fdf4', color: '#10b981' }}><i className="bi bi-chat-dots-fill"></i></div>
                      <div><div className="ud-stat-value">{(authorStats.totalComments || 0).toLocaleString()}</div><div className="ud-stat-label">Total Comments</div></div>
                    </div>
                    <div className="ud-stat-card">
                      <div className="ud-stat-icon" style={{ background: '#fefce8', color: '#eab308' }}><i className="bi bi-bar-chart-fill"></i></div>
                      <div><div className="ud-stat-value">{(authorStats.avgViewsPerArticle || 0).toLocaleString()}</div><div className="ud-stat-label">Avg Views / Article</div></div>
                    </div>
                    <div className="ud-stat-card">
                      <div className="ud-stat-icon" style={{ background: '#faf5ff', color: '#8b5cf6' }}><i className="bi bi-lightning-fill"></i></div>
                      <div><div className="ud-stat-value">{authorStats.engagementRate || '0.0'}%</div><div className="ud-stat-label">Engagement Rate</div></div>
                    </div>
                    <div className="ud-stat-card">
                      <div className="ud-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}><i className="bi bi-clock-history"></i></div>
                      <div><div className="ud-stat-value">{authorStats.recentArticles || 0}</div><div className="ud-stat-label">Published This Week</div><div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '2px' }}>{(authorStats.recentViews || 0).toLocaleString()} views</div></div>
                    </div>
                  </div>

                  {/* Top Performing Articles */}
                  {authorStats.topArticles && authorStats.topArticles.length > 0 && (
                    <div className="ud-card" style={{ marginBottom: '1.5rem' }}>
                      <div className="ud-card-header"><h3><i className="bi bi-trophy-fill me-2" style={{ color: '#eab308' }}></i>Top Performing Articles</h3></div>
                      <div className="ud-card-body">
                        <table className="ud-table">
                          <thead><tr><th>#</th><th>Title</th><th>Category</th><th>Views</th><th>Likes</th><th>Published</th></tr></thead>
                          <tbody>
                            {authorStats.topArticles.map((a, i) => (
                              <tr key={a.id}>
                                <td><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: i === 0 ? '#fef3c7' : i === 1 ? '#f3f4f6' : i === 2 ? '#fef2f2' : '#f9fafb', color: i === 0 ? '#d97706' : i === 1 ? '#6b7280' : '#9ca3af', fontWeight: 800, fontSize: '0.75rem' }}>{i + 1}</span></td>
                                <td style={{ fontWeight: 600 }}>{a.title}</td>
                                <td><span className="ud-badge">{a.category}</span></td>
                                <td style={{ fontWeight: 700 }}>{(a.views || 0).toLocaleString()}</td>
                                <td style={{ color: '#ef4444', fontWeight: 600 }}><i className="bi bi-heart-fill" style={{ fontSize: '0.7rem', marginRight: '4px' }}></i>{a.likes || 0}</td>
                                <td style={{ color: '#6b7280', fontSize: '0.82rem' }}>{new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Category Breakdown with real views/likes */}
                  <div className="ud-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="ud-card-header"><h3><i className="bi bi-pie-chart-fill me-2" style={{ color: accentColor }}></i>Category Performance</h3></div>
                    <div className="ud-card-body">
                      {authorStats.categoryBreakdown && Object.keys(authorStats.categoryBreakdown).length > 0 ? (
                        Object.entries(authorStats.categoryBreakdown)
                          .sort(([,a], [,b]) => b.views - a.views)
                          .map(([cat, data]) => (
                            <div key={cat} className="ud-progress-item" style={{ marginBottom: '1rem' }}>
                              <div className="ud-progress-label">
                                <span style={{ fontWeight: 600 }}>{cat}</span>
                                <span style={{ display: 'flex', gap: '12px', fontSize: '0.78rem' }}>
                                  <span>{data.count} article{data.count !== 1 ? 's' : ''}</span>
                                  <span style={{ color: '#3b82f6' }}><i className="bi bi-eye" style={{ fontSize: '0.7rem', marginRight: '2px' }}></i>{data.views.toLocaleString()}</span>
                                  <span style={{ color: '#ef4444' }}><i className="bi bi-heart-fill" style={{ fontSize: '0.65rem', marginRight: '2px' }}></i>{data.likes}</span>
                                </span>
                              </div>
                              <div className="ud-progress-bar"><div className="ud-progress-fill" style={{ width: `${Math.min(100, (data.views / Math.max(1, authorStats.totalViews)) * 100)}%`, background: accentColor }}></div></div>
                            </div>
                          ))
                      ) : (
                        <p className="text-muted">No category data yet. Publish articles to see breakdown.</p>
                      )}
                    </div>
                  </div>

                  {/* Monthly Publishing Trend */}
                  {authorStats.monthlyTrend && Object.keys(authorStats.monthlyTrend).length > 0 && (
                    <div className="ud-card">
                      <div className="ud-card-header"><h3><i className="bi bi-calendar3 me-2" style={{ color: '#10b981' }}></i>Monthly Publishing Trend (Last 6 Months)</h3></div>
                      <div className="ud-card-body">
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '140px', padding: '0 8px' }}>
                          {Object.entries(authorStats.monthlyTrend).map(([month, data]) => {
                            const maxCount = Math.max(1, ...Object.values(authorStats.monthlyTrend).map(d => d.count));
                            const barHeight = data.count > 0 ? Math.max(12, (data.count / maxCount) * 120) : 4;
                            const monthLabel = new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short' });
                            return (
                              <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#374151' }}>{data.count}</span>
                                <div style={{ width: '100%', height: `${barHeight}px`, background: data.count > 0 ? accentColor : '#e5e7eb', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' }}></div>
                                <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{monthLabel}</span>
                                <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>{data.views.toLocaleString()} views</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
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
                  <div className="ud-form-field">
                    <label>Article Tags / Keywords (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. steel, manufacturing, automation (comma-separated)" 
                      value={articleForm.tags || ''} 
                      onChange={e => setArticleForm({ ...articleForm, tags: e.target.value })} 
                    />
                    <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                      Separate tags with commas. These tags work in the background for SEO and indexing.
                    </small>
                  </div>
                  <div className="ud-form-field"><label>Article Content *</label><textarea rows={10} placeholder="Write your article content here..." value={articleForm.content} onChange={e => setArticleForm({ ...articleForm, content: e.target.value })} required /></div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" className="ud-submit-btn" disabled={publishing} style={{ background: accentColor }}>
                      <i className="bi bi-send-fill me-2"></i>{publishing ? 'Publishing...' : 'Publish Article'}
                    </button>
                    <button type="button" className="ud-submit-btn" style={{ background: '#6b7280' }} onClick={() => setArticleForm({ title: '', content: '', category: 'Articles', image: null, highlights: '', tags: '' })}>Clear</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── UPLOAD AD TAB (Corporate Only) ── */}
          {activeTab === 'upload-ad' && isCorporate && (
            <div>
              {/* Plan-based ad limits info */}
              {isCorporate && (
                <div className="ud-card" style={{ marginBottom: '1.5rem' }}>
                  <div className="ud-card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1rem' }}><i className="bi bi-credit-card-2-front me-2" style={{ color: accentColor }}></i>Your Plan: {planLabels[userInfo.membershipPlan] || 'FREE'}</h4>
                      <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.82rem' }}>You can have up to <strong>{adLimit}</strong> active ad campaigns. Currently using <strong>{approvedAdsCount}</strong>.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ padding: '6px 16px', borderRadius: '20px', fontWeight: 700, fontSize: '0.8rem', background: approvedAdsCount >= adLimit ? '#fef2f2' : '#f0fdf4', color: approvedAdsCount >= adLimit ? '#dc2626' : '#15803d', border: `1px solid ${approvedAdsCount >= adLimit ? '#fecaca' : '#bbf7d0'}` }}>
                        {adLimit - approvedAdsCount > 0 ? `${adLimit - approvedAdsCount} slots available` : 'No slots available'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Ad Upload Form */}
              <div className="ud-card" style={{ marginBottom: '1.5rem' }}>
                <div className="ud-card-header"><h3><i className="bi bi-cloud-upload me-2" style={{ color: accentColor }}></i>Upload New Advertisement</h3></div>
                <div className="ud-card-body">
                  <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.2rem' }}>Upload your ad with targeting details. It will be reviewed and approved by the SuperAdmin within 24 hours before going live.</p>

                  {adFormMsg.text && (<div className={`ud-alert ${adFormMsg.type}`}>{adFormMsg.text}</div>)}

                  {isCorporate && approvedAdsCount >= adLimit && adLimit > 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                      <i className="bi bi-exclamation-triangle" style={{ fontSize: '2rem', color: '#dc2626' }}></i>
                      <p style={{ fontWeight: 700, color: '#dc2626', marginTop: '0.5rem' }}>You’ve reached your ad limit for the {planLabels[userInfo.membershipPlan]} plan.</p>
                      <button className="ud-submit-btn" style={{ background: accentColor, marginTop: '0.5rem' }} onClick={() => setActiveTab('upgrade')}>Upgrade Plan</button>
                    </div>
                  ) : (
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
                        <div className="ud-form-field">
                          <label>Target State <span style={{ color: '#ef4444' }}>*</span></label>
                          <select value={adForm.targetState} onChange={e => setAdForm({ ...adForm, targetState: e.target.value, targetCity: '', hideCalendar: false })} required>
                            <option value="">— Select State —</option>
                            {INDIAN_STATES.map(st => (<option key={st} value={st}>{st}</option>))}
                          </select>
                        </div>
                        <div className="ud-form-field">
                          <label>Target City <span style={{ color: '#ef4444' }}>*</span></label>
                          <select value={adForm.targetCity} onChange={e => setAdForm({ ...adForm, targetCity: e.target.value, hideCalendar: false })} disabled={!adForm.targetState} required>
                            <option value="">— Select City —</option>
                            {adForm.targetState && INDIAN_STATES_CITIES[adForm.targetState]?.map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="ud-form-grid">
                        <div className="ud-form-field">
                          <label>Start Date <span style={{ color: '#ef4444' }}>*</span></label>
                          <input type="date" value={adForm.startDate} onChange={e => setAdForm({ ...adForm, startDate: e.target.value })} required />
                        </div>
                        <div className="ud-form-field">
                          <label>End Date <span style={{ color: '#ef4444' }}>*</span></label>
                          <input type="date" value={adForm.endDate} onChange={e => setAdForm({ ...adForm, endDate: e.target.value })} required />
                        </div>
                      </div>

                      {/* Availability Calendar */}
                      {adForm.targetState && adForm.targetCity && !adForm.hideCalendar && (
                        <div style={{ margin: '0.5rem 0 1rem' }}>
                          <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span><i className="bi bi-calendar-check me-1"></i> Slot Availability Calendar</span>
                            <button type="button" onClick={() => setAdForm({ ...adForm, hideCalendar: true })} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}><i className="bi bi-x-lg"></i></button>
                          </label>
                          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                            <AdAvailabilityCalendar
                              slot={adForm.slot}
                              targetState={adForm.targetState}
                              targetCity={adForm.targetCity}
                              API_BASE={API_BASE}
                              authToken={userInfo?.token}
                              compact
                              onSelectDate={(dateStr) => setAdForm({ ...adForm, startDate: dateStr, endDate: dateStr, duration: '1 day', hideCalendar: true })}
                            />
                          </div>
                        </div>
                      )}

                      <div className="ud-form-grid">
                        <div className="ud-form-field"><label>Click-Through URL</label><input type="url" placeholder="https://yourcompany.com" value={adForm.link} onChange={e => setAdForm({ ...adForm, link: e.target.value })} /></div>
                        <div className="ud-form-field"><label>Duration</label>
                          <select value={adForm.duration} onChange={e => setAdForm({ ...adForm, duration: e.target.value })}>
                            <option value="1 day">1 Day</option><option value="2 days">2 Days</option><option value="3 days">3 Days</option><option value="7 days">7 Days</option><option value="1 month">1 Month</option><option value="3 months">3 Months</option><option value="6 months">6 Months</option><option value="1 year">1 Year</option><option value="Custom">Custom (Set via Dates)</option>
                          </select>
                        </div>
                      </div>
                      <div className="ud-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                        <div className="ud-form-field"><label>Ad Banner Image *</label><input type="file" id="ud-ad-image" accept="image/*" onChange={e => setAdForm({ ...adForm, imageFile: e.target.files[0] || null })} required /></div>
                      </div>
                      <button type="submit" className="ud-submit-btn" disabled={submittingAd} style={{ background: accentColor }}>
                        <i className="bi bi-send-fill me-2"></i>{submittingAd ? 'Submitting...' : 'Submit Ad for Approval'}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Ad Request History (Moved here for Reporter/Corporate to see status) */}
              <div className="ud-card">
                <div className="ud-card-header"><h3>Your Ad Campaigns & Status</h3></div>
                <div className="ud-card-body">
                  {adRequests.length === 0 ? (
                    <p className="text-muted">No ad campaigns submitted yet.</p>
                  ) : (
                    <table className="ud-table">
                      <thead><tr><th>Ad Title</th><th>Location</th><th>Dates</th><th>Status</th><th>Admin Notes</th></tr></thead>
                      <tbody>
                        {adRequests.map(r => (
                          <tr key={r.id}>
                            <td style={{ fontWeight: 600 }}>{r.adTitle}</td>
                            <td style={{ fontSize: '0.8rem' }}>{r.targetCity ? `${r.targetCity}, ${r.targetState}` : r.targetState || '—'}</td>
                            <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>{r.startDate || '—'} → {r.endDate || '—'}</td>
                            <td><span className={`ud-status-badge ${r.status}`}>{r.status.toUpperCase()}</span></td>
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

          {/* ── AD REQUESTS TAB (Corporate Only) ── */}
          {activeTab === 'ads' && (isCorporate || isReporter) && (
            <div>
              {/* Submit Ad Request Form */}
              <div className="ud-card" style={{ marginBottom: '1.5rem' }}>
                <div className="ud-card-header"><h3><i className="bi bi-megaphone-fill me-2" style={{ color: accentColor }}></i>Submit New Ad Request</h3></div>
                <div className="ud-card-body">
                  <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.2rem' }}>Submit your advertisement request with all details. It will be reviewed and approved by the SuperAdmin within 24 hours before going live on the website.</p>

                  {adFormMsg.text && (<div className={`ud-alert ${adFormMsg.type}`}>{adFormMsg.text}</div>)}

                  {isCorporate && approvedAdsCount >= adLimit && adLimit > 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                      <i className="bi bi-exclamation-triangle" style={{ fontSize: '2rem', color: '#dc2626' }}></i>
                      <p style={{ fontWeight: 700, color: '#dc2626', marginTop: '0.5rem' }}>You’ve reached your ad request limit for the {planLabels[userInfo.membershipPlan]} plan.</p>
                      <button className="ud-submit-btn" style={{ background: accentColor, marginTop: '0.5rem' }} onClick={() => setActiveTab('upgrade')}>Upgrade Plan</button>
                    </div>
                  ) : (
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
                      <div className="ud-form-field">
                        <label>Target State <span style={{ color: '#ef4444' }}>*</span></label>
                        <select value={adForm.targetState} onChange={e => setAdForm({ ...adForm, targetState: e.target.value, targetCity: '', hideCalendar: false })} required>
                          <option value="">— Select State —</option>
                          {INDIAN_STATES.map(st => (<option key={st} value={st}>{st}</option>))}
                        </select>
                      </div>
                      <div className="ud-form-field">
                        <label>Target City <span style={{ color: '#ef4444' }}>*</span></label>
                        <select value={adForm.targetCity} onChange={e => setAdForm({ ...adForm, targetCity: e.target.value, hideCalendar: false })} disabled={!adForm.targetState} required>
                          <option value="">— Select City —</option>
                          {adForm.targetState && INDIAN_STATES_CITIES[adForm.targetState]?.map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="ud-form-grid">
                      <div className="ud-form-field">
                        <label>Start Date <span style={{ color: '#ef4444' }}>*</span></label>
                        <input type="date" value={adForm.startDate} onChange={e => setAdForm({ ...adForm, startDate: e.target.value })} required />
                      </div>
                      <div className="ud-form-field">
                        <label>End Date <span style={{ color: '#ef4444' }}>*</span></label>
                        <input type="date" value={adForm.endDate} onChange={e => setAdForm({ ...adForm, endDate: e.target.value })} required />
                      </div>
                    </div>

                    {/* Availability Calendar */}
                    {adForm.targetState && adForm.targetCity && !adForm.hideCalendar && (
                      <div style={{ margin: '0.5rem 0 1rem' }}>
                        <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span><i className="bi bi-calendar-check me-1"></i> Slot Availability Calendar</span>
                          <button type="button" onClick={() => setAdForm({ ...adForm, hideCalendar: true })} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}><i className="bi bi-x-lg"></i></button>
                        </label>
                        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                          <AdAvailabilityCalendar
                            slot={adForm.slot}
                            targetState={adForm.targetState}
                            targetCity={adForm.targetCity}
                            API_BASE={API_BASE}
                            authToken={userInfo?.token}
                            compact
                            onSelectDate={(dateStr) => setAdForm({ ...adForm, startDate: dateStr, endDate: dateStr, duration: '1 day', hideCalendar: true })}
                          />
                        </div>
                      </div>
                    )}

                    <div className="ud-form-grid">
                      <div className="ud-form-field"><label>Click-Through URL</label><input type="url" placeholder="https://yourcompany.com" value={adForm.link} onChange={e => setAdForm({ ...adForm, link: e.target.value })} /></div>
                      <div className="ud-form-field"><label>Duration</label>
                        <select value={adForm.duration} onChange={e => setAdForm({ ...adForm, duration: e.target.value })}>
                          <option value="1 day">1 Day</option><option value="2 days">2 Days</option><option value="3 days">3 Days</option><option value="7 days">7 Days</option><option value="1 month">1 Month</option><option value="3 months">3 Months</option><option value="6 months">6 Months</option><option value="1 year">1 Year</option><option value="Custom">Custom (Set via Dates)</option>
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
                  )}
                </div>
              </div>

              {/* Ad Request History */}
              <div className="ud-card">
                <div className="ud-card-header"><h3>Your Ad Campaigns & Status</h3></div>
                <div className="ud-card-body">
                  {adRequests.length === 0 ? (
                    <p className="text-muted">No ad requests submitted yet.</p>
                  ) : (
                    <table className="ud-table">
                      <thead><tr><th>Ad Title</th><th>Slot</th><th>Location</th><th>Dates</th><th>Status</th><th>Date</th><th>Admin Notes</th></tr></thead>
                      <tbody>
                        {adRequests.map(r => (
                          <tr key={r.id}>
                            <td style={{ fontWeight: 600 }}>{r.adTitle}</td>
                            <td>{AD_SLOTS.find(s => s.id === r.slot)?.label || r.slot}</td>
                            <td style={{ fontSize: '0.8rem' }}>{r.targetCity ? `${r.targetCity}, ${r.targetState}` : r.targetState || '—'}</td>
                            <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>{r.startDate || '—'} → {r.endDate || '—'}</td>
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
                    <img src={userInfo.profilePic ? (userInfo.profilePic.startsWith('http') ? userInfo.profilePic : `${API_BASE}${userInfo.profilePic.startsWith('/') ? '' : '/'}${userInfo.profilePic}`) : 'https://via.placeholder.com/120'} alt={userInfo.name} />
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
