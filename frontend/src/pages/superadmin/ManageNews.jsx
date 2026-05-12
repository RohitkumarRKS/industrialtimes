import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const ManageNews = () => {
  const location = useLocation();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showQuickEdit, setShowQuickEdit] = useState(false);
  const [quickEditCategory, setQuickEditCategory] = useState('All');
  const [editMode, setEditMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentArticle, setCurrentArticle] = useState({ 
    title: '', content: '', category: '', image: '', video: '', videoUrl: '', trending: false, state: '', city: '', highlights: [] 
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mediaUploading, setMediaUploading] = useState(false);

  const categories = [
    "Articles", "Interviews", "Trending", "Manufacturing", 
    "Automation", "Acquisitions", "Startups", "Events", 
    "Videos", "Media Kit", "Magazine"
  ];
  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir"
  ];

  const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
  const config = {
    headers: {
      Authorization: `Bearer ${adminInfo?.token}`
    }
  };

  // Handle Category Redirection from Sidebar
  useEffect(() => {
    if (location.state?.category) {
      const cat = location.state.category;
      setActiveCategory(cat);
      setEditMode(false);
      setCurrentArticle({ 
        title: '', content: '', category: cat, image: '', video: '', videoUrl: '', trending: false, state: '', city: '', highlights: [] 
      });
      setShowModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('http://localhost:5000/api/articles');
      setArticles(data);
    } catch (err) {
      setError('Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleShow = (article = null) => {
    if (article) {
      setEditMode(true);
      let highlights = [];
      try {
        highlights = article.highlights ? JSON.parse(article.highlights) : [];
      } catch (e) {
        highlights = [];
      }
      setCurrentArticle({ ...article, state: article.state || '', city: article.city || '', highlights });
    } else {
      setEditMode(false);
      setCurrentArticle({ title: '', content: '', category: activeCategory !== 'All' ? activeCategory : '', image: '', video: '', videoUrl: '', trending: false, state: '', city: '', highlights: [] });
    }
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMediaUploading(true);
    setError('');
    
    try {
      if (editMode) {
        await axios.put(`http://localhost:5000/api/articles/${currentArticle.id}`, currentArticle, config);
        setSuccess('Article updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/articles', currentArticle, config);
        setSuccess('Article published successfully!');
      }
      fetchArticles();
      setTimeout(handleClose, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed.');
    } finally {
      setMediaUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this article forever?')) {
      try {
        await axios.delete(`http://localhost:5000/api/articles/${id}`, config);
        setSuccess('Article deleted');
        fetchArticles();
      } catch (err) {
        setError('Delete failed');
      }
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setMediaUploading(true);
    try {
      const { data } = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (type === 'image') {
        setCurrentArticle({ ...currentArticle, image: data.imageUrl });
      } else {
        setCurrentArticle({ ...currentArticle, video: data.imageUrl });
      }
      setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded!`);
    } catch (err) {
      setError(`${type} upload failed`);
    } finally {
      setMediaUploading(false);
    }
  };

  const filteredArticles = activeCategory === 'All' 
    ? articles 
    : articles.filter(a => a.category === activeCategory);

  return (
    <div className="manage-news-light">
      {/* Header */}
      <div className="manage-news-header">
        <div>
          <h2 className="manage-news-title">News Repository</h2>
          <p className="manage-news-subtitle">Manage and publish articles</p>
        </div>
        <div style={{display:'flex', gap:'12px'}}>
          <button className="manage-news-publish-btn" style={{background:'#fff', color:'#111', border:'1px solid #ddd'}} onClick={() => setShowQuickEdit(true)}>
            <i className="bi bi-pencil-square"></i>
            <span>Edit News</span>
          </button>
          <button className="manage-news-publish-btn" onClick={() => handleShow()}>
            <i className="bi bi-plus-circle-fill"></i>
            <span>Publish New Article</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {success && <div className="manage-alert success">{success}</div>}
      {error && <div className="manage-alert error">{error}</div>}

      {/* Articles Grid */}
      {loading ? (
        <div className="manage-loading">
          <i className="bi bi-arrow-repeat spin"></i>
          <p>Loading articles...</p>
        </div>
      ) : (
        <div className="manage-articles-grid">
          {filteredArticles.length > 0 ? (
            filteredArticles.map((article) => (
              <div key={article.id} className="manage-article-card">
                <div className="manage-article-thumb">
                  {article.image ? (
                    <img 
                      src={article.image.startsWith('http') ? article.image : `http://localhost:5000${article.image}`} 
                      alt={article.title}
                    />
                  ) : (
                    <div className="manage-article-placeholder">
                      <i className="bi bi-newspaper"></i>
                    </div>
                  )}
                  <span className="manage-article-cat-badge">{article.category}</span>
                  {article.trending && (
                    <span className="manage-article-trending">
                      <i className="bi bi-lightning-fill"></i>
                    </span>
                  )}
                </div>
                <div className="manage-article-body">
                  <h3 className="manage-article-title">{article.title}</h3>
                  <div className="manage-article-actions">
                    <button className="manage-edit-btn" onClick={() => handleShow(article)}>
                      <i className="bi bi-pencil-square"></i> Edit
                    </button>
                    <button className="manage-delete-btn" onClick={() => handleDelete(article.id)}>
                      <i className="bi bi-trash3"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="manage-empty">
              <i className="bi bi-folder2-open"></i>
              <h3>No news found in {activeCategory}</h3>
              <p>Be the first to publish a story in this category.</p>
              <button className="manage-news-publish-btn" onClick={() => handleShow()}>Publish Now</button>
            </div>
          )}
        </div>
      )}

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="publish-modal-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
          <div className="publish-modal">
            <div className="publish-modal-header">
              <div className="publish-modal-title-row">
                <i className="bi bi-newspaper"></i>
                <h2>{editMode ? 'Edit Article' : 'New Article'}</h2>
              </div>
              <button className="publish-modal-close" onClick={handleClose}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="publish-modal-body">
              {error && <div className="publish-alert error">{error}</div>}
              {success && <div className="publish-alert success">{success}</div>}

              <form onSubmit={handleSubmit}>
                <div className="publish-form-grid">
                  <div className="publish-form-left">
                    <div className="publish-field">
                      <label>Article Title</label>
                      <input
                        type="text"
                        placeholder="Enter a compelling headline..."
                        value={currentArticle.title}
                        onChange={(e) => setCurrentArticle({ ...currentArticle, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="publish-field">
                      <label>Content Body</label>
                      <textarea
                        rows={10}
                        placeholder="Tell the story..."
                        value={currentArticle.content}
                        onChange={(e) => setCurrentArticle({ ...currentArticle, content: e.target.value })}
                        required
                      ></textarea>
                    </div>
                    <div className="publish-field">
                      <label>Key Highlights</label>
                      {currentArticle.highlights.map((h, i) => (
                        <div key={i} className="publish-highlight-row">
                          <input
                            type="text"
                            placeholder={`Point ${i+1}`}
                            value={h}
                            onChange={(e) => {
                              const newH = [...currentArticle.highlights];
                              newH[i] = e.target.value;
                              setCurrentArticle({ ...currentArticle, highlights: newH });
                            }}
                          />
                          <button type="button" className="publish-remove-btn" onClick={() => {
                            setCurrentArticle({ ...currentArticle, highlights: currentArticle.highlights.filter((_, idx) => idx !== i) });
                          }}>
                            <i className="bi bi-x"></i>
                          </button>
                        </div>
                      ))}
                      <button type="button" className="publish-add-btn" onClick={() => {
                        setCurrentArticle({ ...currentArticle, highlights: [...currentArticle.highlights, ''] });
                      }}>
                        <i className="bi bi-plus"></i> Add Highlight
                      </button>
                    </div>
                  </div>

                  <div className="publish-form-right">
                    <div className="publish-settings-card">
                      <div className="publish-field">
                        <label>Category</label>
                        <select
                          value={currentArticle.category}
                          onChange={(e) => setCurrentArticle({ ...currentArticle, category: e.target.value })}
                          required
                        >
                          <option value="">Select Category</option>
                          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div className="publish-field">
                        <label>Location (Optional)</label>
                        <select
                          value={currentArticle.state}
                          onChange={(e) => setCurrentArticle({ ...currentArticle, state: e.target.value })}
                        >
                          <option value="">Select State</option>
                          {indianStates.map(st => <option key={st} value={st}>{st}</option>)}
                        </select>
                        <input
                          type="text"
                          placeholder="City (Optional)"
                          value={currentArticle.city}
                          onChange={(e) => setCurrentArticle({ ...currentArticle, city: e.target.value })}
                          style={{ marginTop: '0.5rem' }}
                        />
                      </div>
                      <div className="publish-field">
                        <label>Cover Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'image')}
                          className="publish-file-input"
                        />
                        {currentArticle.image && (
                          <div className="publish-preview-img">
                            <img src={currentArticle.image.startsWith('http') ? currentArticle.image : `http://localhost:5000${currentArticle.image}`} alt="Preview" />
                          </div>
                        )}
                      </div>
                      <div className="publish-field">
                        <label>Video (Optional)</label>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleFileUpload(e, 'video')}
                          className="publish-file-input"
                        />
                        <div className="publish-or-divider">— OR —</div>
                        <input
                          type="url"
                          placeholder="YouTube/Vimeo URL"
                          value={currentArticle.videoUrl || ''}
                          onChange={(e) => setCurrentArticle({ ...currentArticle, videoUrl: e.target.value })}
                        />
                      </div>
                      <div className="publish-toggle-row">
                        <label className="publish-toggle">
                          <input
                            type="checkbox"
                            checked={currentArticle.trending}
                            onChange={(e) => setCurrentArticle({ ...currentArticle, trending: e.target.checked })}
                          />
                          <span className="publish-toggle-slider"></span>
                        </label>
                        <span className="publish-toggle-label">Trending Story</span>
                      </div>
                      <button type="submit" className="publish-submit-btn" disabled={mediaUploading}>
                        {mediaUploading ? (
                          <><i className="bi bi-arrow-repeat spin"></i> Processing...</>
                        ) : (
                          editMode ? 'Update Article' : 'Publish Now'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Quick Edit Modal */}
      {showQuickEdit && (
        <div className="publish-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowQuickEdit(false)}>
          <div className="publish-modal" style={{ maxWidth: '500px' }}>
            <div className="publish-modal-header">
              <div className="publish-modal-title-row">
                <i className="bi bi-pencil-square"></i>
                <h2>Select News to Edit</h2>
              </div>
              <button className="publish-modal-close" onClick={() => setShowQuickEdit(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="publish-modal-body">
              <div className="publish-field">
                <label>Step 1: Choose Category</label>
                <select value={quickEditCategory} onChange={(e) => setQuickEditCategory(e.target.value)}>
                  <option value="All">All Categories</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="publish-field">
                <label>Step 2: Choose Article</label>
                <select onChange={(e) => {
                  const article = articles.find(a => a.id === parseInt(e.target.value));
                  if(article) {
                    setShowQuickEdit(false);
                    handleShow(article);
                  }
                }}>
                  <option value="">Select an article...</option>
                  {articles.filter(a => quickEditCategory === 'All' || a.category === quickEditCategory).map(a => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageNews;
