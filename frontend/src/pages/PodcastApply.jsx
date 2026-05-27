import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Form, Button, Badge } from 'react-bootstrap';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navigation from '../components/Navigation';
import API_BASE from '../config/api';

const PodcastApply = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFormOnly = searchParams.get('form') === 'true';

  const formRef = useRef(null);
  const [episodes, setEpisodes] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(true);

  // Video player modal state
  const [activeVideo, setActiveVideo] = useState(null); // { url, title, thumbnail }

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    website: '',
    background: ''
  });
  const [customData, setCustomData] = useState({});
  const [dynamicFields, setDynamicFields] = useState([]);
  const [pageSettings, setPageSettings] = useState({
    title: 'Industrial Times Podcast',
    description: "Share your expertise, innovations, and insights with our global audience of industry and manufacturing professionals."
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [redirectCount, setRedirectCount] = useState(5);

  // Fetch episodes and form fields
  useEffect(() => {
    window.scrollTo(0, 0);

    if (!isFormOnly) {
      const fetchEpisodes = async () => {
        try {
          const res = await axios.get(`${API_BASE}/api/podcast/episodes`);
          setEpisodes(res.data || []);
        } catch (err) {
          console.error('Failed to load episodes', err);
        } finally {
          setLoadingEpisodes(false);
        }
      };
      fetchEpisodes();
    }

    const fetchFields = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/podcast/fields`);
        setDynamicFields(res.data);
        const initialCustom = {};
        res.data.forEach(f => { initialCustom[f.name] = ''; });
        setCustomData(initialCustom);

        const seoRes = await axios.get(`${API_BASE}/api/settings/seo`);
        if (seoRes.data) {
          setPageSettings({
            title: seoRes.data.podcastHeaderTitle || 'Industrial Times Podcast',
            description: seoRes.data.podcastHeaderDescription || "Share your expertise, innovations, and insights with our global audience of industry and manufacturing professionals."
          });
        }
      } catch (err) {
        console.error("Failed to load fields or settings", err);
      }
    };
    fetchFields();
  }, [isFormOnly]);

  useEffect(() => {
    let timer;
    if (success && redirectCount > 0) {
      timer = setTimeout(() => setRedirectCount(redirectCount - 1), 1000);
    } else if (success && redirectCount === 0) {
      // If opened as form-only tab, close it; otherwise go home
      if (isFormOnly && window.opener) {
        window.close();
      } else {
        navigate('/podcast-apply');
      }
    }
    return () => clearTimeout(timer);
  }, [success, redirectCount, navigate, isFormOnly]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCustomChange = (e, fieldName) => {
    setCustomData({ ...customData, [fieldName]: e.target.value });
  };

  const handleApplyClick = () => {
    window.open('/podcast-apply?form=true', '_blank');
  };

  const handleEpisodeClick = (ep) => {
    if (ep.audioUrl) {
      const videoUrl = ep.audioUrl.startsWith('/uploads/')
        ? `${API_BASE}${ep.audioUrl}`
        : ep.audioUrl;
      const thumbUrl = ep.thumbnailUrl
        ? (ep.thumbnailUrl.startsWith('/') ? `${API_BASE}${ep.thumbnailUrl}` : ep.thumbnailUrl)
        : null;
      setActiveVideo({ url: videoUrl, title: ep.title, thumbnail: thumbUrl, isUploaded: ep.audioUrl.startsWith('/uploads/') });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await axios.post(`${API_BASE}/api/podcast`, { ...formData, customData });
      setSuccess(true);
      setRedirectCount(5);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', website: '', background: '' });
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit application. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const renderDynamicField = (field) => {
    switch (field.type) {
      case 'textarea':
        return <Form.Control as="textarea" rows={4} required={field.required} value={customData[field.name] || ''} onChange={(e) => handleCustomChange(e, field.name)} className="podcast-form-input" placeholder={`Enter ${field.label.toLowerCase()}...`} />;
      case 'select':
        const options = Array.isArray(field.options) ? field.options : [];
        return (
          <Form.Select required={field.required} value={customData[field.name] || ''} onChange={(e) => handleCustomChange(e, field.name)} className="podcast-form-input">
            <option value="">Select an option...</option>
            {options.map((opt, idx) => <option key={idx} value={opt}>{opt}</option>)}
          </Form.Select>
        );
      case 'checkbox':
        return <Form.Check type="checkbox" label="Yes, I confirm" required={field.required} checked={customData[field.name] === 'Yes'} onChange={(e) => handleCustomChange({ target: { value: e.target.checked ? 'Yes' : 'No' } }, field.name)} />;
      default:
        return <Form.Control type={field.type || 'text'} required={field.required} value={customData[field.name] || ''} onChange={(e) => handleCustomChange(e, field.name)} className="podcast-form-input" placeholder={`Enter ${field.label.toLowerCase()}...`} />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // ─── Success Screen ───
  if (success) {
    return (
      <div className="podcast-landing">
        <Navigation />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px' }}>
          <div style={{
            background: '#fff', borderRadius: '24px', padding: '3rem', maxWidth: '550px', width: '90%',
            boxShadow: '0 25px 60px rgba(0,0,0,0.12)', textAlign: 'center'
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
              color: '#10b981', fontSize: '2.5rem'
            }}>
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <h2 style={{ fontWeight: 900, marginBottom: '0.75rem' }}>Application Submitted!</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Thank you for your interest in the Industrial Times Podcast. Our editorial team will review your application and get back to you shortly.
            </p>
            <p style={{ color: '#da251d', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {isFormOnly ? `Closing in ${redirectCount}s...` : `Returning in ${redirectCount}s...`}
            </p>
            <button
              onClick={() => { if (isFormOnly && window.opener) window.close(); else navigate('/podcast-apply'); }}
              style={{
                background: 'linear-gradient(135deg, #da251d, #b91d17)', color: '#fff', border: 'none',
                padding: '12px 40px', borderRadius: '50px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer'
              }}
            >
              <i className="bi bi-check-lg" style={{ marginRight: '8px' }}></i>{isFormOnly ? 'Close Tab' : 'Back to Podcast'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── FORM-ONLY MODE (opened in new tab) ───
  if (isFormOnly) {
    return (
      <div className="podcast-landing">
        <Navigation />
        <section className="podcast-form-section" style={{ paddingTop: '120px' }}>
          <div className="podcast-section-container">
            <div className="podcast-section-header">
              <div className="podcast-section-badge" style={{ background: 'rgba(218, 37, 29, 0.1)', color: '#da251d' }}>
                <i className="bi bi-pencil-square"></i>
                <span>GUEST APPLICATION</span>
              </div>
              <h2 className="podcast-section-title">Apply to Be a Guest</h2>
              <p className="podcast-section-desc">
                Fill out the form below and our editorial team will review your application. We'll get back to you within 48 hours.
              </p>
            </div>

            <div className="podcast-form-card">
              {error && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px',
                  padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px',
                  color: '#dc2626', fontWeight: 600
                }}>
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>{error}</span>
                </div>
              )}

              <Form onSubmit={handleSubmit}>
                <Row className="mb-3">
                  <Form.Group as={Col} md={6} className="mb-3 mb-md-0">
                    <Form.Label className="podcast-form-label">First Name <span style={{ color: '#da251d' }}>*</span></Form.Label>
                    <Form.Control type="text" name="firstName" placeholder="John" required value={formData.firstName} onChange={handleChange} className="podcast-form-input" />
                  </Form.Group>
                  <Form.Group as={Col} md={6}>
                    <Form.Label className="podcast-form-label">Last Name <span style={{ color: '#da251d' }}>*</span></Form.Label>
                    <Form.Control type="text" name="lastName" placeholder="Doe" required value={formData.lastName} onChange={handleChange} className="podcast-form-input" />
                  </Form.Group>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="podcast-form-label">Email Address <span style={{ color: '#da251d' }}>*</span></Form.Label>
                  <Form.Control type="email" name="email" placeholder="john@company.com" required value={formData.email} onChange={handleChange} className="podcast-form-input" />
                  <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>We'll send a confirmation to this address.</Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="podcast-form-label">Phone Number <span style={{ color: '#da251d' }}>*</span></Form.Label>
                  <Form.Control type="tel" name="phone" placeholder="+91 98765 43210" required value={formData.phone} onChange={handleChange} className="podcast-form-input" />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="podcast-form-label">Website / LinkedIn</Form.Label>
                  <Form.Control type="url" name="website" placeholder="https://linkedin.com/in/username" value={formData.website} onChange={handleChange} className="podcast-form-input" />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="podcast-form-label">Background & Topic Idea <span style={{ color: '#da251d' }}>*</span></Form.Label>
                  <Form.Control
                    as="textarea" name="background" rows={5}
                    placeholder="Tell us about your background, expertise, and what topics you'd like to discuss on the podcast..."
                    required value={formData.background} onChange={handleChange} className="podcast-form-input"
                  />
                </Form.Group>

                {dynamicFields.length > 0 && (
                  <>
                    <hr style={{ margin: '2rem 0', opacity: 0.15 }} />
                    <h5 style={{ fontWeight: 800, marginBottom: '1rem' }}>Additional Information</h5>
                    {dynamicFields.map((field) => (
                      <Form.Group className="mb-3" key={field.id}>
                        <Form.Label className="podcast-form-label">
                          {field.label} {field.required && <span style={{ color: '#da251d' }}>*</span>}
                        </Form.Label>
                        {renderDynamicField(field)}
                      </Form.Group>
                    ))}
                  </>
                )}

                <div style={{ marginTop: '2rem' }}>
                  <Button type="submit" disabled={loading} className="podcast-form-submit-btn">
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span> Submitting...</>
                    ) : (
                      <><i className="bi bi-send-fill me-2"></i> Submit Application</>
                    )}
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        </section>

        <footer className="podcast-footer">
          <div className="podcast-section-container">
            <p>© {new Date().getFullYear()} Industrial Times. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  // ─── MAIN LANDING PAGE ───
  return (
    <div className="podcast-landing">
      <Navigation />

      {/* ─── HERO SECTION ─── */}
      <section className="podcast-hero">
        <div className="podcast-hero-bg">
          <div className="podcast-hero-gradient"></div>
          <div className="podcast-hero-pattern"></div>
        </div>
        <div className="podcast-hero-content">
          <div className="podcast-hero-badge">
            <i className="bi bi-mic-fill"></i>
            <span>INDUSTRIAL TIMES PODCAST</span>
          </div>
          <h1 className="podcast-hero-title">{pageSettings.title}</h1>
          <p className="podcast-hero-desc">{pageSettings.description}</p>
          <div className="podcast-hero-actions">
            <button className="podcast-cta-btn" onClick={handleApplyClick}>
              <i className="bi bi-broadcast"></i>
              Apply for Podcast
            </button>
            {episodes.length > 0 && (
              <button
                className="podcast-cta-btn-outline"
                onClick={() => document.getElementById('podcast-episodes')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <i className="bi bi-play-circle"></i>
                Watch Episodes
              </button>
            )}
          </div>
          <div className="podcast-hero-stats">
            <div className="podcast-stat">
              <span className="podcast-stat-value">{episodes.length}+</span>
              <span className="podcast-stat-label">Episodes</span>
            </div>
            <div className="podcast-stat-divider"></div>
            <div className="podcast-stat">
              <span className="podcast-stat-value">100K+</span>
              <span className="podcast-stat-label">Listeners</span>
            </div>
            <div className="podcast-stat-divider"></div>
            <div className="podcast-stat">
              <span className="podcast-stat-value">50+</span>
              <span className="podcast-stat-label">Industry Guests</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LATEST EPISODES SECTION ─── */}
      <section className="podcast-episodes-section" id="podcast-episodes">
        <div className="podcast-section-container">
          <div className="podcast-section-header">
            <div className="podcast-section-badge">
              <i className="bi bi-collection-play-fill"></i>
              <span>LATEST EPISODES</span>
            </div>
            <h2 className="podcast-section-title">Recent Podcast Episodes</h2>
            <p className="podcast-section-desc">
              Catch up on our latest conversations with industry leaders, innovators, and manufacturing professionals.
            </p>
          </div>

          {episodes.length > 0 ? (
            <div className="podcast-episodes-grid">
              {episodes.map((ep) => (
                <div
                  className="podcast-episode-card"
                  key={ep.id}
                  onClick={() => handleEpisodeClick(ep)}
                  style={{ cursor: ep.audioUrl ? 'pointer' : 'default' }}
                >
                  <div className="podcast-episode-thumb">
                    {ep.thumbnailUrl ? (
                      <img src={ep.thumbnailUrl.startsWith('/') ? `${API_BASE}${ep.thumbnailUrl}` : ep.thumbnailUrl} alt={ep.title} />
                    ) : ep.audioUrl && ep.audioUrl.startsWith('/uploads/') ? (
                      <video
                        muted
                        preload="metadata"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        src={`${API_BASE}${ep.audioUrl}#t=1`}
                      />
                    ) : (
                      <div className="podcast-episode-thumb-placeholder">
                        <i className="bi bi-mic-fill"></i>
                      </div>
                    )}
                    {ep.duration && (
                      <span className="podcast-episode-duration">
                        <i className="bi bi-clock"></i> {ep.duration}
                      </span>
                    )}
                    {ep.episodeNumber && (
                      <span className="podcast-episode-number">EP {ep.episodeNumber}</span>
                    )}
                    {/* Play overlay icon */}
                    {ep.audioUrl && (
                      <div className="podcast-episode-play-overlay">
                        <i className="bi bi-play-circle-fill"></i>
                      </div>
                    )}
                  </div>
                  <div className="podcast-episode-body">
                    <h3 className="podcast-episode-title">{ep.title}</h3>
                    {ep.guestName && (
                      <div className="podcast-episode-guest">
                        <i className="bi bi-person-fill"></i>
                        <span>{ep.guestName}</span>
                      </div>
                    )}
                    {ep.description && (
                      <p className="podcast-episode-desc">{ep.description.length > 120 ? ep.description.substring(0, 120) + '...' : ep.description}</p>
                    )}
                    <div className="podcast-episode-footer">
                      <span className="podcast-episode-date">
                        <i className="bi bi-calendar3"></i> {formatDate(ep.publishedAt)}
                      </span>
                      {ep.audioUrl && (
                        <span className="podcast-episode-play-btn">
                          <i className="bi bi-play-fill"></i> Watch
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
              <i className="bi bi-mic" style={{ fontSize: '3rem', opacity: 0.2, display: 'block', marginBottom: '1rem' }}></i>
              <p style={{ fontWeight: 600 }}>No episodes published yet. Stay tuned!</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── VIDEO PLAYER MODAL ─── */}
      {activeVideo && (
        <div className="podcast-video-modal" onClick={() => setActiveVideo(null)}>
          <div className="podcast-video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="podcast-video-modal-close" onClick={() => setActiveVideo(null)}>
              <i className="bi bi-x-lg"></i>
            </button>
            <h3 className="podcast-video-modal-title">{activeVideo.title}</h3>
            {activeVideo.isUploaded ? (
              <video
                controls
                autoPlay
                style={{ width: '100%', borderRadius: '12px', maxHeight: '70vh', background: '#000' }}
                poster={activeVideo.thumbnail || undefined}
              >
                <source src={activeVideo.url} />
                Your browser does not support the video tag.
              </video>
            ) : (
              // For external URLs (YouTube, etc.), try to embed
              activeVideo.url.includes('youtube.com') || activeVideo.url.includes('youtu.be') ? (
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYouTubeId(activeVideo.url)}?autoplay=1`}
                    title={activeVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '12px' }}
                  ></iframe>
                </div>
              ) : (
                <video
                  controls
                  autoPlay
                  style={{ width: '100%', borderRadius: '12px', maxHeight: '70vh', background: '#000' }}
                  poster={activeVideo.thumbnail || undefined}
                >
                  <source src={activeVideo.url} />
                  Your browser does not support the video tag.
                </video>
              )
            )}
          </div>
        </div>
      )}

      {/* ─── FOOTER ─── */}
      <footer className="podcast-footer">
        <div className="podcast-section-container">
          <p>© {new Date().getFullYear()} Industrial Times. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

// Helper to extract YouTube video ID
function extractYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    return u.searchParams.get('v') || '';
  } catch {
    return '';
  }
}

export default PodcastApply;
