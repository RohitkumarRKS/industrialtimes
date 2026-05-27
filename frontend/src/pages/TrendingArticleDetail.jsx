import React, { useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Badge } from 'react-bootstrap';
import Advertisement from '../components/Advertisement';
import MobileStickyAd from '../components/MobileStickyAd';

const TrendingArticleDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const article = location.state?.article;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!article) {
      navigate('/');
    }
  }, [article, navigate]);

  if (!article) return null;

  // Format date if available
  const formattedDate = article.pubDate 
    ? new Date(article.pubDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Recently Updated';

  // Sanitize the HTML content from Google News RSS description
  const createMarkup = () => {
    return { __html: article.description || article.content || '<p>No additional details available for this story.</p>' };
  };

  return (
    <Container fluid="xl" className="py-4 reveal">


      <Row className="g-4 position-relative">
        <Col xl={2} lg={2} className="d-none d-lg-block">
          <div className="sticky-top" style={{ top: '100px', zIndex: 10, transform: 'translateX(-20px)' }}>
            <div className="d-flex justify-content-start">
              <Advertisement slot="left-skyscraper" className="ms-0" />
            </div>
          </div>
        </Col>

        <Col xl={7} lg={7} md={12} xs={12}>
          <nav aria-label="breadcrumb" className="mb-4">
            <ol className="breadcrumb small fw-bold">
              <li className="breadcrumb-item"><Link to="/" className="text-muted">HOME</Link></li>
              <li className="breadcrumb-item active text-danger text-uppercase">TRENDING NEWS</li>
            </ol>
          </nav>

          <Badge bg="danger" className="mb-3 px-3 py-2 fw-black text-uppercase" style={{ letterSpacing: '1px' }}>
            <i className="bi bi-graph-up-arrow me-2"></i> TRENDING
          </Badge>
          
          <h1 className="article-title mb-4">{article.parsedTitle || article.title}</h1>
          
          <div className="d-flex align-items-center gap-3 mb-5 pb-4 border-bottom">
            <div className="bg-dark text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
              <i className="bi bi-globe fs-5"></i>
            </div>
            <div>
              <div className="fw-black small text-uppercase">Source: {article.sourceName || 'Google News'}</div>
              <div className="x-small text-muted fw-bold mt-1">PUBLISHED: {formattedDate}</div>
            </div>
            <div className="ms-auto d-flex gap-2">
              <a href={article.link} target="_blank" rel="noopener noreferrer" className="btn btn-outline-danger btn-sm fw-bold">
                View Original <i className="bi bi-box-arrow-up-right ms-1"></i>
              </a>
            </div>
          </div>

          <div className="my-3 py-2 border-top border-bottom border-light ad-desktop-only" style={{ backgroundColor: '#fcfcfc' }}>
            <Advertisement slot="article-inline" />
          </div>
          <div className="my-3 py-2 ad-mobile-only mobile-ad-row">
            <Advertisement slot="mobile-inline" />
          </div>

          <div className="article-content bg-white p-4 p-md-5 rounded-4 shadow-sm border mb-5">
            <div className="article-body-text">
              <div dangerouslySetInnerHTML={createMarkup()} />
              
              <div className="mt-5 p-4 bg-light border-start border-danger border-4 rounded-3">
                <h6 className="fw-black mb-2 text-uppercase">Disclaimer</h6>
                <p className="small text-muted mb-0">
                  This content is aggregated automatically from Google News ({article.sourceName}). 
                  To read the full, uninterrupted article, please visit the original source.
                </p>
              </div>
            </div>

            {/* INLINE NEWS FOOTER AD — 728 × 90 */}
            <div className="my-4 text-center">
              <Advertisement slot="inline-news-footer" />
            </div>

            <div className="mt-5 pt-4 border-top d-flex flex-wrap gap-2">
              <span className="fw-bold me-2">TAGS:</span>
              <Link to="/category/Trending" className="badge bg-light text-dark border px-3 text-decoration-none tag-hover">#Trending</Link>
              <Link to={`/category/${article.sourceName?.replace(/\s+/g, '')}`} className="badge bg-light text-dark border px-3 text-decoration-none tag-hover">#{article.sourceName?.replace(/\s+/g, '')}</Link>
              <Link to="/category/LiveUpdates" className="badge bg-light text-dark border px-3 text-decoration-none tag-hover">#LiveUpdates</Link>
            </div>
            
            <div className="mt-5 bg-dark text-white p-4 rounded-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 shadow">
              <div>
                <h5 className="fw-black mb-1 d-flex align-items-center gap-2">
                  <i className="bi bi-shield-check text-success"></i> SOURCE CREDIT
                </h5>
                <p className="mb-0 small text-white-50">
                  This story was originally published by <strong className="text-white">{article.sourceName || 'Google News'}</strong>.
                </p>
              </div>
              <div>
                <a href={article.link} target="_blank" rel="noopener noreferrer" className="btn btn-light btn-sm fw-bold px-4 rounded-pill">
                  Read Original <i className="bi bi-box-arrow-up-right ms-1"></i>
                </a>
              </div>
            </div>

          </div>
        </Col>

        <Col xl={3} lg={3} className="d-none d-lg-block">
          <div className="sticky-top" style={{ top: '100px', zIndex: 10 }}>
            <div className="sidebar-ad text-end" style={{ transform: 'translateX(10px)' }}>
               <div className="d-flex justify-content-end">
                  <Advertisement slot="right-half-page" />
               </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* MOBILE STICKY BOTTOM BANNER — 320×50 */}
      <MobileStickyAd />
    </Container>
  );
};

export default TrendingArticleDetail;
