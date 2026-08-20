import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Spinner, Badge, Modal, Form, Button } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import Advertisement from '../components/Advertisement';
import MobileStickyAd from '../components/MobileStickyAd';
import ColombiaAd from '../components/ColombiaAd';
import API_BASE from '../config/api';
import { createSlug } from '../utils/slugify';
import { getRelativeTime, formatPublishDate } from '../utils/timeFormatter';
import { linkifyText } from '../utils/linkify';

const getReporterLevel = (followersCount = 0, thresholds = { silver: 10, gold: 50, diamond: 100 }) => {
  const count = parseInt(followersCount) || 0;
  if (count >= (thresholds.diamond || 100)) return { level: 'Diamond', color: '#38bdf8', icon: 'bi-gem', bg: '#e0f2fe', text: '#0369a1' };
  if (count >= (thresholds.gold || 50)) return { level: 'Gold', color: '#fbbf24', icon: 'bi-trophy-fill', bg: '#fef3c7', text: '#b45309' };
  if (count >= (thresholds.silver || 10)) return { level: 'Silver', color: '#94a3b8', icon: 'bi-award-fill', bg: '#f1f5f9', text: '#475569' };
  return { level: 'Bronze', color: '#cd7f32', icon: 'bi-award', bg: '#ffedd5', text: '#c2410c' };
};

const getSafeJSON = (key, fallback = null) => {
  try {
    const val = localStorage.getItem(key);
    if (!val || val === 'undefined') return fallback;
    return JSON.parse(val);
  } catch (e) {
    localStorage.removeItem(key);
    return fallback;
  }
};

// StarRating component defined outside to ensure reference stability and prevent React Error #300.
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

const ArticleDetail = () => {
  const { id, title } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [reporterThresholds, setReporterThresholds] = useState({ silver: 10, gold: 50, diamond: 100 });
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
    setUserInfo(getSafeJSON('userInfo'));
  }, []);
 
  const fetchAuthorProfile = async (authorIdOrName) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/user/${encodeURIComponent(authorIdOrName)}`);
      if (res.ok) {
        const data = await res.json();
        setAuthorProfile(data);
        
        // Fetch articles based on resolved user profile details
        if (data.id) {
          fetchAuthorArticles(data.id);
        } else if (data.name) {
          fetchAuthorArticles(data.name);
        }
 
        // Fetch follow status if logged in
        const u = getSafeJSON('userInfo');
        if (u && data.id) {
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
          const currentId = article?.id || parseInt(id);
          setAuthorArticles(data.filter(a => a.id !== currentId).slice(0, 3));
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

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        let res;
        if (id) {
          res = await fetch(`${API_BASE}/api/articles/${id}`);
        } else {
          res = await fetch(`${API_BASE}/api/articles/slug/${encodeURIComponent(title)}`);
        }
        
        if (!res.ok) {
          setArticle(null);
          setLoading(false);
          return;
        }

        const data = await res.json();
        if (!data || !data.id) {
          setArticle(null);
          setLoading(false);
          return;
        }
        
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
            data.video = `${API_BASE}${normalizedVideo}`;
          }
        }
        
        setArticle(data);
        setLikes(data.likesCount || 0);

        // Favorites check
        const favorites = getSafeJSON('favorites', []);
        setIsFavorite(favorites.some(fav => fav.id === data.id));
        
        // Check if user has already liked this in this session/browser
        const likedArticles = getSafeJSON('liked_articles', []);
        setHasLiked(likedArticles.includes(data.id));

        setLoading(false);
        window.scrollTo(0, 0);

        // Fetch comments, related articles, and author profile in PARALLEL for maximum speed
        const isSystemAdmin = !data.author || 
          data.author.toLowerCase() === 'admin' || 
          data.author.toLowerCase() === 'superadmin' || 
          data.author === 'Industrial Times';
        const lookupKey = isSystemAdmin ? 'Industrial Times' : (data.authorId || data.author);

        fetchAuthorProfile(lookupKey);

        Promise.allSettled([
          fetch(`${API_BASE}/api/articles/${data.id}/comments`).then(r => r.ok ? r.json() : []),
          data.category ? fetch(`${API_BASE}/api/articles/category/${data.category}`).then(r => r.ok ? r.json() : []) : Promise.resolve([])
        ]).then(([commResult, relResult]) => {
          if (commResult.status === 'fulfilled' && Array.isArray(commResult.value)) {
            setComments(commResult.value);
          }
          if (relResult.status === 'fulfilled' && Array.isArray(relResult.value)) {
            const processedRelated = relResult.value.filter(a => a.id !== data.id).slice(0, 2).map(item => {
              let imgPath = item.image || item.imageUrl;
              if (imgPath && !imgPath.startsWith('http')) {
                const normalizedPath = imgPath.startsWith('/') ? imgPath : `/${imgPath}`;
                imgPath = `${API_BASE}${normalizedPath}`;
              }
              return { ...item, processedImage: imgPath };
            });
            setRelated(processedRelated);
          }
        });

        // Redirect to canonical URL if the ID parameter is missing
        if (!id && data.id) {
          const canonicalUrl = `/article/${createSlug(data.category || 'news')}/${createSlug(data.title)}/${data.id}`;
          navigate(canonicalUrl, { replace: true });
        }
      } catch (error) {
        console.error("Error fetching article:", error);
        setArticle(null);
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id, title]);

  const toggleFavorite = () => {
    let favorites = getSafeJSON('favorites', []);
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
    if (hasLiked || !article) return;
    const articleId = article.id;
    try {
      const res = await fetch(`${API_BASE}/api/articles/${articleId}/like`, { method: 'POST' });
      const data = await res.json();
      setLikes(data.likesCount);
      setHasLiked(true);
      const likedArticles = getSafeJSON('liked_articles', []);
      likedArticles.push(articleId);
      localStorage.setItem('liked_articles', JSON.stringify(likedArticles));
    } catch (err) {
      console.error("Like failed", err);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.content || !article) return;
    if (!userInfo) {
      alert("Please log in to post a comment.");
      return;
    }
    const articleId = article.id;
    setPostingComment(true);
    try {
      const res = await fetch(`${API_BASE}/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({ content: newComment.content })
      });
      if (!res.ok) {
        throw new Error("Failed to post comment");
      }
      const data = await res.json();
      setComments([data, ...comments]);
      setNewComment({ userName: '', content: '' });
    } catch (err) {
      console.error("Comment failed", err);
      alert("Failed to post comment. Please try again.");
    } finally {
      setPostingComment(false);
    }
  };

  const [copyToast, setCopyToast] = useState('');

  const handleShare = (platform) => {
    const url = `${window.location.protocol}//${window.location.host}/article/${createSlug(article.category || 'news')}/${createSlug(article.title)}`;
    const text = `${article.title} — Read on Industrial Times`;
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


  const getCategoryLink = (categoryName) => {
    if (!categoryName) return '/';
    const cat = categoryName.toLowerCase().trim();
    const knownCategories = ['news', 'regional', 'articles', 'trending', 'oem', 'automation', 'interview', 'startup', 'business', 'event', 'entertainment', 'sports', 'education', 'tender', 'astrology'];
    if (knownCategories.includes(cat)) {
      return `/${cat}`;
    }
    return `/category/${encodeURIComponent(categoryName)}`;
  };

  const renderEmbed = (url) => {
    if (!url) return null;
    
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0];
      } else if (url.includes('watch?v=')) {
        videoId = url.split('watch?v=')[1]?.split('&')[0];
      } else if (url.includes('embed/')) {
        videoId = url.split('embed/')[1]?.split('?')[0]?.split('&')[0];
      } else if (url.includes('shorts/')) {
        videoId = url.split('shorts/')[1]?.split('?')[0]?.split('&')[0];
      }

      const params = 'autoplay=1&mute=1&enablejsapi=1&rel=0&modestbranding=1&iv_load_policy=3' + (videoId ? `&playlist=${videoId}` : '');
      let baseSrc = url.includes('youtu.be') 
        ? url.replace('youtu.be/', 'www.youtube.com/embed/') 
        : url.replace('watch?v=', 'embed/').split('&')[0];
      
      const src = videoId 
        ? `https://www.youtube.com/embed/${videoId}?${params}`
        : `${baseSrc}${baseSrc.includes('?') ? '&' : '?'}${params}`;

      return (
        <div className="ratio ratio-16x9 w-100">
          <iframe src={src} title="YouTube Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
        </div>
      );
    }
    
    // Facebook
    if (url.includes('facebook.com')) {
      const src = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=500&autoplay=true`;
      return (
        <div className="d-flex justify-content-center w-100 py-4 bg-white">
          <iframe src={src} width="500" height="500" style={{ border: 'none', overflow: 'hidden' }} scrolling="no" frameBorder="0" allowFullScreen={true} allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
        </div>
      );
    }
    
    // Instagram
    if (url.includes('instagram.com/p/') || url.includes('instagram.com/reel/')) {
      const src = url.endsWith('/') ? `${url}embed` : `${url}/embed`;
      return (
        <div className="d-flex justify-content-center w-100 py-4 bg-white">
          <iframe src={src} width="400" height="500" frameBorder="0" scrolling="no" allowTransparency="true" allow="encrypted-media"></iframe>
        </div>
      );
    }
    
    // Generic Fallback
    return (
      <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5 w-100" style={{ background: '#f8f9fa' }}>
        <i className="bi bi-link-45deg text-danger" style={{ fontSize: '3rem' }}></i>
        <h5 className="fw-bold mt-3 text-dark">External Media Attached</h5>
        <p className="text-muted small mb-4">Click below to view this media content on its native platform.</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-danger rounded-pill px-4 fw-bold shadow-sm">
          <i className="bi bi-box-arrow-up-right me-2"></i> View Media Content
        </a>
      </div>
    );
  };

  // Helper to split content and inject ads
  const renderContentWithAds = (content) => {
    if (!content) return null;
    const paragraphs = content.split('\n').filter(p => p.trim() !== '');
    
    return (
      <>
        {paragraphs.map((p, index) => (
          <React.Fragment key={index}>
            <p>{linkifyText(p)}</p>
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
        <meta property="og:site_name" content="Industrial Times" />
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
          
          {/* CHANGED: Heading size adjusted responsively: clamp(1.4rem, 5vw, 2.0rem) */}
          <h1 className="article-title mb-4" style={{ fontSize: 'clamp(1.4rem, 5vw, 2.0rem)', fontWeight: 800 }}>{article.title}</h1>
          
          <div className="d-flex flex-wrap align-items-center gap-3 mb-4 mb-md-5 pb-3 pb-md-4 border-bottom">
            {(() => {
              const isSystemAdmin = !article.author || 
                article.author.toLowerCase() === 'admin' || 
                article.author.toLowerCase() === 'superadmin' || 
                article.author === 'Industrial Times';
              
              const authorProfileLink = isSystemAdmin ? '/author/Industrial-Times' : `/author/${article.authorId || article.author}`;

              return (
                <Link to={authorProfileLink} className="text-decoration-none">
                  <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 hover-scale shadow-sm bg-white border border-light" style={{ width: '40px', height: '40px', overflow: 'hidden' }}>
                    {isSystemAdmin ? (
                      <img src="/icon.png" alt="ITN Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }} />
                    ) : (
                      <div className="bg-dark text-white w-100 h-100 d-flex align-items-center justify-content-center">
                        <i className="bi bi-person-fill fs-5"></i>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })()}
            <div>
              <div className="fw-black small text-uppercase d-flex align-items-center gap-2">
                {(() => {
                  const isSystemAdmin = !article.author || 
                    article.author.toLowerCase() === 'admin' || 
                    article.author.toLowerCase() === 'superadmin' || 
                    article.author === 'Industrial Times';
                  
                  const displayAuthorName = isSystemAdmin ? 'Industrial Times' : article.author;
                  const authorProfileLink = isSystemAdmin ? '/author/Industrial-Times' : `/author/${article.authorId || article.author}`;

                  return (
                    <Link to={authorProfileLink} className="text-dark hover-text-red text-decoration-none">
                      {displayAuthorName}
                    </Link>
                  );
                })()}
                {authorProfile && authorProfile.averageRating > 0 && (
                  <span className="text-warning fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }} title={`Rated ${authorProfile.averageRating} out of 5`}>
                    <i className="bi bi-star-fill"></i>
                    {authorProfile.averageRating.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="x-small text-muted fw-bold mt-1">
                {formatPublishDate(article.createdAt || article.date)} • 5 MIN READ
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
            <div className="mb-5 rounded-4 shadow-sm overflow-hidden bg-black" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {article.video ? (
                 <video 
                    autoPlay
                    muted
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
                 renderEmbed(article.videoUrl)
              ) : article.image ? (
                 <img 
                   src={article.image} 
                   alt={article.title} 
                   className="w-100" 
                   style={{ maxHeight: '600px', objectFit: 'contain' }} 
                 />
              ) : (
                 <div className="d-flex align-items-center justify-content-center h-100 py-5">
                    <i className="bi bi-image fs-1 text-muted opacity-25"></i>
                 </div>
              )}
            </div>
            
            {article.excerpt && (
              <p className="lead fw-bold text-dark mb-4">
                {linkifyText(article.excerpt)}
              </p>
            )}
            
            <div className="article-body-text">
              {renderContentWithAds(article.content)}
              
              {(() => {
                try {
                  const highlightList = article.highlights ? JSON.parse(article.highlights) : null;
                  if (highlightList && Array.isArray(highlightList) && highlightList.length > 0) {
                    return (
                      <div className="bg-light p-4 rounded-4 my-5 border-start border-danger border-4 shadow-sm">
                        <h5 className="fw-black mb-3 text-uppercase small" style={{ letterSpacing: '1px' }}>Article Keywords</h5>
                        <ul className="mb-0 small fw-medium text-dark">
                          {highlightList.map((h, i) => (
                            <li key={i} className="mb-2 d-flex align-items-start gap-2">
                              <i className="bi bi-check-circle-fill text-danger mt-1" style={{ fontSize: '0.8rem' }}></i>
                              <span>{linkifyText(h)}</span>
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
                    <Link to={`/author/${authorProfile.id || 'Industrial-Times'}`} className="text-decoration-none">
                      <div className="bg-light rounded-circle shadow-sm p-1" style={{ width: '80px', height: '80px', flexShrink: 0 }}>
                        {authorProfile.profilePic ? (
                          <img 
                            src={authorProfile.profilePic.startsWith('http') ? authorProfile.profilePic : (authorProfile.profilePic === '/icon.png' ? '/icon.png' : `${API_BASE}${authorProfile.profilePic.startsWith('/') ? '' : '/'}${authorProfile.profilePic}`)} 
                            alt={authorProfile.name}
                            className="rounded-circle w-100 h-100" 
                            style={{ objectFit: authorProfile.profilePic === '/icon.png' ? 'contain' : 'cover', padding: authorProfile.profilePic === '/icon.png' ? '6px' : '0px' }} 
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
                        <Link to={`/author/${authorProfile.id || 'Industrial-Times'}`} className="text-dark text-decoration-none hover-text-red">
                          <h5 className="fw-bold mb-0">{authorProfile.name}</h5>
                        </Link>
                        {(() => {
                          if (authorProfile.role === 'corporate') {
                            return <Badge bg="purple" className="x-small text-uppercase px-2 py-1 shadow-sm" style={{ fontSize: '0.6rem', background: '#8b5cf6' }}>Corporate</Badge>;
                          }
                          if (authorProfile.role === 'superadmin') {
                            return <Badge bg="danger" className="x-small text-uppercase px-2 py-1 shadow-sm" style={{ fontSize: '0.6rem' }}>Editorial</Badge>;
                          }
                          const lvl = getReporterLevel(authorProfile.followersCount, reporterThresholds);
                          return (
                            <Badge 
                              className="x-small text-uppercase px-2 py-1 shadow-sm d-flex align-items-center gap-1" 
                              style={{ fontSize: '0.6rem', backgroundColor: lvl.color, color: '#fff' }}
                            >
                              <i className={`bi ${lvl.icon}`}></i> {lvl.level}
                            </Badge>
                          );
                        })()}
                      </div>
                      <p className="text-muted small mb-2" style={{ lineHeight: '1.4' }}>
                        {authorProfile.bio || 'Expert Analyst & News contributor at Industrial Times.'}
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
                          <Link to={`/article/${createSlug(art.category)}/${createSlug(art.title)}`} className="text-decoration-none text-dark flex-grow-1">
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
                                {getRelativeTime(art.createdAt || art.date)}
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

            {/* COLOMBIA AD NETWORK PLACEMENT */}
            <ColombiaAd />

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
                            <Link to={`/article/${createSlug(item.category)}/${createSlug(item.title)}`} className="text-dark hover-text-red text-decoration-none" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</Link>
                          </h6>
                          <div className="x-small text-danger fw-bold text-uppercase mt-1">{getRelativeTime(item.date || item.createdAt)}</div>
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
                      <Link to={`/article/${createSlug(item.category)}/${createSlug(item.title)}`} className="text-dark hover-text-red text-decoration-none" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</Link>
                    </h6>
                    <div className="x-small text-danger fw-bold text-uppercase mt-1">{getRelativeTime(item.date || item.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
            {related.length > 0 && (
              <div className="text-start mb-5">
                <Link to={getCategoryLink(article.category)} className="btn btn-outline-danger btn-sm rounded-pill px-4 fw-bold shadow-sm hover-lift text-uppercase w-100" style={{ letterSpacing: '0.5px' }}>
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
                 industrialtimes.in
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
              {userInfo ? (
                <Form onSubmit={handlePostComment} className="mb-5 bg-white border p-4 rounded-4 shadow-sm">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                      {userInfo.name ? userInfo.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="fw-bold small">Commenting as</div>
                      <div className="text-danger fw-bold">{userInfo.name}</div>
                    </div>
                  </div>
                  <Row className="g-3">
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
              ) : (
                <div className="mb-5 bg-light border p-4 rounded-4 text-center shadow-sm">
                  <i className="bi bi-lock-fill text-danger display-6 mb-3 d-block opacity-75"></i>
                  <h6 className="fw-bold mb-2">Join the Discussion</h6>
                  <p className="text-muted small mb-3">You must be logged in to post comments and join the reader discussions.</p>
                  <Link to="/login" className="btn btn-danger rounded-pill px-4 fw-bold shadow-sm">
                    Login to Comment
                  </Link>
                </div>
              )}

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
