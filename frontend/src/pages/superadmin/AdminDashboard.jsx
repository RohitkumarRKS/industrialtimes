import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import ManageNews from './ManageNews';
import ManageAds from './ManageAds';
import AdminNotifications from './AdminNotifications';
import ManagePodcast from './ManagePodcast';
import ManageEmailSettings from './ManageEmailSettings';
import ManagePlans from './ManagePlans';
import ManageAdRequests from './ManageAdRequests';
import API_BASE from '../../config/api';

/* ────────────────────────────────────────────────────────
   DASHBOARD HOME — Stats & Overview
──────────────────────────────────────────────────────── */
const AdminHome = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [trafficFilter, setTrafficFilter] = useState('This Week');
  const [selectedStatModal, setSelectedStatModal] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(6);
  const navigate = useNavigate();

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dummyHeights = [40, 70, 50, 90, 60, 80, 100];

  const getDailyValue = (mainValue, percentage) => {
    const str = String(mainValue);
    const num = parseInt(str.replace(/,/g, ''));
    if (!isNaN(num) && str.indexOf('m') === -1 && str.indexOf('s') === -1) {
      return Math.max(1, Math.round(num * (percentage / 100))).toLocaleString();
    }
    return mainValue;
  };

  const handleDropdownClick = (e, id) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/articles`);
        setArticles(data || []);
      } catch (error) {
        console.error("Error fetching articles", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const totalArticles = articles.length;
  const totalViews = articles.reduce((sum, article) => sum + (article.views || 0), 0);
  const liveVisitors = Math.max(1, Math.floor(totalViews * 0.05)); // Dynamic estimate

  const allCategories = [
    'Articles', 'Interviews', 'Trending', 'Manufacturing', 
    'Automation', 'Acquisitions', 'Startups', 'Events', 
    'Videos', 'Media Kit', 'Magazine'
  ];

  let categoryTraffic = allCategories.map(catName => ({
    name: catName,
    remaining: articles.filter(a => a.category === catName).length,
    total: 100
  }));

  const stats = [
    { label: 'Total Articles', value: totalArticles.toLocaleString(), icon: 'bi-file-earmark-text', change: '+1.5%', positive: true },
    { label: 'Live Visitors', value: liveVisitors.toLocaleString(), icon: 'bi-people', change: '+2.4%', positive: true },
    { label: 'Total Visits', value: totalViews.toLocaleString(), icon: 'bi-graph-up-arrow', change: '+12.5%', positive: true },
    { label: 'Avg. Session', value: totalViews > 0 ? `3m ${(15 + (totalViews % 45))}s` : '0s', icon: 'bi-clock-history', change: '+1.2%', positive: true },
  ];

  if (categoryFilter === 'Top 3 Only') {
    categoryTraffic = categoryTraffic.sort((a, b) => b.remaining - a.remaining).slice(0, 3);
  } else if (categoryFilter === 'Lowest First') {
    categoryTraffic = categoryTraffic.sort((a, b) => a.remaining - b.remaining);
  } else {
    // 'All Categories' - default order
    categoryTraffic = categoryTraffic.sort((a, b) => b.remaining - a.remaining);
  }

  // Dynamic Traffic Data
  let simulatedTraffic = totalViews.toLocaleString();
  if (trafficFilter === 'Today') simulatedTraffic = Math.floor(totalViews * 0.1).toLocaleString();
  if (trafficFilter === 'This Month') simulatedTraffic = Math.floor(totalViews * 3.5).toLocaleString();
  if (trafficFilter === 'This Year') simulatedTraffic = Math.floor(totalViews * 42).toLocaleString();

  // Get 5 most recent articles
  const recentArticlesList = [...articles].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  
  const upcomingArticles = recentArticlesList.map(article => ({
    title: article.title,
    units: article.category,
    date: new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    icon: 'bi-file-earmark-richtext',
    color: '#da251d',
    author: article.author
  }));

  // Fallback if empty
  if (upcomingArticles.length === 0) {
    upcomingArticles.push({ title: 'No articles published yet', units: 'None', date: 'N/A', icon: 'bi-info-circle', color: '#888' });
  }

  return (
    <div className="new-dashboard-layout full-width">
      {/* MAIN CONTENT - 100% WIDTH */}
      <div className="new-dashboard-main">
        {/* Stats Row */}
        <div className="new-stats-row">
          {stats.map((stat, idx) => (
            <div key={idx} className="new-stat-card">
              <div className="new-stat-header">
                <span className="new-stat-title">{stat.label}</span>
                <div style={{ position: 'relative' }}>
                  <i 
                    className="bi bi-three-dots stat-dots-btn" 
                    onClick={(e) => handleDropdownClick(e, `stat-${idx}`)}
                  ></i>
                  {activeDropdown === `stat-${idx}` && (
                    <div className="new-dropdown-menu shadow">
                      <div className="new-dropdown-item" onClick={() => setActiveDropdown(null)}><i className="bi bi-arrow-clockwise"></i> Refresh Data</div>
                      <div className="new-dropdown-item" onClick={() => { 
                        setSelectedStatModal(stat); 
                        setSelectedDayIndex(6); // Default to Sun
                        setActiveDropdown(null); 
                      }}><i className="bi bi-eye"></i> View Details</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="new-stat-body">
                <span className="new-stat-value">{loading ? '...' : stat.value}</span>
                <div className="new-stat-change">
                  <span className={stat.positive ? 'text-success' : 'text-danger'}>{stat.change}</span>
                  <span className="text-muted">from last week</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Middle Split Row */}
        <div className="new-middle-split">
          {/* Category Activity */}
          <div className="new-card new-stock-card">
            <div className="new-card-header">
              <h3>Category Activity</h3>
              <div style={{ position: 'relative' }}>
                  <button 
                  className="new-card-btn" 
                  onClick={(e) => handleDropdownClick(e, 'filter-category')}
                >
                  {categoryFilter} <i className="bi bi-chevron-down"></i>
                </button>
                {activeDropdown === 'filter-category' && (
                  <div className="new-dropdown-menu shadow">
                    <div className="new-dropdown-item" onClick={() => { setCategoryFilter('All Categories'); setActiveDropdown(null); }}>All Categories</div>
                    <div className="new-dropdown-item" onClick={() => { setCategoryFilter('Top 3 Only'); setActiveDropdown(null); }}>Top 3 Only</div>
                    <div className="new-dropdown-item" onClick={() => { setCategoryFilter('Lowest First'); setActiveDropdown(null); }}>Lowest First</div>
                  </div>
                )}
              </div>
            </div>
            <div className="new-stock-summary">
              <span className="new-stock-value">{totalArticles}</span> <span className="new-stock-total">Articles</span>
              <span className="new-stock-status">Live Data</span>
            </div>
            <div className="new-stock-list" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '5px' }}>
              {categoryTraffic.map((cat, i) => (
                <div key={i} className="new-stock-item">
                  <div className="new-stock-item-info">
                    <span>{cat.name}</span>
                    <span className="new-stock-item-stats">{cat.remaining} articles</span>
                  </div>
                  <div className="new-progress-bar">
                    <div className="new-progress-fill" style={{ width: `${Math.min(100, (cat.remaining / Math.max(1, totalArticles)) * 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Publishing */}
          <div className="new-card new-upcoming-card">
            <div className="new-card-header">
              <h3>Recent Publishing</h3>
              <span className="new-view-all" onClick={() => navigate('/admin/news')}>View All</span>
            </div>
            <div className="new-upcoming-list">
              {loading ? (
                <div className="p-3 text-center text-muted">Loading articles...</div>
              ) : (
                upcomingArticles.map((article, i) => (
                  <div key={i} className="new-upcoming-item">
                    <div className="new-upcoming-icon" style={{ color: article.color, backgroundColor: `${article.color}20` }}>
                      <i className={article.icon}></i>
                    </div>
                    <div className="new-upcoming-details">
                      <span className="new-upcoming-title" style={{display:'block', maxWidth:'280px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{article.title}</span>
                      <span className="text-muted x-small" style={{fontSize:'0.75rem', fontWeight:'500'}}>By {article.author || 'Editorial'}</span>
                    </div>
                    <div className="new-upcoming-meta">
                      <span className="new-upcoming-units">{article.units}</span>
                      <span className="new-upcoming-date">{article.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom Chart */}
        <div className="new-card new-chart-card">
          <div className="new-card-header">
            <div>
              <h3>Traffic Summary</h3>
              <div className="new-chart-value">{simulatedTraffic} <span className="text-muted" style={{fontSize:'0.75rem'}}>Total Visits</span></div>
            </div>
            <div style={{ position: 'relative' }}>
              <button 
                className="new-card-btn" 
                onClick={(e) => handleDropdownClick(e, 'filter-traffic')}
              >
                {trafficFilter} <i className="bi bi-chevron-down"></i>
              </button>
              {activeDropdown === 'filter-traffic' && (
                <div className="new-dropdown-menu shadow">
                  <div className="new-dropdown-item" onClick={() => { setTrafficFilter('Today'); setActiveDropdown(null); }}>Today</div>
                  <div className="new-dropdown-item" onClick={() => { setTrafficFilter('This Week'); setActiveDropdown(null); }}>This Week</div>
                  <div className="new-dropdown-item" onClick={() => { setTrafficFilter('This Month'); setActiveDropdown(null); }}>This Month</div>
                  <div className="new-dropdown-item" onClick={() => { setTrafficFilter('This Year'); setActiveDropdown(null); }}>This Year</div>
                </div>
              )}
            </div>
          </div>
          <div className="new-chart-area">
            {/* Pure CSS/SVG Simulated Chart */}
            <svg viewBox="0 0 800 200" preserveAspectRatio="none" className="new-chart-svg">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#da251d" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#da251d" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M0,180 C50,160 100,190 150,170 C200,150 250,130 300,160 C350,190 400,70 450,130 C500,190 550,150 600,110 C650,70 700,120 750,90 C780,70 800,80 800,80 L800,200 L0,200 Z" fill="url(#chartGradient)" />
              <path d="M0,180 C50,160 100,190 150,170 C200,150 250,130 300,160 C350,190 400,70 450,130 C500,190 550,150 600,110 C650,70 700,120 750,90 C780,70 800,80 800,80" fill="none" stroke="#da251d" strokeWidth="3" />
              <circle cx="280" cy="148" r="5" fill="#fff" stroke="#da251d" strokeWidth="2" />
              <line x1="280" y1="148" x2="280" y2="200" stroke="#da251d" strokeWidth="1" strokeDasharray="4 4" />
              <g transform="translate(250, 100)">
                <rect width="60" height="36" rx="6" fill="#111" />
                <text x="30" y="14" fill="#aaa" fontSize="9" textAnchor="middle">Today</text>
                <text x="30" y="28" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">{getDailyValue(simulatedTraffic, 45)}</text>
              </g>
            </svg>
            <div className="new-chart-x-axis">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>
          </div>
        </div>
      </div>

      {/* STAT DETAILS MODAL */}
      {selectedStatModal && (
        <div className="stat-modal-overlay" onClick={() => setSelectedStatModal(null)}>
          <div className="stat-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="stat-modal-header">
              <div className="stat-modal-title-group">
                <div className="stat-modal-icon">
                  <i className={`bi ${selectedStatModal.icon}`}></i>
                </div>
                <div>
                  <h3>{selectedStatModal.label} Details</h3>
                  <p>In-depth analysis and historical data</p>
                </div>
              </div>
              <button className="stat-modal-close" onClick={() => setSelectedStatModal(null)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            
            <div className="stat-modal-body">
              <div className="stat-modal-main-value">
                <h1>{getDailyValue(selectedStatModal.value, dummyHeights[selectedDayIndex])}</h1>
                <span className={`stat-modal-badge ${selectedStatModal.positive ? 'positive' : 'negative'}`}>
                  {selectedStatModal.change} from last week
                </span>
              </div>
              
              <div className="stat-modal-breakdown">
                <h4>Data Breakdown ({daysOfWeek[selectedDayIndex]})</h4>
                <div className="stat-modal-grid">
                  <div className="stat-modal-grid-item">
                    <span>Desktop</span>
                    <strong>{Math.floor(65 * (dummyHeights[selectedDayIndex]/100))}%</strong>
                  </div>
                  <div className="stat-modal-grid-item">
                    <span>Mobile</span>
                    <strong>{Math.floor(28 * (dummyHeights[selectedDayIndex]/100))}%</strong>
                  </div>
                  <div className="stat-modal-grid-item">
                    <span>Tablet</span>
                    <strong>{Math.floor(7 * (dummyHeights[selectedDayIndex]/100))}%</strong>
                  </div>
                </div>
              </div>

              <div className="stat-modal-chart-placeholder">
                <div className="stat-modal-chart-bars">
                  {dummyHeights.map((height, i) => (
                    <div 
                      key={i} 
                      className="stat-bar" 
                      style={{
                        height: `${height}%`, 
                        background: i === selectedDayIndex ? '#da251d' : '#fecaca',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedDayIndex(i)}
                    ></div>
                  ))}
                </div>
                <div className="stat-modal-chart-labels">
                  {daysOfWeek.map((day, i) => (
                    <span 
                      key={i} 
                      style={{
                        color: i === selectedDayIndex ? '#da251d' : '#aaa',
                        fontWeight: i === selectedDayIndex ? '800' : '600',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedDayIndex(i)}
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="stat-modal-footer">
              <button className="stat-modal-btn-secondary" onClick={() => setSelectedStatModal(null)}>Close</button>
              <button className="stat-modal-btn-primary" onClick={() => { setSelectedStatModal(null); navigate('/admin/analytics'); }}>Full Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   ANALYTICS PAGE
──────────────────────────────────────────────────────── */
const AnalyticsPage = ({ articles = [] }) => {
  const totalViews = articles.reduce((sum, article) => sum + (article.views || 0), 0);
  const totalArticles = articles.length;
  const uniqueVisitors = Math.round(totalViews * 0.65);
  const avgSession = totalViews > 0 ? `3m ${(15 + (totalViews % 45))}s` : '0s';

  const metrics = [
    { label: 'Page Views', value: totalViews.toLocaleString(), change: '+12%', icon: 'bi-eye' },
    { label: 'Unique Visitors', value: uniqueVisitors.toLocaleString(), change: '+8%', icon: 'bi-person-check' },
    { label: 'Bounce Rate', value: totalViews > 0 ? '34.2%' : '0%', change: '-5%', icon: 'bi-arrow-return-left' },
    { label: 'Avg. Duration', value: avgSession, change: '+15%', icon: 'bi-stopwatch' },
  ];

  const topArticles = [...articles]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  return (
    <div className="admin-home-content reveal">
      <div className="admin-stats-grid">
        {metrics.map((m, i) => (
          <div key={i} className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: '#f0f9ff', color: '#3b82f6' }}>
              <i className={`bi ${m.icon}`}></i>
            </div>
            <div className="admin-stat-info">
              <div className="admin-stat-label">{m.label}</div>
              <div className="admin-stat-value">{m.value}</div>
              <div className={`admin-stat-change ${m.change.startsWith('+') ? 'positive' : 'negative'}`}>
                {m.change} from last month
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-card" style={{ marginTop: '1.5rem' }}>
        <div className="admin-card-header">
          <h3 className="admin-card-title">Top Performing Articles</h3>
        </div>
        <div className="admin-card-body">
          {topArticles.length === 0 ? (
            <p className="text-muted text-center py-4">No articles available to calculate top performance.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Article Title</th>
                  <th>Category</th>
                  <th>Views</th>
                </tr>
              </thead>
              <tbody>
                {topArticles.map((a, i) => (
                  <tr key={i}>
                    <td className="admin-table-rank">{i + 1}</td>
                    <td className="admin-table-title">{a.title}</td>
                    <td><span className="admin-table-badge">{a.category}</span></td>
                    <td className="admin-table-views">{(a.views || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   MAIN DASHBOARD SHELL
──────────────────────────────────────────────────────── */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const adminInfo = JSON.parse(sessionStorage.getItem('adminInfo'));
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  // Profile Edit State
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profileSettings, setProfileSettings] = useState(() => {
    const saved = localStorage.getItem('adminProfileSettings');
    return saved ? JSON.parse(saved) : { name: adminInfo?.name || 'Abram Workman', photo: '/icon.png' };
  });
  const [tempProfile, setTempProfile] = useState(profileSettings);

  // Global Articles for Real Notifications
  const [globalArticles, setGlobalArticles] = useState([]);
  
  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/articles`);
        setGlobalArticles(data || []);
      } catch (e) {
        console.error("Global fetch error", e);
      }
    };
    fetchGlobalData();
  }, []);

  const latestArticle = globalArticles.length > 0 ? [...globalArticles].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0] : null;
  const topArticle = globalArticles.length > 0 ? [...globalArticles].sort((a,b) => (b.views||0) - (a.views||0))[0] : null;

  useEffect(() => {
    const closeMenus = () => {
      setShowProfileMenu(false);
      setShowNotificationMenu(false);
    };
    window.addEventListener('click', closeMenus);
    return () => window.removeEventListener('click', closeMenus);
  }, []);
  const handleLogout = () => {
    sessionStorage.removeItem('adminInfo');
    navigate('/');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/superadmin@123', icon: 'bi-grid-1x2-fill' },
    { name: 'Manage Media News', path: '/superadmin@123/news', icon: 'bi-newspaper' },
    { name: 'Analytics', path: '/superadmin@123/analytics', icon: 'bi-graph-up-arrow' },
    { name: 'Ad Management', path: '/superadmin@123/ads', icon: 'bi-megaphone-fill' },
    { name: 'Podcast Guests', path: '/superadmin@123/podcast', icon: 'bi-mic-fill' },
    { name: 'Email Settings', path: '/superadmin@123/email-settings', icon: 'bi-envelope-at-fill' },
    { name: 'Corporate Plans', path: '/superadmin@123/plans', icon: 'bi-credit-card-2-front-fill' },
    { name: 'Ad Requests', path: '/superadmin@123/ad-requests', icon: 'bi-envelope-paper-fill' },
    { name: 'Notifications', path: '/superadmin@123/notifications', icon: 'bi-bell-fill' }
  ];

  const isActive = (item) => {
    if (item.path === '/superadmin@123') {
      return location.pathname === '/superadmin@123' || location.pathname === '/superadmin@123/';
    }
    if (item.path) return location.pathname.startsWith(item.path);
    return false;
  };

  const handleNavClick = (item) => {
    if (item.path) {
      navigate(item.path);
    }
  };

  const getPageTitle = () => {
    const p = location.pathname;
    if (p === '/superadmin@123' || p === '/superadmin@123/') return 'Dashboard';
    if (p === '/superadmin@123/analytics') return 'Analytics';
    if (p === '/superadmin@123/ads') return 'Ad Management';
    if (p === '/superadmin@123/news') return 'Manage News';
    if (p === '/superadmin@123/podcast') return 'Podcast Management';
    if (p === '/superadmin@123/email-settings') return 'Email Settings';
    if (p === '/superadmin@123/notifications') return 'System Notifications';
    if (p === '/superadmin@123/plans') return 'Corporate Plans';
    if (p === '/superadmin@123/ad-requests') return 'Ad Requests';
    return 'Dashboard';
  };

  return (
    <>
    <div className="admin-light-layout">
      {/* Fixed Left Sidebar */}
      <aside className="admin-light-sidebar">
        {/* Logo */}
        <div className="admin-sidebar-logo">
          <img src="/industrialtimes_white.png" alt="Industrial Times" className="admin-sidebar-logo-img" />
        </div>

        {/* Navigation */}
        <nav className="admin-sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.name}
              className={`admin-nav-item ${isActive(item) ? 'active' : ''}`}
              onClick={() => handleNavClick(item)}
            >
              <i className={`bi ${item.icon} admin-nav-icon`}></i>
              <span className="admin-nav-label">{item.name}</span>
              {item.action === 'publish' && (
                <span className="admin-nav-badge">NEW</span>
              )}
            </button>
          ))}
        </nav>

        {/* Profile Section */}
        <div className="admin-sidebar-profile">
          <button className="admin-logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-light-main">
        {/* Top Bar */}
        <header className="new-admin-topbar">
          <div className="new-topbar-left">
            <h1 className="new-page-title">{getPageTitle()}</h1>
          </div>
          <div className="new-topbar-right">
            <div 
              className="new-profile-box cursor-pointer hover-scale position-relative"
              onClick={(e) => { e.stopPropagation(); setShowProfileMenu(!showProfileMenu); setShowNotificationMenu(false); }}
            >
              <img src={profileSettings.photo} alt="Profile" className="new-profile-avatar" />
              <div className="new-profile-info">
                <span className="new-profile-name">{profileSettings.name}</span>
                <span className="new-profile-role d-flex align-items-center gap-1">Super Admin <span className="text-success" style={{fontSize:'0.6rem'}}><span className="active-glow d-inline-block">●</span> Active</span></span>
              </div>
              <i className="bi bi-chevron-down new-profile-drop"></i>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="admin-dropdown-menu shadow-lg rounded-3 p-1 bg-white">
                  <div className="dropdown-item fw-bold text-dark rounded-2 mb-1" onClick={() => { setShowEditProfile(true); setTempProfile(profileSettings); }}>
                    <i className="bi bi-person-gear text-primary me-2"></i> Edit Profile
                  </div>
                  <div className="dropdown-item text-danger fw-bold rounded-2" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i> Logout
                  </div>
                </div>
              )}
            </div>
            
            <div 
              className="new-notification-box cursor-pointer hover-scale position-relative"
              onClick={(e) => { e.stopPropagation(); setShowNotificationMenu(!showNotificationMenu); setShowProfileMenu(false); }}
            >
              <i className="bi bi-bell"></i>
              <span className="new-notification-dot"></span>

              {/* Notification Dropdown */}
              {showNotificationMenu && (
                <div className="admin-dropdown-menu notification-menu shadow-lg rounded-3 p-0 text-start bg-white" onClick={e => e.stopPropagation()}>
                  <div className="p-3 border-bottom bg-light rounded-top-3">
                    <h6 className="mb-0 fw-bold">Live Notifications</h6>
                  </div>
                  <div className="notification-list p-2">
                    
                    {latestArticle ? (
                      <div className="notification-item p-2 border-bottom">
                        <div className="d-flex gap-2 align-items-start">
                          <i className="bi bi-newspaper text-primary mt-1"></i>
                          <div>
                            <p className="mb-0 small fw-bold">New Article Published</p>
                            <span className="text-muted" style={{fontSize:'0.75rem'}}>"{latestArticle.title.substring(0, 30)}..." was recently posted.</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="notification-item p-2 border-bottom">
                        <div className="d-flex gap-2 align-items-start">
                          <i className="bi bi-newspaper text-primary mt-1"></i>
                          <div>
                            <p className="mb-0 small fw-bold">System Online</p>
                            <span className="text-muted" style={{fontSize:'0.75rem'}}>Ready to publish news.</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="notification-item p-2 border-bottom">
                      <div className="d-flex gap-2 align-items-start">
                        <i className="bi bi-person-check-fill text-success mt-1"></i>
                        <div>
                          <p className="mb-0 small fw-bold">Admin Active</p>
                          <span className="text-muted" style={{fontSize:'0.75rem'}}>{profileSettings.name} logged in successfully.</span>
                        </div>
                      </div>
                    </div>
                    
                    {topArticle && topArticle.views > 0 && (
                      <div className="notification-item p-2">
                        <div className="d-flex gap-2 align-items-start">
                          <i className="bi bi-graph-up-arrow text-danger mt-1"></i>
                          <div>
                            <p className="mb-0 small fw-bold">Trending Post Alert</p>
                            <span className="text-muted" style={{fontSize:'0.75rem'}}>"{topArticle.title.substring(0, 30)}..." reached {topArticle.views} views!</span>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Routes */}
        <div className="admin-light-content">
          <Routes>
            <Route path="/" element={<AdminHome />} />
            <Route path="/analytics" element={<AnalyticsPage articles={globalArticles} />} />
            <Route path="/news" element={<ManageNews />} />
            <Route path="/podcast" element={<ManagePodcast />} />
            <Route path="/ads" element={<ManageAds />} />
            <Route path="/plans" element={<ManagePlans />} />
            <Route path="/ad-requests" element={<ManageAdRequests />} />
            <Route path="/email-settings" element={<ManageEmailSettings />} />
            <Route path="/notifications" element={<AdminNotifications />} />
          </Routes>
        </div>
      </main>

    </div>

      {/* Edit Profile Modal Popup */}
      {showEditProfile && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-danger text-white border-0 p-4">
                <h5 className="modal-title fw-bold"><i className="bi bi-person-lines-fill me-2"></i> Edit Profile</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditProfile(false)}></button>
              </div>
              <div className="modal-body p-4">
                
                <div className="text-center mb-4">
                  <div className="position-relative d-inline-block">
                    <img src={tempProfile.photo} alt="Profile Preview" className="rounded-circle shadow-sm border border-3 border-white" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
                    <label htmlFor="profilePhotoUpload" className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow hover-scale" style={{ width: '30px', height: '30px', cursor: 'pointer' }}>
                      <i className="bi bi-camera-fill small"></i>
                    </label>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold small text-muted">Admin Full Name</label>
                  <input 
                    type="text" 
                    className="form-control form-control-lg bg-light border-0" 
                    value={tempProfile.name} 
                    onChange={e => setTempProfile({...tempProfile, name: e.target.value})}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-bold small text-muted d-block">Profile Photo</label>
                  <div className="text-muted small mb-2">Click the camera icon on your picture to upload a new photo.</div>
                  <input 
                    id="profilePhotoUpload"
                    type="file" 
                    accept="image/*"
                    className="d-none" 
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setIsUploading(true);
                      const formData = new FormData();
                      formData.append('image', file);
                      try {
                        const { data } = await axios.post(`${API_BASE}/api/upload`, formData, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        setTempProfile({...tempProfile, photo: data.imageUrl});
                      } catch (err) {
                        console.error('Upload failed', err);
                        alert('Failed to upload image. Please try again.');
                      } finally {
                        setIsUploading(false);
                      }
                    }}
                  />
                  {isUploading && <div className="form-text text-primary mt-2 spinner-border spinner-border-sm" role="status"></div>}
                  {isUploading && <span className="ms-2 small text-muted">Uploading...</span>}
                </div>
                
              </div>
              <div className="modal-footer bg-light border-0 p-3 d-flex justify-content-between">
                <button type="button" className="btn btn-outline-secondary px-4 fw-bold rounded-pill" onClick={() => setShowEditProfile(false)}>Cancel</button>
                <button type="button" className="btn btn-danger px-4 fw-bold rounded-pill shadow-sm" onClick={() => {
                  setProfileSettings(tempProfile);
                  localStorage.setItem('adminProfileSettings', JSON.stringify(tempProfile));
                  setShowEditProfile(false);
                }}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};



export default AdminDashboard;
