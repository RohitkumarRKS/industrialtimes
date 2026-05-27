import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Spinner, Badge } from 'react-bootstrap';
import Advertisement from '../components/Advertisement';
import MobileStickyAd from '../components/MobileStickyAd';
import API_BASE from '../config/api';

const CategoryPage = ({ categoryOverride }) => {
  const { category: urlCategory } = useParams();
  const category = categoryOverride || urlCategory;
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(8);

  const createSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
  };

  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    const normalizedPath = img.startsWith('/') ? img : `/${img}`;
    return `${API_BASE}${normalizedPath}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Local News
        const res = await fetch(`${API_BASE}/api/articles/category/${category}`);
        const data = await res.json();
        setArticles(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching category news:", error);
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0);
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [category]);

  useEffect(() => {
    setVisibleCount(8);
  }, [category]);

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

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  const latestArticles = articles.slice(0, visibleCount);
  const featuredArticles = latestArticles.slice(0, 3);
  const standardArticles = latestArticles.slice(3);

  return (
    <Container fluid className="px-md-4 px-lg-5 py-4 reveal">

      <Row className="g-4">
        {/* Left Sidebar Ad */}
        <Col xl={2} lg={2} className="d-none d-lg-block">
          <div className="sticky-top" style={{ top: '135px' }}>
            <Advertisement slot="left-skyscraper" />
          </div>
        </Col>

        {/* Main Content */}
        <Col xl={7} lg={7} md={12}>
          <div className="section-card-header mb-3">
            <span className="section-label-tag">
              <i className="bi bi-lightning-fill me-1"></i> {category.toUpperCase()} NEWS
            </span>
          </div>

          {/* FEATURED NEWS (Top 1 + Ad) */}
          <div className="featured-news-grid">
            {featuredArticles.length > 0 && (
              <>
                {/* News 1 */}
                {featuredArticles.slice(0, 1).map((article) => {
                  const articleImg = getImageUrl(article.image || article.imageUrl);
                  const articleLink = `/article/${createSlug(article.category || 'news')}/${createSlug(article.title)}/${article.id}`;
                  return (
                    <Link 
                      to={articleLink} 
                      key={article.id} 
                      className="featured-news-card" 
                      style={{ height: '280px', display: 'flex', flexDirection: 'column' }}
                    >
                      <div className="featured-news-thumb" style={{ height: '150px', aspectRatio: 'auto' }}>
                        {articleImg ? (
                          <img src={articleImg} alt={article.title} className="featured-news-img" />
                        ) : (
                          <div className="d-flex align-items-center justify-content-center h-100 bg-light text-muted opacity-50">
                            <i className="bi bi-image fs-1"></i>
                          </div>
                        )}
                        {(article.video || article.videoUrl) && (
                          <div className="position-absolute top-50 start-50 translate-middle text-white fs-1" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                            <i className="bi bi-play-circle-fill"></i>
                          </div>
                        )}
                      </div>
                      <div className="featured-news-body" style={{ padding: '10px 15px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifycontent: 'space-between' }}>
                        <div>
                          <Badge bg="light" text="danger" className="mb-1 fw-black text-uppercase x-small border border-danger border-opacity-25" style={{ display: 'inline-block' }}>
                            {article.category || 'News'}
                          </Badge>
                          <h3 className="featured-news-title" style={{ fontSize: '1.05rem', marginBottom: '4px', fontWeight: '800', lineHeight: '1.3' }}>{article.title}</h3>
                        </div>
                        <div className="featured-news-meta">
                          <i className="bi bi-person-fill me-1"></i>
                          {article.author || 'Editorial'}
                          <span className="mx-2">•</span>
                          {article.createdAt ? new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (article.date || 'Today')}
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {/* IN-FEED AD REPLACING SECOND FEATURED CARD */}
                <div className="featured-news-card d-flex align-items-center justify-content-center" style={{ height: '280px', overflow: 'hidden', padding: '0' }}>
                  <Advertisement slot="in-feed-rectangle" />
                </div>

                {/* News 2 and News 3 */}
                {featuredArticles.slice(1, 3).map((article) => {
                  const articleImg = getImageUrl(article.image || article.imageUrl);
                  const articleLink = `/article/${createSlug(article.category || 'news')}/${createSlug(article.title)}/${article.id}`;
                  return (
                    <Link 
                      to={articleLink} 
                      key={article.id} 
                      className="featured-news-card" 
                      style={{ height: '280px', display: 'flex', flexDirection: 'column' }}
                    >
                      <div className="featured-news-thumb" style={{ height: '150px', aspectRatio: 'auto' }}>
                        {articleImg ? (
                          <img src={articleImg} alt={article.title} className="featured-news-img" />
                        ) : (
                          <div className="d-flex align-items-center justify-content-center h-100 bg-light text-muted opacity-50">
                            <i className="bi bi-image fs-1"></i>
                          </div>
                        )}
                        {(article.video || article.videoUrl) && (
                          <div className="position-absolute top-50 start-50 translate-middle text-white fs-1" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                            <i className="bi bi-play-circle-fill"></i>
                          </div>
                        )}
                      </div>
                      <div className="featured-news-body" style={{ padding: '10px 15px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifycontent: 'space-between' }}>
                        <div>
                          <Badge bg="light" text="danger" className="mb-1 fw-black text-uppercase x-small border border-danger border-opacity-25" style={{ display: 'inline-block' }}>
                            {article.category || 'News'}
                          </Badge>
                          <h3 className="featured-news-title" style={{ fontSize: '1.05rem', marginBottom: '4px', fontWeight: '800', lineHeight: '1.3' }}>{article.title}</h3>
                        </div>
                        <div className="featured-news-meta">
                          <i className="bi bi-person-fill me-1"></i>
                          {article.author || 'Editorial'}
                          <span className="mx-2">•</span>
                          {article.createdAt ? new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (article.date || 'Today')}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </>
            )}
          </div>

          {/* STANDARD LATEST STORIES */}
          <div className="news-grid-2col">
            {standardArticles.length > 0
              ? standardArticles.reduce((acc, article, index) => {
                  const articleImg = getImageUrl(article.image || article.imageUrl);
                  const articleLink = `/article/${createSlug(article.category || 'news')}/${createSlug(article.title)}/${article.id}`;
                  
                  acc.push(
                    <Link to={articleLink} key={article.id} className="news-grid-card">
                      <div className="news-grid-thumb">
                        {articleImg ? (
                          <img src={articleImg} alt={article.title} className="news-grid-img" />
                        ) : (
                          <div className="news-grid-placeholder">
                            <i className="bi bi-image"></i>
                          </div>
                        )}
                        {(article.video || article.videoUrl) && (
                          <div className="news-grid-play">
                            <i className="bi bi-play-circle-fill"></i>
                          </div>
                        )}
                      </div>
                      <div className="news-grid-body">
                        <span className="news-grid-cat">{article.category || 'News'}</span>
                        <h6 className="news-grid-title">{article.title}</h6>
                        <div className="news-grid-meta">
                          <i className="bi bi-person-fill me-1"></i>
                          {article.author ? (
                            <span className="text-muted hover-text-red">
                              {article.author}
                            </span>
                          ) : 'Editorial'}
                          <span className="mx-1">·</span>
                          {article.createdAt ? new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (article.date || 'Today')}
                        </div>
                      </div>
                    </Link>
                  );
                  return acc;
                }, [])
              : featuredArticles.length === 0 && (
                <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                  <i className="bi bi-info-circle fs-3 d-block mb-2 opacity-50"></i>
                  No news available for this category.
                </div>
              )
            }
          </div>

          {visibleCount < articles.length && (
            <div className="text-center mt-4 py-3">
              <Spinner animation="border" size="sm" variant="danger" className="me-2" />
              <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Loading more news...</span>
            </div>
          )}

          {/* MOBILE AD — 300×250 (replaces sidebars on mobile) */}
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

      {/* ── TOP / BOTTOM BANNER (970 × 90) ── */}
      <div className="d-none d-xl-block mt-4 mb-0 text-center">
        <Advertisement slot="top-bottom-banner" />
      </div>

      {/* MOBILE STICKY BOTTOM BANNER — 320×50 */}
      <MobileStickyAd category={category} />
    </Container>
  );
};

export default CategoryPage;
