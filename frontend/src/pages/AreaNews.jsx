import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Advertisement from '../components/Advertisement';
import MobileStickyAd from '../components/MobileStickyAd';
import API_BASE from '../config/api';

const AreaNews = () => {
  const [detectedState, setDetectedState] = useState('');
  const [detectedCity, setDetectedCity] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(8);

  useEffect(() => {
    setVisibleCount(8);
  }, [detectedState]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 150) {
        setVisibleCount((prev) => {
          if (prev >= articles.length) return prev;
          return prev + 6;
        });
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [articles.length]);

  // Auto-detect location from sessionStorage (set by Navigation component)
  useEffect(() => {
    const checkLocation = () => {
      const state = sessionStorage.getItem('detectedState');
      const city = sessionStorage.getItem('detectedCity');
      if (state) {
        setDetectedState(state);
        setDetectedCity(city || '');
        return true;
      }
      return false;
    };

    // Try immediately
    if (!checkLocation()) {
      // Retry every 500ms for up to 10 seconds while Navigation detects location
      let attempts = 0;
      const retryTimer = setInterval(() => {
        attempts++;
        if (checkLocation() || attempts >= 20) {
          clearInterval(retryTimer);
          if (attempts >= 20 && !sessionStorage.getItem('detectedState')) {
            // Fallback if location detection failed
            setDetectedState('Jharkhand');
            setDetectedCity('Jamshedpur');
          }
        }
      }, 500);
      return () => clearInterval(retryTimer);
    }
  }, []);

  // Fetch news when state is detected
  useEffect(() => {
    if (!detectedState) return;

    const fetchNews = async () => {
      setLoading(true);
      try {
        const url = `${API_BASE}/api/articles/location/${detectedState}`;
        const res = await fetch(url);
        const data = await res.json();
        setArticles(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [detectedState]);

  const createSlug = (text) => text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    return `${API_BASE}${img.startsWith('/') ? '' : '/'}${img}`;
  };

  return (
    <Container fluid className="px-md-4 px-xl-5 py-4 reveal">


      <Row className="g-4">
        {/* Left Ad */}
        <Col xl={2} lg={2} className="d-none d-lg-block">
          <div className="sticky-top" style={{ top: '135px' }}>
            <Advertisement slot="left-skyscraper" />
          </div>
        </Col>

        {/* Main Content */}
        <Col xl={7} lg={7} md={12} xs={12}>
          {loading ? (
             <div className="text-center py-5">
               <Spinner animation="border" style={{ color: 'var(--industrial-red)' }} />
               <p className="mt-3 text-muted small">Detecting your region and loading news...</p>
             </div>
          ) : articles.length > 0 ? (
             <div className="news-grid-2col">
               {articles.slice(0, visibleCount).map((article) => {
                 const articleImg = getImageUrl(article.image || article.imageUrl);
                 const articleLink = `/article/${createSlug(article.category || 'news')}/${createSlug(article.title)}/${article.id}`;
                 return (
                    <Link to={articleLink} key={article.id} className="news-grid-card position-relative">
                      <div className="news-grid-thumb">
                        {articleImg ? (
                          <img src={articleImg} alt={article.title} className="news-grid-img" />
                        ) : (
                          <div className="news-grid-placeholder">
                            <i className="bi bi-image"></i>
                          </div>
                        )}
                        {article.trending && (
                          <span className="position-absolute top-0 end-0 m-2 badge bg-warning text-dark">
                            Highlight
                          </span>
                        )}
                      </div>
                      <div className="news-grid-body">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="news-grid-cat">{article.city || article.state}</span>
                        </div>
                        <h6 className="news-grid-title">{article.title}</h6>
                        <div className="news-grid-meta">
                          <i className="bi bi-person-fill me-1"></i>
                          {article.author ? (
                            <Link to={`/author/${article.authorId || article.author}`} onClick={(e) => e.stopPropagation()} className="text-decoration-none text-muted hover-text-red">
                              {article.author}
                            </Link>
                          ) : 'Editorial'}
                          <span className="mx-1">·</span>
                          {article.createdAt ? new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (article.date || 'Today')}
                        </div>
                      </div>
                    </Link>
                 );
               })}
             </div>
          ) : (
             <div className="text-center py-5 bg-light rounded-4 border border-secondary border-dashed">
               <i className="bi bi-inbox display-1 text-muted opacity-25"></i>
               <h4 className="mt-3 fw-bold text-secondary">No regional news found for {detectedCity ? `${detectedCity}, ` : ''}{detectedState}</h4>
               <p className="text-muted small mt-2">News from your region will appear here once published.</p>
             </div>
          )}

          {visibleCount < articles.length && (
            <div className="text-center mt-4 mb-3 py-2">
              <Spinner animation="border" size="sm" style={{ color: 'var(--industrial-red)' }} className="me-2" />
              <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Loading more news...</span>
            </div>
          )}

          {/* MOBILE AD — 300×250 */}
          <div className="ad-mobile-only mobile-ad-row">
            <Advertisement slot="mobile-rectangle" />
          </div>
        </Col>

        {/* Right Ad */}
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

export default AreaNews;
