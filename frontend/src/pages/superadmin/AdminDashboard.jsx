import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';

const getSafeJSON = (key) => {
  try {
    const val = localStorage.getItem(key);
    if (!val || val === 'undefined') return null;
    return JSON.parse(val);
  } catch (e) {
    localStorage.removeItem(key);
    return null;
  }
};
import ManageNews from './ManageNews';
import ManageAds from './ManageAds';
import AdminNotifications from './AdminNotifications';
import ManagePodcast from './ManagePodcast';
import ManageWebinars from './ManageWebinars';
import ManageEmailSettings from './ManageEmailSettings';
import ManagePlans from './ManagePlans';
import ManageAdRequests from './ManageAdRequests';
import ManageSeoSettings from './ManageSeoSettings';
import ManageBreakingNews from './ManageBreakingNews';
import ManageAdCalendar from './ManageAdCalendar';
import ManageRevenue from './ManageRevenue';
import ManageAdPricing from './ManageAdPricing';
import ManageVerifications from './ManageVerifications';
import ManageUsers from './ManageUsers';
import ManageManagers from './ManageManagers';
import ManagePromoCodes from './ManagePromoCodes';
import API_BASE from '../../config/api';

/* ────────────────────────────────────────────────────────
   DASHBOARD HOME — Stats & Overview
──────────────────────────────────────────────────────── */
const AdminHome = ({ itProfile, isEmbedded = false, onTabChange }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [trafficFilter, setTrafficFilter] = useState('This Week');
  const [selectedStatModal, setSelectedStatModal] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(6);
  const [analyticsData, setAnalyticsData] = useState([]);
  const navigate = useNavigate();

  const handleInternalNavigate = (path, tabKey) => {
    if (isEmbedded) {
      if (onTabChange) onTabChange(tabKey);
    } else {
      navigate(path);
    }
  };

  // Realistic Database-backed statistics
  const [adRequestsCount, setAdRequestsCount] = useState(0);
  const [pendingVerifsCount, setPendingVerifsCount] = useState(0);
  const [platformRevenue, setPlatformRevenue] = useState(0);
  const [pendingPayoutsCount, setPendingPayoutsCount] = useState(0);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dummyHeights = Array.isArray(analyticsData) && analyticsData.length > 0 ? analyticsData.map(d => Math.max(10, (d.totalViews / Math.max(1, Math.max(...analyticsData.map(a => a.totalViews)))) * 100)) : [40, 70, 50, 90, 60, 80, 100];

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
    const fetchAnalytics = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/analytics/7days`);
        setAnalyticsData(data || []);
      } catch (error) {
        console.error("Error fetching analytics", error);
      }
    };
    fetchArticles();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    const fetchRealCounts = async () => {
      try {
        const adminInfo = getSafeJSON('adminInfo');
        const config = adminInfo?.token ? { headers: { Authorization: `Bearer ${adminInfo.token}` } } : {};
        
        axios.get(`${API_BASE}/api/ad-requests/all`, config).then(res => {
          const pending = (res.data || []).filter(r => r.status === 'pending' || (r.status === 'paid' && !r.linkedAdId)).length;
          setAdRequestsCount(pending);
        }).catch(() => {});

        axios.get(`${API_BASE}/api/auth/bank-verifications`, config).then(res => {
          setPendingVerifsCount(res.data?.length || 0);
        }).catch(() => {});

        axios.get(`${API_BASE}/api/revenue/all`, config).then(res => {
          setPlatformRevenue(res.data?.totals?.totalRevenue || 0);
        }).catch(() => {});

        axios.get(`${API_BASE}/api/withdrawals/all`, config).then(res => {
          const pending = (res.data?.withdrawals || []).filter(w => w.status === 'pending').length;
          setPendingPayoutsCount(pending);
        }).catch(() => {});
      } catch (e) {}
    };
    fetchRealCounts();
  }, []);

  const totalArticles = articles.length;
  const totalViews = articles.reduce((sum, article) => sum + (article.views || 0), 0);
  
  // Real live visitors based on today's unique visitors + some dynamic noise
  const todayAnalytics = Array.isArray(analyticsData) && analyticsData.length > 0 ? analyticsData[analyticsData.length - 1] : { uniqueVisitors: 0 };
  const baseLive = todayAnalytics && todayAnalytics.uniqueVisitors > 0 ? Math.max(1, Math.floor(todayAnalytics.uniqueVisitors * 0.15)) : 0;
  const liveVisitors = baseLive + Math.floor(Math.random() * 3); 

  const allCategories = [
    'Global', 'News', 'Regional', 'Articles', 'Trending', 'OEM', 'Automation',
    'Interview', 'Startup', 'Business', 'Event', 'Tender',
    'Entertainment', 'Sports', 'Education', 'Astrology'
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
    { label: 'Platform Revenue', value: `₹${platformRevenue.toLocaleString('en-IN')}`, icon: 'bi-currency-rupee text-success', change: `Payouts: ${pendingPayoutsCount} pending`, positive: true },
    { 
      label: 'Editorial Followers', 
      value: itProfile ? itProfile.followersCount.toLocaleString() : '0', 
      icon: 'bi-heart-fill text-danger', 
      change: `Rating: ${itProfile?.averageRating ? itProfile.averageRating.toFixed(1) : '0.0'} ★`, 
      positive: true 
    }
  ];

  if (categoryFilter === 'Top 3 Only') {
    categoryTraffic = categoryTraffic.sort((a, b) => b.remaining - a.remaining).slice(0, 3);
  } else if (categoryFilter === 'Lowest First') {
    categoryTraffic = categoryTraffic.sort((a, b) => a.remaining - b.remaining);
  } else {
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

  if (upcomingArticles.length === 0) {
    upcomingArticles.push({ title: 'No articles published yet', units: 'None', date: 'N/A', icon: 'bi-info-circle', color: '#888' });
  }

  return (
    <div className="new-dashboard-layout full-width">
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
                        setSelectedDayIndex(6); 
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

        {/* Quick Admin Actions Hub */}
        <h4 style={{ margin: '1.5rem 0 0.8rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
          <i className="bi bi-speedometer2 text-danger"></i> System Control Hub
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="ud-action-card" style={{ '--action-accent': '#da251d', '--action-bg': '#fef2f2' }} onClick={() => handleInternalNavigate('/superadmin@123/ad-requests', 'ad_requests')}>
            <div className="ud-action-card-icon" style={{ background: '#fef2f2', color: '#da251d' }}><i className="bi bi-megaphone-fill"></i></div>
            <div>
              <div className="ud-action-card-title">Review Ad Campaigns</div>
              <div className="ud-action-card-desc">{adRequestsCount} campaigns awaiting approval.</div>
            </div>
          </div>
          <div className="ud-action-card" style={{ '--action-accent': '#10b981', '--action-bg': '#f0fdf4' }} onClick={() => handleInternalNavigate('/superadmin@123/verifications', 'verifications')}>
            <div className="ud-action-card-icon" style={{ background: '#f0fdf4', color: '#10b981' }}><i className="bi bi-shield-check"></i></div>
            <div>
              <div className="ud-action-card-title">Verify KYC Profiles</div>
              <div className="ud-action-card-desc">{pendingVerifsCount} pending bank submissions.</div>
            </div>
          </div>
          <div className="ud-action-card" style={{ '--action-accent': '#8b5cf6', '--action-bg': '#f5f3ff' }} onClick={() => handleInternalNavigate('/superadmin@123/revenue', 'revenue')}>
            <div className="ud-action-card-icon" style={{ background: '#f5f3ff', color: '#8b5cf6' }}><i className="bi bi-gear-fill"></i></div>
            <div>
              <div className="ud-action-card-title">Change Level Thresholds</div>
              <div className="ud-action-card-desc">Adjust follower parameters inside settings.</div>
            </div>
          </div>
          <div className="ud-action-card" style={{ '--action-accent': '#3b82f6', '--action-bg': '#eff6ff' }} onClick={() => handleInternalNavigate('/superadmin@123/breaking-news', 'breaking_news')}>
            <div className="ud-action-card-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><i className="bi bi-broadcast"></i></div>
            <div>
              <div className="ud-action-card-title">Broadcast System Alert</div>
              <div className="ud-action-card-desc">Publish breaking news banner instantly.</div>
            </div>
          </div>
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
              <span className="new-view-all" onClick={() => handleInternalNavigate('/superadmin@123/news', 'news')}>View All</span>
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

        {/* System Activity & Logs */}
        <div className="new-card" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="new-card-header">
            <h3><i className="bi bi-activity text-danger me-2"></i>Live System Activity Logs</h3>
            <span className="badge bg-danger rounded-pill px-3 py-1.5 fw-black" style={{ fontSize: '0.65rem' }}>Real-time Auditing</span>
          </div>
          <div className="new-card-body" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { time: 'Just Now', icon: 'bi-megaphone', color: '#8b5cf6', text: `Ad Campaign approval request pending for "${articles[0]?.title ? articles[0].title.substring(0, 30) + '...' : 'ITN Corporate ad'}"` },
                { time: '12 mins ago', icon: 'bi-person-check', color: '#10b981', text: 'KYC Document submitted by Reporter Rohitkumar' },
                { time: '1 hour ago', icon: 'bi-newspaper', color: '#3b82f6', text: `New Industrial PR published: "${recentArticlesList[0]?.title || 'Steel production rates'}"` },
                { time: '3 hours ago', icon: 'bi-cash-coin', color: '#eab308', text: `Payout request of ₹${pendingPayoutsCount > 0 ? '10,000' : '5,000'} entered pending ledger` },
                { time: '5 hours ago', icon: 'bi-person-plus', color: '#6366f1', text: 'Seeded editorial account "Industrial Times" synchronized successfully' }
              ].map((act, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.82rem', paddingBottom: '8px', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${act.color}15`, color: act.color, display: 'flex', alignItems: 'center', justifyCenter: 'center', flexShrink: 0, justifyContent: 'center' }}>
                    <i className={`bi ${act.icon}`}></i>
                  </div>
                  <div style={{ flex: 1, color: '#374151', fontWeight: 600 }}>{act.text}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{act.time}</div>
                </div>
              ))}
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
              <button className="stat-modal-btn-primary" onClick={() => { setSelectedStatModal(null); handleInternalNavigate('/superadmin@123/analytics', 'analytics'); }}>Full Report</button>
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
/* ────────────────────────────────────────────────────────
   ANALYTICS PAGE — Premium Interactive Visual Graphs
──────────────────────────────────────────────────────── */
const AnalyticsPage = ({ articles = [], itProfile }) => {
  const totalViews = articles.reduce((sum, article) => sum + (article.views || 0), 0);
  const totalArticles = articles.length;
  const uniqueVisitors = Math.round(totalViews * 0.65);
  const avgSession = totalViews > 0 ? `3m ${(15 + (totalViews % 45))}s` : '0s';

  const [followers, setFollowers] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(true);
  const [stats, setStats] = useState(null);
  const [analytics7Days, setAnalytics7Days] = useState([]);
  
  // Interactive coordinate tooltip states
  const [hoveredDot, setHoveredDot] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);

  useEffect(() => {
    const fetchFollowers = async () => {
      if (!itProfile?.id) return;
      try {
        const adminInfo = getSafeJSON('adminInfo');
        const config = adminInfo?.token ? { headers: { Authorization: `Bearer ${adminInfo.token}` } } : {};
        const { data } = await axios.get(`${API_BASE}/api/auth/followers/${itProfile.id}`, config);
        setFollowers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch followers list", err);
      } finally {
        setLoadingFollowers(false);
      }
    };

    const fetchAuthorStatsAnd7Days = async () => {
      if (!itProfile?.id) return;
      try {
        const { data: statsData } = await axios.get(`${API_BASE}/api/articles/author-stats/${itProfile.id}?authorName=${encodeURIComponent(itProfile.name)}`);
        setStats(statsData);
      } catch (err) {
        console.error("Failed to fetch author stats", err);
      }

      try {
        const { data: analyticData } = await axios.get(`${API_BASE}/api/analytics/7days`);
        setAnalytics7Days(Array.isArray(analyticData) ? analyticData : []);
      } catch (err) {
        console.error("Failed to fetch 7 days traffic", err);
      }
    };

    fetchFollowers();
    fetchAuthorStatsAnd7Days();
  }, [itProfile]);

  const metrics = [
    { label: 'Page Views', value: totalViews.toLocaleString(), change: '+12.5%', icon: 'bi-eye', color: '#da251d', bg: '#fef2f2' },
    { label: 'Unique Visitors', value: uniqueVisitors.toLocaleString(), change: '+8.4%', icon: 'bi-person-check', color: '#10b981', bg: '#f0fdf4' },
    { label: 'Total Engagement (Likes)', value: (stats?.totalLikes || 0).toLocaleString(), change: `Likes: ${stats?.totalLikes || 0}`, icon: 'bi-heart-fill', color: '#ec4899', bg: '#fdf2f8' },
    { label: 'Avg. Duration', value: avgSession, change: '+15.2%', icon: 'bi-stopwatch', color: '#8b5cf6', bg: '#f5f3ff' },
  ];

  const topArticles = [...articles]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  // ────────────────────────────────────────────────────────
  // SVG 1: 7-DAY TRAFFIC ANALYTICS COORDINATE CALCULATOR
  // ────────────────────────────────────────────────────────
  const padX = 50;
  const padY = 30;
  const graphWidth = 600;
  const graphHeight = 220;

  const maxTrafficVal = analytics7Days.length > 0 
    ? Math.max(...analytics7Days.map(d => d.totalViews), 10) 
    : 100;

  const pointsViews = analytics7Days.map((d, index) => {
    const x = padX + (index * (graphWidth - 2 * padX)) / Math.max(1, analytics7Days.length - 1);
    const y = graphHeight - padY - (d.totalViews / maxTrafficVal) * (graphHeight - 2 * padY);
    return { x, y, val: d.totalViews, label: d.day, date: d.date };
  });

  const pointsVisitors = analytics7Days.map((d, index) => {
    const x = padX + (index * (graphWidth - 2 * padX)) / Math.max(1, analytics7Days.length - 1);
    const y = graphHeight - padY - (d.uniqueVisitors / maxTrafficVal) * (graphHeight - 2 * padY);
    return { x, y, val: d.uniqueVisitors, label: d.day, date: d.date };
  });

  // Construct SVG Path description
  const createPath = (points) => {
    if (points.length === 0) return '';
    return points.reduce((str, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${str} L ${p.x} ${p.y}`, '');
  };

  const createAreaPath = (points) => {
    if (points.length === 0) return '';
    const linePath = createPath(points);
    return `${linePath} L ${points[points.length - 1].x} ${graphHeight - padY} L ${points[0].x} ${graphHeight - padY} Z`;
  };

  // ────────────────────────────────────────────────────────
  // SVG 2: 6-MONTH PUBLISHING & LIKES BAR CHART CALCULATOR
  // ────────────────────────────────────────────────────────
  const monthLabels = [];
  const articleCounts = [];
  const articleLikesTrend = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    monthLabels.push(label);

    const trendVal = stats?.monthlyTrend?.[key];
    articleCounts.push(trendVal ? trendVal.count : 0);
    // Realistically spread the author's likes if they exist, else seed mock data
    const mockLikeVal = stats?.totalLikes && stats.totalLikes > 0
      ? Math.max(1, Math.round((stats.totalLikes / 15) * (1 + (i % 3)))) 
      : (5 + (i * 3));
    articleLikesTrend.push(mockLikeVal);
  }

  const maxBarVal = Math.max(...articleCounts, ...articleLikesTrend, 5);

  return (
    <div className="admin-home-content reveal">
      {/* Overview stats cards */}
      <div className="admin-stats-grid">
        {metrics.map((m, i) => (
          <div key={i} className="admin-stat-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div className="admin-stat-icon" style={{ background: m.bg, color: m.color, width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', fontSize: '1.4rem' }}>
              <i className={`bi ${m.icon}`}></i>
            </div>
            <div className="admin-stat-info">
              <div className="admin-stat-label" style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{m.label}</div>
              <div className="admin-stat-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', margin: '2px 0' }}>{m.value}</div>
              <div className="admin-stat-change positive" style={{ fontSize: '0.72rem', fontWeight: 600, color: m.color }}>
                {m.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive SVG Graphs Split Row */}
      <div className="row g-4" style={{ margin: '1.5rem -12px 0' }}>
        {/* Graph 1: Line Chart for Daily Traffic */}
        <div className="col-lg-6 col-md-12">
          <div className="new-card" style={{ height: '100%', position: 'relative' }}>
            <div className="new-card-header d-flex justify-content-between align-items-center">
              <h3><i className="bi bi-graph-up-arrow text-danger me-2"></i>Daily Traffic Curve</h3>
              <div className="d-flex gap-3 text-muted small" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                <span className="d-flex align-items-center gap-1"><span style={{ width: '10px', height: '3px', background: '#da251d', display: 'inline-block' }}></span> Views</span>
                <span className="d-flex align-items-center gap-1"><span style={{ width: '10px', height: '3px', background: '#10b981', display: 'inline-block' }}></span> Visitors</span>
              </div>
            </div>
            <div style={{ position: 'relative', marginTop: '15px' }}>
              {hoveredDot && (
                <div style={{
                  position: 'absolute',
                  top: '-35px',
                  left: `${hoveredDot.x - 55}px`,
                  background: 'rgba(15, 23, 42, 0.95)',
                  backdropFilter: 'blur(8px)',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 50,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ opacity: 0.7, fontSize: '0.62rem', textTransform: 'uppercase' }}>{hoveredDot.label} ({hoveredDot.date})</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, marginTop: '2px', color: hoveredDot.type === 'views' ? '#fecaca' : '#a7f3d0' }}>
                    {hoveredDot.val.toLocaleString()} {hoveredDot.type}
                  </div>
                </div>
              )}
              
              <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} width="100%" height={graphHeight} style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#da251d" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#da251d" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="visitorsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                  const y = padY + ratio * (graphHeight - 2 * padY);
                  return (
                    <line key={index} x1={padX} y1={y} x2={graphWidth - padX} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  );
                })}

                {/* Draw Areas */}
                {pointsViews.length > 1 && (
                  <path d={createAreaPath(pointsViews)} fill="url(#viewsGrad)" />
                )}
                {pointsVisitors.length > 1 && (
                  <path d={createAreaPath(pointsVisitors)} fill="url(#visitorsGrad)" />
                )}

                {/* Draw Lines */}
                {pointsViews.length > 1 && (
                  <path d={createPath(pointsViews)} fill="none" stroke="#da251d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                )}
                {pointsVisitors.length > 1 && (
                  <path d={createPath(pointsVisitors)} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                )}

                {/* Views Interaction Dots */}
                {pointsViews.map((p, i) => (
                  <circle 
                    key={`views-dot-${i}`}
                    cx={p.x} 
                    cy={p.y} 
                    r={hoveredDot?.index === i && hoveredDot?.type === 'views' ? 7 : 4} 
                    fill="#fff" 
                    stroke="#da251d" 
                    strokeWidth="3" 
                    style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                    onMouseEnter={() => setHoveredDot({ ...p, index: i, type: 'views' })}
                    onMouseLeave={() => setHoveredDot(null)}
                  />
                ))}

                {/* Visitors Interaction Dots */}
                {pointsVisitors.map((p, i) => (
                  <circle 
                    key={`visitors-dot-${i}`}
                    cx={p.x} 
                    cy={p.y} 
                    r={hoveredDot?.index === i && hoveredDot?.type === 'visitors' ? 7 : 4} 
                    fill="#fff" 
                    stroke="#10b981" 
                    strokeWidth="3" 
                    style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                    onMouseEnter={() => setHoveredDot({ ...p, index: i, type: 'visitors' })}
                    onMouseLeave={() => setHoveredDot(null)}
                  />
                ))}

                {/* X-axis labels */}
                {pointsViews.map((p, i) => (
                  <text key={`x-lbl-${i}`} x={p.x} y={graphHeight - 10} fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">
                    {p.label}
                  </text>
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* Graph 2: Bar Chart for Monthly Publishing & Likes */}
        <div className="col-lg-6 col-md-12">
          <div className="new-card" style={{ height: '100%', position: 'relative' }}>
            <div className="new-card-header d-flex justify-content-between align-items-center">
              <h3><i className="bi bi-heart-fill text-danger me-2"></i>Publishing & Likes Trend</h3>
              <div className="d-flex gap-3 text-muted small" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                <span className="d-flex align-items-center gap-1"><span style={{ width: '10px', height: '10px', background: '#3b82f6', borderRadius: '2px', display: 'inline-block' }}></span> Articles</span>
                <span className="d-flex align-items-center gap-1"><span style={{ width: '10px', height: '10px', background: '#ec4899', borderRadius: '2px', display: 'inline-block' }}></span> Likes</span>
              </div>
            </div>
            <div style={{ position: 'relative', marginTop: '15px' }}>
              {hoveredBar && (
                <div style={{
                  position: 'absolute',
                  top: '-35px',
                  left: `${hoveredBar.x - 55}px`,
                  background: 'rgba(15, 23, 42, 0.95)',
                  backdropFilter: 'blur(8px)',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 50,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ opacity: 0.7, fontSize: '0.62rem', textTransform: 'uppercase' }}>{hoveredBar.label}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, marginTop: '2px', color: '#fbcfe8' }}>
                    {hoveredBar.likes} Likes | {hoveredBar.articles} Publishes
                  </div>
                </div>
              )}
              
              <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} width="100%" height={graphHeight} style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="barArticlesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                  <linearGradient id="barLikesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#be185d" />
                  </linearGradient>
                </defs>

                {/* Horizontal Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                  const y = padY + ratio * (graphHeight - 2 * padY);
                  return (
                    <line key={index} x1={padX} y1={y} x2={graphWidth - padX} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  );
                })}

                {/* Render Dual Bar columns */}
                {monthLabels.map((lbl, idx) => {
                  const colGroupWidth = (graphWidth - 2 * padX) / monthLabels.length;
                  const centerX = padX + (idx * colGroupWidth) + colGroupWidth / 2;
                  
                  const barWidth = 14;
                  const spacing = 4;
                  
                  const artCount = articleCounts[idx];
                  const likeCount = articleLikesTrend[idx];
                  
                  const artH = (artCount / maxBarVal) * (graphHeight - 2 * padY);
                  const likeH = (likeCount / maxBarVal) * (graphHeight - 2 * padY);
                  
                  const artX = centerX - barWidth - spacing / 2;
                  const likeX = centerX + spacing / 2;
                  
                  const yZero = graphHeight - padY;
                  
                  return (
                    <g key={`bar-group-${idx}`} style={{ cursor: 'pointer' }}
                       onMouseEnter={() => setHoveredBar({ x: centerX, label: lbl, likes: likeCount, articles: artCount })}
                       onMouseLeave={() => setHoveredBar(null)}>
                      {/* Article Bar */}
                      <rect 
                        x={artX} 
                        y={yZero - artH} 
                        width={barWidth} 
                        height={Math.max(2, artH)} 
                        rx="4" 
                        fill="url(#barArticlesGrad)" 
                        style={{ transition: 'opacity 0.2s', opacity: hoveredBar?.label === lbl ? 1 : 0.85 }}
                      />
                      {/* Likes Bar */}
                      <rect 
                        x={likeX} 
                        y={yZero - likeH} 
                        width={barWidth} 
                        height={Math.max(2, likeH)} 
                        rx="4" 
                        fill="url(#barLikesGrad)" 
                        style={{ transition: 'opacity 0.2s', opacity: hoveredBar?.label === lbl ? 1 : 0.85 }}
                      />
                      {/* Label */}
                      <text x={centerX} y={graphHeight - 10} fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">
                        {lbl}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Articles */}
      <div className="admin-card" style={{ marginTop: '24px' }}>
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

      {/* Followers Directory Preview */}
      <div className="admin-card" style={{ marginTop: '24px' }}>
        <div className="admin-card-header d-flex justify-content-between align-items-center">
          <h3 className="admin-card-title"><i className="bi bi-heart-fill text-danger me-2"></i>Editorial Profile Followers</h3>
          <span className="badge bg-danger rounded-pill px-3 py-2 fw-black">{followers.length} Followers</span>
        </div>
        <div className="admin-card-body">
          {loadingFollowers ? (
            <div className="text-center py-4 text-muted"><span className="spinner-border spinner-border-sm me-2" role="status"></span>Loading followers...</div>
          ) : followers.length === 0 ? (
            <p className="text-muted text-center py-4">No followers yet. Publish more articles to build your audience!</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Account Type</th>
                  <th>Followed Date</th>
                </tr>
              </thead>
              <tbody>
                {followers.slice(0, 5).map((f, i) => (
                  <tr key={f.id}>
                    <td className="admin-table-rank">{i + 1}</td>
                    <td className="admin-table-title fw-bold text-dark">{f.name}</td>
                    <td>{f.email}</td>
                    <td>
                      <span className={`badge ${f.role === 'corporate' ? 'bg-info text-dark' : f.role === 'author' ? 'bg-success' : 'bg-secondary'} text-uppercase x-small`} style={{ fontSize: '0.65rem' }}>
                        {f.role === 'author' ? 'reporter' : f.role}
                      </span>
                    </td>
                    <td className="text-muted small">{f.createdAt ? new Date(f.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</td>
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
   EDITORIAL PROFILE PAGE
   - Total Followers, Total Likes, Average Stars Rating
   - Update Brand Info (name, email, bio, expertise)
   - Follower table with search and filtering
──────────────────────────────────────────────────────── */
const AdminProfilePage = ({ itProfile, onProfileUpdate }) => {
  const adminInfo = getSafeJSON('adminInfo') || getSafeJSON('userInfo');
  const isManager = adminInfo?.isManager || false;

  const [followers, setFollowers] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [stats, setStats] = useState(null);

  // Edit fields
  const [brandName, setBrandName] = useState('');
  const [brandEmail, setBrandEmail] = useState('');
  const [brandBio, setBrandBio] = useState('');
  const [brandExpertise, setBrandExpertise] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [brandPassword, setBrandPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    if (itProfile) {
      setBrandName(itProfile.name || '');
      setBrandEmail(itProfile.email || '');
      setBrandBio(itProfile.bio || '');
      setBrandExpertise(itProfile.expertise || '');
      setProfilePic(itProfile.profilePic || '/icon.png');
    }
  }, [itProfile]);

  useEffect(() => {
    const fetchFollowersAndStats = async () => {
      if (!itProfile?.id) return;
      try {
        const adminInfo = getSafeJSON('adminInfo');
        const config = adminInfo?.token ? { headers: { Authorization: `Bearer ${adminInfo.token}` } } : {};
        
        // Fetch followers
        const { data: followersData } = await axios.get(`${API_BASE}/api/auth/followers/${itProfile.id}`, config);
        setFollowers(followersData || []);
        
        // Fetch author-stats
        const { data: statsData } = await axios.get(`${API_BASE}/api/articles/author-stats/${itProfile.id}?authorName=${encodeURIComponent(itProfile.name)}`);
        setStats(statsData);
      } catch (err) {
        console.error("Failed to fetch followers or stats", err);
      } finally {
        setLoadingFollowers(false);
      }
    };
    fetchFollowersAndStats();
  }, [itProfile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!itProfile?.id) return;
    setIsUpdating(true);
    setUpdateSuccess(false);

    try {
      const adminInfo = getSafeJSON('adminInfo');
      const config = adminInfo?.token ? { headers: { Authorization: `Bearer ${adminInfo.token}` } } : {};
      
      await axios.put(`${API_BASE}/api/auth/update-profile`, {
        userId: itProfile.id,
        name: brandName,
        email: brandEmail,
        bio: brandBio,
        expertise: brandExpertise,
        profilePic: profilePic,
        password: brandPassword
      }, config);

      if (onProfileUpdate) {
        // Fetch updated profile
        const { data: updatedProfile } = await axios.get(`${API_BASE}/api/auth/user/${encodeURIComponent(brandName)}`);
        onProfileUpdate(updatedProfile);
      }
      setBrandPassword('');
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update brand profile. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredFollowers = followers.filter(f => {
    const matchesSearch = f.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          f.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || f.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const ratingStars = [];
  const avgRating = itProfile?.averageRating || 0;
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(avgRating)) {
      ratingStars.push(<i key={i} className="bi bi-star-fill text-warning me-1" style={{ fontSize: '1.2rem' }}></i>);
    } else if (i - 0.5 <= avgRating) {
      ratingStars.push(<i key={i} className="bi bi-star-half text-warning me-1" style={{ fontSize: '1.2rem' }}></i>);
    } else {
      ratingStars.push(<i key={i} className="bi bi-star text-warning me-1" style={{ fontSize: '1.2rem' }}></i>);
    }
  }

  return (
    <div className="admin-home-content reveal">
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #da251d 0%, #7f1d1d 100%)', borderRadius: '16px', padding: '30px', color: '#fff', marginBottom: '24px', display: 'flex', gap: '24px', alignItems: 'center', boxShadow: '0 10px 25px rgba(218, 37, 29, 0.15)' }}>
        <div style={{ position: 'relative' }}>
          <img src={profilePic} alt="Brand Logo" className="rounded-circle shadow" style={{ width: '90px', height: '90px', border: '4px solid rgba(255,255,255,0.2)', objectFit: 'cover' }} />
          {!isManager && (
            <>
              <label htmlFor="brandLogoUpload" className="position-absolute bottom-0 end-0 bg-white text-danger rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: '28px', height: '28px', cursor: 'pointer', border: '1px solid #ddd' }}>
                <i className="bi bi-camera-fill small"></i>
              </label>
              <input 
                id="brandLogoUpload" 
                type="file" 
                accept="image/*" 
                className="d-none" 
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('image', file);
                  try {
                    const { data } = await axios.post(`${API_BASE}/api/upload`, formData, {
                      headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    setProfilePic(data.imageUrl);
                    // Trigger auto update
                    const adminInfo = getSafeJSON('adminInfo');
                    const config = adminInfo?.token ? { headers: { Authorization: `Bearer ${adminInfo.token}` } } : {};
                    await axios.put(`${API_BASE}/api/auth/update-profile`, {
                      userId: itProfile.id,
                      profilePic: data.imageUrl
                    }, config);
                    if (onProfileUpdate) {
                      const { data: updatedProfile } = await axios.get(`${API_BASE}/api/auth/user/${encodeURIComponent(brandName)}`);
                      onProfileUpdate(updatedProfile);
                    }
                  } catch (err) {
                    console.error("Upload failed", err);
                  }
                }}
              />
            </>
          )}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>{brandName}</h2>
            <span className="badge bg-white text-danger font-bold rounded-pill" style={{ fontSize: '0.7rem', textTransform: 'uppercase', padding: '4px 10px' }}><i className="bi bi-patch-check-fill me-1"></i>Official Brand Account</span>
          </div>
          <p style={{ margin: '8px 0 0', opacity: 0.85, fontSize: '0.9rem', maxWidth: '600px' }}>{brandBio || "Official media coverage and editorial news from the Industrial Times Editorial Team."}</p>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Side: Stats and Info */}
        <div className="col-lg-4 col-md-12">
          {/* Stats Cards */}
          <div className="new-card" style={{ marginBottom: '24px', padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', marginBottom: '16px' }}><i className="bi bi-bar-chart-fill text-danger me-2"></i>Performance Summary</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyCenter: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', justifyContent: 'space-between' }}>
                <span className="text-muted fw-semibold">Total Followers</span>
                <strong className="text-dark" style={{ fontSize: '1.1rem' }}>{followers.length}</strong>
              </div>
              <div style={{ display: 'flex', justifyCenter: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', justifyContent: 'space-between' }}>
                <span className="text-muted fw-semibold">Total Likes</span>
                <strong className="text-danger" style={{ fontSize: '1.1rem' }}><i className="bi bi-heart-fill me-1"></i>{stats?.totalLikes || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyCenter: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', justifyContent: 'space-between' }}>
                <span className="text-muted fw-semibold">Total Articles</span>
                <strong className="text-dark" style={{ fontSize: '1.1rem' }}>{stats?.totalArticles || 0}</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyCenter: 'space-between', justifyContent: 'space-between' }}>
                  <span className="text-muted fw-semibold">Brand Reputation</span>
                  <strong className="text-warning">{avgRating.toFixed(1)} ★ / 5.0</strong>
                </div>
                <div style={{ display: 'flex', justifyCenter: 'center', background: '#fffbeb', borderRadius: '8px', padding: '8px', marginTop: '4px', justifyContent: 'center' }}>
                  {ratingStars}
                </div>
                <span className="text-center text-muted small" style={{ fontSize: '0.72rem' }}>Based on {itProfile?.ratingsCount || 0} user ratings</span>
              </div>
            </div>
          </div>

          {/* Core Info details card */}
          <div className="new-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', marginBottom: '16px' }}><i className="bi bi-globe2 text-danger me-2"></i>Public Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
              <div>
                <div className="text-muted small fw-semibold">Niche & Expertise</div>
                <div className="text-dark fw-bold" style={{ marginTop: '2px' }}>{brandExpertise || "Industrial News, Press Release"}</div>
              </div>
              <div>
                <div className="text-muted small fw-semibold">Contact Email</div>
                <div className="text-dark fw-bold" style={{ marginTop: '2px' }}>{brandEmail || "info@industrialtimes.in"}</div>
              </div>
              <div>
                <div className="text-muted small fw-semibold">System Role</div>
                <div className="text-dark fw-bold text-uppercase" style={{ marginTop: '2px', color: '#b91c1c' }}>{itProfile?.role || 'superadmin'}</div>
              </div>
              <div>
                <div className="text-muted small fw-semibold">Member Since</div>
                <div className="text-dark fw-bold" style={{ marginTop: '2px' }}>{itProfile?.createdAt ? new Date(itProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Brand Info Form and Followers List */}
        <div className="col-lg-8 col-md-12">
          {/* Brand Info Form */}
          <div className="new-card" style={{ marginBottom: '24px' }}>
            <div className="new-card-header">
              <h3><i className="bi bi-pencil-square text-danger me-2"></i>Update Editorial Identity</h3>
            </div>
            
            {updateSuccess && (
              <div className="alert alert-success border-0 shadow-sm d-flex align-items-center gap-2 mb-4" style={{ borderRadius: '10px' }}>
                <i className="bi bi-check-circle-fill fs-5"></i>
                <strong>Success!</strong> Editorial profile details synchronized successfully.
              </div>
            )}

            {isManager && (
              <div className="alert alert-warning border-0 shadow-sm d-flex align-items-center gap-2 mb-4" style={{ borderRadius: '10px' }}>
                <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                <strong>Access Restricted:</strong> You are logged in as a Manager. Editing the editorial/brand profile details is disabled.
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold text-muted small">Brand Public Name</label>
                  <input 
                    type="text" 
                    className="form-control bg-light border-0" 
                    style={{ borderRadius: '8px', padding: '10px' }}
                    value={brandName} 
                    onChange={e => setBrandName(e.target.value)} 
                    required 
                    disabled={isManager}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold text-muted small">Contact Email</label>
                  <input 
                    type="email" 
                    className="form-control bg-light border-0" 
                    style={{ borderRadius: '8px', padding: '10px' }}
                    value={brandEmail} 
                    onChange={e => setBrandEmail(e.target.value)} 
                    required 
                    disabled={isManager}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold text-muted small">Change Login Password (Leave blank to keep current password)</label>
                <input 
                  type="password" 
                  className="form-control bg-light border-0" 
                  style={{ borderRadius: '8px', padding: '10px' }}
                  placeholder="Enter new password..."
                  value={brandPassword} 
                  onChange={e => setBrandPassword(e.target.value)} 
                  disabled={isManager}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold text-muted small">Niche / Expertise</label>
                <input 
                  type="text" 
                  className="form-control bg-light border-0" 
                  style={{ borderRadius: '8px', padding: '10px' }}
                  placeholder="e.g. Industrial Automation, OEM Tech, Global Manufacturing"
                  value={brandExpertise} 
                  onChange={e => setBrandExpertise(e.target.value)} 
                  disabled={isManager}
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold text-muted small">Biography / Brand Description</label>
                <textarea 
                  className="form-control bg-light border-0" 
                  style={{ borderRadius: '8px', padding: '10px' }}
                  rows="4" 
                  value={brandBio} 
                  onChange={e => setBrandBio(e.target.value)} 
                  disabled={isManager}
                ></textarea>
              </div>

              {!isManager && (
                <button 
                  type="submit" 
                  className="btn btn-danger px-4 py-2 fw-bold" 
                  style={{ borderRadius: '30px', background: '#da251d', border: 'none' }}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Syncing...</>
                  ) : (
                    <><i className="bi bi-cloud-arrow-up-fill me-2"></i>Update Editorial Identity</>
                  )}
                </button>
              )}
            </form>
          </div>

          {/* Followers Table list */}
          <div className="new-card">
            <div className="new-card-header d-flex flex-wrap justify-content-between align-items-center gap-3">
              <h3><i className="bi bi-people-fill text-danger me-2"></i>Official Brand Followers</h3>
              <span className="badge bg-danger rounded-pill px-3 py-2 fw-black" style={{ fontSize: '0.75rem' }}>{followers.length} Followers</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                <input 
                  type="text" 
                  className="form-control bg-light border-0 ps-5" 
                  style={{ borderRadius: '8px', fontSize: '0.85rem', padding: '10px' }}
                  placeholder="Search by name or email..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <select 
                  className="form-select bg-light border-0" 
                  style={{ borderRadius: '8px', fontSize: '0.85rem', padding: '10px', width: '160px' }}
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="corporate">Corporate</option>
                  <option value="author">Reporter</option>
                  <option value="user">Reader</option>
                </select>
              </div>
            </div>

            {loadingFollowers ? (
              <div className="text-center py-5 text-muted">
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>Loading followers...
              </div>
            ) : filteredFollowers.length === 0 ? (
              <div className="text-center py-5 text-muted bg-light rounded-3 text-center">
                <i className="bi bi-people fs-1 d-block mb-2 text-danger"></i>
                No followers matched your filters.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Follower Details</th>
                      <th>Account Role</th>
                      <th>Joined Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFollowers.map((f, i) => (
                      <tr key={f.id}>
                        <td className="admin-table-rank">{i + 1}</td>
                        <td>
                          <div className="fw-bold text-dark">{f.name}</div>
                          <div className="text-muted small">{f.email}</div>
                        </td>
                        <td>
                          <span className={`badge ${f.role === 'corporate' ? 'bg-info text-dark' : f.role === 'author' ? 'bg-success' : 'bg-secondary'} text-uppercase x-small`} style={{ fontSize: '0.62rem', fontWeight: 800 }}>
                            {f.role === 'author' ? 'reporter' : f.role}
                          </span>
                        </td>
                        <td className="text-muted small">
                          {f.createdAt ? new Date(f.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   MAIN DASHBOARD SHELL
──────────────────────────────────────────────────────── */
const AdminDashboard = ({ isEmbedded = false, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [adminInfo, setAdminInfo] = useState(() => {
    if (isEmbedded) {
      return getSafeJSON('userInfo');
    }
    return getSafeJSON('adminInfo');
  });
  const [embeddedTab, setEmbeddedTab] = useState('dashboard');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const [itProfile, setItProfile] = useState(null);

  // Safety check: Ensure the active user session is authenticated as an administrator/manager
  useEffect(() => {
    if (isEmbedded) {
      sessionStorage.setItem('portalMode', 'user');
      const user = getSafeJSON('userInfo');
      if (!user || (!user.isManager && user.role !== 'superadmin')) {
        if (onClose) onClose();
      }
      return;
    }
    sessionStorage.setItem('portalMode', 'admin');
    const admin = getSafeJSON('adminInfo');
    if (!admin || (admin.role !== 'superadmin' && !admin.isManager)) {
      localStorage.removeItem('adminInfo');
      navigate('/superadmin-login', { replace: true });
    }
  }, [navigate, isEmbedded, onClose]);

  // Auto-close mobile sidebar drawer on page transitions
  useEffect(() => {
    setShowMobileSidebar(false);
  }, [location.pathname, embeddedTab]);

  useEffect(() => {
    const fetchItProfile = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/auth/user/Industrial-Times`);
        setItProfile(data);
      } catch (err) {
        console.error("Failed to fetch Industrial Times profile", err);
      }
    };

    const syncManagerPermissions = async () => {
      if (adminInfo && adminInfo.id && adminInfo.isManager) {
        try {
          const { data } = await axios.get(`${API_BASE}/api/auth/user/${adminInfo.id}`);
          if (data && data.isManager) {
            const updatedInfo = {
              ...adminInfo,
              name: data.name,
              email: data.email,
              role: data.role,
              status: data.status,
              isManager: data.isManager,
              managerPermissions: data.managerPermissions
            };
            setAdminInfo(updatedInfo);
            if (isEmbedded) {
              localStorage.setItem('userInfo', JSON.stringify(updatedInfo));
            } else {
              localStorage.setItem('adminInfo', JSON.stringify(updatedInfo));
            }
          }
        } catch (err) {
          console.error("Failed to sync manager permissions", err);
        }
      }
    };

    fetchItProfile();
    syncManagerPermissions();
  }, [adminInfo?.id]);

  // Scroll visibility state for sidebar scrollbar
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimerRef = useRef(null);
  const navRef = useRef(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
      scrollTimerRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 800); // Hide the scrollbar after 800ms of scroll inactivity
    };

    nav.addEventListener('scroll', handleScroll);
    return () => {
      nav.removeEventListener('scroll', handleScroll);
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, []);

  // Profile Edit State
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profileSettings, setProfileSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('adminProfileSettings');
      return saved ? JSON.parse(saved) : { name: adminInfo?.name || 'Abram Workman', photo: '/icon.png' };
    } catch (e) {
      localStorage.removeItem('adminProfileSettings');
      return { name: adminInfo?.name || 'Abram Workman', photo: '/icon.png' };
    }
  });
  const [tempProfile, setTempProfile] = useState(profileSettings);
  const [globalArticles, setGlobalArticles] = useState([]);
  const [pendingAdRequestsCount, setPendingAdRequestsCount] = useState(0);
  const [pendingNotificationsCount, setPendingNotificationsCount] = useState(0);
  const [pendingBankCount, setPendingBankCount] = useState(0);
  const [pendingPodcastCount, setPendingPodcastCount] = useState(0);
  const [pendingAdPricingCount, setPendingAdPricingCount] = useState(0);
  
  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        // Limit to 10 most recent articles for dashboard stats (avoid loading thousands)
        const { data } = await axios.get(`${API_BASE}/api/articles`);
        const articles = Array.isArray(data) ? data : [];
        // Only keep the 10 most recent for latestArticle/topArticle calculations
        const sorted = [...articles].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setGlobalArticles(sorted.slice(0, 10));
      } catch (e) {
        console.error("Global fetch error", e);
      }
    };
    fetchGlobalData();
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const config = adminInfo?.token ? { headers: { Authorization: `Bearer ${adminInfo.token}` } } : {};
        
        // Fetch corporate requests
        const { data: corp } = await axios.get(`${API_BASE}/api/auth/corporate-requests`, config);
        // Fetch reporter requests
        const { data: rep } = await axios.get(`${API_BASE}/api/auth/reporter-requests`, config);
        const corpCount = Array.isArray(corp) ? corp.length : 0;
        const repCount = Array.isArray(rep) ? rep.length : 0;
        setPendingNotificationsCount(corpCount + repCount);

        // Fetch pending bank approvals
        try {
          const { data: verif } = await axios.get(`${API_BASE}/api/auth/bank-verifications?status=pending`, config);
          setPendingBankCount(Array.isArray(verif) ? verif.length : 0);
        } catch (verifErr) {
          console.error("Failed to fetch pending bank verifications", verifErr);
        }

        // Fetch pending podcast count
        try {
          const { data: podCount } = await axios.get(`${API_BASE}/api/podcasts/pending-count`, config);
          setPendingPodcastCount(podCount?.count || 0);
        } catch (podErr) {
          console.error("Failed to fetch pending podcast count", podErr);
        }

        // Fetch pending ad pricing count
        try {
          const { data: pricing } = await axios.get(`${API_BASE}/api/ad-pricing/all/pending`, config);
          setPendingAdPricingCount(Array.isArray(pricing) ? pricing.length : 0);
        } catch (pricingErr) {
          console.error("Failed to fetch pending pricing count", pricingErr);
        }

        // Use lightweight count endpoint instead of fetching all ad requests
        try {
          const { data: adCount } = await axios.get(`${API_BASE}/api/ad-requests/pending-count`, config);
          setPendingAdRequestsCount(adCount?.count || 0);
        } catch (adErr) {
          // Fallback: if new endpoint not deployed yet, use old method
          const { data: ads } = await axios.get(`${API_BASE}/api/ad-requests/all`, config);
          const pendingAds = Array.isArray(ads) ? ads.filter(r => r.status === 'pending' || (r.status === 'paid' && !r.linkedAdId)).length : 0;
          setPendingAdRequestsCount(pendingAds);
        }
      } catch (err) {
        console.error("Failed to fetch pending counts", err);
      }
    };
    
    if (adminInfo?.token) {
      fetchCounts();
      // Poll every 60 seconds instead of 10 to reduce server load
      const interval = setInterval(fetchCounts, 60000);
      return () => clearInterval(interval);
    }
  }, [adminInfo?.token]);

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
    localStorage.removeItem('adminInfo');
    localStorage.removeItem('userInfo');
    navigate('/');
  };

  const allMenuItems = [
    { key: 'dashboard', name: 'Dashboard', path: '/superadmin@123', icon: 'bi-grid-1x2-fill' },
    { key: 'news', name: 'Manage Media News', path: '/superadmin@123/news', icon: 'bi-newspaper' },
    { key: 'analytics', name: 'Analytics', path: '/superadmin@123/analytics', icon: 'bi-graph-up-arrow' },
    { key: 'profile', name: 'Editorial Profile', path: '/superadmin@123/profile', icon: 'bi-person-badge-fill' },
    { key: 'ads', name: 'Ad Management', path: '/superadmin@123/ads', icon: 'bi-megaphone-fill' },
    { key: 'ad_calendar', name: 'Ad Calendar', path: '/superadmin@123/ad-calendar', icon: 'bi-calendar-check' },
    { key: 'podcast', name: 'Podcast Guests', path: '/superadmin@123/podcast', icon: 'bi-mic-fill' },
    { key: 'webinars', name: 'Manage Webinars', path: '/superadmin@123/webinars', icon: 'bi-laptop' },
    { key: 'email_settings', name: 'Email Settings', path: '/superadmin@123/email-settings', icon: 'bi-envelope-at-fill' },
    { key: 'seo', name: 'SEO & Tags', path: '/superadmin@123/seo-settings', icon: 'bi-search' },
    { key: 'plans', name: 'Corporate Plans', path: '/superadmin@123/plans', icon: 'bi-credit-card-2-front-fill' },
    { key: 'ad_requests', name: 'Ad Requests', path: '/superadmin@123/ad-requests', icon: 'bi-envelope-paper-fill' },
    { key: 'ad_pricing', name: 'Ad Pricing', path: '/superadmin@123/ad-pricing', icon: 'bi-cash-coin' },
    { key: 'revenue', name: 'Revenue & Billing', path: '/superadmin@123/revenue', icon: 'bi-currency-rupee' },
    { key: 'verifications', name: 'Bank Approvals', path: '/superadmin@123/verifications', icon: 'bi-shield-check' },
    { key: 'notifications', name: 'Notifications', path: '/superadmin@123/notifications', icon: 'bi-bell-fill' },
    { key: 'breaking_news', name: 'Breaking News', path: '/superadmin@123/breaking-news', icon: 'bi-broadcast' },
    {key: 'users', name: 'Manage Users', path: '/superadmin@123/users', icon: 'bi-people-fill' },
    { key: 'managers', name: 'Assign Manager', path: '/superadmin@123/managers', icon: 'bi-person-check-fill' },
    { key: 'promo_codes', name: 'Promo Codes', path: '/superadmin@123/promo-codes', icon: 'bi-ticket-perforated-fill' }
  ];

  // Filter menu items if user is a manager (not superadmin)
  const isManager = adminInfo?.isManager;
  const managerPerms = (() => {
    const raw = adminInfo?.managerPermissions;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return [];
  })();
  
  const menuItems = adminInfo?.role === 'superadmin' 
    ? allMenuItems 
    : allMenuItems.filter(item => isManager && managerPerms.includes(item.key));

  const isActive = (item) => {
    if (isEmbedded) {
      return embeddedTab === item.key;
    }
    if (item.path === '/superadmin@123') {
      return location.pathname === '/superadmin@123' || location.pathname === '/superadmin@123/';
    }
    if (item.path) return location.pathname.startsWith(item.path);
    return false;
  };

  const handleNavClick = (item) => {
    if (isEmbedded) {
      setEmbeddedTab(item.key);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const getPageTitle = () => {
    if (isEmbedded) {
      const match = allMenuItems.find(item => item.key === embeddedTab);
      return match ? match.name : 'Dashboard';
    }
    const p = location.pathname;
    if (p === '/superadmin@123' || p === '/superadmin@123/') return 'Dashboard';
    if (p === '/superadmin@123/analytics') return 'Analytics';
    if (p === '/superadmin@123/profile') return 'Editorial Profile';
    if (p === '/superadmin@123/ads') return 'Ad Management';
    if (p === '/superadmin@123/ad-calendar') return 'Ad Availability Calendar';
    if (p === '/superadmin@123/news') return 'Manage News';
    if (p === '/superadmin@123/podcast') return 'Podcast Management';
    if (p === '/superadmin@123/webinars') return 'Webinar Management';
    if (p === '/superadmin@123/email-settings') return 'Email Settings';
    if (p === '/superadmin@123/seo-settings') return 'SEO Configuration';
    if (p === '/superadmin@123/notifications') return 'System Notifications';
    if (p === '/superadmin@123/plans') return 'Corporate Plans';
    if (p === '/superadmin@123/ad-requests') return 'Ad Requests';
    if (p === '/superadmin@123/ad-pricing') return 'Ad Pricing Management';
    if (p === '/superadmin@123/revenue') return 'Revenue & Billing';
    if (p === '/superadmin@123/breaking-news') return 'Breaking News';
    if (p === '/superadmin@123/users') return 'Manage Users';
    if (p === '/superadmin@123/managers') return 'Assign Manager';
    if (p === '/superadmin@123/promo-codes') return 'Set Promo Codes';
    return 'Dashboard';
  };

  const totalUnreadCount = pendingNotificationsCount + pendingAdRequestsCount + pendingBankCount + pendingPodcastCount + pendingAdPricingCount;

  return (
    <>
    <div className="admin-light-layout">
      {/* Mobile Sidebar Backdrop Overlay */}
      {showMobileSidebar && (
        <div 
          className="admin-sidebar-backdrop"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Fixed Left Sidebar / Mobile Drawer */}
      <aside className={`admin-light-sidebar ${showMobileSidebar ? 'mobile-show' : ''}`}>
        {/* Logo */}
        <div className="admin-sidebar-logo">
          <Link to="/">
            <img src="/industrialtimes_white.png" alt="Industrial Times" className="admin-sidebar-logo-img" />
          </Link>
        </div>

        {/* Navigation */}
        <nav ref={navRef} className={`admin-sidebar-nav ${isScrolling ? 'scrolling-active' : ''}`}>
          {menuItems.map((item) => {
            let badgeCount = 0;
            if (item.name === 'Ad Requests') {
              badgeCount = pendingAdRequestsCount;
            } else if (item.name === 'Notifications') {
              badgeCount = pendingNotificationsCount;
            } else if (item.name === 'Bank Approvals') {
              badgeCount = pendingBankCount;
            } else if (item.name === 'Podcast Guests') {
              badgeCount = pendingPodcastCount;
            } else if (item.name === 'Ad Pricing') {
              badgeCount = pendingAdPricingCount;
            }

            return (
              <button
                key={item.name}
                className={`admin-nav-item ${isActive(item) ? 'active' : ''}`}
                onClick={() => handleNavClick(item)}
              >
                <i className={`bi ${item.icon} admin-nav-icon`}></i>
                <span className="admin-nav-label">{item.name}</span>
                {badgeCount > 0 && (
                  <span className="admin-nav-badge">{badgeCount}</span>
                )}
                {item.action === 'publish' && (
                  <span className="admin-nav-badge">NEW</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Profile Section */}
        <div className="admin-sidebar-profile d-flex flex-column gap-2" style={{ padding: '16px' }}>
          <button 
            className="admin-logout-btn" 
            style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '8px' }}
            onClick={() => navigate('/')}
          >
            <i className="bi bi-globe" style={{ color: '#38bdf8' }}></i>
            <span>View Website</span>
          </button>
          {isEmbedded && (
            <button 
              className="admin-logout-btn" 
              style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '8px' }}
              onClick={onClose}
            >
              <i className="bi bi-arrow-left-circle-fill" style={{ color: '#ff4d4d' }}></i>
              <span>Back to User Portal</span>
            </button>
          )}
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
          <div className="new-topbar-left d-flex align-items-center gap-2">
            <button 
              className="admin-sidebar-toggle"
              onClick={(e) => { e.stopPropagation(); setShowMobileSidebar(!showMobileSidebar); }}
              aria-label="Toggle Navigation Drawer"
            >
              <i className={`bi ${showMobileSidebar ? 'bi-x' : 'bi-list'}`}></i>
            </button>
            <h1 className="new-page-title">{getPageTitle()}</h1>
          </div>
          <div className="new-topbar-right d-flex align-items-center">
            {/* Notification Bell */}
            <div 
              className="position-relative me-3 cursor-pointer hover-scale"
              style={{ padding: '8px', zIndex: 1001 }}
              onClick={(e) => { e.stopPropagation(); setShowNotificationMenu(!showNotificationMenu); setShowProfileMenu(false); }}
            >
              <i className="bi bi-bell-fill" style={{ fontSize: '1.4rem', color: '#4b5563' }}></i>


              {/* Notification Dropdown Menu */}
              {showNotificationMenu && (
                <div 
                  className="admin-dropdown-menu shadow-lg rounded-4 p-3 bg-white"
                  style={{ 
                    position: 'absolute', 
                    top: '100%', 
                    right: 0, 
                    width: '280px', 
                    zIndex: 1000, 
                    border: '1px solid #e2e8f0',
                    marginTop: '8px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h6 className="fw-bold text-dark mb-3 pb-2 border-bottom d-flex align-items-center justify-content-between">
                    <span>Pending Notifications</span>
                    {totalUnreadCount > 0 && <span className="badge bg-danger rounded-pill">{totalUnreadCount} New</span>}
                  </h6>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pendingNotificationsCount > 0 && (
                      <div 
                        className="p-2 rounded-3 d-flex align-items-center justify-content-between"
                        style={{ cursor: 'pointer', transition: 'background 0.2s', background: 'transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        onClick={() => {
                          handleNavClick({ key: 'notifications', path: '/superadmin@123/notifications' });
                          setShowNotificationMenu(false);
                        }}
                      >
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                          <i className="bi bi-people-fill text-danger me-2"></i>Requests/Users
                        </span>
                        <span className="badge bg-danger bg-opacity-10 text-danger fw-bold rounded-pill px-2 py-1">{pendingNotificationsCount}</span>
                      </div>
                    )}
                    {pendingAdRequestsCount > 0 && (
                      <div 
                        className="p-2 rounded-3 d-flex align-items-center justify-content-between"
                        style={{ cursor: 'pointer', transition: 'background 0.2s', background: 'transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        onClick={() => {
                          handleNavClick({ key: 'ad_requests', path: '/superadmin@123/ad-requests' });
                          setShowNotificationMenu(false);
                        }}
                      >
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                          <i className="bi bi-envelope-paper-fill text-success me-2"></i>Ad Requests
                        </span>
                        <span className="badge bg-success bg-opacity-10 text-success fw-bold rounded-pill px-2 py-1">{pendingAdRequestsCount}</span>
                      </div>
                    )}
                    {pendingAdPricingCount > 0 && (
                      <div 
                        className="p-2 rounded-3 d-flex align-items-center justify-content-between"
                        style={{ cursor: 'pointer', transition: 'background 0.2s', background: 'transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        onClick={() => {
                          handleNavClick({ key: 'ad_pricing', path: '/superadmin@123/ad-pricing' });
                          setShowNotificationMenu(false);
                        }}
                      >
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                          <i className="bi bi-cash-coin text-primary me-2"></i>Ad Pricing Review
                        </span>
                        <span className="badge bg-primary bg-opacity-10 text-primary fw-bold rounded-pill px-2 py-1">{pendingAdPricingCount}</span>
                      </div>
                    )}
                    {pendingBankCount > 0 && (
                      <div 
                        className="p-2 rounded-3 d-flex align-items-center justify-content-between"
                        style={{ cursor: 'pointer', transition: 'background 0.2s', background: 'transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        onClick={() => {
                          handleNavClick({ key: 'verifications', path: '/superadmin@123/verifications' });
                          setShowNotificationMenu(false);
                        }}
                      >
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                          <i className="bi bi-shield-check text-info me-2"></i>Bank Approvals
                        </span>
                        <span className="badge bg-info bg-opacity-10 text-info fw-bold rounded-pill px-2 py-1">{pendingBankCount}</span>
                      </div>
                    )}
                    {pendingPodcastCount > 0 && (
                      <div 
                        className="p-2 rounded-3 d-flex align-items-center justify-content-between"
                        style={{ cursor: 'pointer', transition: 'background 0.2s', background: 'transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        onClick={() => {
                          handleNavClick({ key: 'podcast', path: '/superadmin@123/podcast' });
                          setShowNotificationMenu(false);
                        }}
                      >
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                          <i className="bi bi-mic-fill text-warning me-2"></i>Podcast Guests
                        </span>
                        <span className="badge bg-warning bg-opacity-10 text-warning fw-bold rounded-pill px-2 py-1">{pendingPodcastCount}</span>
                      </div>
                    )}

                    {totalUnreadCount === 0 && (
                      <div className="text-center py-3 text-muted" style={{ fontSize: '0.8rem' }}>
                        <i className="bi bi-check-circle-fill text-success fs-4 d-block mb-1"></i>
                        All caught up! No pending actions.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div 
              className="new-profile-box cursor-pointer hover-scale position-relative"
              onClick={(e) => { e.stopPropagation(); setShowProfileMenu(!showProfileMenu); setShowNotificationMenu(false); }}
            >
              <img src={profileSettings.photo} alt="Profile" className="new-profile-avatar" />
              <div className="new-profile-info">
                <span className="new-profile-name">{profileSettings.name}</span>
                <span className="new-profile-role d-flex align-items-center gap-1">{adminInfo?.role === 'superadmin' ? 'Super Admin' : 'Manager'} <span className="text-success" style={{fontSize:'0.6rem'}}><span className="active-glow d-inline-block">●</span> Active</span></span>
              </div>
              <i className="bi bi-chevron-down new-profile-drop"></i>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="admin-dropdown-menu shadow-lg rounded-3 p-1 bg-white">
                  {!adminInfo?.isManager && (
                    <div className="dropdown-item fw-bold text-dark rounded-2 mb-1" onClick={() => {
                      if (isEmbedded) {
                        setEmbeddedTab('profile');
                        setShowProfileMenu(false);
                      } else {
                        navigate('/superadmin@123/profile');
                      }
                    }}>
                      <i className="bi bi-person-gear text-primary me-2"></i> Edit Profile
                    </div>
                  )}
                  <div className="dropdown-item text-danger fw-bold rounded-2" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i> Logout
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Routes */}
        <div className="admin-light-content">
          {isEmbedded ? (
            <>
              {embeddedTab === 'dashboard' && <AdminHome itProfile={itProfile} isEmbedded={isEmbedded} onTabChange={setEmbeddedTab} />}
              {embeddedTab === 'analytics' && <AnalyticsPage articles={globalArticles} itProfile={itProfile} />}
              {embeddedTab === 'profile' && <AdminProfilePage itProfile={itProfile} onProfileUpdate={(updated) => setItProfile(updated)} />}
              {embeddedTab === 'news' && <ManageNews adminInfo={adminInfo} />}
              {embeddedTab === 'podcast' && <ManagePodcast />}
              {embeddedTab === 'webinars' && <ManageWebinars />}
              {embeddedTab === 'ads' && <ManageAds adminInfo={adminInfo} />}
              {embeddedTab === 'ad_calendar' && <ManageAdCalendar adminInfo={adminInfo} />}
              {embeddedTab === 'plans' && <ManagePlans />}
              {embeddedTab === 'ad_requests' && <ManageAdRequests adminInfo={adminInfo} />}
              {embeddedTab === 'ad_pricing' && <ManageAdPricing adminInfo={adminInfo} />}
              {embeddedTab === 'revenue' && <ManageRevenue adminInfo={adminInfo} />}
              {embeddedTab === 'email_settings' && <ManageEmailSettings />}
              {embeddedTab === 'seo' && <ManageSeoSettings />}
              {embeddedTab === 'notifications' && <AdminNotifications />}
              {embeddedTab === 'breaking_news' && <ManageBreakingNews adminInfo={adminInfo} />}
              {embeddedTab === 'verifications' && <ManageVerifications adminInfo={adminInfo} />}
              {embeddedTab === 'users' && <ManageUsers adminInfo={adminInfo} />}
              {embeddedTab === 'managers' && <ManageManagers adminInfo={adminInfo} />}
              {embeddedTab === 'promo_codes' && <ManagePromoCodes />}
            </>
          ) : (
            <Routes>
              <Route path="/" element={<AdminHome itProfile={itProfile} />} />
              <Route path="/analytics" element={<AnalyticsPage articles={globalArticles} itProfile={itProfile} />} />
              <Route path="/profile" element={<AdminProfilePage itProfile={itProfile} onProfileUpdate={(updated) => setItProfile(updated)} />} />
              <Route path="/news" element={<ManageNews adminInfo={adminInfo} />} />
              <Route path="/podcast" element={<ManagePodcast />} />
              <Route path="/webinars" element={<ManageWebinars />} />
              <Route path="/ads" element={<ManageAds adminInfo={adminInfo} />} />
              <Route path="/ad-calendar" element={<ManageAdCalendar adminInfo={adminInfo} />} />
              <Route path="/plans" element={<ManagePlans />} />
              <Route path="/ad-requests" element={<ManageAdRequests adminInfo={adminInfo} />} />
              <Route path="/ad-pricing" element={<ManageAdPricing adminInfo={adminInfo} />} />
              <Route path="/revenue" element={<ManageRevenue adminInfo={adminInfo} />} />
              <Route path="/email-settings" element={<ManageEmailSettings />} />
              <Route path="/seo-settings" element={<ManageSeoSettings />} />
              <Route path="/notifications" element={<AdminNotifications />} />
              <Route path="/breaking-news" element={<ManageBreakingNews adminInfo={adminInfo} />} />
              <Route path="/verifications" element={<ManageVerifications adminInfo={adminInfo} />} />
              <Route path="/users" element={<ManageUsers adminInfo={adminInfo} />} />
              <Route path="/managers" element={<ManageManagers adminInfo={adminInfo} />} />
              <Route path="/promo-codes" element={<ManagePromoCodes />} />
            </Routes>
          )}
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
