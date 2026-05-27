import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../config/api';
import { INDIAN_STATES, INDIAN_STATES_CITIES } from '../../data/indianStatesAndCities';
import AdAvailabilityCalendar from '../../components/AdAvailabilityCalendar';

/* ─────────────────────────────────────────────────────────────────
   Slot config — single source of truth for dimensions & labels
───────────────────────────────────────────────────────────────── */
const AD_SLOTS = [
  {
    id: 'leaderboard',
    label: 'Header Leaderboard Ad',
    dimension: '728 × 90',
    w: 728, h: 90,
    position: 'Top Header — Shows below the navigation bar on ALL pages',
    icon: 'bi-layout-text-window',
    color: '#3b82f6',
    bg: '#eff6ff',
    type: 'private',
  },
  {
    id: 'article-inline',
    label: 'Article Inline Ad',
    dimension: '728 × 90',
    w: 728, h: 90,
    position: 'Inside News Content — Shows between paragraphs in articles',
    icon: 'bi-text-indent-left',
    color: '#10b981',
    bg: '#ecfdf5',
    type: 'private',
  },
  {
    id: 'left-skyscraper',
    label: 'Left Sidebar Ad',
    dimension: '160 × 600',
    w: 160, h: 600,
    position: 'Left Sidebar — Shows on the left side of the main content',
    icon: 'bi-layout-sidebar',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    type: 'google',
  },
  {
    id: 'right-half-page',
    label: 'Right Sidebar Ad',
    dimension: '300 × 600',
    w: 300, h: 600,
    position: 'Right Sidebar — Shows on the right side next to articles',
    icon: 'bi-layout-sidebar-reverse',
    color: '#ef4444',
    bg: '#fef2f2',
    type: 'private',
  },
  {
    id: 'mobile-banner',
    label: 'Mobile Banner Ad',
    dimension: '300 × 100',
    w: 300, h: 100,
    position: 'Mobile Top/Bottom — Shows on mobile screens as a compact banner',
    icon: 'bi-phone',
    color: '#f59e0b',
    bg: '#fffbeb',
    type: 'private',
  },
  {
    id: 'top-bottom-banner',
    label: 'Top / Bottom Banner (Google Ad)',
    dimension: '970 × 90',
    w: 970, h: 90,
    position: 'Top/Bottom Content — Shows at the bottom or top of main content',
    icon: 'bi-window-sidebar',
    color: '#0ea5e9',
    bg: '#e0f2fe',
    type: 'google',
  },
  {
    id: 'in-feed-rectangle',
    label: 'In-Feed Rectangle (Google Ad)',
    dimension: '336 × 280',
    w: 336, h: 280,
    position: 'News Grid — Shows inline within the article feeds',
    icon: 'bi-grid-1x2',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    type: 'google',
  },
  {
    id: 'inline-news-footer',
    label: 'Inline News Footer (Google Ad)',
    dimension: '728 × 90',
    w: 728, h: 90,
    position: 'Article Footer — Shows above reporter profile at the bottom of articles',
    icon: 'bi-window-dock',
    color: '#10b981',
    bg: '#ecfdf5',
    type: 'google',
  },
  {
    id: 'mobile-rectangle',
    label: 'Mobile Rectangle Ad',
    dimension: '300 × 250',
    w: 300, h: 250,
    position: 'Mobile Content — Replaces sidebar ads on mobile view',
    icon: 'bi-phone-landscape',
    color: '#06b6d4',
    bg: '#ecfeff',
    type: 'private',
  },
  {
    id: 'mobile-inline',
    label: 'Mobile Inline Ad',
    dimension: '300 × 200',
    w: 300, h: 200,
    position: 'Mobile Article — Shows between content on mobile screens',
    icon: 'bi-phone-fill',
    color: '#d946ef',
    bg: '#fdf4ff',
    type: 'private',
  },
];

const CATEGORIES = ['Global (All Pages)', 'Manufacturing', 'Automation', 'Technology', 'Cybersecurity', 'Safety', 'Energy', 'Startups'];



const EMPTY_AD = {
  id: '',
  slot: 'leaderboard',
  imageUrl: '',
  link: '',
  label: 'Advertisement',
  advertiser: '',
  category: '',
  targetState: '',
  targetCity: '',
  startDate: '',
  endDate: '',
  active: true,
  isGoogleAd: false,
  googleAdCode: '',
  isSponsored: false,
};

const ManageAds = () => {
  const [ads, setAds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentAd, setCurrentAd] = useState(EMPTY_AD);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const adminInfo = JSON.parse(sessionStorage.getItem('adminInfo'));
  const config = { headers: { Authorization: `Bearer ${adminInfo?.token}` } };

  const fetchAds = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/api/ads/all`, config);
      setAds(data);
    } catch (err) {
      setError('Failed to fetch ads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAds(); }, []);

  const handleOpenCreate = (slot) => {
    setCurrentAd({ ...EMPTY_AD, slot: slot.id });
    setError(''); setSuccess('');
    setShowModal(true);
  };

  const handleOpenEdit = (ad) => {
    setCurrentAd({
      ...ad,
      startDate: ad.startDate || '',
      endDate: ad.endDate || '',
      category: ad.category || '',
      targetState: ad.targetState || '',
      targetCity: ad.targetCity || '',
      isGoogleAd: !!ad.isGoogleAd,
      googleAdCode: ad.googleAdCode || '',
      isSponsored: !!ad.isSponsored,
    });
    setError(''); setSuccess('');
    setShowModal(true);
  };

  const handleClose = () => { setShowModal(false); };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCurrentAd(prev => ({ ...prev, imageUrl: data.imageUrl }));
      setSuccess('Image uploaded ✓');
    } catch (err) {
      setError('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentAd.imageUrl) { setError('Please upload an ad image first.'); return; }
    try {
      await axios.post(`${API_BASE}/api/ads`, currentAd, config);
      setSuccess('Ad saved successfully!');
      fetchAds();
      setTimeout(handleClose, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  };

  const handleToggle = async (ad) => {
    try {
      await axios.patch(`${API_BASE}/api/ads/${ad.id}/toggle`, {}, config);
      fetchAds();
    } catch { setError('Toggle failed'); }
  };

  const handleDelete = async (ad) => {
    if (!window.confirm(`Delete this ad? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_BASE}/api/ads/${ad.id}`, config);
      fetchAds();
    } catch { setError('Delete failed'); }
  };

  const slotInfo = AD_SLOTS.find(s => s.id === currentAd.slot) || AD_SLOTS[0];

  return (
    <div className="manage-ads-light">
      {/* Page Header */}
      <div className="manage-ads-header">
        <div>
          <h2 className="manage-ads-title">Advertisement Manager</h2>
          <p className="manage-ads-subtitle">Manage desktop (728x90, 160x600, 300x600) and mobile (320x50, 300x250, 320x100) ad slots.</p>
        </div>
      </div>

      {/* Analytics Summary Box */}
      <div className="card border-0 shadow-sm rounded-4 mb-4" style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)' }}>
        <div className="card-body p-4 text-white">
          <h5 className="fw-bold mb-3"><i className="bi bi-graph-up-arrow me-2"></i> Ad Performance Summary</h5>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="bg-white bg-opacity-10 rounded-3 p-3">
                <div className="small opacity-75 text-uppercase fw-bold mb-1">Total Ad Clicks</div>
                <h3 className="mb-0 fw-black">{ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0)}</h3>
              </div>
            </div>
            <div className="col-md-4">
              <div className="bg-white bg-opacity-10 rounded-3 p-3">
                <div className="small opacity-75 text-uppercase fw-bold mb-1">Total Impressions</div>
                <h3 className="mb-0 fw-black">{ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0)}</h3>
              </div>
            </div>
            <div className="col-md-4">
              <div className="bg-white bg-opacity-10 rounded-3 p-3">
                <div className="small opacity-75 text-uppercase fw-bold mb-1">Top Performing Ad</div>
                <h6 className="mb-0 fw-bold text-truncate" style={{ fontSize: '1.2rem', lineHeight: 1.2 }}>
                  {ads.length > 0 && ads.some(a => a.clicks > 0) 
                    ? [...ads].sort((a,b) => (b.clicks||0) - (a.clicks||0))[0].advertiser || [...ads].sort((a,b) => (b.clicks||0) - (a.clicks||0))[0].label || 'Unnamed Ad'
                    : 'No clicks yet'}
                </h6>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Private Slot Cards */}
      <div className="d-flex align-items-center mb-3 mt-4">
        <h4 className="fw-bold mb-0"><i className="bi bi-briefcase-fill text-danger me-2"></i> Private Direct-Sale Ads</h4>
        <div className="ms-auto"><span className="badge bg-light text-dark border">Corporate / Direct Clients</span></div>
      </div>
      <div className="manage-ads-slots mb-5">
        {AD_SLOTS.filter(s => s.type === 'private').map(slot => {
          const slotAds = ads.filter(a => a.slot === slot.id);
          const activeAds = slotAds.filter(a => a.active);
          return (
            <div key={slot.id} className="manage-ads-slot-card" style={{ borderTopColor: slot.color }}>
              <div className="manage-ads-slot-header">
                <div>
                  <div className="manage-ads-slot-label">{slot.label}</div>
                  <div className="manage-ads-slot-dim" style={{ color: slot.color, fontWeight: 800, fontSize: '1rem' }}>{slot.dimension}</div>
                  <div className="manage-ads-slot-pos">{slot.position}</div>
                </div>
                <span className="manage-ads-slot-badge" style={{ background: slot.bg, color: slot.color }}>
                  {activeAds.length} live
                </span>
              </div>

              <div className="manage-ads-slot-preview" style={{ background: slot.bg, borderColor: `${slot.color}40`, color: slot.color }}>
                <i className={`bi ${slot.icon}`}></i>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem' }}>{slot.w} × {slot.h} px</span>
                  <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: '2px' }}>Required Image Size</div>
                </div>
              </div>

              <button className="manage-ads-upload-btn" style={{ background: slot.bg, color: slot.color, borderColor: `${slot.color}40` }} onClick={() => { handleOpenCreate(slot); setCurrentAd(prev => ({ ...prev, isGoogleAd: false })); }}>
                <i className="bi bi-plus-lg"></i> Upload Private Ad ({slot.w}×{slot.h})
              </button>
            </div>
          );
        })}
      </div>

      {/* Google Ad Slot Cards */}
      <div className="d-flex align-items-center mb-3 mt-5 border-top pt-4">
        <h4 className="fw-bold mb-0"><i className="bi bi-google text-primary me-2"></i> Google AdSense Slots</h4>
        <div className="ms-auto"><span className="badge bg-light text-dark border">Google Network</span></div>
      </div>
      <div className="manage-ads-slots">
        {AD_SLOTS.filter(s => s.type === 'google').map(slot => {
          const slotAds = ads.filter(a => a.slot === slot.id);
          const activeAds = slotAds.filter(a => a.active);
          return (
            <div key={slot.id} className="manage-ads-slot-card" style={{ borderTopColor: slot.color }}>
              <div className="manage-ads-slot-header">
                <div>
                  <div className="manage-ads-slot-label">{slot.label}</div>
                  <div className="manage-ads-slot-dim" style={{ color: slot.color, fontWeight: 800, fontSize: '1rem' }}>{slot.dimension}</div>
                  <div className="manage-ads-slot-pos">{slot.position}</div>
                </div>
                <span className="manage-ads-slot-badge" style={{ background: slot.bg, color: slot.color }}>
                  {activeAds.length} live
                </span>
              </div>

              <div className="manage-ads-slot-preview" style={{ background: slot.bg, borderColor: `${slot.color}40`, color: slot.color }}>
                <i className={`bi ${slot.icon}`}></i>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem' }}>{slot.w} × {slot.h} px</span>
                  <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: '2px' }}>AdSense Script Area</div>
                </div>
              </div>

              <div className="manage-ads-upload-btn" style={{ background: '#f8fafc', color: '#94a3b8', borderColor: '#e2e8f0', cursor: 'default' }}>
                <i className="bi bi-info-circle"></i> Managed automatically by Google
              </div>
            </div>
          );
        })}
      </div>

      {/* All Ads Table */}
      <div className="manage-ads-table-wrap">
        <h3 className="manage-ads-table-title">
          <i className="bi bi-grid-3x2-gap"></i> All Configured Ads
        </h3>

        {loading ? (
          <div className="manage-ads-loading">Loading...</div>
        ) : ads.length === 0 ? (
          <div className="manage-ads-empty">
            <i className="bi bi-image"></i>
            <p>No ads configured yet. Use the cards above to add your first ad.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Slot / Dimension</th>
                <th>Advertiser</th>
                <th>Target</th>
                <th>Schedule</th>
                <th>Stats</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ads.map(ad => {
                const slot = AD_SLOTS.find(s => s.id === ad.slot);
                const imgSrc = ad.imageUrl?.startsWith('http') ? ad.imageUrl : `${API_BASE}${ad.imageUrl}`;
                return (
                  <tr key={ad.id}>
                    <td>
                      <img src={imgSrc} alt="ad" style={{ width: 80, height: 40, objectFit: 'cover', borderRadius: 4, border: '1px solid #e5e7eb' }} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{slot?.label || ad.slot}</div>
                      <div style={{ color: slot?.color || '#9ca3af', fontSize: '0.75rem', fontWeight: 700 }}>
                        {slot?.dimension || '—'} px
                      </div>
                    </td>
                    <td style={{ color: '#6b7280' }}>{ad.advertiser || '—'}</td>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        <span className="admin-table-badge" style={{ background: '#eff6ff', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.25)' }}>{ad.category || 'Global Category'}</span>
                        {ad.targetState ? (
                          <span className="admin-table-badge" style={{ background: '#ecfdf5', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)', textTransform: 'none' }}>
                            <i className="bi bi-geo-alt-fill me-1"></i>
                            {ad.targetCity ? `${ad.targetCity}, ` : ''}{ad.targetState}
                          </span>
                        ) : (
                          <span className="admin-table-badge" style={{ background: '#f3f4f6', color: '#6b7280', border: '1px solid rgba(107, 114, 128, 0.25)', textTransform: 'none' }}>
                            <i className="bi bi-globe me-1"></i> Global Location
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                      {ad.startDate ? `${ad.startDate}` : 'Always'}
                      {ad.endDate ? ` → ${ad.endDate}` : ''}
                    </td>
                    <td style={{ fontSize: '0.72rem' }}>
                      <span style={{ color: '#3b82f6', marginRight: '8px' }}><i className="bi bi-eye"></i> {ad.impressions ?? 0}</span>
                      <span style={{ color: '#10b981' }}><i className="bi bi-cursor"></i> {ad.clicks ?? 0}</span>
                    </td>
                    <td>
                      <label className="publish-toggle" style={{ transform: 'scale(0.8)' }}>
                        <input
                          type="checkbox"
                          checked={ad.active}
                          onChange={() => handleToggle(ad)}
                        />
                        <span className="publish-toggle-slider"></span>
                      </label>
                      <span style={{ fontSize: '0.7rem', color: ad.active ? '#10b981' : '#9ca3af', marginLeft: 4 }}>
                        {ad.active ? 'Live' : 'Off'}
                      </span>
                    </td>
                    <td>
                      <button className="manage-table-btn edit" onClick={() => handleOpenEdit(ad)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="manage-table-btn delete" onClick={() => handleDelete(ad)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="publish-modal-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
          <div className="publish-modal" style={{ maxWidth: '640px' }}>
            <div className="publish-modal-header">
              <div className="publish-modal-title-row">
                <i className="bi bi-megaphone-fill"></i>
                <h2>{currentAd.id ? 'Edit Ad' : 'Upload New Ad'} — {slotInfo?.label}</h2>
              </div>
              <button className="publish-modal-close" onClick={handleClose}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="publish-modal-body">
              {error && <div className="publish-alert error">{error}</div>}
              {success && <div className="publish-alert success">{success}</div>}

              <form onSubmit={handleSubmit}>
                {/* Slot info */}
                <div className="manage-ads-slot-info-bar" style={{ background: slotInfo?.bg, borderColor: `${slotInfo?.color}40`, color: slotInfo?.color }}>
                  <i className={`bi ${slotInfo?.icon}`} style={{ fontSize: '1.5rem' }}></i>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{slotInfo?.label}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{slotInfo?.position}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '6px 14px', background: `${slotInfo?.color}15`, borderRadius: '8px', border: `1.5px solid ${slotInfo?.color}40` }}>
                    <div style={{ fontWeight: 900, fontSize: '1.1rem', lineHeight: 1 }}>{slotInfo?.w} × {slotInfo?.h}</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 600, opacity: 0.7, marginTop: '2px' }}>PIXELS</div>
                  </div>
                </div>

                <div className="publish-field" style={{ display: 'flex', gap: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={currentAd.isSponsored}
                      onChange={e => setCurrentAd(prev => ({ ...prev, isSponsored: e.target.checked }))}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>Show "ADVERTISEMENT" Label?</span>
                  </label>
                </div>

                <div className="publish-field">
                  <label>Ad Image <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="publish-file-input" />
                  <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '0.35rem', fontWeight: 600 }}>
                    ⚠ Required size: exactly {slotInfo?.w} × {slotInfo?.h} pixels. Ad will be displayed at this exact dimension.
                  </div>
                  {uploading && <div style={{ color: '#3b82f6', fontSize: '0.8rem' }}><i className="bi bi-arrow-repeat spin"></i> Uploading...</div>}
                  {currentAd.imageUrl && (
                    <div className="publish-preview-img">
                      <img
                        src={currentAd.imageUrl.startsWith('http') ? currentAd.imageUrl : `${API_BASE}${currentAd.imageUrl}`}
                        alt="preview"
                      />
                    </div>
                  )}
                </div>

                <div className="publish-field">
                  <label>Click-Through URL</label>
                  <input
                    type="url"
                    placeholder="https://advertiser.com"
                    value={currentAd.link}
                    onChange={e => setCurrentAd(prev => ({ ...prev, link: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="publish-field">
                    <label>Advertiser Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Siemens India"
                      value={currentAd.advertiser}
                      onChange={e => setCurrentAd(prev => ({ ...prev, advertiser: e.target.value }))}
                    />
                  </div>
                  <div className="publish-field">
                    <label>Ad Label / Caption</label>
                    <input
                      type="text"
                      placeholder="Advertisement"
                      value={currentAd.label}
                      onChange={e => setCurrentAd(prev => ({ ...prev, label: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="publish-field">
                    <label>Category Targeting</label>
                    <select
                      value={currentAd.category}
                      onChange={e => setCurrentAd(prev => ({ ...prev, category: e.target.value }))}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c === 'Global (All Pages)' ? '' : c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  {currentAd.id && (
                    <div className="publish-field">
                      <label>Ad Slot</label>
                      <select
                        value={currentAd.slot}
                        onChange={e => setCurrentAd(prev => ({ ...prev, slot: e.target.value }))}
                      >
                        {AD_SLOTS.map(s => (
                          <option key={s.id} value={s.id}>{s.label} — {s.dimension}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="publish-field">
                    <label>Target State <span style={{ color: '#ef4444' }}>*</span></label>
                    <select
                      value={currentAd.targetState || ''}
                      onChange={e => setCurrentAd(prev => ({ ...prev, targetState: e.target.value, targetCity: '', hideCalendar: false }))}
                      required
                    >
                      <option value="">— Select State —</option>
                      {INDIAN_STATES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  <div className="publish-field">
                    <label>Target City <span style={{ color: '#ef4444' }}>*</span></label>
                    <select
                      value={currentAd.targetCity || ''}
                      onChange={e => setCurrentAd(prev => ({ ...prev, targetCity: e.target.value, hideCalendar: false }))}
                      disabled={!currentAd.targetState}
                      required
                    >
                      <option value="">— Select City —</option>
                      {currentAd.targetState && INDIAN_STATES_CITIES[currentAd.targetState]?.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="publish-field">
                    <label>Start Date <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="date"
                      value={currentAd.startDate}
                      onChange={e => setCurrentAd(prev => ({ ...prev, startDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="publish-field">
                    <label>End Date <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="date"
                      value={currentAd.endDate}
                      onChange={e => setCurrentAd(prev => ({ ...prev, endDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Availability Calendar */}
                {currentAd.targetState && currentAd.targetCity && !currentAd.hideCalendar && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span><i className="bi bi-calendar-check me-1"></i> Slot Availability Calendar</span>
                      <button type="button" onClick={() => setCurrentAd(prev => ({ ...prev, hideCalendar: true }))} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}><i className="bi bi-x-lg"></i></button>
                    </label>
                    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                      <AdAvailabilityCalendar
                        slot={currentAd.slot}
                        targetState={currentAd.targetState}
                        targetCity={currentAd.targetCity}
                        API_BASE={API_BASE}
                        authToken={adminInfo?.token}
                        compact
                        onSelectDate={(dateStr) => setCurrentAd(prev => ({ ...prev, startDate: dateStr, endDate: dateStr, hideCalendar: true }))}
                      />
                    </div>
                  </div>
                )}

                <div className="publish-toggle-row">
                  <label className="publish-toggle">
                    <input
                      type="checkbox"
                      checked={currentAd.active}
                      onChange={e => setCurrentAd(prev => ({ ...prev, active: e.target.checked }))}
                    />
                    <span className="publish-toggle-slider"></span>
                  </label>
                  <span className="publish-toggle-label">Activate immediately (make live)</span>
                </div>

                <button type="submit" className="publish-submit-btn" disabled={uploading}>
                  <i className="bi bi-cloud-upload"></i>
                  {currentAd.id ? ' Update Ad Configuration' : ' Publish Ad'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAds;
