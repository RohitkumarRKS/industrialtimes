import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ProgressBar, Form } from 'react-bootstrap';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config/api';
import { INDIAN_STATES } from '../data/indianStatesAndCities';
import AdminDashboard from './superadmin/AdminDashboard';

const getReporterLevel = (followersCount = 0, thresholds = { silver: 10, gold: 50, diamond: 100 }) => {
  const count = parseInt(followersCount) || 0;
  if (count >= (thresholds.diamond || 100)) return { level: 'Diamond', color: '#38bdf8', icon: 'bi-gem', bg: '#e0f2fe', text: '#0369a1' };
  if (count >= (thresholds.gold || 50)) return { level: 'Gold', color: '#fbbf24', icon: 'bi-trophy-fill', bg: '#fef3c7', text: '#b45309' };
  if (count >= (thresholds.silver || 10)) return { level: 'Silver', color: '#94a3b8', icon: 'bi-award-fill', bg: '#f1f5f9', text: '#475569' };
  return { level: 'Bronze', color: '#cd7f32', icon: 'bi-award', bg: '#ffedd5', text: '#c2410c' };
};

const UserProfile = () => {
  const [reporterThresholds, setReporterThresholds] = useState({ silver: 10, gold: 50, diamond: 100 });

  useEffect(() => {
    sessionStorage.setItem('portalMode', 'user');
  }, []);

  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/platform-settings/public`);
        if (data.reporterLevels) {
          setReporterThresholds(data.reporterLevels);
        }
      } catch (err) {
        console.error("Failed to fetch public level settings", err);
      }
    };
    fetchThresholds();
  }, []);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('adminOpen') === 'true') {
      try {
        const saved = localStorage.getItem('userInfo');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.isManager || parsed.role === 'superadmin')) {
            setShowAdminPanel(true);
          }
        }
      } catch (e) {
        console.error("Failed to parse userInfo for adminOpen check", e);
      }
      params.delete('adminOpen');
      const searchStr = params.toString();
      navigate(location.pathname + (searchStr ? '?' + searchStr : ''), { replace: true });
    }
  }, [location, navigate]);

  const hasAdminAccess = () => {
    try {
      const admin = localStorage.getItem('adminInfo');
      if (admin && admin !== 'undefined') {
        const parsed = JSON.parse(admin);
        return parsed && (parsed.role === 'superadmin' || parsed.isManager);
      }
    } catch (e) {}
    return false;
  };

  // Corporate Specific Dashboard States
  const [corpTab, setCorpTab] = useState('overview');
  const [corpAds, setCorpAds] = useState([]);
  const [corpArticleForm, setCorpArticleForm] = useState({ title: '', content: '', category: 'Articles', image: null, videoUrl: '', state: '', city: '' });
  const [corpPublishing, setCorpPublishing] = useState(false);
  const [corpPublishMsg, setCorpPublishMsg] = useState({ text: '', type: '' });

  const [corpAdForm, setCorpAdForm] = useState({ slot: 'leaderboard', link: '', imageFile: null });
  const [corpAdUploading, setCorpAdUploading] = useState(false);
  const [corpAdMsg, setCorpAdMsg] = useState({ text: '', type: '' });

  const [reqStatus, setReqStatus] = useState({ text: '', type: '' });

  useEffect(() => {
    const saved = localStorage.getItem('userInfo');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u.role === 'author') {
          navigate('/user-dashboard', { replace: true });
          return;
        } else if (u.role === 'corporate') {
          if (u.membershipPlan) {
            navigate('/user-dashboard', { replace: true });
          } else {
            navigate(`/corporate/payment?plan=${u.selectedPlan || 'basic'}`, { replace: true });
          }
          return;
        }
        setUserInfo(u);
      } catch (e) {
        console.error(e);
        localStorage.removeItem('userInfo');
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (userInfo?.id) {
      const fetchLatestStats = async () => {
        try {
          const { data } = await axios.get(`${API_BASE}/api/auth/user/${userInfo.id}`);
          if (data.role === 'author') {
            const updated = { ...userInfo, ...data };
            localStorage.setItem('userInfo', JSON.stringify(updated));
            navigate('/user-dashboard', { replace: true });
          } else if (data.role === 'corporate') {
            const updated = { ...userInfo, ...data };
            localStorage.setItem('userInfo', JSON.stringify(updated));
            if (data.membershipPlan) {
              navigate('/user-dashboard', { replace: true });
            } else {
              navigate(`/corporate/payment?plan=${data.selectedPlan || 'basic'}`, { replace: true });
            }
          } else {
            setUserInfo(prev => {
              const updated = { ...prev, ...data };
              localStorage.setItem('userInfo', JSON.stringify(updated));
              return updated;
            });
          }
        } catch (err) {
          console.error('Failed to fetch latest stats', err);
        }
      };
      fetchLatestStats();
    }
  }, [userInfo?.id, navigate]);

  useEffect(() => {
    if (!userInfo?.id) return;
    const fetchArticles = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/articles?authorId=${userInfo.id}`);
        setArticles(data || []);
      } catch (e) {
        console.error('Failed to fetch articles');
      }
    };
    fetchArticles();
  }, [userInfo?.id]);

  const fetchCorpAds = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/ads`);
      setCorpAds(data || []);
    } catch (err) {
      console.error('Failed to load corporate ads', err);
    }
  };

  useEffect(() => {
    if (userInfo && userInfo.role === 'corporate') {
      fetchCorpAds();
    }
  }, [userInfo?.id, userInfo?.role]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const updatedUser = { ...userInfo, profilePic: data.imageUrl };

      // Persist to database
      await axios.put(`${API_BASE}/api/auth/update-profile`, {
        userId: userInfo.id,
        profilePic: data.imageUrl
      });

      setUserInfo(updatedUser);
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      alert('Profile picture updated!');
    } catch (err) {
      alert('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/');
  };

  const planPrices = {
    basic: { monthly: 2500 },
    standard: { monthly: 4500 },
    premium: { monthly: 9500 },
    pro: { monthly: 20000 }
  };

  const planLabels = {
    basic: 'STARTER',
    standard: 'BUSINESS',
    premium: 'ENTERPRISE',
    pro: 'EXECUTIVE'
  };



  const getPlanQuotas = () => {
    const plan = userInfo?.membershipPlan;
    if (plan === 'basic') return { articles: 3, ads: 0 };
    if (plan === 'standard') return { articles: 5, ads: 0 };
    if (plan === 'premium') return { articles: 7, ads: 2 };
    if (plan === 'pro') return { articles: 99999, ads: 4 };
    return { articles: 0, ads: 0 };
  };

  const handleCorpPublish = async (e) => {
    e.preventDefault();
    setCorpPublishing(true);
    setCorpPublishMsg({ text: '', type: '' });

    // Quota validation
    const quota = getPlanQuotas();
    const myArticlesCount = articles.filter(a => parseInt(a.authorId) === parseInt(userInfo.id)).length;
    if (myArticlesCount >= quota.articles) {
      setCorpPublishMsg({ 
        text: `🚫 Monthly limit reached! Your ${planLabels[userInfo.membershipPlan]} plan allows up to ${quota.articles} articles per month. Please upgrade your tier for higher volume publishing.`, 
        type: 'danger' 
      });
      setCorpPublishing(false);
      return;
    }

    try {
      let imageUrl = '';
      if (corpArticleForm.image) {
        const formData = new FormData();
        formData.append('image', corpArticleForm.image);
        const uploadRes = await axios.post(`${API_BASE}/api/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = uploadRes.data.imageUrl;
      }

      const articleData = {
        title: corpArticleForm.title,
        content: corpArticleForm.content,
        category: corpArticleForm.category,
        image: imageUrl,
        videoUrl: corpArticleForm.videoUrl,
        author: userInfo.companyName || userInfo.name,
        state: corpArticleForm.state,
        city: corpArticleForm.city
      };

      await axios.post(`${API_BASE}/api/articles`, articleData, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`
        }
      });

      setCorpPublishMsg({ text: '🎉 Premium Corporate Article successfully published! It is now live on the global feed.', type: 'success' });
      setCorpArticleForm({ title: '', content: '', category: 'Articles', image: null, videoUrl: '', state: '', city: '' });
      
      // Refresh articles
      const { data } = await axios.get(`${API_BASE}/api/articles?authorId=${userInfo.id}`);
      setArticles(data || []);

      // Reset file input
      const fileInput = document.getElementById('corp-article-image');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setCorpPublishMsg({ text: err.response?.data?.message || 'Failed to publish article', type: 'danger' });
    } finally {
      setCorpPublishing(false);
    }
  };

  const handleCorpAdUpload = async (e) => {
    e.preventDefault();
    setCorpAdUploading(true);
    setCorpAdMsg({ text: '', type: '' });

    // Quota validation
    const quota = getPlanQuotas();
    const myAds = corpAds.filter(ad => ad.advertiser === userInfo.companyName);
    if (myAds.length >= quota.ads) {
      setCorpAdMsg({ 
        text: `🚫 Ad limit reached! Your ${planLabels[userInfo.membershipPlan]} plan allows up to ${quota.ads} active banner ad campaigns. Please upgrade to executive level for more slots.`, 
        type: 'danger' 
      });
      setCorpAdUploading(false);
      return;
    }

    if (!corpAdForm.imageFile) {
      setCorpAdMsg({ text: 'Please select an image creative graphic for your advertisement.', type: 'danger' });
      setCorpAdUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', corpAdForm.imageFile);
      const uploadRes = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imageUrl = uploadRes.data.imageUrl;

      await axios.post(`${API_BASE}/api/ads`, {
        slot: corpAdForm.slot,
        imageUrl: imageUrl,
        link: corpAdForm.link,
        advertiser: userInfo.companyName || userInfo.name,
        active: true,
        label: 'Sponsored'
      }, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`
        }
      });

      setCorpAdMsg({ text: '🚀 Sponsored banner ad campaign successfully verified and launched live!', type: 'success' });
      setCorpAdForm({ slot: 'leaderboard', link: '', imageFile: null });
      fetchCorpAds();

      // Reset file input
      const fileInput = document.getElementById('corp-ad-image');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setCorpAdMsg({ text: err.response?.data?.message || 'Failed to submit campaign', type: 'danger' });
    } finally {
      setCorpAdUploading(false);
    }
  };

  const handleCampaignReq = (requestName) => {
    setReqStatus({ text: `⏳ Campaign request submitted! Your corporate account manager will contact you within 2 hours to deploy the "${requestName}" campaign assets.`, type: 'success' });
    setTimeout(() => {
      setReqStatus({ text: '', type: '' });
    }, 6000);
  };

  if (showAdminPanel) {
    return <AdminDashboard isEmbedded={true} onClose={() => setShowAdminPanel(false)} />;
  }

  if (!userInfo) return null;

  const role = userInfo.role;
  const myArticles = articles.filter(a => 
    (a.authorId && parseInt(a.authorId) === parseInt(userInfo.id)) ||
    (a.author && a.author.toLowerCase() === userInfo.name.toLowerCase())
  );
  const totalViews = myArticles.reduce((sum, a) => sum + (a.views || 0), 0);

  // Role-specific accent colors
  const roleColors = {
    user: { primary: '#3b82f6', gradient: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)' },
    author: { primary: '#10b981', gradient: 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)' },
    corporate: { primary: '#8b5cf6', gradient: 'linear-gradient(135deg, #3b1f7a 0%, #0f172a 100%)' },
    superadmin: { primary: '#da251d', gradient: 'linear-gradient(135deg, #7f1d1d 0%, #0f172a 100%)' }
  };
  const accent = roleColors[role] || roleColors.user;

  const roleLabel = {
    user: 'Reader',
    author: 'Reporter',
    corporate: 'Corporate Account',
    superadmin: 'Super Admin'
  };

  return (
    <div className="profile-page py-5" style={{ background: '#f4f7f6', minHeight: '90vh' }}>
      <Container>
        <Row className="justify-content-center">
          <Col lg={10}>
            <Card className="border-0 shadow-sm overflow-hidden" style={{ borderRadius: '20px' }}>
              {/* Profile Header */}
              <div className="profile-header p-5 text-center text-white position-relative" style={{ background: accent.gradient }}>
                <div className="profile-avatar-wrapper mx-auto mb-3 position-relative" style={{ width: '130px', height: '130px' }}>
                  <img 
                    src={userInfo.profilePic ? (userInfo.profilePic.startsWith('http') ? userInfo.profilePic : `${API_BASE}${userInfo.profilePic.startsWith('/') ? '' : '/'}${userInfo.profilePic}`) : 'https://via.placeholder.com/150'} 
                    alt={userInfo.name}
                    className="rounded-circle border border-4 border-white shadow-lg w-100 h-100 object-fit-cover"
                  />
                  <label htmlFor="profile-upload" className="avatar-edit-btn position-absolute bottom-0 end-0 text-white rounded-circle d-flex align-items-center justify-content-center cursor-pointer shadow" style={{ width: '38px', height: '38px', background: accent.primary }}>
                    <i className="bi bi-camera-fill"></i>
                    <input type="file" id="profile-upload" className="d-none" onChange={handleFileChange} accept="image/*" />
                  </label>
                </div>
                <h2 className="fw-black mb-1">{userInfo.name}</h2>
                <Badge style={{ background: accent.primary }} className="text-uppercase mb-2" pill>{roleLabel[role]}</Badge>
                {role === 'corporate' && userInfo.companyName && (
                  <p className="mb-0 mt-1 text-white-50" style={{ fontSize: '0.9rem' }}>
                    <i className="bi bi-building me-1"></i>{userInfo.companyName}
                    {userInfo.designation && <span className="ms-2">• {userInfo.designation}</span>}
                  </p>
                )}
              </div>

              <Card.Body className="p-4 p-md-5">
                {/* === STATS ROW === */}
                <Row className="g-3 mb-4">
                  {role === 'user' && (
                    <>
                      <Col md={4}>
                        <div className="stat-box p-3 rounded-4 text-center" style={{ background: '#f0f9ff', border: '1px solid #bfdbfe' }}>
                          <h3 className="fw-black mb-0" style={{ color: '#3b82f6' }}>
                            {userInfo.membershipPlan ? planLabels[userInfo.membershipPlan] || 'Basic' : 'Free'}
                          </h3>
                          <small className="text-muted fw-bold">Current Plan</small>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="stat-box p-3 rounded-4 text-center" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                          <h3 className="fw-black mb-0" style={{ color: '#10b981' }}>∞</h3>
                          <small className="text-muted fw-bold">Articles Read</small>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="stat-box p-3 rounded-4 text-center" style={{ background: '#fefce8', border: '1px solid #fef08a' }}>
                          <h3 className="fw-black mb-0" style={{ color: '#eab308' }}>
                            {new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          </h3>
                          <small className="text-muted fw-bold">Member Since</small>
                        </div>
                      </Col>
                    </>
                  )}

                  {role === 'author' && (
                    <>
                      <Col md={3}>
                        <div className="stat-box p-3 rounded-4 text-center" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                          <h3 className="fw-black mb-0" style={{ color: '#10b981' }}>{myArticles.length}</h3>
                          <small className="text-muted fw-bold">Published</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="stat-box p-3 rounded-4 text-center" style={{ background: '#f0f9ff', border: '1px solid #bfdbfe' }}>
                          <h3 className="fw-black mb-0" style={{ color: '#3b82f6' }}>{totalViews.toLocaleString()}</h3>
                          <small className="text-muted fw-bold">Total Views</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="stat-box p-3 rounded-4 text-center" style={{ background: '#fdf4ff', border: '1px solid #f0abfc' }}>
                          <h3 className="fw-black mb-0" style={{ color: '#a855f7' }}>
                            {myArticles.length > 0 ? Math.round(totalViews / myArticles.length) : 0}
                          </h3>
                          <small className="text-muted fw-bold">Avg Views</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="stat-box p-3 rounded-4 text-center" style={{ background: '#fefce8', border: '1px solid #fef08a' }}>
                          <h3 className="fw-black mb-0" style={{ color: '#eab308' }}>
                            {[...new Set(myArticles.map(a => a.category))].length}
                          </h3>
                          <small className="text-muted fw-bold">Categories</small>
                        </div>
                      </Col>
                    </>
                  )}

                  {role === 'corporate' && (
                    <>
                      <Col md={3}>
                        <div className="stat-box p-3 rounded-4 text-center" style={{ background: '#faf5ff', border: '1px solid #e9d5ff' }}>
                          <h3 className="fw-black mb-0" style={{ color: '#8b5cf6' }}>
                            {userInfo.membershipPlan ? planLabels[userInfo.membershipPlan] : 'None'}
                          </h3>
                          <small className="text-muted fw-bold">Active Plan</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="stat-box p-3 rounded-4 text-center" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                          <h3 className="fw-black mb-0" style={{ color: '#10b981' }}>
                            <i className="bi bi-check-circle-fill"></i>
                          </h3>
                          <small className="text-muted fw-bold">Verified</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="stat-box p-3 rounded-4 text-center" style={{ background: '#f0f9ff', border: '1px solid #bfdbfe' }}>
                          <h3 className="fw-black mb-0" style={{ color: '#3b82f6' }}>
                            {planLabels[userInfo.selectedPlan] || 'Starter'}
                          </h3>
                          <small className="text-muted fw-bold">Selected Plan</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="stat-box p-3 rounded-4 text-center" style={{ background: '#fefce8', border: '1px solid #fef08a' }}>
                          <h3 className="fw-black mb-0" style={{ color: '#eab308' }}>
                            {new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          </h3>
                          <small className="text-muted fw-bold">Member Since</small>
                        </div>
                      </Col>
                    </>
                  )}
                </Row>

                {/* === ACCOUNT INFORMATION === */}
                <div className="profile-details">
                  <h5 className="fw-bold border-bottom pb-3 mb-4">
                    <i className="bi bi-person-lines-fill me-2"></i>Account Information
                  </h5>
                  
                  <Row className="g-4">
                    <Col md={6}>
                      <div className="detail-item">
                        <label className="text-muted x-small fw-bold text-uppercase">Full Name</label>
                        <p className="fw-bold fs-5 mb-0">{userInfo.name}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="detail-item">
                        <label className="text-muted x-small fw-bold text-uppercase">Email Address</label>
                        <p className="fw-bold fs-5 mb-0">{userInfo.email}</p>
                      </div>
                    </Col>
                    {role === 'corporate' && (
                      <>
                        <Col md={6}>
                          <div className="detail-item">
                            <label className="text-muted x-small fw-bold text-uppercase">Company</label>
                            <p className="fw-bold fs-5 mb-0">{userInfo.companyName || 'N/A'}</p>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="detail-item">
                            <label className="text-muted x-small fw-bold text-uppercase">Designation</label>
                            <p className="fw-bold fs-5 mb-0">{userInfo.designation || 'N/A'}</p>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="detail-item">
                            <label className="text-muted x-small fw-bold text-uppercase">Phone</label>
                            <p className="fw-bold fs-5 mb-0">{userInfo.phone || 'N/A'}</p>
                          </div>
                        </Col>
                      </>
                    )}
                    <Col md={6}>
                      <div className="detail-item">
                        <label className="text-muted x-small fw-bold text-uppercase">Account Type</label>
                        <div className="d-flex align-items-center gap-2">
                          <p className="fw-bold fs-5 mb-0 text-uppercase">{roleLabel[role]}</p>
                          <Badge bg="success">Active</Badge>
                        </div>
                      </div>
                    </Col>
                    {role === 'author' ? (() => {
                      const lvl = getReporterLevel(userInfo.followersCount, reporterThresholds);
                      return (
                        <Col md={6}>
                          <div className="detail-item">
                            <label className="text-muted x-small fw-bold text-uppercase">Reporter Status</label>
                            <div className="d-flex align-items-center gap-2">
                              <p className="fw-bold fs-5 mb-0 text-uppercase" style={{ color: lvl.color }}>
                                <i className={`bi ${lvl.icon} me-1`}></i> {lvl.level} Level
                              </p>
                            </div>
                          </div>
                        </Col>
                      );
                    })() : (
                      <Col md={6}>
                        <div className="detail-item">
                          <label className="text-muted x-small fw-bold text-uppercase">Current Plan</label>
                          <div className="d-flex align-items-center gap-2">
                            <p className="fw-bold fs-5 mb-0 text-uppercase">
                              {userInfo.membershipPlan ? planLabels[userInfo.membershipPlan] || userInfo.membershipPlan : 'Free'}
                            </p>
                            {userInfo.membershipPlan && <Badge bg="success">Active</Badge>}
                          </div>
                        </div>
                      </Col>
                    )}
                  </Row>

                  {/* === CORPORATE: Premium Active Subscription Dashboard === */}
                  {role === 'corporate' && userInfo.membershipPlan && (
                    <div className="mt-5 pt-4 border-top">
                      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                        <h4 className="fw-black mb-0 text-dark">
                          <i className="bi bi-shield-check text-primary me-2"></i>
                          Corporate Partner Portal
                        </h4>
                        <Badge bg="primary" className="py-2 px-3 text-uppercase">
                          {planLabels[userInfo.membershipPlan]} Package Active
                        </Badge>
                      </div>

                      {/* Tab Navigation */}
                      <div className="d-flex gap-2 mb-4 flex-wrap">
                        <Button 
                          variant={corpTab === 'overview' ? 'primary' : 'light'}
                          className="fw-bold rounded-3 px-3 py-2"
                          onClick={() => setCorpTab('overview')}
                        >
                          <i className="bi bi-grid-1x2 me-1"></i> Overview
                        </Button>
                        <Button 
                          variant={corpTab === 'article' ? 'primary' : 'light'}
                          className="fw-bold rounded-3 px-3 py-2"
                          onClick={() => setCorpTab('article')}
                        >
                          <i className="bi bi-pencil-square me-1"></i> Post Articles
                        </Button>
                        
                        {/* Ads tab only for Premium & Pro levels */}
                        {getPlanQuotas().ads > 0 && (
                          <Button 
                            variant={corpTab === 'ads' ? 'primary' : 'light'}
                            className="fw-bold rounded-3 px-3 py-2"
                            onClick={() => setCorpTab('ads')}
                          >
                            <i className="bi bi-image me-1"></i> Ad Campaigns
                          </Button>
                        )}

                        <Button 
                          variant={corpTab === 'requests' ? 'primary' : 'light'}
                          className="fw-bold rounded-3 px-3 py-2"
                          onClick={() => setCorpTab('requests')}
                        >
                          <i className="bi bi-mailbox me-1"></i> Requests Desk
                        </Button>
                      </div>

                      {/* --- TAB 1: OVERVIEW & METRICS --- */}
                      {corpTab === 'overview' && (
                        <div>
                          <Row className="g-3 mb-4">
                            <Col md={6}>
                              <Card className="border p-3 rounded-4 shadow-sm h-100 bg-white">
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                  <span className="fw-bold text-muted small">ARTICLE PUBLISHING LIMITS</span>
                                  <i className="bi bi-file-earmark-text text-primary fs-5"></i>
                                </div>
                                <h3 className="fw-black text-dark mb-2">
                                  {myArticles.length} / {getPlanQuotas().articles === 99999 ? '∞' : getPlanQuotas().articles}
                                </h3>
                                <ProgressBar 
                                  now={getPlanQuotas().articles === 99999 ? 100 : (myArticles.length / getPlanQuotas().articles) * 100} 
                                  variant="primary" 
                                  className="rounded-pill"
                                  style={{ height: '8px' }}
                                />
                                <small className="text-muted mt-2 d-block">
                                  {getPlanQuotas().articles === 99999 ? 'Unlimited publishing active.' : `${getPlanQuotas().articles - myArticles.length} articles remaining this month.`}
                                </small>
                              </Card>
                            </Col>

                            {getPlanQuotas().ads > 0 && (
                              <Col md={6}>
                                <Card className="border p-3 rounded-4 shadow-sm h-100 bg-white">
                                  <div className="d-flex align-items-center justify-content-between mb-2">
                                    <span className="fw-bold text-muted small">BANNER ADS CAMPAIGNS</span>
                                    <i className="bi bi-image text-success fs-5"></i>
                                  </div>
                                  <h3 className="fw-black text-dark mb-2">
                                    {corpAds.filter(ad => ad.advertiser === (userInfo.companyName || userInfo.name)).length} / {getPlanQuotas().ads}
                                  </h3>
                                  <ProgressBar 
                                    now={(corpAds.filter(ad => ad.advertiser === (userInfo.companyName || userInfo.name)).length / getPlanQuotas().ads) * 100} 
                                    variant="success" 
                                    className="rounded-pill"
                                    style={{ height: '8px' }}
                                  />
                                  <small className="text-muted mt-2 d-block">
                                    {getPlanQuotas().ads - corpAds.filter(ad => ad.advertiser === (userInfo.companyName || userInfo.name)).length} active banner slots available.
                                  </small>
                                </Card>
                              </Col>
                            )}
                          </Row>

                          {/* Published List */}
                          <div className="bg-white border rounded-4 p-4 shadow-sm">
                            <h5 className="fw-bold text-dark mb-3">Recent Corporate Publications</h5>
                            {myArticles.length === 0 ? (
                              <p className="text-muted small mb-0">No published articles yet. Navigate to "Post Articles" to launch your first brand statement.</p>
                            ) : (
                              <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                  <thead>
                                    <tr>
                                      <th>Article Title</th>
                                      <th>Category</th>
                                      <th>Published Date</th>
                                      <th>Metrics</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {myArticles.map(art => (
                                      <tr key={art.id}>
                                        <td className="fw-bold text-dark">{art.title}</td>
                                        <td><Badge bg="secondary">{art.category}</Badge></td>
                                        <td>{new Date(art.createdAt).toLocaleDateString()}</td>
                                        <td><strong>{art.views || 0}</strong> impressions</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* --- TAB 2: POST / PUBLISH ARTICLES TOOL --- */}
                      {corpTab === 'article' && (
                        <Card className="border rounded-4 p-4 bg-white shadow-sm">
                          <h5 className="fw-bold text-dark mb-4">
                            <i className="bi bi-pencil-square me-2 text-primary"></i>
                            Draft Corporate Press Release or Article
                          </h5>

                          {corpPublishMsg.text && (
                            <div className={`alert alert-${corpPublishMsg.type} rounded-3 small`}>
                              {corpPublishMsg.text}
                            </div>
                          )}

                          <form onSubmit={handleCorpPublish}>
                            <div className="mb-3">
                              <label className="fw-bold small text-muted mb-1">Headline *</label>
                              <input 
                                type="text"
                                className="form-control rounded-3"
                                placeholder="Enter corporate announcement or PR headline..."
                                value={corpArticleForm.title}
                                onChange={e => setCorpArticleForm({ ...corpArticleForm, title: e.target.value })}
                                required
                              />
                            </div>

                            <Row className="mb-3">
                              <Col md={6}>
                                <label className="fw-bold small text-muted mb-1">Target Category *</label>
                                <Form.Select 
                                  className="rounded-3"
                                  value={corpArticleForm.category}
                                  onChange={e => setCorpArticleForm({ ...corpArticleForm, category: e.target.value })}
                                  required
                                >
                                  {['Global', 'News', 'Regional', 'Articles', 'Trending', 'OEM', 'Automation', 'Interview', 'Startup', 'Business', 'Event', 'Tender', 'Entertainment', 'Sports', 'Education'].map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                </Form.Select>
                              </Col>
                              <Col md={6}>
                                <label className="fw-bold small text-muted mb-1">State (Optional)</label>
                                <Form.Select 
                                  className="rounded-3"
                                  value={corpArticleForm.state || ''}
                                  onChange={e => setCorpArticleForm({ ...corpArticleForm, state: e.target.value })}
                                >
                                  <option value="">— Select State —</option>
                                  {INDIAN_STATES.map(st => (
                                    <option key={st} value={st}>{st}</option>
                                  ))}
                                </Form.Select>
                              </Col>
                              <Col md={6} className="mt-3">
                                <label className="fw-bold small text-muted mb-1">City (Optional)</label>
                                <input 
                                  type="text" 
                                  className="form-control rounded-3"
                                  placeholder="Enter City / Area..."
                                  value={corpArticleForm.city || ''}
                                  onChange={e => setCorpArticleForm({ ...corpArticleForm, city: e.target.value })}
                                />
                              </Col>
                              <Col md={6} className="mt-3">
                                <label className="fw-bold small text-muted mb-1">Featured Branding Thumbnail</label>
                                <input 
                                  type="file"
                                  id="corp-article-image"
                                  accept="image/*"
                                  className="form-control rounded-3"
                                  onChange={e => setCorpArticleForm({ ...corpArticleForm, image: e.target.files[0] || null })}
                                />
                              </Col>
                              <Col md={12} className="mt-3">
                                <label className="fw-bold small text-muted mb-1">Media / Social Embed URL (Optional)</label>
                                <input 
                                  type="url"
                                  className="form-control rounded-3"
                                  placeholder="Paste YouTube, Facebook, Instagram, or LinkedIn link here..." 
                                  value={corpArticleForm.videoUrl || ''} 
                                  onChange={e => setCorpArticleForm({ ...corpArticleForm, videoUrl: e.target.value })} 
                                />
                              </Col>
                            </Row>

                            <div className="mb-4">
                              <label className="fw-bold small text-muted mb-1">Article Body Content *</label>
                              <textarea 
                                className="form-control rounded-3"
                                rows={8}
                                placeholder="Paste or draft your premium press release body..."
                                value={corpArticleForm.content}
                                onChange={e => setCorpArticleForm({ ...corpArticleForm, content: e.target.value })}
                                required
                                style={{ lineHeight: 1.7 }}
                              />
                            </div>

                            <Button 
                              type="submit" 
                              variant="primary" 
                              className="fw-bold px-4 rounded-pill"
                              disabled={corpPublishing}
                            >
                              {corpPublishing ? 'Submitting PR...' : 'Publish Corporate PR'}
                            </Button>
                          </form>
                        </Card>
                      )}

                      {/* --- TAB 3: SPONSORED ADS CAMPAIGN MANAGER --- */}
                      {corpTab === 'ads' && getPlanQuotas().ads > 0 && (
                        <Card className="border rounded-4 p-4 bg-white shadow-sm">
                          <h5 className="fw-bold text-dark mb-4">
                            <i className="bi bi-image me-2 text-primary"></i>
                            Launch Sponsored Advertisement Banner
                          </h5>

                          {corpAdMsg.text && (
                            <div className={`alert alert-${corpAdMsg.type} rounded-3 small`}>
                              {corpAdMsg.text}
                            </div>
                          )}

                          <form onSubmit={handleCorpAdUpload}>
                            <Row className="mb-3">
                              <Col md={6}>
                                <label className="fw-bold small text-muted mb-1">Placement Placement Slot</label>
                                <select 
                                  className="form-select rounded-3"
                                  value={corpAdForm.slot}
                                  onChange={e => setCorpAdForm({ ...corpAdForm, slot: e.target.value })}
                                  required
                                >
                                  <option value="leaderboard">Leaderboard Banner (728 x 90) - Homepage Top</option>
                                  <option value="right-half-page">Half Page Ad (300 x 600) - Sidebar Right</option>
                                </select>
                              </Col>
                              <Col md={6}>
                                <label className="fw-bold small text-muted mb-1">Click Redirect URL</label>
                                <input 
                                  type="url"
                                  className="form-control rounded-3"
                                  placeholder="https://yourcompany.com/landing-page"
                                  value={corpAdForm.link}
                                  onChange={e => setCorpAdForm({ ...corpAdForm, link: e.target.value })}
                                />
                              </Col>
                            </Row>

                            <div className="mb-4">
                              <label className="fw-bold small text-muted mb-1">Banner Graphic Image *</label>
                              <input 
                                type="file"
                                id="corp-ad-image"
                                accept="image/*"
                                className="form-control rounded-3"
                                onChange={e => setCorpAdForm({ ...corpAdForm, imageFile: e.target.files[0] || null })}
                                required
                              />
                              <small className="text-muted mt-1 d-block">
                                JPEG or PNG recommended. Ensure it fits exactly the selected banner size.
                              </small>
                            </div>

                            <Button 
                              type="submit" 
                              variant="success" 
                              className="fw-bold px-4 rounded-pill"
                              disabled={corpAdUploading}
                            >
                              {corpAdUploading ? 'Uploading Graphic...' : 'Launch Sponsored Ad'}
                            </Button>
                          </form>

                          {/* Existing Ads List */}
                          <div className="mt-4 border-top pt-4">
                            <h6 className="fw-bold text-dark mb-3">Your Active Banner Slots</h6>
                            {corpAds.filter(ad => ad.advertiser === (userInfo.companyName || userInfo.name)).length === 0 ? (
                              <p className="text-muted small mb-0">No active banner ads launched yet.</p>
                            ) : (
                              <div className="d-flex flex-column gap-3">
                                {corpAds.filter(ad => ad.advertiser === (userInfo.companyName || userInfo.name)).map(ad => (
                                  <div key={ad.id} className="d-flex align-items-center justify-content-between p-3 border rounded-3 bg-light">
                                    <div className="d-flex align-items-center gap-3">
                                      <img src={`${API_BASE}${ad.imageUrl}`} alt="" style={{ height: '40px', width: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                                      <div>
                                        <p className="mb-0 fw-bold text-dark text-capitalize">{ad.slot.replace('-', ' ')} Slot</p>
                                        <small className="text-muted">{ad.clicks || 0} clicks • {ad.impressions || 0} views</small>
                                      </div>
                                    </div>
                                    <Badge bg="success">LIVE</Badge>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </Card>
                      )}

                      {/* --- TAB 4: CAMPAIGNS & REQUEST DESK --- */}
                      {corpTab === 'requests' && (
                        <Card className="border rounded-4 p-4 bg-white shadow-sm">
                          <h5 className="fw-bold text-dark mb-2">
                            <i className="bi bi-mailbox me-2 text-primary"></i>
                            Strategic Campaign Desk
                          </h5>
                          <p className="text-muted small mb-4">
                            Submit a request to execute premium brand promotion deliverables included in your partnership.
                          </p>

                          {reqStatus.text && (
                            <div className="alert alert-success rounded-3 small animate-fade-in">
                              <i className="bi bi-info-circle-fill me-2"></i>
                              {reqStatus.text}
                            </div>
                          )}

                          <Row className="g-3">
                            <Col sm={6}>
                              <div className="p-3 border rounded-3 bg-light d-flex justify-content-between align-items-center">
                                <div>
                                  <h6 className="fw-bold text-dark mb-1">Newsletter Placement</h6>
                                  <p className="text-muted x-small mb-0">Deliver brand to 50K subscribers</p>
                                </div>
                                <Button size="sm" variant="outline-primary" className="fw-bold rounded-pill px-3" onClick={() => handleCampaignReq('Newsletter Placement')}>
                                  Request
                                </Button>
                              </div>
                            </Col>

                            <Col sm={6}>
                              <div className="p-3 border rounded-3 bg-light d-flex justify-content-between align-items-center">
                                <div>
                                  <h6 className="fw-bold text-dark mb-1">Social Media Shoutout</h6>
                                  <p className="text-muted x-small mb-0">Featured across our social feeds</p>
                                </div>
                                <Button size="sm" variant="outline-primary" className="fw-bold rounded-pill px-3" onClick={() => handleCampaignReq('Social Media Shoutout')}>
                                  Request
                                </Button>
                              </div>
                            </Col>

                            {/* Pro Only Deliverables */}
                            {userInfo.membershipPlan === 'pro' && (
                              <>
                                <Col sm={6}>
                                  <div className="p-3 border rounded-3 bg-light d-flex justify-content-between align-items-center">
                                    <div>
                                      <h6 className="fw-bold text-dark mb-1">Homepage Takeover</h6>
                                      <p className="text-muted x-small mb-0">Exclusive display ad blocks</p>
                                    </div>
                                    <Button size="sm" variant="outline-primary" className="fw-bold rounded-pill px-3" onClick={() => handleCampaignReq('Homepage Takeover')}>
                                      Request
                                    </Button>
                                  </div>
                                </Col>
                                <Col sm={6}>
                                  <div className="p-3 border rounded-3 bg-light d-flex justify-content-between align-items-center">
                                    <div>
                                      <h6 className="fw-bold text-dark mb-1">Digital E-paper Feature</h6>
                                      <p className="text-muted x-small mb-0">Full feature interview feature</p>
                                    </div>
                                    <Button size="sm" variant="outline-primary" className="fw-bold rounded-pill px-3" onClick={() => handleCampaignReq('Digital E-Paper Feature')}>
                                      Request
                                    </Button>
                                  </div>
                                </Col>
                              </>
                            )}

                            {/* Direct Line to Account Manager */}
                            <Col xs={12} className="mt-4">
                              <div className="p-4 rounded-4 text-white" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                                  <div className="d-flex align-items-center gap-3">
                                    <div className="bg-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                                      <i className="bi bi-headset text-white fs-4"></i>
                                    </div>
                                    <div>
                                      <h6 className="fw-bold mb-0">Dedicated Account Manager</h6>
                                      <p className="text-white-50 x-small mb-0">Need custom solutions? Get direct assistance now.</p>
                                    </div>
                                  </div>
                                  <Button variant="primary" className="fw-bold rounded-pill px-4" onClick={() => handleCampaignReq('Account Manager Consultation')}>
                                    <i className="bi bi-chat-dots-fill me-1"></i> Call Support Line
                                  </Button>
                                </div>
                              </div>
                            </Col>
                          </Row>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* === CORPORATE: Unpaid Signup CTA === */}
                  {role === 'corporate' && !userInfo.membershipPlan && userInfo.selectedPlan && (
                    <div className="mt-4 p-4 rounded-4" style={{ background: 'linear-gradient(135deg, #faf5ff, #ede9fe)', border: '2px solid #e9d5ff' }}>
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                        <div>
                          <h5 className="fw-black mb-1" style={{ color: '#7c3aed' }}>
                            <i className="bi bi-gift-fill me-2"></i>
                            Activate Your {planLabels[userInfo.selectedPlan]} Plan
                          </h5>
                          <p className="text-muted mb-0 small">
                            Complete your subscription payment to unlock premium publishing features, ad slots, and campaign assets.
                          </p>
                        </div>
                        <Button 
                          onClick={() => navigate(`/corporate/payment?plan=${userInfo.selectedPlan}`)}
                          style={{ background: '#7c3aed', border: 'none', fontWeight: 800, padding: '12px 30px', borderRadius: '12px' }}
                          className="shadow-sm"
                        >
                          <i className="bi bi-credit-card me-2"></i>
                          Purchase Plan — ₹{planPrices[userInfo.selectedPlan]?.monthly?.toLocaleString() || '2,500'}/mo
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* === AUTHOR: Recent Articles === */}
                  {role === 'author' && myArticles.length > 0 && (
                    <div className="mt-4">
                      <h5 className="fw-bold border-bottom pb-3 mb-3">
                        <i className="bi bi-file-earmark-text me-2"></i>Your Recent Articles
                      </h5>
                      <div className="d-flex flex-column gap-2">
                        {myArticles.slice(0, 5).map((article) => (
                          <div key={article.id} className="d-flex align-items-center gap-3 p-3 rounded-3 bg-light">
                            <div className="flex-shrink-0" style={{ width: '50px', height: '50px', borderRadius: '10px', overflow: 'hidden', background: '#e5e7eb' }}>
                              {article.imageUrl ? (
                                <img src={`${API_BASE}${article.imageUrl}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div className="d-flex align-items-center justify-content-center w-100 h-100 text-muted">
                                  <i className="bi bi-image"></i>
                                </div>
                              )}
                            </div>
                            <div className="flex-grow-1 min-w-0">
                              <p className="fw-bold mb-0 text-truncate" style={{ fontSize: '0.9rem' }}>{article.title}</p>
                              <small className="text-muted">
                                <Badge bg="light" text="dark" className="me-2">{article.category}</Badge>
                                {article.views || 0} views
                              </small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* === ACTION BUTTONS === */}
                  <div className="mt-5 pt-4 border-top d-flex flex-wrap gap-2">
                    <Button variant="outline-danger" className="fw-bold px-4 rounded-pill">
                      <i className="bi bi-pencil me-2"></i>Edit Profile
                    </Button>

                    {role === 'corporate' && !userInfo.membershipPlan && userInfo.selectedPlan && (
                      <Button style={{ background: '#7c3aed', border: 'none' }} className="fw-bold px-4 rounded-pill" onClick={() => navigate(`/corporate/payment?plan=${userInfo.selectedPlan}`)}>
                        <i className="bi bi-credit-card me-2"></i>Activate Plan
                      </Button>
                    )}
                    {userInfo && (userInfo.role === 'superadmin' || userInfo.isManager) && (
                       <Button 
                         variant="danger" 
                         className="fw-bold px-4 rounded-pill" 
                         style={{ background: '#da251d', border: 'none' }}
                         onClick={() => {
                           if (userInfo.isManager) {
                             setShowAdminPanel(true);
                           } else {
                             navigate('/superadmin-login');
                           }
                         }}
                       >
                         <i className="bi bi-shield-lock me-2"></i>Access Admin Panel
                       </Button>
                     )}
                    <Button variant="outline-dark" className="fw-bold px-4 rounded-pill" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>Logout
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>



      <style dangerouslySetInnerHTML={{ __html: `
        .avatar-edit-btn:hover {
          transform: scale(1.1);
          filter: brightness(1.2);
        }
        .letter-spacing-1 { letter-spacing: 1px; }
        .detail-item p { color: #333; }
        .stat-box { transition: all 0.3s ease; }
        .stat-box:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
      `}} />
    </div>
  );
};

export default UserProfile;
