import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import API_BASE from '../config/api';
import { INDIAN_STATES, INDIAN_STATES_CITIES } from '../data/indianStatesAndCities';
import AdAvailabilityCalendar from '../components/AdAvailabilityCalendar';
import AdminDashboard from './superadmin/AdminDashboard';

const allCategories = [
  'Global', 'News', 'Regional', 'Articles', 'Trending', 'OEM', 'Automation',
  'Interview', 'Startup', 'Business', 'Event', 'Tender',
  'Entertainment', 'Sports', 'Education', 'Astrology'
];

/* ─── SLOT CONFIG ─── */
const AD_SLOTS = [
  { id: 'leaderboard', label: 'Header Leaderboard', dim: '728 × 90' },
  { id: 'right-half-page', label: 'Right Sidebar', dim: '300 × 600' },
  { id: 'article-inline', label: 'Article Inline', dim: '728 × 90' },
];

const INDIAN_BANKS = [
  "State Bank of India (SBI)", "HDFC Bank", "ICICI Bank", "Punjab National Bank (PNB)",
  "Axis Bank", "Kotak Mahindra Bank", "Bank of Baroda", "Canara Bank", "Union Bank of India",
  "Bank of India", "IndusInd Bank", "Yes Bank", "IDFC First Bank", "Indian Bank",
  "Central Bank of India", "Indian Overseas Bank", "UCO Bank", "Bank of Maharashtra",
  "Punjab & Sind Bank", "Bandhan Bank", "Federal Bank", "South Indian Bank", "RBL Bank",
  "Standard Chartered Bank", "Citibank", "HSBC"
];

const planLabels = { basic: 'STARTER', standard: 'BUSINESS', premium: 'ENTERPRISE', pro: 'EXECUTIVE' };

const getReporterLevel = (followersCount = 0, thresholds = { silver: 10, gold: 50, diamond: 100 }) => {
  const count = parseInt(followersCount) || 0;
  if (count >= (thresholds.diamond || 100)) return { level: 'Diamond', color: '#38bdf8', icon: 'bi-gem', bg: '#e0f2fe', text: '#0369a1' };
  if (count >= (thresholds.gold || 50)) return { level: 'Gold', color: '#fbbf24', icon: 'bi-trophy-fill', bg: '#fef3c7', text: '#b45309' };
  if (count >= (thresholds.silver || 10)) return { level: 'Silver', color: '#94a3b8', icon: 'bi-award-fill', bg: '#f1f5f9', text: '#475569' };
  return { level: 'Bronze', color: '#cd7f32', icon: 'bi-award', bg: '#ffedd5', text: '#c2410c' };
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('portalMode', 'user');
  }, []);

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
  const [reporterThresholds, setReporterThresholds] = useState({ silver: 10, gold: 50, diamond: 100 });
  const [hoveredDot, setHoveredDot] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);

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

  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get('tab');
    if (urlTab) return urlTab;

    const saved = localStorage.getItem('userInfo');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.role !== 'corporate' && parsed.role !== 'author') {
          return 'profile';
        }
      } catch (e) {
        console.error(e);
      }
    }
    return 'dashboard';
  });

  // Keep activeTab state in sync with URL search params (handling Back/Forward browser buttons)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlTab = params.get('tab');
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [location.search]);
  const [articles, setArticles] = useState([]);
  const [adRequests, setAdRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Ad Request Form
  const [adForm, setAdForm] = useState({
    adTitle: '',
    adDescription: '',
    slot: 'leaderboard',
    link: '',
    imageFile: null,
    targetState: '',
    targetCity: '',
    startDate: '',
    endDate: '',
    durationOption: '1',
    customDays: ''
  });
  const [adFormMsg, setAdFormMsg] = useState({ text: '', type: '' });
  const [submittingAd, setSubmittingAd] = useState(false);
  const [areaPricePerDay, setAreaPricePerDay] = useState(null);
  const [fallbackPricing, setFallbackPricing] = useState(null);
  const [areaPriceLoading, setAreaPriceLoading] = useState(false);

  // Edit Ad Request Modal State
  const [editingAd, setEditingAd] = useState(null);
  const [editAdForm, setEditAdForm] = useState({
    adTitle: '', adDescription: '', slot: 'leaderboard', link: '',
    imageFile: null, imageUrl: '', targetState: '', targetCity: '',
    startDate: '', endDate: ''
  });
  const [editAdMsg, setEditAdMsg] = useState({ text: '', type: '' });
  const [submittingEditAd, setSubmittingEditAd] = useState(false);

  // Promo code states for Ad checkout modal
  const [selectedAdPricing, setSelectedAdPricing] = useState(null);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoDiscountAmount, setPromoDiscountAmount] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim() || !selectedAdPricing) return;
    setValidatingPromo(true);
    setPromoError('');
    const totalAmount = parseFloat(selectedAdPricing.adminTotalAmount || selectedAdPricing.totalAmount);
    try {
      const res = await axios.post(`${API_BASE}/api/promo-codes/validate`, {
        code: promoCodeInput.trim().toUpperCase(),
        platform: 'ad',
        originalAmount: totalAmount
      });
      if (res.data.valid) {
        setAppliedPromo(res.data);
        setPromoDiscountAmount(res.data.discountAmount);
        setPromoError('');
      } else {
        setPromoError(res.data.error || 'Invalid promo code');
        setAppliedPromo(null);
        setPromoDiscountAmount(0);
      }
    } catch (err) {
      setPromoError(err.response?.data?.error || 'Invalid promo code');
      setAppliedPromo(null);
      setPromoDiscountAmount(0);
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoDiscountAmount(0);
    setPromoCodeInput('');
    setPromoError('');
  };

  // Profile pic
  const [uploadingPic, setUploadingPic] = useState(false);

  // Publish form (for reporters/authors/corporates)
  const [articleForm, setArticleForm] = useState({ title: '', content: '', category: 'Articles', image: null, highlights: '', tags: '', videoUrl: '', state: '', city: '' });
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState({ text: '', type: '' });
  const [isListening, setIsListening] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const recognitionRef = React.useRef(null);

  React.useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);


  // Real analytics data from backend
  const [authorStats, setAuthorStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Revenue & Earnings
  const [revenueDashboard, setRevenueDashboard] = useState(null);
  const [revenueHistory, setRevenueHistory] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', paymentMethod: 'bank_transfer', upiId: '', accountNo: '', ifsc: '', accountName: '' });
  const [withdrawMsg, setWithdrawMsg] = useState({ text: '', type: '' });
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [adPricings, setAdPricings] = useState({});

  // Bank & KYC Verification
  const [bankForm, setBankForm] = useState({
    accountName: '',
    accountNo: '',
    confirmAccountNo: '',
    ifsc: '',
    bankName: '',
    passbookFile: null,
    aadharNumber: '',
    aadharFile: null
  });
  const [submittingBank, setSubmittingBank] = useState(false);
  const [bankMsg, setBankMsg] = useState({ text: '', type: '' });
  const [ifscLoading, setIfscLoading] = useState(false);
  const [ifscBranch, setIfscBranch] = useState('');
  const [isEditingBank, setIsEditingBank] = useState(false);

  const handleEditKYC = () => {
    setBankForm({
      accountName: userInfo.bankDetails?.accountName || '',
      accountNo: userInfo.bankDetails?.accountNo || '',
      confirmAccountNo: userInfo.bankDetails?.accountNo || '',
      ifsc: userInfo.bankDetails?.ifsc || '',
      bankName: userInfo.bankDetails?.bankName || '',
      passbookFile: null,
      aadharNumber: userInfo.aadharDetails?.number || '',
      aadharFile: null
    });
    setIfscBranch(userInfo.bankDetails?.branchName || '');
    setIsEditingBank(true);
  };

  useEffect(() => {
    const lookupIFSC = async () => {
      const code = bankForm.ifsc.trim().toUpperCase();
      if (code.length === 11) {
        setIfscLoading(true);
        try {
          const { data } = await axios.get(`https://ifsc.razorpay.com/${code}`);
          if (data) {
            setBankForm(prev => ({
              ...prev,
              bankName: data.BANK || prev.bankName
            }));
            setIfscBranch(`${data.BRANCH || ''}, ${data.CITY || ''} (${data.STATE || ''})`);
          }
        } catch (err) {
          console.error("IFSC lookup failed:", err);
          setIfscBranch('Invalid IFSC code or lookup failed. Please fill manually.');
        } finally {
          setIfscLoading(false);
        }
      } else {
        setIfscBranch('');
      }
    };
    lookupIFSC();
  }, [bankForm.ifsc]);

  useEffect(() => {
    const saved = localStorage.getItem('userInfo');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u.role !== 'author' && u.role !== 'corporate') {
          navigate('/profile', { replace: true });
        } else if (u.role === 'corporate' && !u.membershipPlan) {
          navigate(`/corporate/payment?plan=${u.selectedPlan || 'basic'}`, { replace: true });
        } else {
          setUserInfo(u);
        }
      } catch (e) {
        console.error(e);
        localStorage.removeItem('userInfo');
        navigate('/login');
      }
    }
    else { navigate('/login'); }
  }, [navigate]);

  useEffect(() => {
    if (userInfo?.id) {
      const fetchLatestStats = async () => {
        try {
          const { data } = await axios.get(`${API_BASE}/api/auth/user/${userInfo.id}`);
          if (data.role !== 'author' && data.role !== 'corporate') {
            const updated = { ...userInfo, ...data };
            localStorage.setItem('userInfo', JSON.stringify(updated));
            navigate('/profile', { replace: true });
          } else if (data.role === 'corporate' && !data.membershipPlan) {
            const updated = { ...userInfo, ...data };
            localStorage.setItem('userInfo', JSON.stringify(updated));
            navigate(`/corporate/payment?plan=${data.selectedPlan || 'basic'}`, { replace: true });
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
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/articles?authorId=${userInfo.id}`);
        setArticles(Array.isArray(data) ? data : []);
      } catch (e) { console.error('Failed to fetch articles'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [userInfo?.id]);

  useEffect(() => {
    if ((userInfo?.role === 'corporate' || userInfo?.role === 'author') && userInfo?.token) {
      fetchMyAdRequests();
      fetchAuthorStats();
      fetchRevenueData();
    }
  }, [userInfo?.id, userInfo?.token, userInfo?.role]);

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
      setAdRequests(Array.isArray(data) ? data : []);
    } catch (e) { console.error('Failed to fetch ad requests'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/');
  };

  // ── Revenue Data Fetching ──────────────────────────────────────
  const fetchRevenueData = async () => {
    if (!userInfo?.token) return;
    const authConfig = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    try {
      const [dashRes, histRes, wdRes] = await Promise.all([
        axios.get(`${API_BASE}/api/revenue/dashboard`, authConfig).catch(() => ({ data: null })),
        axios.get(`${API_BASE}/api/revenue/my`, authConfig).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/withdrawals/my`, authConfig).catch(() => ({ data: [] }))
      ]);
      setRevenueDashboard(dashRes.data);
      setRevenueHistory(Array.isArray(histRes.data) ? histRes.data : []);
      setWithdrawals(Array.isArray(wdRes.data) ? wdRes.data : []);
    } catch (e) { console.error('Revenue fetch error:', e); }
  };

  const fetchAdPricing = async (adRequestId) => {
    if (adPricings[adRequestId]) return;
    try {
      const { data } = await axios.get(`${API_BASE}/api/ad-pricing/${adRequestId}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setAdPricings(prev => ({ ...prev, [adRequestId]: data }));
    } catch { /* no pricing yet */ }
  };

  // Load Razorpay Script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleAcceptPrice = async (pricing) => {
    try {
      const res = await loadRazorpayScript();
      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        return;
      }

      // 1. Create order
      const { data: order } = await axios.post(`${API_BASE}/api/ad-pricing/${pricing.id}/create-razorpay-order`, {
        promoCode: appliedPromo?.code || ''
      }, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });

      // 2. Open Razorpay Checkout
      const options = {
        key: 'rzp_live_SwnZMgoy1Uy9zu',
        amount: order.amount,
        currency: order.currency,
        name: 'Industrial Times',
        description: 'Ad Campaign Payment',
        order_id: order.id,
        handler: async function (response) {
          try {
            // 3. Verify payment
            await axios.patch(`${API_BASE}/api/ad-pricing/${pricing.id}/user-accept`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              promoCode: appliedPromo?.code || ''
            }, {
              headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            
            alert('Payment successful and Ad activated!');
            setSelectedAdPricing(null);
            handleRemovePromo();
            fetchRevenueData();
            fetchMyAdRequests();
            setAdPricings({});
          } catch (err) {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: userInfo.name,
          email: userInfo.email
        },
        theme: {
          color: '#DA251D'
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initiate payment');
    }
  };

  const handleRejectPrice = async (pricingId) => {
    try {
      await axios.patch(`${API_BASE}/api/ad-pricing/${pricingId}/user-reject`, {}, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setAdPricings({});
    } catch (err) { alert(err.response?.data?.message || 'Failed to reject price'); }
  };

  const handleWithdrawRequest = async (e) => {
    e.preventDefault();
    setSubmittingWithdraw(true);
    setWithdrawMsg({ text: '', type: '' });
    try {
      const paymentDetails = withdrawForm.paymentMethod === 'upi'
        ? { upiId: withdrawForm.upiId }
        : { accountNo: withdrawForm.accountNo, ifsc: withdrawForm.ifsc, accountName: withdrawForm.accountName };

      const { data } = await axios.post(`${API_BASE}/api/withdrawals/request`, {
        amount: parseFloat(withdrawForm.amount),
        paymentMethod: withdrawForm.paymentMethod,
        paymentDetails
      }, { headers: { Authorization: `Bearer ${userInfo.token}` } });

      setWithdrawMsg({ text: data.message, type: 'success' });
      setWithdrawForm({ amount: '', paymentMethod: 'bank_transfer', upiId: '', accountNo: '', ifsc: '', accountName: '' });
      fetchRevenueData();
    } catch (err) {
      setWithdrawMsg({ text: err.response?.data?.message || 'Withdrawal failed', type: 'danger' });
    } finally { setSubmittingWithdraw(false); }
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
      let videoUrlPath = '';
      if (articleForm.videoFile) {
        const fd = new FormData(); fd.append('image', articleForm.videoFile);
        const upRes = await axios.post(`${API_BASE}/api/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        videoUrlPath = upRes.data.imageUrl;
      }
      const highlightsArray = articleForm.highlights ? articleForm.highlights.split('\n').filter(h => h.trim() !== '') : null;
      const authConfig = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token}` } };

      await axios.post(`${API_BASE}/api/articles`, { 
        title: articleForm.title, 
        content: articleForm.content, 
        category: articleForm.category || 'Articles', 
        author: userInfo.name, 
        image: imageUrl,
        video: videoUrlPath,
        videoUrl: articleForm.videoUrl,
        highlights: highlightsArray,
        tags: articleForm.tags,
        state: articleForm.state,
        city: articleForm.city
      }, authConfig);
      
      setPublishMsg({ text: 'Article published successfully!', type: 'success' });
      setArticleForm({ title: '', content: '', category: 'Articles', image: null, videoFile: null, highlights: '', tags: '', videoUrl: '', state: '', city: '' });
      const fi = document.getElementById('ud-article-image'); if (fi) fi.value = '';
      const fv = document.getElementById('ud-article-video'); if (fv) fv.value = '';
      const { data } = await axios.get(`${API_BASE}/api/articles?authorId=${userInfo.id}`); setArticles(data || []);
    } catch (err) { setPublishMsg({ text: err.response?.data?.message || 'Failed to publish', type: 'danger' }); }
    finally { setPublishing(false); }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition. Please try Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event) => {
        const currentText = event.results[event.results.length - 1][0].transcript;
        setArticleForm(prev => ({
          ...prev,
          content: prev.content ? prev.content + " " + currentText : currentText
        }));
      };

      rec.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          alert("Microphone access was denied. Please allow microphone permissions.");
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    }
  };

  const handleEnhanceContent = async () => {
    if (!articleForm.content.trim()) {
      alert("Please write some content first to enhance it with AI.");
      return;
    }
    setIsEnhancing(true);
    setPublishMsg({ text: '', type: '' });
    try {
      const { data } = await axios.post(
        `${API_BASE}/api/articles/enhance`,
        { content: articleForm.content },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );
      if (data && data.enhancedText) {
        setArticleForm(prev => ({
          ...prev,
          content: data.enhancedText
        }));
      }
    } catch (err) {
      console.error(err);
      setPublishMsg({ text: err.response?.data?.message || 'AI Enhancement failed. Please try again.', type: 'danger' });
    } finally {
      setIsEnhancing(false);
    }
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
      }, { headers: { Authorization: `Bearer ${userInfo.token}` } });

      setUserInfo(updated);
      localStorage.setItem('userInfo', JSON.stringify(updated));
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to upload image';
      alert(errorMsg);
    } finally {
      setUploadingPic(false);
    }
  };

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    setBankMsg({ text: '', type: '' });

    // Validate Account Holder Name
    if (!/^[a-zA-Z\s]{3,50}$/.test(bankForm.accountName.trim())) {
      setBankMsg({ text: 'Account Holder Name must be between 3 and 50 characters and contain only letters.', type: 'danger' });
      return;
    }

    // Validate Account Number
    if (!/^\d{9,18}$/.test(bankForm.accountNo)) {
      setBankMsg({ text: 'Account Number must contain only digits (between 9 and 18 numbers).', type: 'danger' });
      return;
    }

    if (bankForm.accountNo !== bankForm.confirmAccountNo) {
      setBankMsg({ text: 'Account numbers do not match.', type: 'danger' });
      return;
    }

    // Validate IFSC Code
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankForm.ifsc.trim().toUpperCase())) {
      setBankMsg({ text: 'IFSC Code must be in valid format (e.g. SBIN0000291).', type: 'danger' });
      return;
    }

    // Validate Aadhar Number
    if (!/^\d{12}$/.test(bankForm.aadharNumber.trim())) {
      setBankMsg({ text: 'Aadhar Number must be exactly 12 digits.', type: 'danger' });
      return;
    }

    if (bankForm.aadharFile && !bankForm.aadharFile.type.startsWith('image/')) {
      setBankMsg({ text: 'Aadhar card file must be a valid image file (e.g. JPG, PNG).', type: 'danger' });
      return;
    }

    if (bankForm.passbookFile && !bankForm.passbookFile.type.startsWith('image/')) {
      setBankMsg({ text: 'Passbook file must be a valid image file (e.g. JPG, PNG).', type: 'danger' });
      return;
    }

    setSubmittingBank(true);
    try {
      let aadharUrl = userInfo.aadharDetails?.documentUrl || '';
      if (bankForm.aadharFile) {
        const fd = new FormData(); fd.append('image', bankForm.aadharFile);
        const upRes = await axios.post(`${API_BASE}/api/upload?type=aadhar&aadharNumber=${bankForm.aadharNumber.trim()}&accountName=${encodeURIComponent(bankForm.accountName.trim())}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        aadharUrl = upRes.data.imageUrl;
      }

      let passbookUrl = userInfo.bankDetails?.passbookUrl || '';
      if (bankForm.passbookFile) {
        const fd = new FormData(); fd.append('image', bankForm.passbookFile);
        const upRes = await axios.post(`${API_BASE}/api/upload?type=passbook&accountName=${encodeURIComponent(bankForm.accountName.trim())}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        passbookUrl = upRes.data.imageUrl;
      }
      
      const { data } = await axios.put(`${API_BASE}/api/auth/update-bank-details`, {
        bankDetails: {
          accountName: bankForm.accountName.trim(),
          accountNo: bankForm.accountNo,
          ifsc: bankForm.ifsc.trim().toUpperCase(),
          bankName: bankForm.bankName.trim(),
          branchName: ifscBranch || '',
          passbookUrl
        },
        aadharDetails: {
          number: bankForm.aadharNumber.trim(),
          documentUrl: aadharUrl
        }
      }, { headers: { Authorization: `Bearer ${userInfo.token}` } });

      setBankMsg({ text: data.message, type: 'success' });
      const updatedUser = { ...userInfo, ...data.user };
      setUserInfo(updatedUser);
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      setBankForm({ accountName: '', accountNo: '', confirmAccountNo: '', ifsc: '', bankName: '', passbookFile: null, aadharNumber: '', aadharFile: null });
      setIfscBranch('');
      setIsEditingBank(false);
    } catch (err) {
      setBankMsg({ text: err.response?.data?.message || 'Failed to submit details', type: 'danger' });
    } finally {
      setSubmittingBank(false);
    }
  };

  // ── Fetch area pricing when state, city, or slot changes ──────────────
  useEffect(() => {
    const fetchFallbackPricing = async () => {
      try {
        const startDateVal = adForm.startDate || new Date().toISOString().split('T')[0];
        const days = adForm.durationOption === 'custom'
          ? (parseInt(adForm.customDays) || 1)
          : (parseInt(adForm.durationOption) || 1);
        const start = new Date(startDateVal);
        const end = new Date(start.getTime() + (days - 1) * 24 * 60 * 60 * 1000);
        const endDateVal = end.toISOString().split('T')[0];

        const { data } = await axios.post(
          `${API_BASE}/api/ad-pricing/preview`,
          {
            slot: adForm.slot,
            startDate: startDateVal,
            endDate: endDateVal,
            targetState: adForm.targetState,
            targetCity: adForm.targetCity,
            link: adForm.link || ''
          },
          { headers: { Authorization: `Bearer ${userInfo.token}` } }
        );
        setFallbackPricing(data);
      } catch (err) {
        console.error('Fallback pricing failed:', err);
        setFallbackPricing(null);
      }
    };

    const fetchAreaPrice = async () => {
      if (!adForm.targetState || !adForm.slot || !userInfo?.token) {
        setAreaPricePerDay(null);
        setFallbackPricing(null);
        return;
      }
      setAreaPriceLoading(true);
      try {
        const cityParam = adForm.targetCity ? `&city=${encodeURIComponent(adForm.targetCity)}` : '';
        const { data } = await axios.get(
          `${API_BASE}/api/ad-area-pricing/lookup?state=${encodeURIComponent(adForm.targetState)}&slot=${encodeURIComponent(adForm.slot)}${cityParam}`,
          { headers: { Authorization: `Bearer ${userInfo.token}` } }
        );
        if (data && data.pricePerDay) {
          setAreaPricePerDay(data.pricePerDay);
          setFallbackPricing(null);
        } else {
          setAreaPricePerDay(null);
          await fetchFallbackPricing();
        }
      } catch {
        setAreaPricePerDay(null);
        await fetchFallbackPricing();
      } finally {
        setAreaPriceLoading(false);
      }
    };
    fetchAreaPrice();
  }, [adForm.targetState, adForm.targetCity, adForm.slot, adForm.startDate, adForm.durationOption, adForm.customDays, adForm.link, userInfo?.token]);

  // ── Calculate End Date automatically based on Start Date and selected Duration ──
  useEffect(() => {
    if (!adForm.startDate) return;
    const days = adForm.durationOption === 'custom'
      ? (parseInt(adForm.customDays) || 1)
      : (parseInt(adForm.durationOption) || 1);
    
    const start = new Date(adForm.startDate);
    const end = new Date(start.getTime() + (days - 1) * 24 * 60 * 60 * 1000);
    const endDateStr = end.toISOString().split('T')[0];

    if (adForm.endDate !== endDateStr) {
      setAdForm(prev => ({ ...prev, endDate: endDateStr }));
    }
  }, [adForm.startDate, adForm.durationOption, adForm.customDays, adForm.endDate]);

  // Calculate total price from area price and dates
  const getAdDays = () => {
    if (!adForm.startDate || !adForm.endDate) return 0;
    const start = new Date(adForm.startDate);
    const end = new Date(adForm.endDate);
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
  };
  const adDays = getAdDays();
  const adTotalPrice = areaPricePerDay && adDays > 0 ? areaPricePerDay * adDays : null;

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

      const finalBudget = adTotalPrice 
        ? `₹${adTotalPrice.toLocaleString()}` 
        : (fallbackPricing ? `₹${fallbackPricing.totalAmount.toLocaleString()}` : '');

      // 1. Submit request to backend
      const { data } = await axios.post(`${API_BASE}/api/ad-requests`, {
        adTitle: adForm.adTitle,
        adDescription: adForm.adDescription,
        slot: adForm.slot,
        imageUrl,
        link: adForm.link,
        targetState: adForm.targetState,
        targetCity: adForm.targetCity,
        startDate: adForm.startDate,
        endDate: adForm.endDate,
        budget: finalBudget,
        companyName: userInfo.companyName || userInfo.name,
        contactEmail: userInfo.email,
        phone: userInfo.phone || ''
      }, { headers: { Authorization: `Bearer ${userInfo.token}` } });

      const pricing = data.pricing;
      
      const resetForm = () => {
        setAdForm({
          adTitle: '',
          adDescription: '',
          slot: 'leaderboard',
          link: '',
          imageFile: null,
          targetState: '',
          targetCity: '',
          startDate: '',
          endDate: '',
          durationOption: '1',
          customDays: ''
        });
        setAreaPricePerDay(null);
        const fi = document.getElementById('ud-ad-image');
        if (fi) fi.value = '';
        fetchMyAdRequests();
      };

      if (pricing) {
        // Load Razorpay Script
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          setAdFormMsg({ text: '⚠️ Ad request submitted, but Razorpay SDK failed to load. Please complete payment from the history table below.', type: 'warning' });
          resetForm();
          return;
        }

        // Create Razorpay Order
        try {
          const { data: order } = await axios.post(`${API_BASE}/api/ad-pricing/${pricing.id}/create-razorpay-order`, {}, {
            headers: { Authorization: `Bearer ${userInfo.token}` }
          });

          // Open Razorpay Checkout
          const options = {
            key: 'rzp_live_SwnZMgoy1Uy9zu',
            amount: order.amount,
            currency: order.currency,
            name: 'Industrial Times',
            description: 'Ad Campaign Payment',
            order_id: order.id,
            handler: async function (response) {
              try {
                // Verify payment
                await axios.patch(`${API_BASE}/api/ad-pricing/${pricing.id}/user-accept`, {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                }, { headers: { Authorization: `Bearer ${userInfo.token}` } });

                setAdFormMsg({ text: '✅ Ad request submitted and payment verified successfully! Awaiting SuperAdmin approval.', type: 'success' });
                resetForm();
              } catch (err) {
                setAdFormMsg({ text: '❌ Payment verification failed. Please check with your bank or contact support.', type: 'danger' });
                resetForm();
              }
            },
            modal: {
              ondismiss: function () {
                setAdFormMsg({ text: '⚠️ Ad request submitted, but payment was cancelled. You can complete payment from the history table below.', type: 'warning' });
                resetForm();
              }
            },
            prefill: {
              name: userInfo.name,
              email: userInfo.email
            },
            theme: { color: '#DA251D' }
          };

          const paymentObject = new window.Razorpay(options);
          paymentObject.open();

        } catch (err) {
          setAdFormMsg({ text: '⚠️ Ad request submitted, but could not initiate checkout. Please pay from the history table below.', type: 'warning' });
          resetForm();
        }
      } else {
        setAdFormMsg({ text: '✅ Ad request submitted successfully! Awaiting SuperAdmin approval.', type: 'success' });
        resetForm();
      }

    } catch (err) {
      setAdFormMsg({ text: err.response?.data?.message || 'Failed to submit ad request', type: 'danger' });
    } finally {
      setSubmittingAd(false);
    }
  };

  const handleEditAdSubmit = async (e) => {
    e.preventDefault();
    setSubmittingEditAd(true);
    setEditAdMsg({ text: '', type: '' });
    try {
      let imageUrl = editAdForm.imageUrl;
      if (editAdForm.imageFile) {
        const fd = new FormData();
        fd.append('image', editAdForm.imageFile);
        const upRes = await axios.post(`${API_BASE}/api/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        imageUrl = upRes.data.imageUrl;
      }

      await axios.put(`${API_BASE}/api/ad-requests/${editingAd.id}`, {
        adTitle: editAdForm.adTitle,
        adDescription: editAdForm.adDescription,
        link: editAdForm.link,
        imageUrl,
        targetState: editAdForm.targetState,
        targetCity: editAdForm.targetCity,
        startDate: editAdForm.startDate,
        endDate: editAdForm.endDate,
        slot: editAdForm.slot
      }, { headers: { Authorization: `Bearer ${userInfo.token}` } });
      
      setEditAdMsg({ text: 'Ad request updated successfully! Sent for admin review.', type: 'success' });
      fetchMyAdRequests();
      setTimeout(() => setEditingAd(null), 2000);
    } catch (err) {
      setEditAdMsg({ text: err.response?.data?.message || 'Update failed', type: 'danger' });
    } finally {
      setSubmittingEditAd(false);
    }
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

  const roleLabel = isCorporate ? 'Corporate User' : isReporter ? 'Reporter' : 'Reader';
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
    ...(isCorporate || isReporter ? [{ name: 'Revenue & Earnings', id: 'revenue', icon: 'bi-currency-rupee' }] : []),
    { name: 'Profile', id: 'profile', icon: 'bi-person-fill' },
    ...(isCorporate ? [{ name: 'Upgrade Plan', id: 'upgrade', icon: 'bi-arrow-up-circle-fill' }] : []),
  ];

  if (showAdminPanel) {
    return <AdminDashboard isEmbedded={true} onClose={() => setShowAdminPanel(false)} />;
  }

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
            <button 
              key={item.id} 
              className={`ud-nav-item ${activeTab === item.id ? 'active' : ''}`} 
              onClick={() => { 
                navigate('?tab=' + item.id);
                setActiveTab(item.id); 
                setSidebarOpen(false); 
              }}
            >
              <i className={`bi ${item.icon} ud-nav-icon`}></i>
              <span className="ud-nav-label">{item.name}</span>
              {item.id === 'ads' && adRequests.filter(r => r.status === 'approved').length > 0 && (
                <span className="ud-nav-badge">{adRequests.filter(r => r.status === 'approved').length}</span>
              )}
              {item.id === 'profile' && userInfo?.bankVerificationStatus && userInfo.bankVerificationStatus !== 'approved' && (
                <span className="ud-nav-badge" style={{ background: userInfo.bankVerificationStatus === 'rejected' ? '#ef4444' : '#eab308' }}>
                  {userInfo.bankVerificationStatus === 'rejected' ? '!' : '?'}
                </span>
              )}
              {item.id === 'revenue' && (revenueDashboard?.withdrawableBalance >= (revenueDashboard?.minWithdrawalAmount || 5000)) && (
                <span className="ud-nav-badge" style={{ background: '#10b981' }}>₹</span>
              )}
            </button>
          ))}
        </nav>
        <div className="ud-sidebar-bottom">
          {(userInfo?.role === 'superadmin' || userInfo?.isManager) && (
            <button 
              className="ud-view-site-btn" 
              style={{ background: '#da251d', color: '#fff', border: 'none', marginBottom: '8px' }}
              onClick={() => {
                if (userInfo.isManager) {
                  setShowAdminPanel(true);
                } else {
                  navigate('/superadmin-login');
                }
              }}
            >
              <i className="bi bi-shield-lock-fill"></i><span>Admin Panel</span>
            </button>
          )}
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
            <button className="ud-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle Navigation Sidebar">
              <i className={`bi ${sidebarOpen ? 'bi-x' : 'bi-list'}`}></i>
            </button>
            <h1 className="ud-page-title">{menuItems.find(m => m.id === activeTab)?.name || 'Dashboard'}</h1>
          </div>
          <div className="ud-topbar-right">
            <div 
              className="ud-topbar-profile-btn" 
              onClick={() => {
                navigate('?tab=profile');
                setActiveTab('profile');
              }}
              title="View Profile Settings"
            >
              <span className="ud-role-tag" style={{ background: accentColor, margin: 0 }}>{roleLabel}</span>
              <div className="ud-profile-chip" style={{ margin: 0 }}>
                <img src={userInfo.profilePic ? (userInfo.profilePic.startsWith('http') ? userInfo.profilePic : `${API_BASE}${userInfo.profilePic.startsWith('/') ? '' : '/'}${userInfo.profilePic}`) : 'https://via.placeholder.com/40'} alt="" className="ud-profile-avatar" />
                <div className="ud-profile-info">
                  <span className="ud-profile-name">{userInfo.name}</span>
                  <span className="ud-profile-role">{roleLabel} <span className="text-success" style={{ fontSize: '0.6rem' }}>● Active</span></span>
                </div>
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
              {/* KYC / Bank Account Banner Alert */}
              {(() => {
                const status = userInfo.bankVerificationStatus;
                if (status === 'approved') {
                  return (
                    <div className="ud-kyc-banner verified">
                      <div>
                        <div className="ud-kyc-title text-success" style={{ fontWeight: 800 }}><i className="bi bi-shield-check me-2"></i> Bank Profile Verified & Active</div>
                        <div className="ud-kyc-desc">Your KYC documentation is fully approved. Live withdrawable revenue requests are active.</div>
                      </div>
                      <button className="btn btn-sm btn-outline-success rounded-pill fw-bold" onClick={() => setActiveTab('profile')}>View Details</button>
                    </div>
                  );
                } else if (status === 'pending') {
                  return (
                    <div className="ud-kyc-banner">
                      <div>
                        <div className="ud-kyc-title text-warning" style={{ fontWeight: 800 }}><i className="bi bi-hourglass-split me-2"></i> KYC Verification Pending</div>
                        <div className="ud-kyc-desc">Your bank profile details are currently under review by our editorial administration. Payouts will trigger upon approval.</div>
                      </div>
                      <button className="btn btn-sm btn-outline-warning rounded-pill fw-bold" onClick={() => setActiveTab('profile')}>Check Status</button>
                    </div>
                  );
                } else if (status === 'rejected') {
                  return (
                    <div className="ud-kyc-banner rejected">
                      <div>
                        <div className="ud-kyc-title text-danger" style={{ fontWeight: 800 }}><i className="bi bi-exclamation-triangle-fill me-2"></i> Verification Rejected</div>
                        <div className="ud-kyc-desc">Your previous KYC documentation was rejected due to mismatching account info. Please update details to enable withdrawals.</div>
                      </div>
                      <button className="btn btn-sm btn-danger rounded-pill fw-bold" onClick={() => setActiveTab('profile')}>Update Now</button>
                    </div>
                  );
                } else {
                  return (
                    <div className="ud-kyc-banner">
                      <div>
                        <div className="ud-kyc-title text-primary" style={{ fontWeight: 800 }}><i className="bi bi-info-circle-fill me-2"></i> Bank Account Not Verified</div>
                        <div className="ud-kyc-desc">Please complete your bank and Aadhar KYC verification under the Profile tab to request platform earnings withdrawals.</div>
                      </div>
                      <button className="btn btn-sm btn-primary rounded-pill fw-bold" onClick={() => setActiveTab('profile')}>Submit KYC</button>
                    </div>
                  );
                }
              })()}

              {/* KPI Stats Grid */}
              <div className="ud-stats-row">
                <div className="ud-stat-card"><div className="ud-stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><i className="bi bi-file-earmark-text"></i></div><div><div className="ud-stat-value">{myArticles.length}</div><div className="ud-stat-label">Total Articles</div></div></div>
                <div className="ud-stat-card"><div className="ud-stat-icon" style={{ background: '#f0fdf4', color: '#10b981' }}><i className="bi bi-eye"></i></div><div><div className="ud-stat-value">{totalViews.toLocaleString()}</div><div className="ud-stat-label">Total Views</div></div></div>
                <div className="ud-stat-card"><div className="ud-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}><i className="bi bi-people-fill"></i></div><div><div className="ud-stat-value">{userInfo.followersCount || 0}</div><div className="ud-stat-label">Followers</div></div></div>
                <div className="ud-stat-card"><div className="ud-stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}><i className="bi bi-star-fill text-warning"></i></div><div><div className="ud-stat-value">{userInfo.averageRating ? `${userInfo.averageRating.toFixed(1)} / 5` : '0.0 / 5'}</div><div className="ud-stat-label">Rating ({userInfo.ratingsCount || 0})</div></div></div>
                
                {isReporter ? (() => {
                  const lvl = getReporterLevel(userInfo.followersCount, reporterThresholds);
                  return (
                    <div className="ud-stat-card">
                      <div className="ud-stat-icon" style={{ background: lvl.bg, color: lvl.text }}>
                        <i className={`bi ${lvl.icon}`}></i>
                      </div>
                      <div>
                        <div className="ud-stat-value" style={{ fontSize: '1.05rem', letterSpacing: '-0.2px', color: lvl.text, fontWeight: 'bold' }}>
                          {lvl.level} Level
                        </div>
                        <div className="ud-stat-label">Reporter Status</div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="ud-stat-card"><div className="ud-stat-icon" style={{ background: '#faf5ff', color: '#8b5cf6' }}><i className="bi bi-credit-card"></i></div><div><div className="ud-stat-value" style={{ fontSize: '1.05rem', letterSpacing: '-0.2px' }}>{userInfo.membershipPlan ? planLabels[userInfo.membershipPlan] || 'Active' : 'Free'}</div><div className="ud-stat-label">Current Plan</div>{isCorporate && adLimit > 0 && <div style={{ fontSize: '0.65rem', color: '#8b5cf6', fontWeight: 800, marginTop: '4px', background: '#f3e8ff', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>{adLimit - approvedAdsCount} ADS LEFT</div>}</div></div>
                )}

                {/* Additional Aggregated Stat Card: Wallet/Earnings */}
                <div className="ud-stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('revenue')}>
                  <div className="ud-stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}><i className="bi bi-wallet2"></i></div>
                  <div>
                    <div className="ud-stat-value" style={{ color: '#10b981' }}>
                      ₹{(revenueDashboard?.withdrawableBalance || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="ud-stat-label">Withdrawable</div>
                  </div>
                </div>
              </div>

              {/* Aggregated Quick Action shortcuts */}
              <h4 className="ud-action-hub-title"><i className="bi bi-lightning-charge-fill text-warning"></i> Quick Action Hub</h4>
              <div className="ud-action-hub-grid">
                <div className="ud-action-card" style={{ '--action-accent': '#10b981', '--action-bg': '#ecfdf5' }} onClick={() => setActiveTab('publish')}>
                  <div className="ud-action-card-icon"><i className="bi bi-pencil-square"></i></div>
                  <div>
                    <div className="ud-action-card-title">Publish PR & Articles</div>
                    <div className="ud-action-card-desc">Draft and release new industrial news posts.</div>
                  </div>
                </div>
                
                {isCorporate && (
                  <div className="ud-action-card" style={{ '--action-accent': '#8b5cf6', '--action-bg': '#f5f3ff' }} onClick={() => setActiveTab('upload-ad')}>
                    <div className="ud-action-card-icon"><i className="bi bi-megaphone-fill"></i></div>
                    <div>
                      <div className="ud-action-card-title">Launch Banner Ad</div>
                      <div className="ud-action-card-desc">Set target cities and upload graphic assets.</div>
                    </div>
                  </div>
                )}

                <div className="ud-action-card" style={{ '--action-accent': '#3b82f6', '--action-bg': '#eff6ff' }} onClick={() => setActiveTab('revenue')}>
                  <div className="ud-action-card-icon"><i className="bi bi-cash-stack"></i></div>
                  <div>
                    <div className="ud-action-card-title">Payouts & Wallet</div>
                    <div className="ud-action-card-desc">Request direct earnings withdrawal to bank.</div>
                  </div>
                </div>

                <div className="ud-action-card" style={{ '--action-accent': '#eab308', '--action-bg': '#fffbeb' }} onClick={() => setActiveTab('profile')}>
                  <div className="ud-action-card-icon"><i className="bi bi-person-fill-gear"></i></div>
                  <div>
                    <div className="ud-action-card-title">Account Settings</div>
                    <div className="ud-action-card-desc">Manage biography, profile avatar, and bank KYC.</div>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Aggregated Widgets */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '1.5rem' }}>
                
                {/* Left side: Recent Publications */}
                <div className="ud-card" style={{ height: 'fit-content' }}>
                  <div className="ud-card-header"><h3><i className="bi bi-journal-text me-2" style={{ color: accentColor }}></i>Recent Publications</h3></div>
                  <div className="ud-card-body" style={{ padding: '16px' }}>
                    {myArticles.length === 0 ? (
                      <p className="text-muted small" style={{ textAlign: 'center', padding: '2rem' }}>No articles published yet.</p>
                    ) : (
                      <table className="ud-table" style={{ fontSize: '0.82rem' }}>
                        <thead><tr><th>Title</th><th>Category</th><th>Views</th></tr></thead>
                        <tbody>
                          {myArticles.slice(0, 5).map(a => (
                            <tr key={a.id}>
                              <td style={{ fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</td>
                              <td><span className="ud-badge" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>{a.category}</span></td>
                              <td style={{ fontWeight: 800, color: '#3b82f6' }}>{(a.views || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Right side: Active Ad Campaigns */}
                <div className="ud-card" style={{ height: 'fit-content' }}>
                  <div className="ud-card-header"><h3><i className="bi bi-graph-up-arrow me-2" style={{ color: '#8b5cf6' }}></i>Active Ad Campaigns</h3></div>
                  <div className="ud-card-body" style={{ padding: '16px' }}>
                    {adRequests.length === 0 ? (
                      <p className="text-muted small" style={{ textAlign: 'center', padding: '2rem' }}>No active banner ads to display.</p>
                    ) : (
                      <table className="ud-table" style={{ fontSize: '0.82rem' }}>
                        <thead><tr><th>Campaign</th><th>Impressions</th><th>Clicks</th><th>CTR</th></tr></thead>
                        <tbody>
                          {adRequests.slice(0, 5).map(r => {
                            const impressions = r.ad?.impressions || 0;
                            const clicks = r.ad?.clicks || 0;
                            const ctr = impressions > 0 ? `${(clicks / impressions * 100).toFixed(2)}%` : '0.00%';
                            return (
                              <tr key={r.id}>
                                <td style={{ fontWeight: 600, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.adTitle}</td>
                                <td style={{ fontWeight: 700, color: '#4f46e5' }}>{impressions.toLocaleString()}</td>
                                <td style={{ fontWeight: 700, color: '#ea580c' }}>{clicks.toLocaleString()}</td>
                                <td style={{ fontWeight: 800, color: '#059669' }}>{ctr}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Width Widget: Earnings & Payout Summary */}
              <div className="ud-card" style={{ marginTop: '1.5rem' }}>
                <div className="ud-card-header"><h3><i className="bi bi-wallet2 me-2" style={{ color: '#10b981' }}></i>Platform Revenue & Direct Payouts Overview</h3></div>
                <div className="ud-card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Earnings Generated</span>
                      <h3 style={{ margin: '4px 0', fontWeight: 900, color: '#1e293b' }}>₹{(revenueDashboard?.totalRevenue || 0).toLocaleString('en-IN')}</h3>
                      <small style={{ color: '#64748b', fontSize: '0.72rem' }}>Cumulative platform revenue payouts</small>
                    </div>
                     <div style={{ padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                       <div>
                         <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Withdrawable Balance</span>
                         <h3 style={{ margin: '4px 0', fontWeight: 900, color: '#10b981' }}>₹{(revenueDashboard?.withdrawableBalance || 0).toLocaleString('en-IN')}</h3>
                         <small style={{ color: '#15803d', fontSize: '0.72rem', display: 'block' }}>Ready for bank disbursement request</small>
                       </div>
                       {userInfo?.bankVerificationStatus === 'approved' && (revenueDashboard?.withdrawableBalance >= (revenueDashboard?.minWithdrawalAmount || 5000)) && (
                         <button 
                           onClick={() => setActiveTab('revenue')} 
                           className="btn btn-success btn-sm w-100 mt-2 fw-bold" 
                           style={{ fontSize: '0.75rem', padding: '4px 10px', background: '#10b981', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
                         >
                           <i className="bi bi-cash-stack me-1"></i> Withdraw to Bank
                         </button>
                       )}
                     </div>
                     <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                       <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Disbursal Bank Route</span>
                       {userInfo?.bankVerificationStatus === 'approved' && userInfo.bankDetails?.bankName ? (
                         <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <i className="bi bi-bank" style={{ fontSize: '1.25rem', color: '#10b981' }}></i>
                           <div>
                             <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#1e293b' }}>{userInfo.bankDetails.bankName.substring(0, 20)}</div>
                             <div style={{ fontSize: '0.7rem', color: '#64748b' }}>A/c: ****{userInfo.bankDetails.accountNo ? userInfo.bankDetails.accountNo.slice(-4) : ''}</div>
                           </div>
                         </div>
                       ) : userInfo?.bankVerificationStatus === 'pending' ? (
                         <div style={{ marginTop: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#eab308' }}>
                           <i className="bi bi-hourglass-split me-1"></i> Verification Pending
                         </div>
                       ) : userInfo?.bankVerificationStatus === 'rejected' ? (
                         <div style={{ marginTop: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#dc2626' }}>
                           <i className="bi bi-exclamation-triangle me-1"></i> Verification Rejected
                         </div>
                       ) : (
                         <div style={{ marginTop: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                           <i className="bi bi-x-circle me-1"></i> No bank details linked
                         </div>
                       )}
                     </div>
                  </div>
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
                    <div className="ud-stat-card"><div className="ud-stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><i className="bi bi-eye"></i></div><div><div className="ud-stat-value">{(authorStats.totalViews || 0).toLocaleString()}</div><div className="ud-stat-label">Total Views</div></div></div>
                    <div className="ud-stat-card"><div className="ud-stat-icon" style={{ background: '#fef2f2', color: '#ef4444' }}><i className="bi bi-heart-fill"></i></div><div><div className="ud-stat-value">{(authorStats.totalLikes || 0).toLocaleString()}</div><div className="ud-stat-label">Total Likes</div></div></div>
                    <div className="ud-stat-card"><div className="ud-stat-icon" style={{ background: '#f0fdf4', color: '#10b981' }}><i className="bi bi-chat-dots-fill"></i></div><div><div className="ud-stat-value">{(authorStats.totalComments || 0).toLocaleString()}</div><div className="ud-stat-label">Total Comments</div></div></div>
                    <div className="ud-stat-card"><div className="ud-stat-icon" style={{ background: '#fffbeb', color: '#eab308' }}><i className="bi bi-bar-chart-fill"></i></div><div><div className="ud-stat-value">{(authorStats.avgViewsPerArticle || 0).toLocaleString()}</div><div className="ud-stat-label">Avg Views / Article</div></div></div>
                    <div className="ud-stat-card"><div className="ud-stat-icon" style={{ background: '#faf5ff', color: '#8b5cf6' }}><i className="bi bi-lightning-fill"></i></div><div><div className="ud-stat-value">{authorStats.engagementRate || '0.0'}%</div><div className="ud-stat-label">Engagement Rate</div></div></div>
                    <div className="ud-stat-card"><div className="ud-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}><i className="bi bi-clock-history"></i></div><div><div className="ud-stat-value">{authorStats.recentArticles || 0}</div><div className="ud-stat-label">Published This Week</div><div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '2px' }}>{(authorStats.recentViews || 0).toLocaleString()} views</div></div></div>
                  </div>

                  {/* ═════════ PREMIUM SVG GRAPHICS BLOCK ═════════ */}
                  <div className="ud-charts-layout">
                    {/* SVG Chart 1: Article Performance Curve */}
                    <div className="ud-chart-box">
                      <div className="ud-chart-header">
                        <h4 className="ud-chart-title"><i className="bi bi-graph-up text-emerald-500" style={{ color: '#10b981' }}></i> View Analytics Trend</h4>
                        <div className="ud-chart-legend">
                          <div className="ud-chart-legend-item"><span className="ud-chart-legend-color" style={{ background: '#10b981' }}></span>Views</div>
                        </div>
                      </div>

                      <div className="ud-chart-container">
                        {/* Tooltip Popup */}
                        {hoveredDot && (
                          <div className="ud-chart-tooltip" style={{ left: hoveredDot.x + 10, top: hoveredDot.y - 45, opacity: 1 }}>
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{hoveredDot.month}</div>
                            <div style={{ marginTop: '2px' }}><i className="bi bi-eye-fill text-success me-1"></i> {hoveredDot.views.toLocaleString()} views</div>
                            <div><i className="bi bi-file-earmark-text-fill text-primary me-1"></i> {hoveredDot.count} published</div>
                          </div>
                        )}

                        {(() => {
                          const displayTrend = Object.entries(authorStats.monthlyTrend || {}).length > 0
                            ? Object.entries(authorStats.monthlyTrend)
                            : [
                                ["2026-01", { count: 1, views: 1200 }],
                                ["2026-02", { count: 3, views: 2400 }],
                                ["2026-03", { count: 2, views: 1800 }],
                                ["2026-04", { count: 4, views: 3500 }],
                                ["2026-05", { count: 5, views: 4200 }],
                                ["2026-06", { count: 3, views: 2800 }]
                              ];

                          const maxViews = Math.max(100, ...displayTrend.map(([, d]) => d.views));
                          const stepX = 420 / Math.max(1, displayTrend.length - 1);

                          // Calculate coordinates
                          const points = displayTrend.map(([month, d], i) => {
                            const x = 40 + i * stepX;
                            const y = 160 - (d.views / maxViews * 120);
                            return { x, y, month, ...d };
                          });

                          // Generate Line Path
                          const lineD = points.reduce((path, p, i) => path + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), "");
                          // Generate Area Path
                          const areaD = lineD ? `${lineD} L ${points[points.length - 1].x} 160 L 40 160 Z` : "";

                          return (
                            <svg className="ud-chart-svg" viewBox="0 0 500 180">
                              <defs>
                                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>
                              
                              {/* Horizontal Gridlines */}
                              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                                const yVal = 160 - ratio * 120;
                                return (
                                  <line key={index} x1="40" y1={yVal} x2="460" y2={yVal} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                                );
                              })}

                              {/* Filled Gradient Area */}
                              {areaD && <path d={areaD} fill="url(#areaGrad)" />}

                              {/* Main Line Stroke */}
                              {lineD && <path className="ud-chart-path" d={lineD} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />}

                              {/* Axis Labels */}
                              {points.map((p, i) => {
                                const labelMonth = new Date(p.month + '-01').toLocaleDateString('en-IN', { month: 'short' });
                                return (
                                  <text key={i} x={p.x} y="175" fill="#94a3b8" fontSize="9" fontWeight="700" textAnchor="middle">{labelMonth}</text>
                                );
                              })}

                              {/* Interactive Dot Markers */}
                              {points.map((p, i) => (
                                <circle 
                                  key={i} 
                                  cx={p.x} 
                                  cy={p.y} 
                                  r="4" 
                                  fill="#10b981" 
                                  stroke="#ffffff" 
                                  strokeWidth="2" 
                                  className="ud-chart-dot"
                                  onMouseEnter={() => setHoveredDot(p)}
                                  onMouseLeave={() => setHoveredDot(null)}
                                />
                              ))}
                            </svg>
                          );
                        })()}
                      </div>
                    </div>

                    {/* SVG Chart 2: Ad Campaigns impressions and clicks */}
                    <div className="ud-chart-box">
                      <div className="ud-chart-header">
                        <h4 className="ud-chart-title"><i className="bi bi-megaphone text-indigo-500" style={{ color: '#6366f1' }}></i> Ads Performance Geo-Metrics</h4>
                        <div className="ud-chart-legend">
                          <div className="ud-chart-legend-item"><span className="ud-chart-legend-color" style={{ background: '#4f46e5' }}></span>Views</div>
                          <div className="ud-chart-legend-item"><span className="ud-chart-legend-color" style={{ background: '#f97316' }}></span>Clicks</div>
                        </div>
                      </div>

                      <div className="ud-chart-container">
                        {hoveredBar && (
                          <div className="ud-chart-tooltip" style={{ left: hoveredBar.x + 10, top: hoveredBar.y - 45, opacity: 1 }}>
                            <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.78rem' }}>{hoveredBar.title}</div>
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', margin: '2px 0' }}>Slot: {hoveredBar.slot}</div>
                            <div><i className="bi bi-eye-fill text-primary me-1"></i> {hoveredBar.impressions.toLocaleString()} views</div>
                            <div><i className="bi bi-cursor-fill text-warning me-1"></i> {hoveredBar.clicks.toLocaleString()} clicks</div>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '4px', paddingTop: '4px', color: '#10b981' }}>CTR: {hoveredBar.ctr}</div>
                          </div>
                        )}

                        {(() => {
                          const activeCampaigns = adRequests.filter(r => r.ad || r.status === 'paid');
                          const displayAds = activeCampaigns.length > 0 ? activeCampaigns : [
                            { id: '1', adTitle: 'ITN Corporate Ads', ad: { impressions: 4800, clicks: 310 }, slot: 'leaderboard' },
                            { id: '2', adTitle: 'OEM Manufacturing PR', ad: { impressions: 6400, clicks: 420 }, slot: 'right-half-page' },
                            { id: '3', adTitle: 'Automation Summit', ad: { impressions: 2200, clicks: 190 }, slot: 'article-inline' }
                          ];

                          const maxImp = Math.max(100, ...displayAds.map(a => a.ad?.impressions || 0));
                          const stepX = 400 / Math.max(1, displayAds.length);

                          return (
                            <svg className="ud-chart-svg" viewBox="0 0 500 180">
                              {/* Grid lines */}
                              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                                const yVal = 160 - ratio * 120;
                                return (
                                  <line key={index} x1="40" y1={yVal} x2="460" y2={yVal} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                                );
                              })}

                              {displayAds.map((a, i) => {
                                const imps = a.ad?.impressions || 0;
                                const clicks = a.ad?.clicks || 0;
                                const ctr = imps > 0 ? `${(clicks / imps * 100).toFixed(2)}%` : '0.00%';

                                const xCenter = 40 + i * stepX + stepX / 2;
                                const impHeight = Math.max(4, (imps / maxImp) * 110);
                                const clickHeight = Math.max(4, (clicks / maxImp) * 110);

                                const barWidth = 14;

                                const itemData = {
                                  x: xCenter,
                                  y: 160 - impHeight,
                                  title: a.adTitle,
                                  slot: a.slot,
                                  impressions: imps,
                                  clicks: clicks,
                                  ctr
                                };

                                return (
                                  <g key={a.id || i} style={{ cursor: 'pointer' }}
                                     onMouseEnter={() => setHoveredBar(itemData)}
                                     onMouseLeave={() => setHoveredBar(null)}>
                                    
                                    {/* Impressions Bar */}
                                    <rect 
                                      x={xCenter - barWidth - 2} 
                                      y={160 - impHeight} 
                                      width={barWidth} 
                                      height={impHeight} 
                                      fill="#4f46e5" 
                                      rx="3" 
                                      className="ud-chart-bar" 
                                    />
                                    
                                    {/* Clicks Bar */}
                                    <rect 
                                      x={xCenter + 2} 
                                      y={160 - clickHeight} 
                                      width={barWidth} 
                                      height={clickHeight} 
                                      fill="#f97316" 
                                      rx="3" 
                                      className="ud-chart-bar" 
                                    />

                                    {/* CTR floating text */}
                                    <text 
                                      x={xCenter} 
                                      y={Math.min(150 - impHeight - 8, 140)} 
                                      fill="#059669" 
                                      fontSize="8" 
                                      fontWeight="800" 
                                      textAnchor="middle"
                                    >
                                      {ctr}
                                    </text>

                                    {/* X Axis Labels */}
                                    <text 
                                      x={xCenter} 
                                      y="174" 
                                      fill="#94a3b8" 
                                      fontSize="8" 
                                      fontWeight="800" 
                                      textAnchor="middle"
                                      style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                    >
                                      {a.adTitle.substring(0, 10)}..
                                    </text>
                                  </g>
                                );
                              })}
                            </svg>
                          );
                        })()}
                      </div>
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
                    <div className="ud-form-field"><label>Featured Image</label><input type="file" id="ud-article-image" accept="image/*" onChange={e => setArticleForm({ ...articleForm, image: e.target.files[0] || null })} /></div>
                    <div className="ud-form-field"><label>Video File (Optional Upload)</label><input type="file" id="ud-article-video" accept="video/*" onChange={e => setArticleForm({ ...articleForm, videoFile: e.target.files[0] || null })} /></div>
                  </div>
                  <div className="ud-form-grid">
                    <div className="ud-form-field">
                      <label>State (Optional)</label>
                      <select value={articleForm.state} onChange={e => setArticleForm({ ...articleForm, state: e.target.value })}>
                        <option value="">— Select State —</option>
                        {INDIAN_STATES.map(st => (<option key={st} value={st}>{st}</option>))}
                      </select>
                    </div>
                    <div className="ud-form-field">
                      <label>City (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="Enter City / Area..." 
                        value={articleForm.city} 
                        onChange={e => setArticleForm({ ...articleForm, city: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div className="ud-form-field">
                    <label>Video Link / Embed URL (YouTube, Vimeo, etc.)</label>
                    <input type="url" placeholder="Paste YouTube, Facebook, Instagram, or video link here..." value={articleForm.videoUrl || ''} onChange={e => setArticleForm({ ...articleForm, videoUrl: e.target.value })} />
                  </div>
                  <div className="ud-form-field">
                    <label>Industry Highlights / Important Points</label>
                    <textarea rows={3} placeholder="Enter key points (one per line)..." value={articleForm.highlights} onChange={e => setArticleForm({ ...articleForm, highlights: e.target.value })} />
                    <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                      <i className="bi bi-info-circle me-1 text-primary"></i> Any links in key highlights will automatically be converted into clickable links on the website.
                    </small>
                  </div>
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
                  <div className="ud-form-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <label style={{ margin: 0 }}>Article Content *</label>
                      <div className="ai-toolbar" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={handleVoiceInput}
                          className={`ai-toolbar-btn voice-btn ${isListening ? 'listening' : ''}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            border: '1px solid #e2e8f0',
                            background: isListening ? '#fef2f2' : '#ffffff',
                            color: isListening ? '#ef4444' : '#64748b',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            outline: 'none'
                          }}
                          title={isListening ? "Listening... Click to stop" : "Start Voice Dictation"}
                        >
                          <i className={`bi ${isListening ? 'bi-mic-fill' : 'bi-mic'} ${isListening ? 'pulse-anim' : ''}`} style={{ color: isListening ? '#ef4444' : 'inherit' }}></i>
                          {isListening ? 'Listening...' : 'Voice Dictate'}
                        </button>
                        <button
                          type="button"
                          onClick={handleEnhanceContent}
                          disabled={isEnhancing}
                          className={`ai-toolbar-btn enhance-btn ${isEnhancing ? 'enhancing' : ''}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            border: '1px solid #e9d5ff',
                            background: isEnhancing ? '#f3e8ff' : 'linear-gradient(135deg, #f5f3ff 0%, #edd8fc 100%)',
                            color: '#7c3aed',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            outline: 'none'
                          }}
                          title="Improve writing structure & grammar using AI"
                        >
                          <i className={`bi ${isEnhancing ? 'bi-arrow-repeat' : 'bi-magic'} ${isEnhancing ? 'spin-anim' : ''}`}></i>
                          {isEnhancing ? 'Enhancing...' : 'AI Enhance'}
                        </button>
                      </div>
                    </div>
                    <textarea rows={10} placeholder="Write your article content here..." value={articleForm.content} onChange={e => setArticleForm({ ...articleForm, content: e.target.value })} required />
                    <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                      <i className="bi bi-info-circle me-1 text-primary"></i> Any website links (e.g. Website: https://..., Instagram: https://...) included in the body will automatically become clickable links on the website.
                    </small>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" className="ud-submit-btn" disabled={publishing} style={{ background: accentColor }}>
                      <i className="bi bi-send-fill me-2"></i>{publishing ? 'Publishing...' : 'Publish Article'}
                    </button>
                    <button type="button" className="ud-submit-btn" style={{ background: '#6b7280' }} onClick={() => setArticleForm({ title: '', content: '', category: 'Articles', image: null, highlights: '', tags: '', videoUrl: '', state: '', city: '' })}>Clear</button>
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

                      <div className="ud-form-grid" style={{ gridTemplateColumns: adForm.durationOption === 'custom' ? '1fr 1fr 1fr' : '1fr 1fr', gap: '1rem' }}>
                        <div className="ud-form-field">
                          <label>Start Date <span style={{ color: '#ef4444' }}>*</span></label>
                          <input type="date" value={adForm.startDate} onChange={e => setAdForm({ ...adForm, startDate: e.target.value })} required />
                        </div>
                        <div className="ud-form-field">
                          <label>Duration <span style={{ color: '#ef4444' }}>*</span></label>
                          <select value={adForm.durationOption} onChange={e => setAdForm({ ...adForm, durationOption: e.target.value })}>
                            <option value="1">1 Day</option>
                            <option value="3">3 Days</option>
                            <option value="7">7 Days</option>
                            <option value="15">15 Days</option>
                            <option value="30">30 Days</option>
                            <option value="custom">Custom...</option>
                          </select>
                        </div>
                        {adForm.durationOption === 'custom' && (
                          <div className="ud-form-field">
                            <label>Custom Days <span style={{ color: '#ef4444' }}>*</span></label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="e.g. 5"
                              value={adForm.customDays}
                              onChange={e => setAdForm({ ...adForm, customDays: e.target.value })}
                              required
                            />
                          </div>
                        )}
                      </div>

                      {adForm.startDate && adForm.endDate && (
                        <div style={{ margin: '-0.5rem 0 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#4b5563' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '6px', background: '#f3f4f6', border: '1px solid #e5e7eb' }}>
                            <i className="bi bi-clock me-1"></i> Campaign Ends On: <strong>{new Date(adForm.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                          </span>
                        </div>
                      )}

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
                              onSelectDate={(dateStr) => setAdForm({ ...adForm, startDate: dateStr, hideCalendar: true })}
                            />
                          </div>
                        </div>
                      )}

                      <div className="ud-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                        <div className="ud-form-field"><label>Click-Through URL</label><input type="url" placeholder="https://yourcompany.com" value={adForm.link} onChange={e => setAdForm({ ...adForm, link: e.target.value })} /></div>
                      </div>

                      {/* Auto Pricing Display */}
                      {adForm.targetState && (
                        <div style={{
                          background: (areaPricePerDay || fallbackPricing) ? 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)' : '#fefce8',
                          border: `1.5px solid ${(areaPricePerDay || fallbackPricing) ? '#bbf7d0' : '#fef08a'}`,
                          borderRadius: '14px', padding: '1rem 1.2rem', marginBottom: '1rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <i className={`bi ${(areaPricePerDay || fallbackPricing) ? 'bi-check-circle-fill' : 'bi-info-circle-fill'}`} style={{ color: (areaPricePerDay || fallbackPricing) ? '#10b981' : '#eab308', fontSize: '1.1rem' }}></i>
                            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1f2937' }}>Ad Pricing</span>
                          </div>
                          {areaPriceLoading ? (
                            <div style={{ color: '#6b7280', fontSize: '0.82rem' }}>Loading pricing...</div>
                          ) : areaPricePerDay ? (
                            <div>
                              <div style={{ fontSize: '0.82rem', color: '#374151', fontWeight: 600, marginBottom: '4px' }}>
                                Rate: <span style={{ fontWeight: 800, color: '#059669' }}>₹{areaPricePerDay.toLocaleString()}</span> / day for {adForm.targetState} — {AD_SLOTS.find(s => s.id === adForm.slot)?.label || adForm.slot}
                              </div>
                              {adDays > 0 && adTotalPrice && (() => {
                                const baseAmount = adTotalPrice;
                                const gstAmount = Math.round(baseAmount * 0.18);
                                const totalWithGst = baseAmount + gstAmount;
                                return (
                                  <div style={{
                                    background: '#fff', borderRadius: '10px', padding: '12px 14px',
                                    border: '1px solid #d1fae5', marginTop: '8px'
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#4b5563', marginBottom: '4px' }}>
                                      <span>Base Price ({adDays} day{adDays > 1 ? 's' : ''}):</span>
                                      <span style={{ fontWeight: 700 }}>₹{baseAmount.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#4b5563', marginBottom: '8px', borderBottom: '1px dashed #e5e7eb', paddingBottom: '6px' }}>
                                      <span>GST (18%):</span>
                                      <span style={{ fontWeight: 700 }}>₹{gstAmount.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1f2937' }}>Total Cost (incl. GST):</span>
                                      <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#059669' }}>
                                        ₹{totalWithGst.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : fallbackPricing ? (
                            <div>
                              <div style={{ fontSize: '0.82rem', color: '#374151', fontWeight: 600, marginBottom: '4px' }}>
                                Rate: <span style={{ fontWeight: 800, color: '#059669' }}>₹{(fallbackPricing.factors?.slotPlacement?.baseRatePerDay || 0).toLocaleString()}</span> / day (Suggested Base) — {AD_SLOTS.find(s => s.id === adForm.slot)?.label || adForm.slot}
                              </div>
                              <div style={{
                                background: '#fff', borderRadius: '10px', padding: '12px 14px',
                                border: '1px solid #d1fae5', marginTop: '8px'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#4b5563', marginBottom: '4px' }}>
                                  <span>Base Price ({adDays} day{adDays > 1 ? 's' : ''}):</span>
                                  <span style={{ fontWeight: 700 }}>₹{fallbackPricing.baseAmount.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#4b5563', marginBottom: '8px', borderBottom: '1px dashed #e5e7eb', paddingBottom: '6px' }}>
                                  <span>GST (18%):</span>
                                  <span style={{ fontWeight: 700 }}>₹{fallbackPricing.gstAmount.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1f2937' }}>Total Cost (incl. GST):</span>
                                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#059669' }}>
                                    ₹{fallbackPricing.totalAmount.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.82rem', color: '#92400e', fontWeight: 600 }}>
                              <i className="bi bi-exclamation-triangle me-1"></i>
                              No pricing configured for {adForm.targetState}. Please contact admin.
                            </div>
                          )}
                        </div>
                      )}

                      <div className="ud-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                        <div className="ud-form-field"><label>Ad Banner Image *</label><input type="file" id="ud-ad-image" accept="image/*" onChange={e => setAdForm({ ...adForm, imageFile: e.target.files[0] || null })} required /></div>
                      </div>
                      <button type="submit" className="ud-submit-btn" disabled={submittingAd} style={{ background: accentColor }}>
                        <i className="bi bi-send-fill me-2"></i>{submittingAd ? 'Submitting...' : (areaPricePerDay ? 'Pay & Submit Ad for Approval' : 'Submit Ad for Approval')}
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
                      <thead>
                        <tr>
                          <th>Ad Title</th>
                          <th>Location</th>
                          <th>Dates</th>
                          <th>Status</th>
                          <th>Pricing / Actions</th>
                          <th>Admin Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adRequests.map(r => (
                          <tr key={r.id}>
                            <td style={{ fontWeight: 600 }}>{r.adTitle}</td>
                            <td style={{ fontSize: '0.8rem' }}>{r.targetCity ? `${r.targetCity}, ${r.targetState}` : r.targetState || '—'}</td>
                            <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>{r.startDate || '—'} → {r.endDate || '—'}</td>
                            <td>
                              <span className={`ud-status-badge ${r.status}`}>
                                {r.status === 'pending' ? 'Waiting for Approval (24hr)' : (r.status === 'approved' ? 'approved (unpaid)' : r.status.toUpperCase())}
                              </span>
                            </td>
                            <td>
                              {r.status === 'approved' && r.pricing?.status === 'admin_confirmed' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#059669' }}>
                                    Quote: ₹{parseFloat(r.pricing.adminTotalAmount || r.pricing.totalAmount).toLocaleString()}
                                  </span>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                      onClick={() => { setSelectedAdPricing(r.pricing); handleRemovePromo(); }}
                                      style={{
                                        padding: '4px 10px', borderRadius: '6px', border: 'none',
                                        background: '#10b981', color: '#fff', fontSize: '0.72rem',
                                        fontWeight: 700, cursor: 'pointer'
                                      }}
                                    >
                                      Pay Now
                                    </button>
                                    <button
                                      onClick={() => handleRejectPrice(r.pricing.id)}
                                      style={{
                                        padding: '4px 10px', borderRadius: '6px', border: '1px solid #e5e7eb',
                                        background: '#fff', color: '#6b7280', fontSize: '0.72rem',
                                        fontWeight: 700, cursor: 'pointer'
                                      }}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              ) : r.status === 'paid' ? (
                                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#059669' }}>
                                  Paid: ₹{parseFloat(r.pricing?.adminTotalAmount || r.pricing?.totalAmount || 0).toLocaleString()}
                                </span>
                              ) : r.pricing ? (
                                <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>
                                  Est: ₹{parseFloat(r.pricing.totalAmount).toLocaleString()}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
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

                    <div className="ud-form-grid" style={{ gridTemplateColumns: adForm.durationOption === 'custom' ? '1fr 1fr 1fr' : '1fr 1fr', gap: '1rem' }}>
                      <div className="ud-form-field">
                        <label>Start Date <span style={{ color: '#ef4444' }}>*</span></label>
                        <input type="date" value={adForm.startDate} onChange={e => setAdForm({ ...adForm, startDate: e.target.value })} required />
                      </div>
                      <div className="ud-form-field">
                        <label>Duration <span style={{ color: '#ef4444' }}>*</span></label>
                        <select value={adForm.durationOption} onChange={e => setAdForm({ ...adForm, durationOption: e.target.value })}>
                          <option value="1">1 Day</option>
                          <option value="3">3 Days</option>
                          <option value="7">7 Days</option>
                          <option value="15">15 Days</option>
                          <option value="30">30 Days</option>
                          <option value="custom">Custom...</option>
                        </select>
                      </div>
                      {adForm.durationOption === 'custom' && (
                        <div className="ud-form-field">
                          <label>Custom Days <span style={{ color: '#ef4444' }}>*</span></label>
                          <input
                            type="number"
                            min="1"
                             step="1"
                            placeholder="e.g. 5"
                            value={adForm.customDays}
                            onChange={e => setAdForm({ ...adForm, customDays: e.target.value })}
                            required
                          />
                        </div>
                      )}
                    </div>

                    {adForm.startDate && adForm.endDate && (
                      <div style={{ margin: '-0.5rem 0 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#4b5563' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', background: '#f3f4f6', border: '1px solid #e5e7eb' }}>
                          <i className="bi bi-clock me-1"></i> Campaign Ends On: <strong>{new Date(adForm.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                        </span>
                      </div>
                    )}

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
                            onSelectDate={(dateStr) => setAdForm({ ...adForm, startDate: dateStr, hideCalendar: true })}
                          />
                        </div>
                      </div>
                    )}

                    <div className="ud-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                      <div className="ud-form-field"><label>Click-Through URL</label><input type="url" placeholder="https://yourcompany.com" value={adForm.link} onChange={e => setAdForm({ ...adForm, link: e.target.value })} /></div>
                    </div>

                    {/* Auto Pricing Display */}
                    {adForm.targetState && (
                      <div style={{
                        background: (areaPricePerDay || fallbackPricing) ? 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)' : '#fefce8',
                        border: `1.5px solid ${(areaPricePerDay || fallbackPricing) ? '#bbf7d0' : '#fef08a'}`,
                        borderRadius: '14px', padding: '1rem 1.2rem', marginBottom: '1rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <i className={`bi ${(areaPricePerDay || fallbackPricing) ? 'bi-check-circle-fill' : 'bi-info-circle-fill'}`} style={{ color: (areaPricePerDay || fallbackPricing) ? '#10b981' : '#eab308', fontSize: '1.1rem' }}></i>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1f2937' }}>Ad Pricing</span>
                        </div>
                        {areaPriceLoading ? (
                          <div style={{ color: '#6b7280', fontSize: '0.82rem' }}>Loading pricing...</div>
                        ) : areaPricePerDay ? (
                          <div>
                            <div style={{ fontSize: '0.82rem', color: '#374151', fontWeight: 600, marginBottom: '4px' }}>
                              Rate: <span style={{ fontWeight: 800, color: '#059669' }}>₹{areaPricePerDay.toLocaleString()}</span> / day for {adForm.targetState} — {AD_SLOTS.find(s => s.id === adForm.slot)?.label || adForm.slot}
                            </div>
                            {adDays > 0 && adTotalPrice && (() => {
                              const baseAmount = adTotalPrice;
                              const gstAmount = Math.round(baseAmount * 0.18);
                              const totalWithGst = baseAmount + gstAmount;
                              return (
                                <div style={{
                                  background: '#fff', borderRadius: '10px', padding: '12px 14px',
                                  border: '1px solid #d1fae5', marginTop: '8px'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#4b5563', marginBottom: '4px' }}>
                                    <span>Base Price ({adDays} day{adDays > 1 ? 's' : ''}):</span>
                                    <span style={{ fontWeight: 700 }}>₹{baseAmount.toLocaleString()}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#4b5563', marginBottom: '8px', borderBottom: '1px dashed #e5e7eb', paddingBottom: '6px' }}>
                                    <span>GST (18%):</span>
                                    <span style={{ fontWeight: 700 }}>₹{gstAmount.toLocaleString()}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1f2937' }}>Total Cost (incl. GST):</span>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#059669' }}>
                                      ₹{totalWithGst.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ) : fallbackPricing ? (
                          <div>
                            <div style={{ fontSize: '0.82rem', color: '#374151', fontWeight: 600, marginBottom: '4px' }}>
                              Rate: <span style={{ fontWeight: 800, color: '#059669' }}>₹{(fallbackPricing.factors?.slotPlacement?.baseRatePerDay || 0).toLocaleString()}</span> / day (Suggested Base) — {AD_SLOTS.find(s => s.id === adForm.slot)?.label || adForm.slot}
                            </div>
                            <div style={{
                              background: '#fff', borderRadius: '10px', padding: '12px 14px',
                              border: '1px solid #d1fae5', marginTop: '8px'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#4b5563', marginBottom: '4px' }}>
                                <span>Base Price ({adDays} day{adDays > 1 ? 's' : ''}):</span>
                                <span style={{ fontWeight: 700 }}>₹{fallbackPricing.baseAmount.toLocaleString()}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#4b5563', marginBottom: '8px', borderBottom: '1px dashed #e5e7eb', paddingBottom: '6px' }}>
                                <span>GST (18%):</span>
                                <span style={{ fontWeight: 700 }}>₹{fallbackPricing.gstAmount.toLocaleString()}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1f2937' }}>Total Cost (incl. GST):</span>
                                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#059669' }}>
                                  ₹{fallbackPricing.totalAmount.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.82rem', color: '#92400e', fontWeight: 600 }}>
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            No pricing configured for {adForm.targetState}. Please contact admin.
                          </div>
                        )}
                      </div>
                    )}

                    <div className="ud-form-grid">
                      <div className="ud-form-field"><label>Ad Banner Image *</label><input type="file" id="ud-ad-image" accept="image/*" onChange={e => setAdForm({ ...adForm, imageFile: e.target.files[0] || null })} required /></div>
                    </div>
                    <button type="submit" className="ud-submit-btn" disabled={submittingAd} style={{ background: accentColor }}>
                      <i className="bi bi-send-fill me-2"></i>{submittingAd ? 'Submitting...' : (areaPricePerDay ? 'Pay & Submit Ad Request' : 'Submit Ad Request for Approval')}
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
                      <thead>
                        <tr>
                          <th>Ad Title</th>
                          <th>Slot</th>
                          <th>Location</th>
                          <th>Dates</th>
                          <th>Status</th>
                          <th>Pricing / Actions</th>
                          <th>Admin Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adRequests.map(r => (
                          <tr key={r.id}>
                            <td style={{ fontWeight: 600 }}>{r.adTitle}</td>
                            <td>{AD_SLOTS.find(s => s.id === r.slot)?.label || r.slot}</td>
                            <td style={{ fontSize: '0.8rem' }}>{r.targetCity ? `${r.targetCity}, ${r.targetState}` : r.targetState || '—'}</td>
                            <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>{r.startDate || '—'} → {r.endDate || '—'}</td>
                            <td>
                              <span className={`ud-status-badge ${r.status}`}>
                                {r.status === 'pending' ? 'Waiting for Approval (24hr)' : (r.status === 'approved' ? 'approved (unpaid)' : r.status.toUpperCase())}
                              </span>
                            </td>
                            <td>
                              {r.status === 'approved' && r.pricing?.status === 'admin_confirmed' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#059669' }}>
                                    Quote: ₹{parseFloat(r.pricing.adminTotalAmount || r.pricing.totalAmount).toLocaleString()}
                                  </span>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                      onClick={() => { setSelectedAdPricing(r.pricing); handleRemovePromo(); }}
                                      style={{
                                        padding: '4px 10px', borderRadius: '6px', border: 'none',
                                        background: '#10b981', color: '#fff', fontSize: '0.72rem',
                                        fontWeight: 700, cursor: 'pointer'
                                      }}
                                    >
                                      Pay Now
                                    </button>
                                    <button
                                      onClick={() => handleRejectPrice(r.pricing.id)}
                                      style={{
                                        padding: '4px 10px', borderRadius: '6px', border: '1px solid #e5e7eb',
                                        background: '#fff', color: '#6b7280', fontSize: '0.72rem',
                                        fontWeight: 700, cursor: 'pointer'
                                      }}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              ) : r.status === 'paid' ? (
                                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#059669' }}>
                                  Paid: ₹{parseFloat(r.pricing?.adminTotalAmount || r.pricing?.totalAmount || 0).toLocaleString()}
                                </span>
                              ) : r.pricing ? (
                                <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>
                                  Est: ₹{parseFloat(r.pricing.totalAmount).toLocaleString()}
                                </span>
                              ) : (
                                '—'
                              )}
                              <div style={{ marginTop: '8px' }}>
                                <button
                                  onClick={() => {
                                    setEditingAd(r);
                                    setEditAdForm({
                                      adTitle: r.adTitle || '',
                                      adDescription: r.adDescription || '',
                                      slot: r.slot || 'leaderboard',
                                      link: r.link || '',
                                      imageUrl: r.imageUrl || '',
                                      imageFile: null,
                                      targetState: r.targetState || '',
                                      targetCity: r.targetCity || '',
                                      startDate: r.startDate || '',
                                      endDate: r.endDate || ''
                                    });
                                    setEditAdMsg({ text: '', type: '' });
                                  }}
                                  style={{
                                    padding: '4px 10px', borderRadius: '6px', border: '1px solid #3b82f6',
                                    background: '#eff6ff', color: '#3b82f6', fontSize: '0.72rem',
                                    fontWeight: 700, cursor: 'pointer', width: '100%'
                                  }}
                                >
                                  <i className="bi bi-pencil-fill me-1"></i> Edit Ad
                                </button>
                              </div>
                            </td>
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
            <div className="ud-dashboard-home">
              <div className="ud-card" style={{ marginBottom: '1.5rem' }}>
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
                      <div className="ud-detail"><label>Account Type</label><p style={{ textTransform: 'uppercase' }}>{userInfo?.role === 'corporate' ? 'Corporate Account' : userInfo?.role === 'author' ? 'Reporter' : 'Reader'}</p></div>
                      {isReporter ? (() => {
                        const lvl = getReporterLevel(userInfo.followersCount, reporterThresholds);
                        return (
                          <div className="ud-detail">
                            <label>Reporter Status</label>
                            <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: lvl.text }}>
                              <i className={`bi ${lvl.icon}`}></i> {lvl.level}
                            </p>
                          </div>
                        );
                      })() : (
                        <div className="ud-detail"><label>Current Plan</label><p>{userInfo.membershipPlan ? planLabels[userInfo.membershipPlan] || userInfo.membershipPlan : 'Free'}</p></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {(userInfo?.role === 'corporate' || userInfo?.role === 'author') && (
                <div className="ud-card">
                  <div className="ud-card-header"><h3><i className="bi bi-bank me-2"></i>Bank & KYC Verification</h3></div>
                  <div className="ud-card-body">
                    {userInfo?.bankVerificationStatus === 'approved' && !isEditingBank ? (
                      <div>
                        <div className="ud-alert success mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <i className="bi bi-check-circle-fill me-2"></i> Your Bank and KYC details are verified. You can now request withdrawals.
                          </div>
                          <button 
                            type="button"
                            onClick={handleEditKYC} 
                            className="btn btn-sm btn-outline-success" 
                            style={{ fontWeight: 'bold', border: '1px solid #10b981', background: '#fff', color: '#10b981', borderRadius: '20px', padding: '4px 12px', cursor: 'pointer' }}
                          >
                            <i className="bi bi-pencil-square me-1"></i> Edit Details
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '1rem' }}>
                          <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                            <h5 style={{ fontWeight: 800, color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="bi bi-bank" style={{ color: '#10b981' }}></i> Bank Account Information
                            </h5>
                            <div className="ud-detail mb-2" style={{ marginBottom: '8px' }}><label className="text-muted small d-block" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Bank Name</label><p style={{ fontWeight: 600, margin: 0, color: '#1e293b' }}>{userInfo.bankDetails?.bankName || 'N/A'}</p></div>
                            {userInfo.bankDetails?.branchName && (
                              <div className="ud-detail mb-2" style={{ marginBottom: '8px' }}><label className="text-muted small d-block" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Branch Name</label><p style={{ fontWeight: 600, margin: 0, color: '#1e293b' }}>{userInfo.bankDetails.branchName}</p></div>
                            )}
                            <div className="ud-detail mb-2" style={{ marginBottom: '8px' }}><label className="text-muted small d-block" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Account Holder Name</label><p style={{ fontWeight: 600, margin: 0, color: '#1e293b' }}>{userInfo.bankDetails?.accountName || 'N/A'}</p></div>
                            <div className="ud-detail mb-2" style={{ marginBottom: '8px' }}><label className="text-muted small d-block" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Account Number</label><p style={{ fontWeight: 600, margin: 0, color: '#1e293b' }}>
                              {userInfo.bankDetails?.accountNo ? `•••• •••• •••• ${userInfo.bankDetails.accountNo.slice(-4)}` : 'N/A'}
                            </p></div>
                            <div className="ud-detail"><label className="text-muted small d-block" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>IFSC Code</label><p style={{ fontWeight: 600, margin: 0, color: '#1e293b' }}>{userInfo.bankDetails?.ifsc || 'N/A'}</p></div>
                          </div>
                          
                          <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                            <h5 style={{ fontWeight: 800, color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="bi bi-shield-check" style={{ color: '#10b981' }}></i> KYC Document Details
                            </h5>
                            <div className="ud-detail mb-3" style={{ marginBottom: '12px' }}><label className="text-muted small d-block" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Aadhar Number</label><p style={{ fontWeight: 600, margin: 0, color: '#1e293b' }}>
                              {userInfo.aadharDetails?.number ? `•••• •••• ${userInfo.aadharDetails.number.slice(-4)}` : 'N/A'}
                            </p></div>
                            {userInfo.aadharDetails?.documentUrl && (
                              <div className="ud-detail mb-2" style={{ marginBottom: '8px' }}>
                                <label className="text-muted small d-block" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Aadhar Verification Document</label>
                                <a 
                                  href={userInfo.aadharDetails.documentUrl.startsWith('http') ? userInfo.aadharDetails.documentUrl : `${API_BASE}${userInfo.aadharDetails.documentUrl.startsWith('/') ? '' : '/'}${userInfo.aadharDetails.documentUrl}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  style={{ color: '#10b981', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}
                                >
                                  <i className="bi bi-file-earmark-pdf-fill"></i> View Submitted Aadhar
                                </a>
                              </div>
                            )}
                            {userInfo.bankDetails?.passbookUrl && (
                              <div className="ud-detail">
                                <label className="text-muted small d-block" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Passbook Photo</label>
                                <a 
                                  href={userInfo.bankDetails.passbookUrl.startsWith('http') ? userInfo.bankDetails.passbookUrl : `${API_BASE}${userInfo.bankDetails.passbookUrl.startsWith('/') ? '' : '/'}${userInfo.bankDetails.passbookUrl}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  style={{ color: '#10b981', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}
                                >
                                  <i className="bi bi-file-image-fill"></i> View Submitted Passbook
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : userInfo?.bankVerificationStatus === 'pending' ? (
                      <div className="ud-alert warning">
                        <i className="bi bi-hourglass-split me-2"></i> Your Bank and KYC details are pending approval from SuperAdmin.
                      </div>
                    ) : (
                      <>
                        {userInfo?.bankVerificationStatus === 'rejected' && (
                          <div className="ud-alert danger">
                            <i className="bi bi-exclamation-triangle-fill me-2"></i> Your previous Bank/KYC submission was rejected. Please submit valid details.
                          </div>
                        )}
                        <form onSubmit={handleBankSubmit}>
                          {bankMsg.text && <div className={`ud-alert ${bankMsg.type}`}>{bankMsg.text}</div>}
                          
                          <h5 style={{ marginTop: '0.5rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Bank Details</h5>
                          <div className="ud-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <div className="ud-form-field">
                              <label>Account Holder Name *</label>
                              <input type="text" value={bankForm.accountName} onChange={e => setBankForm({...bankForm, accountName: e.target.value})} required />
                            </div>
                            <div className="ud-form-field">
                              <label>Bank Name *</label>
                              <input type="text" list="bank-list" value={bankForm.bankName} onChange={e => setBankForm({...bankForm, bankName: e.target.value})} required />
                              <datalist id="bank-list">
                                {INDIAN_BANKS.map(b => <option key={b} value={b} />)}
                              </datalist>
                            </div>
                            <div className="ud-form-field">
                              <label>Account Number *</label>
                              <input type="password" value={bankForm.accountNo} onChange={e => setBankForm({...bankForm, accountNo: e.target.value})} required />
                            </div>
                            <div className="ud-form-field">
                              <label>Confirm Account Number *</label>
                              <input type="text" value={bankForm.confirmAccountNo} onChange={e => setBankForm({...bankForm, confirmAccountNo: e.target.value})} required />
                            </div>
                            <div className="ud-form-field">
                              <label>IFSC Code *</label>
                              <input type="text" placeholder="e.g. SBIN0000291" value={bankForm.ifsc} onChange={e => setBankForm({...bankForm, ifsc: e.target.value})} required />
                              {ifscLoading && <small className="text-muted d-block mt-1"><span className="spinner-border spinner-border-sm me-1" role="status" style={{ width: '0.8rem', height: '0.8rem', borderWidth: '0.12em' }}></span>Verifying IFSC...</small>}
                              {ifscBranch && <small className={`d-block mt-1 fw-bold ${ifscBranch.includes('Invalid') ? 'text-danger' : 'text-success'}`}>{ifscBranch}</small>}
                            </div>
                            <div className="ud-form-field">
                              <label>Upload Passbook Photo {(!userInfo.bankDetails?.passbookUrl) && "*"}</label>
                              <input type="file" accept="image/*" onChange={e => setBankForm({...bankForm, passbookFile: e.target.files[0]})} required={!userInfo.bankDetails?.passbookUrl} />
                            </div>
                          </div>

                          <hr style={{ margin: '1.5rem 0', borderColor: '#e5e7eb' }} />
                          <h5 style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Aadhar KYC</h5>
                          <div className="ud-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <div className="ud-form-field">
                              <label>Aadhar Number *</label>
                              <input type="text" pattern="\d*" placeholder="Enter 12-digit Aadhaar Number" value={bankForm.aadharNumber} onChange={e => setBankForm({...bankForm, aadharNumber: e.target.value.replace(/\D/g, '')})} maxLength={12} required />
                            </div>
                            <div className="ud-form-field">
                              <label>Upload Aadhar Card Image {(!userInfo.aadharDetails?.documentUrl) && "*"}</label>
                              <input type="file" accept="image/*" onChange={e => setBankForm({...bankForm, aadharFile: e.target.files[0]})} required={!userInfo.aadharDetails?.documentUrl} />
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem' }}>
                            <button type="submit" className="ud-submit-btn" disabled={submittingBank} style={{ background: '#10b981', margin: 0 }}>
                              <i className="bi bi-shield-check me-2"></i>{submittingBank ? 'Submitting...' : 'Submit for Verification'}
                            </button>
                            {isEditingBank && (
                              <button 
                                type="button" 
                                className="ud-submit-btn" 
                                style={{ background: '#64748b', margin: 0 }} 
                                onClick={() => setIsEditingBank(false)}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              )}
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

          {/* ── REVENUE & EARNINGS TAB ── */}
          {activeTab === 'revenue' && (isCorporate || isReporter) && (
            <div className="ud-dashboard-home">
              {revenueDashboard ? (
                <>
                  <div className="ud-stats-row">
                    <div className="ud-stat-card">
                      <div className="ud-stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}><i className="bi bi-currency-rupee"></i></div>
                      <div><div className="ud-stat-value">₹{(revenueDashboard.totalRevenue || 0).toLocaleString('en-IN')}</div><div className="ud-stat-label">Total Revenue</div></div>
                    </div>
                    <div className="ud-stat-card">
                      <div className="ud-stat-icon" style={{ background: '#fef2f2', color: '#ef4444' }}><i className="bi bi-cart-dash-fill"></i></div>
                      <div><div className="ud-stat-value">₹{(revenueDashboard.totalSpent || 0).toLocaleString('en-IN')}</div><div className="ud-stat-label">Total Spent</div></div>
                    </div>
                    <div className="ud-stat-card">
                      <div className="ud-stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><i className="bi bi-wallet2"></i></div>
                      <div><div className="ud-stat-value">₹{(revenueDashboard.withdrawableBalance || 0).toLocaleString('en-IN')}</div><div className="ud-stat-label">Withdrawable</div></div>
                    </div>
                    <div className="ud-stat-card">
                      <div className="ud-stat-icon" style={{ background: '#faf5ff', color: '#8b5cf6' }}><i className="bi bi-arrow-down-circle"></i></div>
                      <div><div className="ud-stat-value">₹{(revenueDashboard.totalWithdrawn || 0).toLocaleString('en-IN')}</div><div className="ud-stat-label">Withdrawn</div></div>
                    </div>
                    <div className="ud-stat-card">
                      <div className="ud-stat-icon" style={{ background: '#fff7ed', color: '#ea580c' }}><i className="bi bi-receipt"></i></div>
                      <div><div className="ud-stat-value">₹{(revenueDashboard.totalSpentGst || 0).toLocaleString('en-IN')}</div><div className="ud-stat-label">GST Paid ({revenueDashboard.gstRate}%)</div></div>
                    </div>
                    <div className="ud-stat-card">
                      <div className="ud-stat-icon" style={{ background: '#f0fdf4', color: '#059669' }}><i className="bi bi-hash"></i></div>
                      <div><div className="ud-stat-value">{revenueDashboard.transactionCount || 0}</div><div className="ud-stat-label">Transactions</div></div>
                    </div>
                  </div>

                  {/* Withdrawal Section */}
                  <div className="ud-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="ud-card-header">
                      <h3><i className="bi bi-cash-stack me-2" style={{ color: '#10b981' }}></i>Request Withdrawal</h3>
                    </div>
                    <div className="ud-card-body">
                      <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: '1rem', fontSize: '0.85rem' }}>
                        <i className="bi bi-info-circle me-2" style={{ color: '#10b981' }}></i>
                        Minimum withdrawal: <strong>₹{(revenueDashboard.minWithdrawalAmount || 5000).toLocaleString('en-IN')}</strong> •
                        Your balance: <strong>₹{(revenueDashboard.withdrawableBalance || 0).toLocaleString('en-IN')}</strong> •
                        Processed within <strong>24 hours</strong> after admin approval
                      </div>

                      {withdrawMsg.text && (<div className={`ud-alert ${withdrawMsg.type}`}>{withdrawMsg.text}</div>)}

                      {userInfo?.bankVerificationStatus !== 'approved' ? (
                        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#6b7280' }}>
                          <i className="bi bi-shield-lock" style={{ fontSize: '2rem', color: '#ef4444' }}></i>
                          <p style={{ marginTop: '0.5rem', fontWeight: 600, color: '#ef4444' }}>Bank Verification Required</p>
                          <p style={{ fontSize: '0.82rem' }}>You must verify your bank account and KYC in the Profile section before you can request a withdrawal.</p>
                        </div>
                      ) : revenueDashboard.canWithdraw ? (
                        <form onSubmit={handleWithdrawRequest}>
                          <div className="ud-form-grid">
                            <div className="ud-form-field">
                              <label>Withdrawal Amount (₹) <span style={{ color: '#ef4444' }}>*</span></label>
                              <input type="number" min={revenueDashboard.minWithdrawalAmount} max={revenueDashboard.withdrawableBalance} value={withdrawForm.amount} onChange={e => setWithdrawForm({ ...withdrawForm, amount: e.target.value })} placeholder={`Min ₹${(revenueDashboard.minWithdrawalAmount || 5000).toLocaleString('en-IN')}`} required />
                            </div>
                            <div className="ud-form-field">
                              <label>Payment Method <span style={{ color: '#ef4444' }}>*</span></label>
                              <select value={withdrawForm.paymentMethod} onChange={e => setWithdrawForm({ ...withdrawForm, paymentMethod: e.target.value })}>
                                <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                                <option value="upi">UPI</option>
                              </select>
                            </div>
                          </div>

                          {withdrawForm.paymentMethod === 'upi' ? (
                            <div className="ud-form-field">
                              <label>UPI ID <span style={{ color: '#ef4444' }}>*</span></label>
                              <input type="text" placeholder="yourname@upi" value={withdrawForm.upiId} onChange={e => setWithdrawForm({ ...withdrawForm, upiId: e.target.value })} required />
                            </div>
                          ) : (
                            <div className="ud-form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                              <div className="ud-form-field">
                                <label>Account Holder Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <input type="text" value={withdrawForm.accountName} onChange={e => setWithdrawForm({ ...withdrawForm, accountName: e.target.value })} required />
                              </div>
                              <div className="ud-form-field">
                                <label>Account Number <span style={{ color: '#ef4444' }}>*</span></label>
                                <input type="text" value={withdrawForm.accountNo} onChange={e => setWithdrawForm({ ...withdrawForm, accountNo: e.target.value })} required />
                              </div>
                              <div className="ud-form-field">
                                <label>IFSC Code <span style={{ color: '#ef4444' }}>*</span></label>
                                <input type="text" value={withdrawForm.ifsc} onChange={e => setWithdrawForm({ ...withdrawForm, ifsc: e.target.value })} required />
                              </div>
                            </div>
                          )}

                          <button type="submit" className="ud-submit-btn" disabled={submittingWithdraw} style={{ background: '#10b981', marginTop: '0.5rem' }}>
                            <i className="bi bi-cash-stack me-2"></i>{submittingWithdraw ? 'Processing...' : 'Request Withdrawal'}
                          </button>
                        </form>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#6b7280' }}>
                          <i className="bi bi-lock" style={{ fontSize: '2rem', color: '#d1d5db' }}></i>
                          <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>Withdrawal not available yet</p>
                          <p style={{ fontSize: '0.82rem' }}>You need at least <strong>₹{(revenueDashboard.minWithdrawalAmount || 5000).toLocaleString('en-IN')}</strong> in your balance to request a withdrawal.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Withdrawal History */}
                  {withdrawals.length > 0 && (
                    <div className="ud-card" style={{ marginBottom: '1.5rem' }}>
                      <div className="ud-card-header"><h3><i className="bi bi-clock-history me-2"></i>Withdrawal History</h3></div>
                      <div className="ud-card-body">
                        <table className="ud-table">
                          <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Status</th><th>Notes</th></tr></thead>
                          <tbody>
                            {withdrawals.map(w => (
                              <tr key={w.id}>
                                <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>{new Date(w.requestedAt || w.createdAt).toLocaleDateString('en-IN')}</td>
                                <td style={{ fontWeight: 700 }}>₹{parseFloat(w.amount).toLocaleString('en-IN')}</td>
                                <td style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>{w.paymentMethod || 'Bank'}</td>
                                <td><span className={`ud-status-badge ${w.status}`}>{w.status.toUpperCase()}</span></td>
                                <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>{w.adminNotes || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Revenue History */}
                  <div className="ud-card">
                    <div className="ud-card-header"><h3><i className="bi bi-receipt me-2"></i>Transaction History</h3></div>
                    <div className="ud-card-body">
                      {revenueHistory.length === 0 ? (
                        <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>No transactions yet. Submit ad requests or publish articles to see activity here.</p>
                      ) : (
                        <table className="ud-table">
                          <thead><tr><th>Date</th><th>Description</th><th>Base</th><th>GST</th><th>Total</th><th>Status</th></tr></thead>
                          <tbody>
                            {revenueHistory.map(r => (
                              <tr key={r.id}>
                                <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                                <td style={{ fontWeight: 600 }}>
                                  {r.type === 'article_reward' ? (
                                    <span style={{ background: '#ecfdf5', color: '#10b981', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }}>Earned</span>
                                  ) : (
                                    <span style={{ background: '#fef2f2', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }}>Spent</span>
                                  )}
                                  <span style={{ verticalAlign: 'middle' }}>{r.description || (r.type === 'article_reward' ? 'Article Reward' : 'Ad Payment')}</span>
                                </td>
                                <td>₹{parseFloat(r.amount).toLocaleString('en-IN')}</td>
                                <td style={{ color: '#9ca3af' }}>₹{parseFloat(r.gstAmount).toLocaleString('en-IN')}</td>
                                <td style={{ fontWeight: 700 }}>₹{parseFloat(r.totalAmount).toLocaleString('en-IN')}</td>
                                <td><span className={`ud-status-badge ${r.status}`}>{r.status.toUpperCase()}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  {/* Monthly Breakdown */}
                  {revenueDashboard.monthlyBreakdown && Object.keys(revenueDashboard.monthlyBreakdown).length > 0 && (
                    <div className="ud-card" style={{ marginTop: '1.5rem' }}>
                      <div className="ud-card-header"><h3><i className="bi bi-bar-chart-fill me-2" style={{ color: accentColor }}></i>Monthly Revenue Breakdown</h3></div>
                      <div className="ud-card-body">
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '140px', padding: '0 8px' }}>
                          {Object.entries(revenueDashboard.monthlyBreakdown).map(([month, data]) => {
                            const maxRev = Math.max(1, ...Object.values(revenueDashboard.monthlyBreakdown).map(d => d.revenue));
                            const barHeight = data.revenue > 0 ? Math.max(12, (data.revenue / maxRev) * 120) : 4;
                            const monthLabel = new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short' });
                            return (
                              <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#374151' }}>₹{data.revenue.toLocaleString('en-IN')}</span>
                                <div style={{ width: '100%', height: `${barHeight}px`, background: data.revenue > 0 ? '#10b981' : '#e5e7eb', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' }}></div>
                                <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{monthLabel}</span>
                                <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>{data.count} txn</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                  <i className="bi bi-currency-rupee" style={{ fontSize: '3rem', color: '#d1d5db' }}></i>
                  <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>No revenue data yet</p>
                  <p style={{ fontSize: '0.85rem' }}>Submit ad requests and once your pricing is confirmed, your revenue will appear here.</p>
                </div>
              )}
            </div>
          )}

          {/* Edit Ad Modal */}
          {editingAd && (
            <div className="ud-modal-overlay">
              <div className="ud-modal" style={{ maxWidth: '600px', width: '90%' }}>
                <div className="ud-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}><i className="bi bi-pencil-square me-2"></i> Edit Ad Request</h3>
                  <button onClick={() => setEditingAd(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                </div>
                
                <div className="ud-alert warning" style={{ marginBottom: '1rem' }}>
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  <strong>Warning:</strong> Editing an active or approved ad will temporarily pause it and send it back to the admin for review. It will not show on the website until re-approved.
                </div>

                <form onSubmit={handleEditAdSubmit}>
                  {editAdMsg.text && <div className={`ud-alert ${editAdMsg.type}`}>{editAdMsg.text}</div>}
                  <div className="ud-form-field">
                    <label>Ad Title *</label>
                    <input type="text" value={editAdForm.adTitle} onChange={e => setEditAdForm({ ...editAdForm, adTitle: e.target.value })} required />
                  </div>
                  <div className="ud-form-field">
                    <label>Click-Through URL</label>
                    <input type="url" value={editAdForm.link} onChange={e => setEditAdForm({ ...editAdForm, link: e.target.value })} />
                  </div>
                  <div className="ud-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="ud-form-field">
                      <label>Target State *</label>
                      <select value={editAdForm.targetState} onChange={e => setEditAdForm({ ...editAdForm, targetState: e.target.value, targetCity: '' })} required>
                        <option value="">— Select State —</option>
                        {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
                    <div className="ud-form-field">
                      <label>Target City *</label>
                      <select value={editAdForm.targetCity} onChange={e => setEditAdForm({ ...editAdForm, targetCity: e.target.value })} required>
                        <option value="">— Select City —</option>
                        {editAdForm.targetState && INDIAN_STATES_CITIES[editAdForm.targetState]?.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="ud-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="ud-form-field">
                      <label>Start Date *</label>
                      <input type="date" value={editAdForm.startDate} onChange={e => setEditAdForm({ ...editAdForm, startDate: e.target.value })} required />
                    </div>
                    <div className="ud-form-field">
                      <label>End Date *</label>
                      <input type="date" value={editAdForm.endDate} onChange={e => setEditAdForm({ ...editAdForm, endDate: e.target.value })} required />
                    </div>
                  </div>
                  <div className="ud-form-field">
                    <label>Replace Banner Image (Leave empty to keep current)</label>
                    <input type="file" accept="image/*" onChange={e => setEditAdForm({ ...editAdForm, imageFile: e.target.files[0] })} />
                    {editAdForm.imageUrl && !editAdForm.imageFile && (
                      <div style={{ marginTop: '8px' }}>
                        <img src={editAdForm.imageUrl.startsWith('http') ? editAdForm.imageUrl : `${API_BASE}${editAdForm.imageUrl}`} alt="Current Ad" style={{ height: '60px', borderRadius: '4px', border: '1px solid #ddd' }} />
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                    <button type="button" onClick={() => setEditingAd(null)} className="ud-submit-btn" style={{ background: '#6b7280', flex: 1 }}>Cancel</button>
                    <button type="submit" className="ud-submit-btn" disabled={submittingEditAd} style={{ background: '#3b82f6', flex: 2 }}>
                      {submittingEditAd ? 'Saving...' : 'Save & Submit for Review'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Secure Checkout Modal for Ad Pricing */}
          {selectedAdPricing && (
            <div className="ud-modal-overlay" onClick={() => setSelectedAdPricing(null)} style={{ position: 'fixed', inset: 0, zIndex: 10050, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyOrigin: 'center', justifyContent: 'center', padding: '20px' }}>
              <div className="ud-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', color: '#fff', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontWeight: 800, color: '#f8fafc', margin: 0 }}><i className="bi bi-shield-lock-fill text-success me-2"></i>Secure Checkout</h4>
                  <button onClick={() => setSelectedAdPricing(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer', padding: 0, lineHeight: 1 }}>&times;</button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Service:</span>
                    <span className="fw-bold">Ad Campaign Payment</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Base Quote:</span>
                    <span>₹{parseFloat(selectedAdPricing.adminFinalAmount || selectedAdPricing.baseAmount).toLocaleString()}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">GST ({selectedAdPricing.gstRate}%):</span>
                    <span>₹{parseFloat(selectedAdPricing.adminGstAmount || selectedAdPricing.gstAmount).toLocaleString()}</span>
                  </div>
                </div>

                {/* Promo Code Input Block */}
                <div className="my-3 p-2 bg-dark bg-opacity-25 rounded-3 border border-secondary border-opacity-25" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                  {appliedPromo ? (
                    <div className="d-flex align-items-center justify-content-between text-success small p-1">
                      <div>
                        <i className="bi bi-tag-fill me-2"></i>
                        <strong>{appliedPromo.code}</strong> applied
                      </div>
                      <button type="button" className="btn btn-link btn-sm text-danger p-0 ms-2 text-decoration-none fw-bold" onClick={handleRemovePromo}>Remove</button>
                    </div>
                  ) : (
                    <div>
                      <div className="input-group input-group-sm">
                        <input 
                          type="text" 
                          className="form-control bg-dark border-secondary text-white" 
                          placeholder="Have a promo code?" 
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value)}
                          disabled={validatingPromo}
                          style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        <button 
                          className="btn btn-danger btn-sm fw-bold px-3" 
                          type="button" 
                          onClick={handleApplyPromo}
                          disabled={validatingPromo || !promoCodeInput.trim()}
                        >
                          {validatingPromo ? <span className="spinner-border spinner-border-sm"></span> : 'Apply'}
                        </button>
                      </div>
                      {promoError && <div className="text-danger small mt-1 fw-medium" style={{ fontSize: '0.75rem' }}><i className="bi bi-exclamation-circle me-1"></i>{promoError}</div>}
                    </div>
                  )}
                </div>

                {promoDiscountAmount > 0 && (
                  <div className="d-flex justify-content-between text-success small mb-3">
                    <span>Promo Discount Applied</span>
                    <span>-₹{promoDiscountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="d-flex justify-content-between align-items-center mb-4 pt-2" style={{ borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Total Payable:</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981' }}>
                    {promoDiscountAmount > 0 ? (
                      <>
                        <span className="text-muted text-decoration-line-through me-2" style={{ fontSize: '0.9rem' }}>₹{parseFloat(selectedAdPricing.adminTotalAmount || selectedAdPricing.totalAmount).toLocaleString()}</span>
                        <span>₹{Math.max(0, parseFloat(selectedAdPricing.adminTotalAmount || selectedAdPricing.totalAmount) - promoDiscountAmount).toLocaleString()}</span>
                      </>
                    ) : `₹${parseFloat(selectedAdPricing.adminTotalAmount || selectedAdPricing.totalAmount).toLocaleString()}`}
                  </span>
                </div>

                <button 
                  className="btn btn-success w-100 fw-bold py-2 rounded-pill" 
                  onClick={() => handleAcceptPrice(selectedAdPricing)}
                  style={{ background: '#10b981', border: 'none' }}
                >
                  Pay & Activate Campaign
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
