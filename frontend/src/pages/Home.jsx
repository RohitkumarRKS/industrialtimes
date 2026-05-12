import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Advertisement from '../components/Advertisement';

const Home = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(8);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/articles');
        const data = await res.json();
        setArticles(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch articles:", error);
        setLoading(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '40vh' }}>
        <Spinner animation="border" style={{ color: 'var(--industrial-red)' }} />
      </Container>
    );
  }

  const latestArticles = articles.slice(0, visibleCount);

  const createSlug = (text) => {
    return text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  };

  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    return `http://localhost:5000${img.startsWith('/') ? '' : '/'}${img}`;
  };

  return (
    <Container fluid="xl" className="py-3">



      {/* ════════════════════════════════════════════════════════════
          MAIN CONTENT GRID:
          [Left Skyscraper 160px] | [Trending 3] | [Stories 6] | [Right Half-Page 3]
      ════════════════════════════════════════════════════════════ */}
      <Row className="g-3 mt-1 reveal">

        {/* ── LEFT SKYSCRAPER AD — 160 × 600 ── */}
        <Col xl={2} lg={2} className="d-none d-lg-block">
          <div className="sticky-top" style={{ top: '80px' }}>
            <Advertisement slot="left-skyscraper" />
          </div>
        </Col>

        {/* ── LATEST STORIES — 2-col grid ── */}
        <Col xl={7} lg={7} md={12} xs={12}>
          <div className="section-card-header mb-3">
            <span className="section-label-tag">
              <i className="bi bi-lightning-fill me-1"></i> LATEST STORIES
            </span>
          </div>

          <div className="news-grid-2col">
            {latestArticles.length > 0
              ? latestArticles.map((article) => {
                  const articleImg = getImageUrl(article.image || article.imageUrl);
                  const articleLink = `/article/${createSlug(article.category || 'news')}/${createSlug(article.title)}/${article.id}`;
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
                          {article.author || 'Editorial'}
                          <span className="mx-1">·</span>
                          {article.date || 'Today'}
                        </div>
                      </div>
                    </Link>
                  );
                })
              : (
                <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                  <i className="bi bi-info-circle fs-3 d-block mb-2 opacity-50"></i>
                  No news available. Upload from Admin panel.
                </div>
              )
            }
          </div>

          {articles.length > visibleCount && (
            <div className="text-center mt-4">
              <Button
                variant="outline-danger"
                className="rounded-pill px-5 fw-bold small shadow-sm text-uppercase"
                onClick={() => setVisibleCount(articles.length)}
              >
                View All Latest News <i className="bi bi-arrow-down-short ms-1"></i>
              </Button>
            </div>
          )}
        </Col>

        {/* ── RIGHT HALF-PAGE AD — 300 × 600 ── */}
        <Col xl={3} lg={3} className="d-none d-lg-block">
          <div className="sticky-top" style={{ top: '80px' }}>
            <Advertisement slot="right-half-page" />
          </div>
        </Col>

      </Row>
    </Container>
  );
};

export default Home;
