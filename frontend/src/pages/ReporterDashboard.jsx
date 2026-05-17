import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config/api';

const allCategories = [
  'Articles', 'Interviews', 'Trending', 'Manufacturing',
  'Automation', 'Acquisitions', 'Startups', 'Events',
  'Videos', 'Media Kit', 'Magazine'
];

const ReporterDashboard = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  // Publish form state
  const [showPublish, setShowPublish] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState({ text: '', type: '' });
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    category: 'Articles',
    image: null
  });

  useEffect(() => {
    const saved = sessionStorage.getItem('userInfo');
    if (saved) {
      const u = JSON.parse(saved);
      if (u.role !== 'author') {
        navigate('/profile');
        return;
      }
      setUserInfo(u);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/articles`);
      setArticles(data || []);
    } catch (e) {
      console.error('Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('userInfo');
    navigate('/login');
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    setPublishing(true);
    setPublishMsg({ text: '', type: '' });

    try {
      const formData = new FormData();
      formData.append('title', articleForm.title);
      formData.append('content', articleForm.content);
      formData.append('category', articleForm.category);
      formData.append('author', userInfo.name);
      if (articleForm.image) {
        formData.append('image', articleForm.image);
      }

      await axios.post(`${API_BASE}/api/articles`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setPublishMsg({ text: 'Article published successfully! It is now live on the website.', type: 'success' });
      setArticleForm({ title: '', content: '', category: 'Articles', image: null });
      fetchArticles();
      
      // Reset file input
      const fileInput = document.getElementById('reporter-article-image');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setPublishMsg({ text: err.response?.data?.message || 'Failed to publish article', type: 'error' });
    } finally {
      setPublishing(false);
    }
  };

  if (!userInfo) return null;

  const myArticles = articles.filter(a =>
    a.author && a.author.toLowerCase() === userInfo.name.toLowerCase()
  );
  const totalViews = myArticles.reduce((sum, a) => sum + (a.views || 0), 0);
  const topArticle = myArticles.length > 0 ? [...myArticles].sort((a, b) => (b.views || 0) - (a.views || 0))[0] : null;
  const uniqueCategories = [...new Set(myArticles.map(a => a.category))];

  return (
    <div style={{ background: '#f4f7f6', minHeight: '100vh' }}>
      {/* Top Navigation Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="/industrialtimes_white.png" alt="IT" style={{ height: '32px' }} />
          <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Reporter Portal
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
          >
            <i className="bi bi-globe me-1"></i>View Website
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              {userInfo.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>{userInfo.name}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Reporter</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ background: 'rgba(239,68,68,0.2)', border: 'none', color: '#ef4444', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
          >
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
          {[
            { label: 'Published Articles', value: myArticles.length, icon: 'bi-file-earmark-text', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Total Views', value: totalViews.toLocaleString(), icon: 'bi-eye', color: '#3b82f6', bg: '#f0f9ff', border: '#bfdbfe' },
            { label: 'Avg Views', value: myArticles.length > 0 ? Math.round(totalViews / myArticles.length) : 0, icon: 'bi-graph-up', color: '#8b5cf6', bg: '#faf5ff', border: '#e9d5ff' },
            { label: 'Categories', value: uniqueCategories.length, icon: 'bi-tags', color: '#f59e0b', bg: '#fffbeb', border: '#fef3c7' }
          ].map((stat, i) => (
            <div key={i} style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '20px',
              border: `1px solid ${stat.border}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'transform 0.2s',
              cursor: 'default'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  <i className={`bi ${stat.icon}`}></i>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111' }}>{stat.value}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { key: 'overview', label: 'My Articles', icon: 'bi-file-earmark-text' },
            { key: 'publish', label: 'Publish New', icon: 'bi-plus-circle' },
            { key: 'profile', label: 'My Profile', icon: 'bi-person' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 22px',
                borderRadius: '12px',
                border: activeTab === tab.key ? '2px solid #10b981' : '2px solid #e5e7eb',
                background: activeTab === tab.key ? '#10b981' : '#fff',
                color: activeTab === tab.key ? '#fff' : '#64748b',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className={`bi ${tab.icon}`}></i>{tab.label}
            </button>
          ))}
        </div>

        {/* === MY ARTICLES TAB === */}
        {activeTab === 'overview' && (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '0', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 style={{ fontWeight: 800, margin: 0 }}>
                <i className="bi bi-file-earmark-text me-2" style={{ color: '#10b981' }}></i>
                My Published Articles ({myArticles.length})
              </h5>
              <button
                onClick={() => setActiveTab('publish')}
                style={{
                  background: '#10b981', border: 'none', color: '#fff', padding: '10px 20px',
                  borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                }}
              >
                <i className="bi bi-plus-lg me-1"></i>Write New Article
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <div className="spinner-border text-success" role="status"></div>
              </div>
            ) : myArticles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <i className="bi bi-file-earmark-plus" style={{ fontSize: '3rem', color: '#cbd5e1', display: 'block', marginBottom: '12px' }}></i>
                <p style={{ fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>No Articles Published Yet</p>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '16px' }}>Start writing your first article to build your portfolio.</p>
                <button onClick={() => setActiveTab('publish')} style={{ background: '#10b981', border: 'none', color: '#fff', padding: '10px 24px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
                  <i className="bi bi-pencil me-1"></i>Write Article
                </button>
              </div>
            ) : (
              <div style={{ padding: '0' }}>
                {myArticles.map((article, idx) => (
                  <div key={article.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px 24px',
                    borderBottom: idx < myArticles.length - 1 ? '1px solid #f1f5f9' : 'none',
                    transition: 'background 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => navigate(`/article/${article.category}/${encodeURIComponent(article.title)}/${article.id}`)}
                  >
                    <div style={{
                      width: '70px', height: '50px', borderRadius: '10px', overflow: 'hidden',
                      background: '#e5e7eb', flexShrink: 0
                    }}>
                      {article.imageUrl ? (
                        <img src={`${API_BASE}${article.imageUrl}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                          <i className="bi bi-image"></i>
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem' }}>{article.title}</p>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
                        <span style={{ background: '#f0fdf4', color: '#10b981', padding: '2px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>{article.category}</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                          {new Date(article.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111' }}>{(article.views || 0).toLocaleString()}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600 }}>views</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === PUBLISH TAB === */}
        {activeTab === 'publish' && (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h5 style={{ fontWeight: 800, marginBottom: '24px' }}>
              <i className="bi bi-pencil-square me-2" style={{ color: '#10b981' }}></i>
              Publish New Article
            </h5>

            {publishMsg.text && (
              <div style={{
                background: publishMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                color: publishMsg.type === 'success' ? '#16a34a' : '#dc2626',
                padding: '14px 18px',
                borderRadius: '12px',
                fontSize: '0.88rem',
                marginBottom: '1.5rem',
                border: `1px solid ${publishMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                fontWeight: 600
              }}>
                <i className={`bi ${publishMsg.type === 'success' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-2`}></i>
                {publishMsg.text}
              </div>
            )}

            <form onSubmit={handlePublish}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 700, fontSize: '0.85rem', color: '#374151', display: 'block', marginBottom: '8px' }}>
                  Article Title *
                </label>
                <input
                  type="text"
                  value={articleForm.title}
                  onChange={e => setArticleForm({ ...articleForm, title: e.target.value })}
                  required
                  placeholder="Enter a compelling headline..."
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: '12px',
                    border: '2px solid #e5e7eb', fontSize: '1rem', fontWeight: 600,
                    outline: 'none', transition: 'border-color 0.3s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#10b981'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 700, fontSize: '0.85rem', color: '#374151', display: 'block', marginBottom: '8px' }}>
                  Category *
                </label>
                <select
                  value={articleForm.category}
                  onChange={e => setArticleForm({ ...articleForm, category: e.target.value })}
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: '12px',
                    border: '2px solid #e5e7eb', fontSize: '0.9rem', fontWeight: 600,
                    outline: 'none', background: '#fff', cursor: 'pointer'
                  }}
                >
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 700, fontSize: '0.85rem', color: '#374151', display: 'block', marginBottom: '8px' }}>
                  Featured Image
                </label>
                <input
                  type="file"
                  id="reporter-article-image"
                  accept="image/*"
                  onChange={e => setArticleForm({ ...articleForm, image: e.target.files[0] || null })}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                    border: '2px dashed #e5e7eb', fontSize: '0.85rem',
                    background: '#fafafa', cursor: 'pointer'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontWeight: 700, fontSize: '0.85rem', color: '#374151', display: 'block', marginBottom: '8px' }}>
                  Article Content *
                </label>
                <textarea
                  value={articleForm.content}
                  onChange={e => setArticleForm({ ...articleForm, content: e.target.value })}
                  required
                  placeholder="Write your article content here... You can format your content with paragraphs."
                  rows={12}
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: '12px',
                    border: '2px solid #e5e7eb', fontSize: '0.9rem', fontWeight: 500,
                    outline: 'none', resize: 'vertical', lineHeight: 1.7,
                    transition: 'border-color 0.3s', fontFamily: 'inherit'
                  }}
                  onFocus={e => e.target.style.borderColor = '#10b981'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                  {articleForm.content.length} characters
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={publishing}
                  style={{
                    background: '#10b981', border: 'none', color: '#fff',
                    padding: '14px 32px', borderRadius: '12px', fontWeight: 800,
                    fontSize: '0.9rem', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', gap: '8px'
                  }}
                >
                  {publishing ? (
                    <><span className="spinner-border spinner-border-sm"></span> Publishing...</>
                  ) : (
                    <><i className="bi bi-send-fill"></i> Publish Article</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setArticleForm({ title: '', content: '', category: 'Articles', image: null })}
                  style={{
                    background: '#f1f5f9', border: 'none', color: '#64748b',
                    padding: '14px 24px', borderRadius: '12px', fontWeight: 700,
                    fontSize: '0.85rem', cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        )}

        {/* === PROFILE TAB === */}
        {activeTab === 'profile' && (
          <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            {/* Profile Header */}
            <div style={{
              background: 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)',
              padding: '40px 32px',
              textAlign: 'center',
              color: '#fff'
            }}>
              <div style={{
                width: '90px', height: '90px', borderRadius: '50%', background: '#10b981',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', fontWeight: 900, margin: '0 auto 16px',
                border: '4px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}>
                {userInfo.name.charAt(0).toUpperCase()}
              </div>
              <h3 style={{ fontWeight: 900, marginBottom: '4px' }}>{userInfo.name}</h3>
              <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '4px 16px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                VERIFIED REPORTER
              </span>
            </div>

            <div style={{ padding: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Email</label>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111', margin: '4px 0 0' }}>{userInfo.email}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Phone</label>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111', margin: '4px 0 0' }}>{userInfo.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Expertise</label>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111', margin: '4px 0 0' }}>{userInfo.expertise || 'General'}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</label>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: '#10b981', margin: '4px 0 0' }}>
                    <i className="bi bi-check-circle-fill me-1"></i>Active
                  </p>
                </div>
                {userInfo.bio && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Bio</label>
                    <p style={{ fontWeight: 500, fontSize: '0.9rem', color: '#374151', margin: '4px 0 0', lineHeight: 1.7 }}>{userInfo.bio}</p>
                  </div>
                )}
                {userInfo.portfolio && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Portfolio</label>
                    <p style={{ margin: '4px 0 0' }}>
                      <a href={userInfo.portfolio} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontWeight: 700, textDecoration: 'none' }}>
                        <i className="bi bi-link-45deg me-1"></i>{userInfo.portfolio}
                      </a>
                    </p>
                  </div>
                )}
              </div>

              {/* Performance Summary */}
              {topArticle && (
                <div style={{
                  marginTop: '32px', padding: '24px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', border: '1px solid #bbf7d0'
                }}>
                  <h6 style={{ fontWeight: 800, color: '#064e3b', marginBottom: '12px' }}>
                    <i className="bi bi-trophy-fill me-2" style={{ color: '#f59e0b' }}></i>
                    Top Performing Article
                  </h6>
                  <p style={{ fontWeight: 700, margin: '0 0 4px', color: '#111' }}>{topArticle.title}</p>
                  <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>
                    {(topArticle.views || 0).toLocaleString()} views • {topArticle.category}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}} />
    </div>
  );
};

export default ReporterDashboard;
