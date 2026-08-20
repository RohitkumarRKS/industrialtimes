import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Badge, Spinner } from 'react-bootstrap';
import Advertisement from '../components/Advertisement';
import MobileStickyAd from '../components/MobileStickyAd';
import API_BASE from '../config/api';
import { createSlug } from '../utils/slugify';
import { getRelativeTime } from '../utils/timeFormatter';
import axios from 'axios';

const getReporterLevel = (followersCount = 0, thresholds = { silver: 10, gold: 50, diamond: 100 }) => {
  const count = parseInt(followersCount) || 0;
  if (count >= (thresholds.diamond || 100)) return { level: 'Diamond', color: '#38bdf8', icon: 'bi-gem', bg: '#e0f2fe', text: '#0369a1' };
  if (count >= (thresholds.gold || 50)) return { level: 'Gold', color: '#fbbf24', icon: 'bi-trophy-fill', bg: '#fef3c7', text: '#b45309' };
  if (count >= (thresholds.silver || 10)) return { level: 'Silver', color: '#94a3b8', icon: 'bi-award-fill', bg: '#f1f5f9', text: '#475569' };
  return { level: 'Bronze', color: '#cd7f32', icon: 'bi-award', bg: '#ffedd5', text: '#c2410c' };
};

const AuthorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [author, setAuthor] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reporterThresholds, setReporterThresholds] = useState({ silver: 10, gold: 50, diamond: 100 });

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

  // Follow & Rating States
  const [userInfo, setUserInfo] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    // If logged-in user visits their own author profile, redirect to dashboard
    const saved = localStorage.getItem('userInfo');
    let currentUser = null;
    if (saved) {
      try {
        currentUser = JSON.parse(saved);
        setUserInfo(currentUser);
        if ((currentUser.id.toString() === id || currentUser.name.toLowerCase() === decodeURIComponent(id).toLowerCase()) && (currentUser.role === 'author' || currentUser.role === 'corporate')) {
          navigate('/user-dashboard', { replace: true });
          return;
        }
      } catch (e) {
        console.error(e);
        localStorage.removeItem('userInfo');
      }
    }

    const fetchAuthorData = async () => {
      try {
        setLoading(true);
        // 1. Fetch author profile
        const authorRes = await axios.get(`${API_BASE}/api/auth/user/${encodeURIComponent(id)}`);
        const authorData = authorRes.data;
        setAuthor(authorData);

        // 2. Fetch author's articles
        const queryParam = authorData.id ? `authorId=${authorData.id}` : `authorName=${encodeURIComponent(authorData.name)}`;
        const articlesRes = await axios.get(`${API_BASE}/api/articles?${queryParam}`);
        setArticles(articlesRes.data);

        // 3. Fetch follow status
        if (currentUser && authorData.id) {
          if (currentUser.role !== 'superadmin' && currentUser.role !== 'admin' && parseInt(currentUser.id) !== parseInt(authorData.id)) {
            const followRes = await axios.get(`${API_BASE}/api/auth/follow-status/${authorData.id}`, {
              headers: { Authorization: `Bearer ${currentUser.token}` }
            });
            setIsFollowing(followRes.data.isFollowing);
          }
        }
      } catch (err) {
        console.error('Failed to fetch author data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuthorData();
  }, [id, navigate]);

  const handleFollowToggle = async () => {
    if (!userInfo) {
      alert('Please login to follow this reporter.');
      return;
    }
    if (!author?.id) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/auth/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({ reporterId: author.id })
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.followed);
        setAuthor(prev => ({
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
    if (!author?.id) return;
    setRatingLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (userInfo?.token) {
        headers['Authorization'] = `Bearer ${userInfo.token}`;
      }
      
      const res = await fetch(`${API_BASE}/api/auth/rate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reporterId: author.id, rating: score })
      });
      if (res.ok) {
        const data = await res.json();
        setAuthor(prev => ({
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

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" style={{ color: 'var(--industrial-red)' }} />
      </Container>
    );
  }

  if (!author) {
    return (
      <Container className="py-5 text-center" style={{ minHeight: '60vh' }}>
        <h2>Author not found</h2>
        <Link to="/" className="btn btn-danger mt-3">Return Home</Link>
      </Container>
    );
  }


  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    return `${API_BASE}${img.startsWith('/') ? '' : '/'}${img}`;
  };

  return (
    <Container fluid className="px-md-4 px-xl-5 py-5 reveal">
      <Row className="g-4">
        {/* Left Sidebar Ad */}
        <Col xl={2} lg={2} className="d-none d-lg-block">
          <div className="sticky-top" style={{ top: '135px' }}>
            <Advertisement slot="left-skyscraper" />
          </div>
        </Col>

        {/* Main Content */}
        <Col xl={7} lg={7} md={12} xs={12}>
          <div className="author-header bg-white p-4 p-md-5 rounded-4 mb-5 shadow-sm border border-light hover-lift position-relative overflow-hidden transition-all">
             <div className="position-absolute top-0 start-0 w-100" style={{ height: '80px', background: 'linear-gradient(90deg, #f8fafc 0%, #fff1f2 100%)' }}></div>
             
             <Row className="align-items-start position-relative z-index-1 mt-2">
                <Col md="auto" className="mb-4 mb-md-0 d-flex flex-column align-items-center">
                    <div className="bg-white rounded-circle shadow-sm p-1 mb-3" style={{ width: '120px', height: '120px', overflow: 'hidden' }}>
                      {author.profilePic ? (
                        <img 
                          src={author.profilePic.startsWith('http') ? author.profilePic : (author.profilePic === '/icon.png' ? '/icon.png' : `${API_BASE}${author.profilePic.startsWith('/') ? '' : '/'}${author.profilePic}`)}
                          alt={author.name}
                          className="rounded-circle w-100 h-100"
                          style={{ objectFit: author.profilePic === '/icon.png' ? 'contain' : 'cover', padding: author.profilePic === '/icon.png' ? '12px' : '0px' }}
                        />
                      ) : (
                        <div className="bg-danger rounded-circle w-100 h-100 d-flex align-items-center justify-content-center text-white shadow-inner">
                           <span className="display-5 fw-black">{author.name ? author.name.charAt(0).toUpperCase() : 'E'}</span>
                        </div>
                      )}
                    </div>
                    {(() => {
                      if (author.role === 'corporate') {
                        return <Badge bg="purple" className="text-uppercase fw-black px-3 py-2 shadow-sm" style={{ letterSpacing: '1px', fontSize: '0.7rem', background: '#8b5cf6' }}>Corporate Partner</Badge>;
                      }
                      if (author.role === 'superadmin') {
                        return <Badge bg="danger" className="text-uppercase fw-black px-3 py-2 shadow-sm" style={{ letterSpacing: '1px', fontSize: '0.7rem' }}>Editorial Team</Badge>;
                      }
                      const lvl = getReporterLevel(author.followersCount, reporterThresholds);
                      return (
                        <Badge 
                          className="text-uppercase fw-black px-3 py-2 shadow-sm d-flex align-items-center gap-1" 
                          style={{ letterSpacing: '1px', fontSize: '0.7rem', backgroundColor: lvl.color, color: '#fff', border: `1px solid rgba(255,255,255,0.2)` }}
                        >
                          <i className={`bi ${lvl.icon}`}></i> {lvl.level} Reporter
                        </Badge>
                      );
                    })()}
                </Col>
                <Col className="ps-md-4 pt-md-3 text-center text-md-start">
                   <h1 className="display-6 fw-black text-dark mb-2">{author.name || 'Editorial Member'}</h1>
                   <p className="text-secondary mb-4" style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>
                     {author.bio || 'Expert Industrial Analyst & Content Strategist at Industrial Times.'}
                   </p>
                   
                   <div className="d-flex flex-wrap gap-3 gap-md-4 small fw-bold bg-light p-3 rounded-4 border justify-content-center justify-content-md-start mb-4">
                      <div className="d-flex flex-column gap-1 text-start">
                        <span className="text-muted x-small text-uppercase fw-bold" style={{ letterSpacing: '0.5px' }}>Contact</span>
                        <span className="text-dark"><i className="bi bi-envelope-fill text-danger me-2"></i>{author.email || 'contact@industrialtimes.in'}</span>
                      </div>
                      <div className="d-flex flex-column gap-1 border-start ps-3 ps-md-4 text-start">
                        <span className="text-muted x-small text-uppercase fw-bold" style={{ letterSpacing: '0.5px' }}>Expertise</span>
                        <span className="text-dark"><i className="bi bi-tag-fill text-danger me-2"></i>{author.expertise || 'General News, Industry 4.0'}</span>
                      </div>
                   </div>
                   
                   {/* Profile Metrics & Actions */}
                   <div className="d-flex flex-wrap align-items-center gap-4 justify-content-center justify-content-md-start">
                      <div className="d-flex align-items-center gap-4 text-center text-md-start">
                         <div>
                            <div className="h4 fw-black text-dark mb-0">{author.followersCount || 0}</div>
                            <div className="text-muted x-small text-uppercase fw-bold" style={{ letterSpacing: '0.5px' }}>Followers</div>
                         </div>
                         <div className="border-start ps-4">
                            <div className="h4 fw-black text-dark mb-0">{articles.length}</div>
                            <div className="text-muted x-small text-uppercase fw-bold" style={{ letterSpacing: '0.5px' }}>Published</div>
                         </div>
                         <div className="border-start ps-4">
                            <div className="h4 fw-black text-dark mb-0 d-flex align-items-center gap-1 justify-content-center justify-content-md-start">
                              <i className="bi bi-star-fill text-warning"></i>
                              {author.averageRating ? author.averageRating.toFixed(1) : '0.0'}
                            </div>
                            <div className="text-muted x-small text-uppercase fw-bold" style={{ letterSpacing: '0.5px' }}>Rating ({author.ratingsCount || 0})</div>
                         </div>
                      </div>
                      
                      <div className="ms-md-auto mt-3 mt-md-0 d-flex flex-wrap align-items-center gap-3">
                         {/* Follow Button: Hide for admin, superadmin, or self */}
                         {(!userInfo || (userInfo.role !== 'superadmin' && userInfo.role !== 'admin' && parseInt(userInfo.id) !== parseInt(author.id))) && (
                            <button 
                              className={`btn ${isFollowing ? 'btn-outline-secondary' : 'btn-danger'} rounded-pill px-4 py-2 fw-bold shadow-sm hover-scale d-flex align-items-center gap-2`}
                              onClick={handleFollowToggle}
                            >
                              <i className={`bi ${isFollowing ? 'bi-person-check-fill' : 'bi-person-plus-fill'}`}></i>
                              {isFollowing ? 'Following' : 'Follow Author'}
                            </button>
                         )}

                         {/* Star rating widget for visitor to rate the reporter: Hide for self */}
                         {(!userInfo || parseInt(userInfo.id) !== parseInt(author.id)) && (
                            <div className="d-flex align-items-center gap-2 bg-light p-2 rounded-pill border shadow-sm">
                               <span className="x-small fw-black text-uppercase text-muted px-2" style={{ letterSpacing: '0.5px' }}>Rate:</span>
                               <StarRating rating={0} onRate={handleRateAuthor} interactive={true} />
                            </div>
                         )}
                      </div>
                   </div>
                </Col>
             </Row>
          </div>

          <h4 className="fw-black text-uppercase mb-4 border-bottom pb-3 small" style={{ letterSpacing: '1px' }}>Latest Contributions by {author.name}</h4>
          <div className="d-flex flex-column gap-4">
             {articles.length > 0 ? articles.map(article => {
                const articleImg = getImageUrl(article.image || article.imageUrl);
                return (
                <div key={article.id}>
                   <Link to={`/article/${createSlug(article.category)}/${createSlug(article.title)}`} className="text-decoration-none group">
                      <div className="bg-white rounded-4 shadow-sm border border-light overflow-hidden hover-lift transition-all d-flex flex-column flex-md-row h-100">
                         {/* Mobile Image */}
                         <div className="d-md-none position-relative" style={{ height: '220px' }}>
                            {articleImg ? (
                               <img src={articleImg} className="w-100 h-100" style={{ objectFit: 'cover' }} alt={article.title} />
                            ) : (
                               <div className="w-100 h-100 bg-light d-flex align-items-center justify-content-center">
                                  <i className="bi bi-image text-muted opacity-25 fs-1"></i>
                               </div>
                            )}
                         </div>
                         {/* Desktop Image */}
                         <div className="d-none d-md-block flex-shrink-0 position-relative" style={{ width: '240px', height: '160px' }}>
                            {articleImg ? (
                               <img src={articleImg} className="w-100 h-100" style={{ objectFit: 'cover' }} alt={article.title} />
                            ) : (
                               <div className="w-100 h-100 bg-light d-flex align-items-center justify-content-center">
                                  <i className="bi bi-image text-muted opacity-25 fs-1"></i>
                               </div>
                            )}
                         </div>
                         {/* Content */}
                         <div className="p-3 px-md-4 d-flex flex-column flex-grow-1 justify-content-center">
                            <div className="d-flex align-items-center mb-2">
                               <Badge bg="danger" className="x-small fw-black text-uppercase me-3 px-2 py-1 shadow-sm" style={{ fontSize: '0.65rem' }}>{article.category || 'News'}</Badge>
                               <span className="text-muted x-small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                                 <i className="bi bi-calendar-event me-1"></i>
                                 {getRelativeTime(article.createdAt || 'Today')}
                               </span>
                            </div>
                            <h6 className="fw-bold text-dark mb-2 lh-sm" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '1.1rem' }}>
                               {article.title}
                            </h6>
                            <p className="text-muted small mb-0 d-none d-lg-block" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5', fontSize: '0.9rem' }}>
                               {article.excerpt || 'Read the full article to discover more details about this latest update in the industrial sector.'}
                            </p>
                         </div>
                      </div>
                   </Link>
                </div>
             )}) : (
                <div className="text-center py-5 bg-white rounded-4 shadow-sm border border-light">
                   <i className="bi bi-journal-x display-3 text-muted opacity-25 mb-3 d-block"></i>
                   <h5 className="text-dark fw-bold">No articles published yet</h5>
                   <p className="text-muted mb-0">Check back later for updates from this author.</p>
                </div>
             )}
          </div>

          {/* MOBILE AD — 300×250 */}
          <div className="ad-mobile-only mobile-ad-row">
            <Advertisement slot="mobile-rectangle" />
          </div>
        </Col>

        {/* Right Sidebar Ad */}
        <Col xl={3} lg={3} className="d-none d-lg-block">
          <div className="sticky-top" style={{ top: '135px' }}>
            <Advertisement slot="right-half-page" />
          </div>
        </Col>
      </Row>

      {/* MOBILE STICKY BOTTOM BANNER — 320×50 */}
      <MobileStickyAd />
    </Container>
  );
};

export default AuthorProfile;
