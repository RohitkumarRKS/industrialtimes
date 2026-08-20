import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import Advertisement from '../components/Advertisement';
import MobileStickyAd from '../components/MobileStickyAd';
import ColombiaAd from '../components/ColombiaAd';
import API_BASE from '../config/api';
import VideoNewsThumbnail from '../components/VideoNewsThumbnail';
import { createSlug } from '../utils/slugify';
import { getRelativeTime } from '../utils/timeFormatter';

const Home = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileSearch, setMobileSearch] = useState('');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(8);
  const [storyFilter, setStoryFilter] = useState('All');
  const [rotateIndex, setRotateIndex] = useState(0);

  const displayArticles = storyFilter === 'National'
    ? articles.filter(a => a.category === 'Global')
    : articles;

  const featuredArticles = displayArticles.slice(0, 3);
  const featuredRotatingPool = displayArticles.slice(1, 11);
  const remainingArticles = displayArticles.slice(3, visibleCount);

  useEffect(() => {
    setRotateIndex(0);
  }, [storyFilter, articles]);

  useEffect(() => {
    if (featuredRotatingPool.length <= 2) return;
    const interval = setInterval(() => {
      setRotateIndex((prev) => (prev + 1) % featuredRotatingPool.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [featuredRotatingPool.length]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/articles?limit=30`);
        const data = await res.json();
        setArticles(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch articles:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '40vh' }}>
        <Spinner animation="border" style={{ color: 'var(--industrial-red)' }} />
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


  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    return `${API_BASE}${img.startsWith('/') ? '' : '/'}${img}`;
  };

  return (
    <Container fluid className="px-md-4 px-xl-5 py-3">



      {/* ════════════════════════════════════════════════════════════
          MAIN CONTENT GRID:
          [Left Skyscraper 160px] | [Trending 3] | [Stories 6] | [Right Half-Page 3]
      ════════════════════════════════════════════════════════════ */}
      <Row className="g-3 mt-1 reveal">

        {/* ── LEFT SKYSCRAPER AD — 160 × 600 ── */}
        <Col xl={2} lg={2} className="d-none d-lg-block">
          <div className="sticky-top" style={{ top: '135px' }}>
            <Advertisement slot="left-skyscraper" />
          </div>
        </Col>

        {/* ── LATEST STORIES — 2-col grid ── */}
        <Col xl={7} lg={7} md={12} xs={12}>

          {/* ── MOBILE SEARCH BAR — visible only on mobile ── */}
          <div className="d-block d-md-none mb-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (mobileSearch.trim()) {
                  navigate(`/search?q=${mobileSearch.trim()}`);
                  setMobileSearch('');
                }
              }}
              className="d-flex align-items-center gap-2"
            >
              <div className="input-group" style={{ borderRadius: '25px', overflow: 'hidden', border: '1.5px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <span className="input-group-text bg-transparent border-0" style={{ paddingLeft: '14px' }}>
                  <i className="bi bi-search text-muted" style={{ fontSize: '0.9rem' }}></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-transparent border-0 shadow-none"
                  placeholder="Search news, topics..."
                  value={mobileSearch}
                  onChange={(e) => setMobileSearch(e.target.value)}
                  style={{ fontSize: '0.88rem', padding: '10px 8px', color: '#1f2937' }}
                />
                {mobileSearch && (
                  <button
                    type="button"
                    className="btn bg-transparent border-0 d-flex align-items-center"
                    onClick={() => setMobileSearch('')}
                    style={{ padding: '0 10px' }}
                  >
                    <i className="bi bi-x-lg text-muted" style={{ fontSize: '0.8rem' }}></i>
                  </button>
                )}
                <button
                  type="submit"
                  className="btn border-0 d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: 'var(--industrial-red, #da251d)', color: 'white', padding: '0 18px', borderRadius: '0 25px 25px 0', fontWeight: '700', fontSize: '0.8rem', letterSpacing: '0.3px' }}
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          <div className="section-card-header mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
            <span className="section-label-tag">
              <i className="bi bi-lightning-fill me-1"></i> LATEST NEWS
            </span>
            <div className="d-flex gap-2">
              <button
                className={`btn btn-sm rounded-pill fw-bold px-3 ${storyFilter === 'All' ? 'btn-danger shadow-sm' : 'btn-outline-danger bg-white text-danger'}`}
                onClick={() => setStoryFilter('All')}
              >
                All Stories
              </button>
              <button
                className={`btn btn-sm rounded-pill fw-bold px-3 ${storyFilter === 'National' ? 'btn-danger shadow-sm' : 'btn-outline-danger bg-white text-danger'}`}
                onClick={() => setStoryFilter('National')}
              >
                National
              </button>
            </div>
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
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="featured-news-cat" style={{ marginBottom: 0 }}>{article.category || 'News'}</span>
                            {article.trending && (
                              <span className="badge bg-warning text-dark px-2 py-0.5" style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                                <i className="bi bi-lightning-fill"></i> TRENDING
                              </span>
                            )}
                          </div>

                          <h3 className="featured-news-title" style={{ fontSize: '1.05rem', marginBottom: '4px', fontWeight: '800', lineHeight: '1.3' }}>{article.title}</h3>
                        </div>
                        <div className="featured-news-meta">
                          <i className="bi bi-person-fill me-1"></i>
                          {!article.author || article.author.toLowerCase() === 'admin' || article.author.toLowerCase() === 'superadmin' || article.author === 'Industrial Times' ? 'Industrial Times' : article.author}
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
                       <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="featured-news-cat" style={{ marginBottom: 0 }}>{article1.category || 'News'}</span>
                          {article1.trending && (
                            <span className="badge bg-warning text-dark px-2 py-0.5" style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                              <i className="bi bi-lightning-fill"></i> TRENDING
                            </span>
                          )}
                        </div>

                        <h3 className="featured-news-title" style={{ fontSize: '1.05rem', marginBottom: '4px', fontWeight: '800', lineHeight: '1.3' }}>{article1.title}</h3>
                      </div>
                      <div className="featured-news-meta">
                        <i className="bi bi-person-fill me-1"></i>
                        {!article1.author || article1.author.toLowerCase() === 'admin' || article1.author.toLowerCase() === 'superadmin' || article1.author === 'Industrial Times' ? 'Industrial Times' : article1.author}
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
                       <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="featured-news-cat" style={{ marginBottom: 0 }}>{article2.category || 'News'}</span>
                          {article2.trending && (
                            <span className="badge bg-warning text-dark px-2 py-0.5" style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                                <i className="bi bi-lightning-fill"></i> TRENDING
                              </span>
                            )}
                          </div>

                        <h3 className="featured-news-title" style={{ fontSize: '1.05rem', marginBottom: '4px', fontWeight: '800', lineHeight: '1.3' }}>{article2.title}</h3>
                      </div>
                      <div className="featured-news-meta">
                        <i className="bi bi-person-fill me-1"></i>
                        {!article2.author || article2.author.toLowerCase() === 'admin' || article2.author.toLowerCase() === 'superadmin' || article2.author === 'Industrial Times' ? 'Industrial Times' : article2.author}
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
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="featured-news-cat" style={{ marginBottom: 0 }}>{featuredArticles[2].category || 'News'}</span>
                            {featuredArticles[2].trending && (
                              <span className="badge bg-warning text-dark px-2 py-0.5" style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                                <i className="bi bi-lightning-fill"></i> TRENDING
                              </span>
                            )}
                          </div>

                          <h3 className="featured-news-title" style={{ fontSize: '1.05rem', marginBottom: '4px', fontWeight: '800', lineHeight: '1.3' }}>{featuredArticles[2].title}</h3>
                        </div>
                        <div className="featured-news-meta">
                          <i className="bi bi-person-fill me-1"></i>
                          {!featuredArticles[2].author || featuredArticles[2].author.toLowerCase() === 'admin' || featuredArticles[2].author.toLowerCase() === 'superadmin' || featuredArticles[2].author === 'Industrial Times' ? 'Industrial Times' : featuredArticles[2].author}
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

          {/* MOBILE INLINE AD — 300×250 (replaces sidebar ads on mobile) */}
          <div className="ad-mobile-only mobile-ad-row">
            <Advertisement slot="mobile-rectangle" />
          </div>

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
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="news-grid-cat" style={{ marginBottom: 0 }}>{article.category || 'News'}</span>
                        {article.trending && (
                          <span className="badge bg-warning text-dark px-2 py-0.5" style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                            <i className="bi bi-lightning-fill"></i> TRENDING
                          </span>
                        )}
                      </div>

                      <h6 className="news-grid-title">{article.title}</h6>
                      <div className="news-grid-meta">
                        <i className="bi bi-person-fill me-1"></i>
                        <span className="text-muted hover-text-red">
                          {!article.author || article.author.toLowerCase() === 'admin' || article.author.toLowerCase() === 'superadmin' || article.author === 'Industrial Times' ? 'Industrial Times' : article.author}
                        </span>
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
                  No news available. Upload from Admin panel.
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
        </Col>

        {/* ── RIGHT HALF-PAGE AD — 300 × 600 ── */}
        <Col xl={3} lg={3} className="d-none d-lg-block">
          <div className="sticky-top" style={{ top: '135px' }}>
            <Advertisement slot="right-half-page" />
          </div>
        </Col>

      </Row>

      {/* COLOMBIA AD NETWORK PLACEMENT */}
      <ColombiaAd />

      {/* MOBILE STICKY BOTTOM BANNER — 320×50 */}
      <MobileStickyAd />
    </Container>
  );
};

export default Home;
