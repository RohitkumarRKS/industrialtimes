import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Container, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import Advertisement from '../components/Advertisement';
import MobileStickyAd from '../components/MobileStickyAd';
import API_BASE from '../config/api';
import { createSlug } from '../utils/slugify';
import { getRelativeTime } from '../utils/timeFormatter';

const SearchPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(8);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q');
  const dateQuery = searchParams.get('date');

  useEffect(() => {
    setVisibleCount(8);
  }, [query, dateQuery]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 150) {
        setVisibleCount((prev) => {
          if (prev >= results.length) return prev;
          return prev + 6;
        });
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [results.length]);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        let url = `${API_BASE}/api/articles`;
        if (query) {
          url += `?search=${query}`;
        } else if (dateQuery) {
          url += `?date=${dateQuery}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        
        let filtered = data;
        if (query) {
           const lowercaseQuery = query.toLowerCase();
           filtered = data.filter(a => {
             const titleMatch = a.title?.toLowerCase().includes(lowercaseQuery);
             const categoryMatch = a.category?.toLowerCase().includes(lowercaseQuery);
             const contentMatch = a.content?.toLowerCase().includes(lowercaseQuery);
             const excerptMatch = a.excerpt?.toLowerCase().includes(lowercaseQuery);
             const tagsMatch = a.tags?.toLowerCase().includes(lowercaseQuery);
             
             // highlights might be stored as JSON or string
             let highlightsMatch = false;
             if (a.highlights) {
               try {
                 const parsed = typeof a.highlights === 'string' ? JSON.parse(a.highlights) : a.highlights;
                 if (Array.isArray(parsed)) {
                   highlightsMatch = parsed.some(h => typeof h === 'string' && h.toLowerCase().includes(lowercaseQuery));
                 } else {
                   highlightsMatch = String(a.highlights).toLowerCase().includes(lowercaseQuery);
                 }
               } catch (e) {
                 highlightsMatch = String(a.highlights).toLowerCase().includes(lowercaseQuery);
               }
             }
             
             return titleMatch || categoryMatch || contentMatch || excerptMatch || tagsMatch || highlightsMatch;
           });
        }
        
        setResults(filtered);
        setLoading(false);
      } catch (error) {
        console.error("Search failed:", error);
        setLoading(false);
      }
    };
    if (query || dateQuery) fetchResults();
  }, [query, dateQuery]);

  const displayTitle = query ? `Showing results for: "${query}"` : dateQuery ? `News for: ${new Date(dateQuery).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Search Results';


  return (
    <Container fluid className="px-md-4 px-xl-5 py-4 reveal">
      <Helmet>
        <title>{query ? `Search: ${query}` : dateQuery ? `News: ${dateQuery}` : 'Search'} | Industrial Times</title>
      </Helmet>

      <Row className="g-4">
        {/* Left Sidebar Ad */}
        <Col xl={2} lg={2} className="d-none d-lg-block">
          <div className="sticky-top" style={{ top: '135px' }}>
            <Advertisement slot="left-skyscraper" />
          </div>
        </Col>

        {/* Main Content */}
        <Col xl={7} lg={7} md={12} xs={12}>
          <div className="mb-5">
            <h6 className="text-danger fw-bold text-uppercase x-small letter-spacing-1">{query ? 'Search Results' : 'Archive News'}</h6>
            <h2 className="fw-black display-6">{displayTitle}</h2>
            <p className="text-muted">{results.length} articles found matching your criteria</p>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="danger" />
            </div>
          ) : results.length > 0 ? (
            <Row className="g-4">
              {results.slice(0, visibleCount).map(article => (
                <Col md={6} key={article.id}>
                  <div className="search-result-card h-100 hover-lift shadow-sm p-3 bg-white rounded-4 border">
                    <div className="img-wrapper mb-3 rounded-3 overflow-hidden" style={{ height: '180px' }}>
                      <img src={article.imageUrl || article.image} alt={article.title} className="w-100 h-100 object-fit-cover" />
                    </div>
                    <Badge bg="danger" className="mb-2 text-uppercase">{article.category}</Badge>
                    <h5 className="fw-bold lh-sm" style={{ fontSize: '1.1rem' }}>
                      <Link to={`/article/${createSlug(article.category)}/${createSlug(article.title)}`} className="text-dark hover-text-red text-decoration-none">
                        {article.title}
                      </Link>
                    </h5>
                    <p className="small text-muted mb-0">{getRelativeTime(article.date || article.createdAt)} • By Admin</p>
                  </div>
                </Col>
              ))}
            </Row>
          ) : (
            <div className="text-center py-5 bg-light rounded-4 border">
              <i className="bi bi-search fs-1 text-muted mb-3 d-block"></i>
              <h4>No results found</h4>
              <p className="text-muted">Try using different keywords or check your spelling.</p>
              <Link to="/" className="btn btn-danger rounded-pill px-4 mt-2">Back to Home</Link>
            </div>
          )}

          {visibleCount < results.length && (
            <div className="text-center mt-2 mb-4 py-3">
              <Spinner animation="border" size="sm" variant="danger" className="me-2" />
              <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Loading more news...</span>
            </div>
          )}

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

export default SearchPage;
