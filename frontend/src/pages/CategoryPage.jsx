import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Spinner, Badge } from 'react-bootstrap';
import Advertisement from '../components/Advertisement';
import MobileStickyAd from '../components/MobileStickyAd';
import API_BASE from '../config/api';
import VideoNewsThumbnail from '../components/VideoNewsThumbnail';
import { createSlug } from '../utils/slugify';
import { getRelativeTime } from '../utils/timeFormatter';

const CategoryPage = ({ categoryOverride }) => {
  const { category: urlCategory } = useParams();
  const category = categoryOverride || urlCategory;
  const [articles, setArticles] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(8);
  const [rotateIndex, setRotateIndex] = useState(0);

  const featuredArticles = articles.slice(0, 3);
  const featuredRotatingPool = articles.slice(1, 11);
  const remainingArticles = articles.slice(3, visibleCount);

  useEffect(() => {
    setRotateIndex(0);
  }, [category, articles]);

  useEffect(() => {
    if (featuredRotatingPool.length <= 2) return;
    const interval = setInterval(() => {
      setRotateIndex((prev) => (prev + 1) % featuredRotatingPool.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [featuredRotatingPool.length]);


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
        const res = await fetch(`${API_BASE}/api/articles/category/${category}?limit=30`);
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

  let article1 = null;
  let article2 = null;
  if (featuredRotatingPool.length > 0) {
    article1 = featuredRotatingPool[rotateIndex % featuredRotatingPool.length];
    if (featuredRotatingPool.length > 1) {
      article2 = featuredRotatingPool[(rotateIndex + 1) % featuredRotatingPool.length];
    }
  }

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
                  const articleLink = `/article/${createSlug(article.category || 'news')}/${createSlug(article.title)}`;
                  return (
                    <Link 
                      to={articleLink} 
                      key={article.id} 
                      className="featured-news-card" 
                      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    >
                      <VideoNewsThumbnail article={article} isFeatured={true} imgHeight="160px" />
                      <div className="featured-news-body" style={{ padding: '10px 15px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
                          {getRelativeTime(article.createdAt || article.date)}
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {/* IN-FEED AD REPLACING SECOND FEATURED CARD */}
                {!isMobile && (
                  <div className="d-flex align-items-center justify-content-center" style={{ height: '280px', overflow: 'hidden', padding: '0' }}>
                    <Advertisement slot="in-feed-rectangle" />
                  </div>
                )}

                {/* Rotating Slot 1 (News 2) */}
                {article1 && (
                  <Link
                    to={`/article/${createSlug(article1.category || 'news')}/${createSlug(article1.title)}`}
                    key={`rotate-slot1-${article1.id}`}
                    className="featured-news-card rotating-news-card"
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                  >
                    <VideoNewsThumbnail article={article1} imgHeight="160px" />
                    <div className="featured-news-body" style={{ padding: '10px 15px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <Badge bg="light" text="danger" className="mb-1 fw-black text-uppercase x-small border border-danger border-opacity-25" style={{ display: 'inline-block' }}>
                          {article1.category || 'News'}
                        </Badge>
                        <h3 className="featured-news-title" style={{ fontSize: '1.05rem', marginBottom: '4px', fontWeight: '800', lineHeight: '1.3' }}>{article1.title}</h3>
                      </div>
                      <div className="featured-news-meta">
                        <i className="bi bi-person-fill me-1"></i>
                        {article1.author || 'Editorial'}
                        <span className="mx-2">•</span>
                        {getRelativeTime(article1.createdAt || article1.date)}
                      </div>
                    </div>
                  </Link>
                )}

                {/* Rotating Slot 2 (News 3) */}
                {article2 ? (
                  <Link
                    to={`/article/${createSlug(article2.category || 'news')}/${createSlug(article2.title)}`}
                    key={`rotate-slot2-${article2.id}`}
                    className="featured-news-card rotating-news-card"
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                  >
                    <VideoNewsThumbnail article={article2} imgHeight="160px" />
                    <div className="featured-news-body" style={{ padding: '10px 15px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <Badge bg="light" text="danger" className="mb-1 fw-black text-uppercase x-small border border-danger border-opacity-25" style={{ display: 'inline-block' }}>
                          {article2.category || 'News'}
                        </Badge>
                        <h3 className="featured-news-title" style={{ fontSize: '1.05rem', marginBottom: '4px', fontWeight: '800', lineHeight: '1.3' }}>{article2.title}</h3>
                      </div>
                      <div className="featured-news-meta">
                        <i className="bi bi-person-fill me-1"></i>
                        {article2.author || 'Editorial'}
                        <span className="mx-2">•</span>
                        {getRelativeTime(article2.createdAt || article2.date)}
                      </div>
                    </div>
                  </Link>
                ) : (
                  featuredArticles[2] && (
                    <Link
                      to={`/article/${createSlug(featuredArticles[2].category || 'news')}/${createSlug(featuredArticles[2].title)}`}
                      key={featuredArticles[2].id}
                      className="featured-news-card"
                      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    >
                      <VideoNewsThumbnail article={featuredArticles[2]} imgHeight="160px" />
                      <div className="featured-news-body" style={{ padding: '10px 15px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <Badge bg="light" text="danger" className="mb-1 fw-black text-uppercase x-small border border-danger border-opacity-25" style={{ display: 'inline-block' }}>
                            {featuredArticles[2].category || 'News'}
                          </Badge>
                          <h3 className="featured-news-title" style={{ fontSize: '1.05rem', marginBottom: '4px', fontWeight: '800', lineHeight: '1.3' }}>{featuredArticles[2].title}</h3>
                        </div>
                        <div className="featured-news-meta">
                          <i className="bi bi-person-fill me-1"></i>
                          {featuredArticles[2].author || 'Editorial'}
                          <span className="mx-2">•</span>
                          {getRelativeTime(featuredArticles[2].createdAt || featuredArticles[2].date)}
                        </div>
                      </div>
                    </Link>
                  )
                )}
              </>
            )}
          </div>

          <style>{`
            @keyframes rotatingNewsSlide {
              0% { opacity: 0; transform: translateX(30px); }
              100% { opacity: 1; transform: translateX(0); }
            }
            .rotating-news-card {
              animation: rotatingNewsSlide 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>

          {/* ALL REMAINING NEWS (with infinite scroll) */}
          <div className="news-grid-2col">
            {remainingArticles.length > 0
              ? remainingArticles.map((article) => {
                  const articleImg = getImageUrl(article.image || article.imageUrl);
                  const articleLink = `/article/${createSlug(article.category || 'news')}/${createSlug(article.title)}`;
                  return (
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
                            <span className="text-muted hover-text-red">{article.author}</span>
                          ) : 'Editorial'}
                          <span className="mx-1">·</span>
                          {getRelativeTime(article.createdAt || article.date)}
                        </div>
                      </div>
                    </Link>
                  );
                })
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




      {/* MOBILE STICKY BOTTOM BANNER — 320×50 */}
      <MobileStickyAd category={category} />
    </Container>
  );
};

export default CategoryPage;
