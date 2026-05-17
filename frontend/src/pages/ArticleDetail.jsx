import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Spinner, Badge, Modal, Form, Button } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import Advertisement from '../components/Advertisement';
import API_BASE from '../config/api';

const ArticleDetail = () => {
  const { id, category, title } = useParams();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState({ userName: '', content: '' });
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.some(fav => fav.id === parseInt(id)));
    
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/articles/${id}`);
        const data = await res.json();
        
        // Handle both 'image' and 'imageUrl' for compatibility
        const imgPath = data.image || data.imageUrl;
        if (imgPath) {
          if (imgPath.startsWith('http')) {
            data.image = imgPath;
          } else {
            // Ensure path starts with /uploads/ if it doesn't have a protocol
            const normalizedPath = imgPath.startsWith('/') ? imgPath : `/${imgPath}`;
            data.image = `${API_BASE}${normalizedPath}`;
          }
        }

        // Handle video path
        if (data.video) {
          if (data.video.startsWith('http')) {
            // Already a full URL
          } else {
            // Prepend backend URL and ensure /uploads/ is included if missing
            let normalizedVideo = data.video.startsWith('/') ? data.video : `/${data.video}`;
            // If the path doesn't already contain 'uploads', we might need to be careful,
            // but usually the backend returns paths like 'uploads/filename.mp4'
            data.video = `${API_BASE}${normalizedVideo}`;
          }
        }
        
        setArticle(data);
        setLikes(data.likesCount || 0);
        
        // Check if user has already liked this in this session/browser
        const likedArticles = JSON.parse(localStorage.getItem('liked_articles') || '[]');
        setHasLiked(likedArticles.includes(parseInt(id)));

        // Fetch comments
        const commRes = await fetch(`${API_BASE}/api/articles/${id}/comments`);
        const commData = await commRes.json();
        setComments(commData);
        
        // Fetch related articles in the same category
        if (data.category) {
          try {
            const relRes = await fetch(`${API_BASE}/api/articles/category/${data.category}`);
            const relData = await relRes.json();
            if (Array.isArray(relData)) {
              setRelated(relData.filter(a => a.id !== parseInt(id)).slice(0, 4));
            }
          } catch (e) {
            console.error("Related articles fetch error", e);
          }
        }
        
        setLoading(false);
        window.scrollTo(0, 0);
      } catch (error) {
        console.error("Error fetching article:", error);
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  const toggleFavorite = () => {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (isFavorite) {
      favorites = favorites.filter(fav => fav.id !== article.id);
    } else {
      favorites.push({
        id: article.id,
        title: article.title,
        image: article.image,
        category: article.category,
        date: article.date || 'Today'
      });
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    setIsFavorite(!isFavorite);
  };

  const handleLike = async () => {
    if (hasLiked) return;
    try {
      const res = await fetch(`${API_BASE}/api/articles/${id}/like`, { method: 'POST' });
      const data = await res.json();
      setLikes(data.likesCount);
      setHasLiked(true);
      const likedArticles = JSON.parse(localStorage.getItem('liked_articles') || '[]');
      likedArticles.push(parseInt(id));
      localStorage.setItem('liked_articles', JSON.stringify(likedArticles));
    } catch (err) {
      console.error("Like failed", err);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.userName || !newComment.content) return;
    setPostingComment(true);
    try {
      const res = await fetch(`${API_BASE}/api/articles/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newComment)
      });
      const data = await res.json();
      setComments([data, ...comments]);
      setNewComment({ userName: '', content: '' });
    } catch (err) {
      console.error("Comment failed", err);
    } finally {
      setPostingComment(false);
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Check out this news on Industrial Times: ${article.title}`;
    
    // Use Web Share API if available and on mobile
    if (platform === 'native' && navigator.share) {
      navigator.share({
        title: article.title,
        text: text,
        url: url,
      }).catch(console.error);
      return;
    }

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
        break;
      default:
        break;
    }
    setShowShareModal(false);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  if (!article) {
    return (
      <Container className="py-5 text-center">
        <h3>Article not found</h3>
        <Link to="/" className="btn btn-danger mt-3">Back to Home</Link>
      </Container>
    );
  }

  const createSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
  };

  // Helper to split content and inject ads
  const renderContentWithAds = (content) => {
    if (!content) return null;
    const paragraphs = content.split('\n').filter(p => p.trim() !== '');
    
    return (
      <>
        {paragraphs.map((p, index) => (
          <React.Fragment key={index}>
            <p>{p}</p>
            {index === 0 && (
              <div className="my-3 py-2 border-top border-bottom border-light" style={{ backgroundColor: '#fcfcfc' }}>
                <Advertisement slot="article-inline" />
              </div>
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  const articleDescription = article.excerpt || (article.content ? article.content.substring(0, 160) : 'Industrial Times News');

  return (
    <Container fluid="xl" className="py-4 reveal">
      <Helmet>
        <title>{article.title} | Industrial Times</title>
        <meta name="description" content={articleDescription} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={articleDescription} />
        <meta property="og:image" content={article.image} />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>



      <Row className="g-4">
        <Col xl={2} lg={2} className="d-none d-lg-block">
          <div className="sticky-top" style={{ top: '80px' }}>
            <Advertisement slot="left-skyscraper" />
          </div>
        </Col>

        <Col xl={7} lg={7} md={12} xs={12}>
          <nav aria-label="breadcrumb" className="mb-4">
            <ol className="breadcrumb small fw-bold">
              <li className="breadcrumb-item"><Link to="/" className="text-muted">HOME</Link></li>
              <li className="breadcrumb-item active text-danger text-uppercase">{article.category}</li>
            </ol>
          </nav>

          <Badge bg="danger" className="mb-3 px-3 py-2 fw-black text-uppercase" style={{ letterSpacing: '1px' }}>
            <i className="bi bi-broadcast me-2"></i> LIVE UPDATES
          </Badge>
          
          <h1 className="display-5 fw-black mb-4 lh-sm">{article.title}</h1>
          
          <div className="d-flex flex-wrap align-items-center gap-3 mb-4 mb-md-5 pb-3 pb-md-4 border-bottom">
            <div className="bg-dark text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px' }}>
              <i className="bi bi-person-fill fs-5"></i>
            </div>
            <div>
              <div className="fw-black small text-uppercase">Industrial Times Editorial Team</div>
              <div className="x-small text-muted fw-bold mt-1">PUBLISHED: {article.date || 'Today'} • 5 MIN READ</div>
            </div>
            <div className="ms-auto d-flex flex-wrap gap-2 align-items-center">
               <button 
                 className="btn btn-outline-secondary rounded-pill px-3 fw-bold shadow-sm btn-sm hover-lift"
                 onClick={() => setShowCommentsModal(true)}
               >
                 <i className="bi bi-chat-left-text me-2"></i> Comment
               </button>

               <button 
                 className="btn btn-dark rounded-pill px-4 fw-bold shadow-sm btn-sm hover-lift"
                 onClick={() => setShowShareModal(true)}
               >
                 <i className="bi bi-send-fill me-2"></i> Share
               </button>

               <button 
                 className={`btn ${isFavorite ? 'bg-danger text-white border-danger' : 'btn-outline-secondary'} btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center hover-scale shadow-sm`} 
                 onClick={toggleFavorite}
                 title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                 style={{ width: '36px', height: '36px', transition: 'all 0.3s ease' }}
               >
                 <i className={`bi ${isFavorite ? 'bi-bookmark-fill' : 'bi-bookmark'} fs-5`}></i>
               </button>
            </div>
          </div>

          <Modal show={showShareModal} onHide={() => setShowShareModal(false)} centered contentClassName="border-0 shadow-lg rounded-4">
            <Modal.Header closeButton className="border-0 pb-0">
              <Modal.Title className="fw-black text-uppercase small" style={{ letterSpacing: '1px' }}>Share this Story</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4 pt-2">
              <div className="text-center mb-4">
                {article.image ? (
                   <img src={article.image} alt={article.title} className="rounded-3 shadow-sm mb-3 w-100" style={{ maxHeight: '150px', objectFit: 'cover' }} />
                ) : (
                   <div className="bg-light rounded-3 mb-3 w-100 d-flex align-items-center justify-content-center" style={{ height: '150px' }}>
                      <i className="bi bi-image fs-1 text-muted opacity-25"></i>
                   </div>
                )}
                <h6 className="fw-bold px-3">{article.title}</h6>
              </div>
              <Row className="g-3">
                <Col xs={6}><button onClick={() => handleShare('whatsapp')} className="btn btn-light w-100 py-3 rounded-4 border-0 d-flex flex-column align-items-center gap-2 hover-lift transition-all shadow-sm"><i className="bi bi-whatsapp text-success fs-3"></i><span className="x-small fw-bold">WhatsApp</span></button></Col>
                <Col xs={6}><button onClick={() => handleShare('facebook')} className="btn btn-light w-100 py-3 rounded-4 border-0 d-flex flex-column align-items-center gap-2 hover-lift transition-all shadow-sm"><i className="bi bi-facebook text-primary fs-3"></i><span className="x-small fw-bold">Facebook</span></button></Col>
                <Col xs={6}><button onClick={() => handleShare('twitter')} className="btn btn-light w-100 py-3 rounded-4 border-0 d-flex flex-column align-items-center gap-2 hover-lift transition-all shadow-sm"><i className="bi bi-twitter-x text-dark fs-3"></i><span className="x-small fw-bold">Twitter</span></button></Col>
                <Col xs={6}><button onClick={() => handleShare('copy')} className="btn btn-light w-100 py-3 rounded-4 border-0 d-flex flex-column align-items-center gap-2 hover-lift transition-all shadow-sm"><i className="bi bi-link-45deg text-muted fs-3"></i><span className="x-small fw-bold">Copy Link</span></button></Col>
                {navigator.share && (
                  <Col xs={12}><button onClick={() => handleShare('native')} className="btn btn-danger w-100 py-3 rounded-4 border-0 d-flex align-items-center justify-content-center gap-2 hover-lift transition-all shadow-sm"><i className="bi bi-share fs-4"></i><span className="fw-bold">More Options</span></button></Col>
                )}
              </Row>
            </Modal.Body>
          </Modal>

          <div className="article-content">
            <div className="img-zoom-container mb-5 rounded-4 shadow-sm overflow-hidden bg-black" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {article.video ? (
                 <video 
                    controls 
                    playsInline
                    className="w-100" 
                    style={{ maxHeight: '600px', backgroundColor: '#000', outline: 'none' }} 
                    key={article.video} // Use key to force reload when video changes
                 >
                    <source src={article.video} type="video/mp4" />
                    Your browser does not support the video tag.
                 </video>
              ) : article.videoUrl ? (
                 <div className="ratio ratio-16x9">
                    <iframe 
                      src={article.videoUrl.includes('youtu.be') 
                        ? article.videoUrl.replace('youtu.be/', 'www.youtube.com/embed/') 
                        : article.videoUrl.replace('watch?v=', 'embed/').split('&')[0]
                      } 
                      title="Video Content" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                 </div>
              ) : article.image ? (
                 <img src={article.image} alt={article.title} className="w-100" style={{ maxHeight: '500px', objectFit: 'cover' }} />
              ) : (
                 <div className="d-flex align-items-center justify-content-center h-100 py-5">
                    <i className="bi bi-image fs-1 text-muted opacity-25"></i>
                 </div>
              )}
            </div>
            
            <p className="lead fw-bold text-dark mb-4">
              {article.excerpt || "Industry leaders are monitoring shifts reshaping the global landscape. This represents a fundamental transformation in industrial systems."}
            </p>
            
            <div className="article-body-text" style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#374151' }}>
              {renderContentWithAds(article.content)}
              
              <div className="bg-light p-4 rounded-4 my-5 border-start border-danger border-4 shadow-sm">
                <h5 className="fw-black mb-3 text-uppercase small" style={{ letterSpacing: '1px' }}>Industry Highlights</h5>
                <ul className="mb-0 small fw-medium text-dark">
                  {(() => {
                    try {
                      const highlightList = article.highlights ? JSON.parse(article.highlights) : null;
                      if (highlightList && Array.isArray(highlightList) && highlightList.length > 0) {
                        return highlightList.map((h, i) => (
                          <li key={i} className="mb-2 d-flex align-items-start gap-2">
                            <i className="bi bi-check-circle-fill text-danger mt-1" style={{ fontSize: '0.8rem' }}></i>
                            {h}
                          </li>
                        ));
                      }
                    } catch (e) {
                      console.error("Highlights parse error", e);
                    }
                    return (
                      <>
                        <li className="mb-2">Strategic digital transformation is now a business imperative.</li>
                        <li className="mb-2">Energy efficiency remains a top priority for global manufacturers.</li>
                        <li className="mb-0">Supply chain transparency is being enhanced through AI solutions.</li>
                      </>
                    );
                  })()}
                </ul>
              </div>

              {/* Comments Modal */}
              <Modal 
                show={showCommentsModal} 
                onHide={() => setShowCommentsModal(false)} 
                size="lg" 
                centered 
                contentClassName="border-0 shadow-lg rounded-4 overflow-hidden"
              >
                <Modal.Header closeButton className="border-bottom bg-light py-3 px-4">
                  <Modal.Title className="fw-black text-uppercase small" style={{ letterSpacing: '1px' }}>
                    Reader Discussions ({comments.length})
                  </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0">
                  <div className="comments-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <div className="p-4">
                      <Form onSubmit={handlePostComment} className="mb-5 bg-white border p-4 rounded-4 shadow-sm">
                        <h6 className="fw-bold mb-3">Join the discussion</h6>
                        <Row className="g-3">
                          <Col md={12}>
                            <Form.Control 
                              type="text" 
                              placeholder="Your Name" 
                              className="rounded-3 border-light bg-light py-2"
                              value={newComment.userName}
                              onChange={(e) => setNewComment({ ...newComment, userName: e.target.value })}
                              required
                            />
                          </Col>
                          <Col md={12}>
                            <Form.Control 
                              as="textarea" 
                              rows={3} 
                              placeholder="Share your thoughts..." 
                              className="rounded-3 border-light bg-light py-2"
                              value={newComment.content}
                              onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
                              required
                            />
                          </Col>
                          <Col md={12}>
                            <Button variant="danger" type="submit" className="rounded-pill px-4 fw-bold shadow-sm w-100 py-2" disabled={postingComment}>
                              {postingComment ? 'POSTING...' : 'POST COMMENT'}
                            </Button>
                          </Col>
                        </Row>
                      </Form>

                      <div className="comments-list">
                        {comments.length > 0 ? (
                          comments.map(comment => (
                            <div key={comment.id} className="comment-item mb-4 pb-4 border-bottom last-border-0">
                              <div className="d-flex align-items-center gap-3 mb-2">
                                <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                                  {comment.userName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="fw-bold small">{comment.userName}</div>
                                  <div className="x-small text-muted">{new Date(comment.createdAt).toLocaleDateString()}</div>
                                </div>
                              </div>
                              <p className="mb-0 text-muted" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{comment.content}</p>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-5 text-muted border border-dashed rounded-4">
                            <i className="bi bi-chat-dots display-6 mb-3 d-block opacity-25"></i>
                            No comments yet. Be the first to share your thoughts!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Modal.Body>
              </Modal>
            </div>

            <div className="mt-5 pt-5 border-top d-flex flex-wrap gap-2">
              <span className="fw-bold me-2">TAGS:</span>
              <Link to={`/category/${article.category}`} className="badge bg-light text-dark border px-3 text-decoration-none tag-hover">#{article.category}</Link>
              <Link to="/category/IndustrialUpdates" className="badge bg-light text-dark border px-3 text-decoration-none tag-hover">#IndustrialUpdates</Link>
              <Link to="/category/GlobalTrends" className="badge bg-light text-dark border px-3 text-decoration-none tag-hover">#GlobalTrends</Link>
            </div>
          </div>
        </Col>

        <Col xl={3} lg={3} className="d-none d-lg-block">
          <div className="sticky-top" style={{ top: '80px' }}>
            <h5 className="fw-black mb-4 d-flex align-items-center">
              <i className="bi bi-arrow-right-circle-fill text-danger me-2"></i> RELATED STORIES
            </h5>
            <div className="related-list mb-5">
              {related.map(item => (
                <div className="related-item d-flex gap-3 mb-4 hover-lift p-2 rounded-3 bg-white border border-light" key={item.id}>
                  <img src={item.image || item.imageUrl} alt={item.title} style={{ width: '80px', height: '80px', objectFit: 'cover' }} className="rounded-3" />
                  <div>
                    <h6 className="fw-bold mb-1 x-small" style={{ fontSize: '0.85rem' }}>
                      <Link to={`/article/${createSlug(item.category)}/${createSlug(item.title)}/${item.id}`} className="text-dark hover-text-red">{item.title}</Link>
                    </h6>
                    <div className="x-small text-danger fw-bold text-uppercase">{item.date || 'Today'}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="sidebar-ad text-end">
               <div className="d-flex justify-content-end">
                  <Advertisement slot="right-half-page" />
               </div>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ArticleDetail;
