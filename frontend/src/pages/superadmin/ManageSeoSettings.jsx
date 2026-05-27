import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../config/api';

const ManageSeoSettings = () => {
  const [settings, setSettings] = useState({
    siteTitle: '',
    metaDescription: '',
    metaKeywords: '',
    googleAnalyticsId: '',
    isAutoTrends: false,
    autoKeywords: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const { data } = await axios.get(`${API_BASE}/api/settings/seo?admin=true`);
      setSettings({
        siteTitle: data.siteTitle || '',
        metaDescription: data.metaDescription || '',
        metaKeywords: data.metaKeywords || '',
        googleAnalyticsId: data.googleAnalyticsId || '',
        isAutoTrends: data.isAutoTrends || false,
        autoKeywords: data.autoKeywords || ''
      });
    } catch (error) {
      console.error('Error fetching SEO settings:', error);
      setMessage({ type: 'danger', text: 'Failed to load SEO settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.put(`${API_BASE}/api/settings/seo`, settings);
      setMessage({ type: 'success', text: 'SEO settings updated successfully! Search engines will now pick up your new tags.' });
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      setMessage({ type: 'danger', text: 'Failed to update SEO settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-light-content text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3 text-muted">Loading SEO Configuration...</p>
      </div>
    );
  }

  return (
    <div className="admin-light-content reveal">
      <div className="admin-card">
        <div className="admin-card-header bg-gradient-primary text-white p-4" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', borderRadius: '12px 12px 0 0' }}>
          <div className="d-flex align-items-center gap-3">
            <div className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '50px', height: '50px', fontSize: '1.5rem' }}>
              <i className="bi bi-search"></i>
            </div>
            <div>
              <h2 className="mb-0 text-white fw-bold">SEO & Tags Management</h2>
              <p className="mb-0 opacity-75">Update your website's hidden metadata to rank higher for trending topics.</p>
            </div>
          </div>
        </div>

        <div className="admin-card-body p-4">
          {message.text && (
            <div className={`alert alert-${message.type} alert-dismissible fade show shadow-sm`} role="alert">
              <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
              {message.text}
              <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
            </div>
          )}

          <div className="alert alert-info bg-light border-info border-start border-4 text-dark p-4 shadow-sm rounded mb-4">
            <h5 className="fw-bold"><i className="bi bi-info-circle-fill text-info me-2"></i> How This Works</h5>
            <p className="mb-0">
              The information you enter below is injected directly into the HTML <code>&lt;head&gt;</code> of your website. Visitors will not see this on the page itself, but search engines (Google, Bing) use it to understand what your website is about. Updating your keywords to match current trends is a great way to boost your search rankings!
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              <div className="col-md-12">
                <div className="form-group">
                  <label className="form-label fw-bold">Website Title (Global)</label>
                  <input
                    type="text"
                    name="siteTitle"
                    className="form-control form-control-lg bg-light"
                    value={settings.siteTitle}
                    onChange={handleChange}
                    placeholder="e.g. Industrial Times - Breaking News"
                    required
                  />
                  <div className="form-text text-muted small"><i className="bi bi-browser-chrome me-1"></i> This is what appears on the browser tab.</div>
                </div>
              </div>

              <div className="col-md-12">
                <div className="form-group">
                  <label className="form-label fw-bold">Trending Tags / Keywords</label>
                  <textarea
                    name="metaKeywords"
                    className="form-control form-control-lg bg-light"
                    value={settings.metaKeywords}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Leave empty to auto-load Google daily trends..."
                  ></textarea>
                  <div className="form-text text-muted small d-flex flex-wrap align-items-center gap-2 mt-1">
                    <span><i className="bi bi-tags-fill me-1"></i> Separate your trending tags with commas.</span>
                    <span className="badge bg-success text-white"><i className="bi bi-robot me-1"></i> Google Trends Fallback Active</span>
                  </div>
                  
                  {/* Show Google-parsed active tags when textarea is empty */}
                  {settings.isAutoTrends && settings.autoKeywords && (
                    <div className="mt-3 p-3 bg-light border-start border-success border-3 rounded shadow-sm">
                      <span className="fw-bold small text-success d-flex align-items-center gap-2 mb-2">
                        <i className="bi bi-cpu-fill"></i> ACTIVE GOOGLE TRENDS IN USE (BACKGROUND):
                      </span>
                      <div className="d-flex flex-wrap gap-2">
                        {settings.autoKeywords.split(',').map((tag, idx) => (
                          <span key={idx} className="badge bg-dark text-white px-2 py-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-md-12">
                <div className="form-group">
                  <label className="form-label fw-bold">Meta Description</label>
                  <textarea
                    name="metaDescription"
                    className="form-control form-control-lg bg-light"
                    value={settings.metaDescription}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Briefly describe what your site offers..."
                    required
                  ></textarea>
                  <div className="form-text text-muted small"><i className="bi bi-card-text me-1"></i> This is the short description that appears below your title in Google search results.</div>
                </div>
              </div>

              <div className="col-md-12">
                <div className="form-group">
                  <label className="form-label fw-bold text-primary"><i className="bi bi-graph-up-arrow me-1"></i> Google Analytics Tracking ID</label>
                  <input
                    type="text"
                    name="googleAnalyticsId"
                    className="form-control form-control-lg bg-light"
                    value={settings.googleAnalyticsId}
                    onChange={handleChange}
                    placeholder="e.g. G-XXXXXXXXXX"
                  />
                  <div className="form-text text-muted small">
                    <i className="bi bi-info-circle me-1"></i> 
                    Enter your Google Analytics Measurement ID to track website traffic. Leave blank to disable.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 d-flex justify-content-end">
              <button
                type="submit"
                className="btn btn-primary btn-lg px-5 shadow rounded-pill"
                disabled={saving}
              >
                {saving ? (
                  <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Saving...</>
                ) : (
                  <><i className="bi bi-save-fill me-2"></i> Save SEO Settings</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManageSeoSettings;
