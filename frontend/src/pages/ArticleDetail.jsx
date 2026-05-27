import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Spinner, Badge, Modal, Form, Button } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import Advertisement from '../components/Advertisement';
import MobileStickyAd from '../components/MobileStickyAd';
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
  const [showImageModal, setShowImageModal] = useState(false);

  // Reporter & Follow & Rating States
  const [userInfo, setUserInfo] = useState(null);
  const [authorProfile, setAuthorProfile] = useState(null);
  const [authorArticles, setAuthorArticles] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('userInfo');
    if (saved) {
      setUserInfo(JSON.parse(saved));
    }
  }, []);

  const fetchAuthorProfile = async (authorIdOrName) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/user/${encodeURIComponent(authorIdOrName)}`);
      if (res.ok) {
        const data = await res.json();
        setAuthorProfile(data);
        
        // Fetch follow status if logged in
        const saved = sessionStorage.getItem('userInfo');
        if (saved && data.id) {
          const u = JSON.parse(saved);
          if (u.role !== 'superadmin' && u.role !== 'admin' && parseInt(u.id) !== parseInt(data.id)) {
            const followRes = await fetch(`${API_BASE}/api/auth/follow-status/${data.id}`, {
              headers: { Authorization: `Bearer ${u.token}` }
            });
            if (followRes.ok) {
              const followData = await followRes.json();
              setIsFollowing(followData.isFollowing);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching author profile:', err);
    }
  };

  const fetchAuthorArticles = async (authorIdOrName) => {
    try {
      const isNumeric = !isNaN(authorIdOrName);
      const queryParam = isNumeric ? `authorId=${authorIdOrName}` : `authorName=${encodeURIComponent(authorIdOrName)}`;
      const res = await fetch(`${API_BASE}/api/articles?${queryParam}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAuthorArticles(data.filter(a => a.id !== parseInt(id)).slice(0, 3));
        }
      }
    } catch (err) {
      console.error('Error fetching author articles:', err);
    }
  };

  const handleFollowToggle = async () => {
    if (!userInfo) {
      alert('Please login to follow this reporter.');
      return;
    }
    if (!authorProfile?.id) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/auth/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({ reporterId: authorProfile.id })
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.followed);
        setAuthorProfile(prev => ({
          ...prev,
          followersCount: data.followersCount
        }));
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to toggle follow');
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
    }
  };

  const handleRateAuthor = async (score) => {
    if (!authorProfile?.id) return;
    setRatingLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (userInfo?.token) {
        headers['Authorization'] = `Bearer ${userInfo.token}`;
      }
      
      const res = await fetch(`${API_BASE}/api/auth/rate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reporterId: authorProfile.id, rating: score })
      });
      if (res.ok) {
        const data = await res.json();
        setAuthorProfile(prev => ({
          ...prev,
          averageRating: data.averageRating,
          ratingsCount: data.ratingsCount
        }));
        alert(`Thank you for rating! The reporter's average rating is now ${data.averageRating}.`);
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to submit rating');
      }
    } catch (err) {
      console.error('Rating error:', err);
    } finally {
      setRatingLoading(false);
    }
  };

  const StarRating = ({ rating, onRate = null, interactive = false }) => {
    const [hoverRating, setHoverRating] = useState(0);
    
    return (
      <div className="d-flex align-items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`bi ${star <= (hoverRating || rating) ? 'bi-star-fill' : 'bi-star'}`}
            style={{ 
              fontSize: interactive ? '1.5rem' : '1.1rem', 
              color: star <= (hoverRating || rating) ? '#fbbf24' : '#e5e7eb',
              cursor: interactive ? 'pointer' : 'default',
              transition: 'color 0.2s, transform 0.1s',
              transform: interactive && hoverRating === star ? 'scale(1.2)' : 'scale(1)'
            }}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    );
  };

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
              const processedRelated = relData.filter(a => a.id !== parseInt(id)).slice(0, 2).map(item => {
                let imgPath = item.image || item.imageUrl;
                if (imgPath) {
                  if (!imgPath.startsWith('http')) {
                    const normalizedPath = imgPath.startsWith('/') ? imgPath : `/${imgPath}`;
                    imgPath = `${API_BASE}${normalizedPath}`;
                  }
                }
                return { ...item, processedImage: imgPath };
              });
              setRelated(processedRelated);
            }
          } catch (e) {
            console.error("Related articles fetch error", e);
          }
        }

        // Fetch author profile & articles
        if (data.authorId) {
          fetchAuthorProfile(data.authorId);
          fetchAuthorArticles(data.authorId);
        } else if (data.author) {
          fetchAuthorProfile(data.author);
          fetchAuthorArticles(data.author);
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

  const [copyToast, setCopyToast] = useState('');

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `${article.title} — Read on Industrial Times Network`;
    const excerpt = article.excerpt || (article.content ? article.content.substring(0, 200) : '');
    
    // Use Web Share API if available and on mobile
    if (platform === 'native' && navigator.share) {
      navigator.share({
        title: article.title,
        text: text + '\n\n' + excerpt,
        url: url,
      }).catch(console.error);
      return;
    }

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n\n' + excerpt + '\n\n' + url)}`, '_blank');
        break;
      case 'facebook':
        // Use feed dialog with quote for pre-filled text (works better on iOS than sharer.php)
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text + '\n\n' + excerpt)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}&hashtags=IndustrialTimes,IndustryNews,India`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'instagram':
        // Instagram has no web share API — copy text + URL for user to paste
        const instaText = `${article.title}\n\n${excerpt}\n\nRead more: ${url}\n\n#IndustrialTimes #IndustryNews #India`;
        navigator.clipboard.writeText(instaText).then(() => {
          setCopyToast('Copied! Opening Instagram...');
          setTimeout(() => {
            setCopyToast('');
            // Try to open Instagram's creation UI (desktop) or just open instagram
            window.open('https://www.instagram.com/create/style/', '_blank');
          }, 1500);
        }).catch(() => {
          setCopyToast('Could not copy. Please copy the link manually.');
          setTimeout(() => setCopyToast(''), 3000);
        });
        return; // Don't close modal so user can see the toast
      case 'copy':
        navigator.clipboard.writeText(url);
        setCopyToast('Link copied to clipboard!');
        setTimeout(() => setCopyToast(''), 2000);
        return;
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
              <>
                <div className="my-3 py-2 border-top border-bottom border-light ad-desktop-only" style={{ backgroundColor: '#fcfcfc' }}>
                  <Advertisement slot="article-inline" />
                </div>
                <div className="my-3 py-2 ad-mobile-only mobile-ad-row">
                  <Advertisement slot="mobile-inline" />
                </div>
              </>
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  const articleDescription = article.excerpt || (article.content ? article.content.substring(0, 160) : 'Industrial Times News');

  return (
    <>
      <Container fluid className="px-3 px-md-4 px-xl-5 py-4 reveal">
        <Helmet>
        <title>{article.title} | Industrial Times</title>
        <meta name="description" content={articleDescription} />
        {article.tags && <meta name="keywords" content={article.tags} />}
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Industrial Times Network" />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={articleDescription} />
        <meta property="og:image" content={article.image} />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={articleDescription} />
        <meta name="twitter:image" content={article.image} />
      </Helmet>



      <Row className="g-4 position-relative">
        <Col xl={2} lg={2} className="d-none d-lg-block">
          <div className="sticky-top" style={{ top: '135px' }}>
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
          
          <h1 className="article-title mb-4">{article.title}</h1>
          
          <div className="d-flex flex-wrap align-items-center gap-3 mb-4 mb-md-5 pb-3 pb-md-4 border-bottom">
            {article.author ? (
              <Link to={`/author/${article.authorId || article.author}`} className="text-decoration-none">
                <div className="bg-dark text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 hover-scale" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-person-fill fs-5"></i>
                </div>
              </Link>
            ) : (
              <div className="bg-dark text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px' }}>
                <i className="bi bi-person-fill fs-5"></i>
              </div>
            )}
            <div>
              <div className="fw-black small text-uppercase d-flex align-items-center gap-2">
                {article.author ? (
                  <Link to={`/author/${article.authorId || article.author}`} className="text-dark hover-text-red text-decoration-none">
                    {article.author}
                  </Link>
                ) : (
                  <span className="text-dark">Industrial Times Editorial Team</span>
                )}
                {authorProfile && authorProfile.averageRating > 0 && (
                  <span className="text-warning fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }} title={`Rated ${authorProfile.averageRating} out of 5`}>
                    <i className="bi bi-star-fill"></i>
                    {authorProfile.averageRating.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="x-small text-muted fw-bold mt-1">
                PUBLISHED: {article.createdAt ? new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'} • 5 MIN READ
              </div>
            </div>
            <div className="ms-auto d-flex flex-wrap gap-2 align-items-center">
               <button 
                 className="btn btn-outline-secondary rounded-pill px-3 fw-bold shadow-sm btn-sm hover-lift"
                 onClick={() => setShowCommentsModal(true)}
               >
                 <i className="bi bi-chat-left-text me-2"></i> Comment
               </button>

               <button 
                 className={`btn ${hasLiked ? 'btn-danger' : 'btn-outline-danger'} rounded-pill px-3 fw-bold shadow-sm btn-sm hover-lift`}
                 onClick={handleLike}
               >
                 <i className={`bi ${hasLiked ? 'bi-heart-fill' : 'bi-heart'} me-2`}></i> {hasLiked ? 'Liked' : 'Like'} ({likes})
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

          {/* Share Modal Moved outside Container */}

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
                 <img 
                   src={article.image} 
                   alt={article.title} 
                   className="w-100 hover-scale" 
                   style={{ maxHeight: '500px', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.3s ease' }} 
                   onClick={() => setShowImageModal(true)}
                   title="Click to view full image"
                 />
              ) : (
                 <div className="d-flex align-items-center justify-content-center h-100 py-5">
                    <i className="bi bi-image fs-1 text-muted opacity-25"></i>
                 </div>
              )}
            </div>
            
            <p className="lead fw-bold text-dark mb-4">
              {article.excerpt || "Industry leaders are monitoring shifts reshaping the global landscape. This represents a fundamental transformation in industrial systems."}
            </p>
            
            <div className="article-body-text">
              {renderContentWithAds(article.content)}
              
              {(() => {
                try {
                  const highlightList = article.highlights ? JSON.parse(article.highlights) : null;
                  if (highlightList && Array.isArray(highlightList) && highlightList.length > 0) {
                    return (
                      <div className="bg-light p-4 rounded-4 my-5 border-start border-danger border-4 shadow-sm">
                        <h5 className="fw-black mb-3 text-uppercase small" style={{ letterSpacing: '1px' }}>Industry Highlights</h5>
                        <ul className="mb-0 small fw-medium text-dark">
                          {highlightList.map((h, i) => (
                            <li key={i} className="mb-2 d-flex align-items-start gap-2">
                              <i className="bi bi-check-circle-fill text-danger mt-1" style={{ fontSize: '0.8rem' }}></i>
                              {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                } catch (e) {
                  console.error("Highlights parse error", e);
                }
                return null;
              })()}
            </div>

            {/* INLINE NEWS FOOTER AD — 728 × 90 */}
            <div className="my-4 text-center">
              <Advertisement slot="inline-news-footer" />
            </div>

            {/* BOTTOM REPORTER PROFILE CARD & FEEDBACK WIDGET */}
            {authorProfile && (
              <div className="reporter-profile-card bg-white p-4 rounded-4 shadow-sm border border-light mt-5 mb-4 hover-lift-subtle">
                <Row className="align-items-center g-4">
                  <Col md={7} className="d-flex flex-column flex-sm-row align-items-center align-items-sm-start text-center text-sm-start gap-3">
                    <Link to={`/author/${authorProfile.id}`} className="text-decoration-none">
                      <div className="bg-light rounded-circle shadow-sm p-1" style={{ width: '80px', height: '80px', flexShrink: 0 }}>
                        {authorProfile.profilePic ? (
                          <img 
                            src={authorProfile.profilePic.startsWith('http') ? authorProfile.profilePic : `${API_BASE}${authorProfile.profilePic.startsWith('/') ? '' : '/'}${authorProfile.profilePic}`} 
                            alt={authorProfile.name}
                            className="rounded-circle w-100 h-100" 
                            style={{ objectFit: 'cover' }} 
                          />
                        ) : (
                          <div className="bg-danger rounded-circle w-100 h-100 d-flex align-items-center justify-content-center text-white fw-black fs-4">
                            {authorProfile.name ? authorProfile.name.charAt(0).toUpperCase() : 'E'}
                          </div>
                        )}
                      </div>
                    </Link>
                    <div>
                      <div className="d-flex align-items-center gap-2 justify-content-center justify-content-sm-start mb-1">
                        <Link to={`/author/${authorProfile.id}`} className="text-dark text-decoration-none hover-text-red">
                          <h5 className="fw-bold mb-0">{authorProfile.name}</h5>
                        </Link>
                        <Badge bg="danger" className="x-small text-uppercase px-2 py-1 shadow-sm" style={{ fontSize: '0.6rem' }}>
                          {authorProfile.role === 'corporate' ? 'Corporate' : 'Reporter'}
                        </Badge>
                      </div>
                      <p className="text-muted small mb-2" style={{ lineHeight: '1.4' }}>
                        {authorProfile.bio || 'Expert Analyst & News contributor at Industrial Times Network.'}
                      </p>
                      {authorProfile.expertise && (
                        <div className="x-small text-muted fw-bold">
                          <i className="bi bi-tag-fill text-danger me-1"></i> EXPERTISE: {authorProfile.expertise}
                        </div>
                      )}
                    </div>
                  </Col>
                  
                  <Col md={5} className="border-start-md ps-md-4 py-2 d-flex flex-column align-items-center align-items-md-start">
                    <div className="d-flex align-items-center gap-4 mb-3 text-center text-md-start w-100 justify-content-center justify-content-md-start">
                      <div>
                        <div className="h5 fw-bold text-dark mb-0">{authorProfile.followersCount || 0}</div>
                        <div className="text-muted x-small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Followers</div>
                      </div>
                      <div className="border-start ps-4">
                        <div className="h5 fw-bold text-dark mb-0 d-flex align-items-center gap-1 justify-content-center justify-content-md-start">
                          <i className="bi bi-star-fill text-warning" style={{ fontSize: '0.9rem' }}></i>
                          {authorProfile.averageRating ? authorProfile.averageRating.toFixed(1) : '0.0'}
                        </div>
                        <div className="text-muted x-small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                          Rating ({authorProfile.ratingsCount || 0})
                        </div>
                      </div>
                    </div>

                    <div className="d-flex flex-wrap gap-2 w-100 justify-content-center justify-content-md-start align-items-center">
                      {/* Follow Button: Hide for admin, superadmin, or self */}
                      {(!userInfo || (userInfo.role !== 'superadmin' && userInfo.role !== 'admin' && parseInt(userInfo.id) !== parseInt(authorProfile.id))) && (
                        <button 
                          className={`btn ${isFollowing ? 'btn-outline-secondary' : 'btn-danger'} rounded-pill px-3 py-1.5 fw-bold btn-sm hover-scale d-flex align-items-center gap-1.5`}
                          onClick={handleFollowToggle}
                        >
                          <i className={`bi ${isFollowing ? 'bi-person-check-fill' : 'bi-person-plus-fill'}`}></i>
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>
                      )}

                      {/* Interactive Rating stars: Hide for self */}
                      {(!userInfo || parseInt(userInfo.id) !== parseInt(authorProfile.id)) && (
                        <div className="d-flex align-items-center gap-2 border-start-md-only ps-md-3 ms-md-2 mt-2 mt-sm-0">
                          <span className="x-small fw-black text-uppercase text-muted" style={{ letterSpacing: '0.5px' }}>Rate:</span>
                          <StarRating rating={0} onRate={handleRateAuthor} interactive={true} />
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>
              </div>
            )}

            {/* MORE NEWS FROM THIS REPORTER */}
            {authorArticles.length > 0 && (
              <div className="reporter-more-articles-section mt-5 mb-4">
                <h5 className="fw-black mb-4 d-flex align-items-center border-bottom pb-2">
                  <i className="bi bi-journal-text text-danger me-2"></i> MORE FROM THIS REPORTER
                </h5>
                <Row className="g-3">
                  {authorArticles.map(art => {
                    const artImg = art.image || art.imageUrl;
                    const processedImg = artImg ? (artImg.startsWith('http') ? artImg : `${API_BASE}${artImg.startsWith('/') ? '' : '/'}${artImg}`) : null;
                    return (
                      <Col md={4} key={art.id}>
                        <div className="bg-white rounded-4 shadow-sm border border-light overflow-hidden hover-lift h-100 d-flex flex-column">
                          <Link to={`/article/${createSlug(art.category)}/${createSlug(art.title)}/${art.id}`} className="text-decoration-none text-dark flex-grow-1">
                            <div style={{ height: '140px', overflow: 'hidden', position: 'relative' }}>
                              {processedImg ? (
                                <img src={processedImg} className="w-100 h-100" style={{ objectFit: 'cover' }} alt={art.title} />
                              ) : (
                                <div className="w-100 h-100 bg-light d-flex align-items-center justify-content-center">
                                  <i className="bi bi-image text-muted opacity-25 fs-2"></i>
                                </div>
                              )}
                              <Badge bg="danger" className="position-absolute top-0 start-0 m-2 x-small text-uppercase">{art.category}</Badge>
                            </div>
                            <div className="p-3">
                              <h6 className="fw-bold mb-2 text-dark" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '0.95rem' }}>{art.title}</h6>
                              <div className="x-small text-muted">
                                <i className="bi bi-calendar-event me-1"></i>
                                {new Date(art.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                            </div>
                          </Link>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            )}

            <div className="mt-5 pt-5 border-top d-flex flex-wrap gap-2">
              <span className="fw-bold me-2">TAGS:</span>
              <Link to={`/category/${article.category}`} className="badge bg-light text-dark border px-3 text-decoration-none tag-hover">#{article.category}</Link>
              <Link to="/category/IndustrialUpdates" className="badge bg-light text-dark border px-3 text-decoration-none tag-hover">#IndustrialUpdates</Link>
              <Link to="/category/GlobalTrends" className="badge bg-light text-dark border px-3 text-decoration-none tag-hover">#GlobalTrends</Link>
            </div>

            {/* MOBILE RELATED STORIES — shows only on mobile/tablet screens */}
            {related.length > 0 && (
              <div className="d-lg-none mt-5 pt-4 border-top">
                <h5 className="fw-black mb-4 d-flex align-items-center">
                  <i className="bi bi-arrow-right-circle-fill text-danger me-2"></i> RELATED STORIES
                </h5>
                <div className="row g-3">
                  {related.map(item => (
                    <div className="col-12 col-md-6" key={item.id}>
                      <div className="related-item d-flex gap-3 hover-lift p-2 rounded-3 bg-white border border-light shadow-sm h-100">
                        {item.processedImage ? (
                          <img src={item.processedImage} alt={item.title} style={{ width: '80px', height: '80px', objectFit: 'cover' }} className="rounded-3 flex-shrink-0" />
                        ) : (
                          <div className="bg-light border rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '80px', height: '80px' }}>
                            <i className="bi bi-image fs-4 text-muted opacity-50"></i>
                          </div>
                        )}
                        <div>
                          <h6 className="fw-bold mb-1" style={{ fontSize: '0.88rem', lineHeight: '1.4' }}>
                            <Link to={`/article/${createSlug(item.category)}/${createSlug(item.title)}/${item.id}`} className="text-dark hover-text-red text-decoration-none" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</Link>
                          </h6>
                          <div className="x-small text-danger fw-bold text-uppercase mt-1">{item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Col>

        <Col xl={3} lg={3} className="d-none d-lg-block">
          <div>
            <h5 className="fw-black mb-4 d-flex align-items-center">
              <i className="bi bi-arrow-right-circle-fill text-danger me-2"></i> RELATED STORIES
            </h5>
            <div className="related-list mb-4">
              {related.map(item => (
                <div className="related-item d-flex gap-3 mb-4 hover-lift p-2 rounded-3 bg-white border border-light shadow-sm" key={item.id}>
                  {item.processedImage ? (
                    <img src={item.processedImage} alt={item.title} style={{ width: '80px', height: '80px', objectFit: 'cover' }} className="rounded-3 flex-shrink-0" />
                  ) : (
                    <div className="bg-light border rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '80px', height: '80px' }}>
                      <i className="bi bi-image fs-4 text-muted opacity-50"></i>
                    </div>
                  )}
                  <div>
                    <h6 className="fw-bold mb-1 x-small" style={{ fontSize: '0.85rem' }}>
                      <Link to={`/article/${createSlug(item.category)}/${createSlug(item.title)}/${item.id}`} className="text-dark hover-text-red text-decoration-none" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</Link>
                    </h6>
                    <div className="x-small text-danger fw-bold text-uppercase mt-1">{item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'}</div>
                  </div>
                </div>
              ))}
            </div>
            {related.length > 0 && (
              <div className="text-start mb-5">
                <Link to={`/category/${article.category}`} className="btn btn-outline-danger btn-sm rounded-pill px-4 fw-bold shadow-sm hover-lift text-uppercase w-100" style={{ letterSpacing: '0.5px' }}>
                  View All Related Stories
                </Link>
              </div>
            )}
          </div>

          <div className="sticky-top" style={{ top: '135px' }}>
            <Advertisement slot="right-half-page" />
          </div>
        </Col>
      </Row>

      {/* ── TOP / BOTTOM BANNER (970 × 90) ── */}
      <div className="d-none d-xl-block mt-4 mb-0 text-center">
        <Advertisement slot="top-bottom-banner" />
      </div>
    </Container>

      <Modal show={showShareModal} onHide={() => setShowShareModal(false)} centered contentClassName="border-0 shadow-lg rounded-4" className="premium-modal">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-black text-uppercase small" style={{ letterSpacing: '1px' }}>Share this Story</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 pt-2">
          <div className="d-flex align-items-center bg-light rounded-4 p-3 mb-4 shadow-sm border border-light">
            {article.image ? (
               <img src={article.image} alt={article.title} className="rounded-3 flex-shrink-0" style={{ width: '72px', height: '72px', objectFit: 'cover' }} />
            ) : (
               <div className="bg-white border rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '72px', height: '72px' }}>
                  <i className="bi bi-image fs-3 text-muted opacity-50"></i>
               </div>
            )}
            <div className="ms-3 text-start overflow-hidden">
               <h6 className="fw-bold mb-1 lh-sm text-dark" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '0.95rem' }}>
                 {article.title}
               </h6>
               <span className="text-muted x-small text-uppercase fw-bold d-block mt-1" style={{ letterSpacing: '0.5px', color: '#64748b' }}>
                 industrial-times.com
               </span>
            </div>
          </div>
          {copyToast && (
            <div className="alert alert-success py-2 px-3 text-center small fw-bold mb-4 rounded-pill shadow-sm" style={{ fontSize: '0.85rem' }}>
              <i className="bi bi-check-circle-fill me-2"></i>{copyToast}
            </div>
          )}
          
          <div className="d-flex flex-wrap justify-content-center gap-3 mb-2">
            <div className="d-flex flex-column align-items-center gap-2" style={{ width: '70px' }}>
              <button onClick={() => handleShare('whatsapp')} className="btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center hover-lift" style={{ width: '56px', height: '56px', backgroundColor: '#e8f9ec' }}>
                <i className="bi bi-whatsapp fs-4" style={{ color: '#25D366' }}></i>
              </button>
              <span className="x-small fw-bold text-muted">WhatsApp</span>
            </div>
            
            <div className="d-flex flex-column align-items-center gap-2" style={{ width: '70px' }}>
              <button onClick={() => handleShare('facebook')} className="btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center hover-lift" style={{ width: '56px', height: '56px', backgroundColor: '#e6f0fa' }}>
                <i className="bi bi-facebook fs-4" style={{ color: '#1877F2' }}></i>
              </button>
              <span className="x-small fw-bold text-muted">Facebook</span>
            </div>

            <div className="d-flex flex-column align-items-center gap-2" style={{ width: '70px' }}>
              <button onClick={() => handleShare('twitter')} className="btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center hover-lift" style={{ width: '56px', height: '56px', backgroundColor: '#f0f0f0' }}>
                <i className="bi bi-twitter-x fs-4 text-dark"></i>
              </button>
              <span className="x-small fw-bold text-muted">X</span>
            </div>

            <div className="d-flex flex-column align-items-center gap-2" style={{ width: '70px' }}>
              <button onClick={() => handleShare('instagram')} className="btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center hover-lift" style={{ width: '56px', height: '56px', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
                <i className="bi bi-instagram fs-4 text-white"></i>
              </button>
              <span className="x-small fw-bold text-muted">Instagram</span>
            </div>

            <div className="d-flex flex-column align-items-center gap-2" style={{ width: '70px' }}>
              <button onClick={() => handleShare('linkedin')} className="btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center hover-lift" style={{ width: '56px', height: '56px', backgroundColor: '#eaf2fa' }}>
                <i className="bi bi-linkedin fs-4" style={{ color: '#0A66C2' }}></i>
              </button>
              <span className="x-small fw-bold text-muted">LinkedIn</span>
            </div>

            <div className="d-flex flex-column align-items-center gap-2" style={{ width: '70px' }}>
              <button onClick={() => handleShare('copy')} className="btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center hover-lift" style={{ width: '56px', height: '56px', backgroundColor: '#f8f9fa' }}>
                <i className="bi bi-link-45deg fs-4 text-secondary"></i>
              </button>
              <span className="x-small fw-bold text-muted">Copy Link</span>
            </div>
          </div>

          {navigator.share && (
            <div className="mt-4 pt-3 border-top text-center">
              <button onClick={() => handleShare('native')} className="btn btn-outline-dark rounded-pill px-4 py-2 fw-bold small hover-lift shadow-sm">
                <i className="bi bi-share me-2"></i>More Options
              </button>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <Modal 
        show={showCommentsModal} 
        onHide={() => setShowCommentsModal(false)} 
        size="lg" 
        centered 
        contentClassName="border-0 shadow-lg rounded-4 overflow-hidden"
        className="premium-modal"
      >
        <Modal.Header closeButton className="border-bottom bg-light py-3 px-4">
          <Modal.Title className="fw-black text-uppercase small" style={{ letterSpacing: '1px' }}>
            Reader Discussions ({comments.length})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <div className="comments-modal-body custom-scrollbar" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
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

      {/* Full-size Image Modal */}
      <Modal 
        show={showImageModal} 
        onHide={() => setShowImageModal(false)} 
        size="xl" 
        centered 
        contentClassName="bg-transparent border-0"
      >
        <Modal.Header closeButton closeVariant="white" className="border-0 position-absolute top-0 end-0 z-3 p-4"></Modal.Header>
        <Modal.Body className="p-0 text-center d-flex align-items-center justify-content-center" onClick={() => setShowImageModal(false)} style={{ cursor: 'zoom-out' }}>
          {article?.image && (
            <img 
              src={article.image} 
              alt={article.title} 
              style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} 
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* MOBILE STICKY BOTTOM BANNER — 320×50 */}
      <MobileStickyAd category={article?.category} />
    </>
  );
};

export default ArticleDetail;
