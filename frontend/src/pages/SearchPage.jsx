import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Container, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import Advertisement from '../components/Advertisement';

const SearchPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q');
  const dateQuery = searchParams.get('date');

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        let url = `http://localhost:5000/api/articles`;
        if (query) {
          url += `?search=${query}`;
        } else if (dateQuery) {
          url += `?date=${dateQuery}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        
        let filtered = data;
        if (query) {
           filtered = data.filter(a => 
            a.title.toLowerCase().includes(query.toLowerCase()) || 
            (a.category && a.category.toLowerCase().includes(query.toLowerCase()))
          );
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
    <Container fluid="xl" className="py-5 reveal">
      <Helmet>
        <title>{query ? `Search: ${query}` : dateQuery ? `News: ${dateQuery}` : 'Search'} | Industrial Times</title>
      </Helmet>

      <Row className="g-4">
        {/* Left Sidebar Ad */}
        <Col xl={2} lg={2} className="d-none d-lg-block">
          <div className="sticky-top" style={{ top: '80px' }}>
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
              {results.map(article => (
                <Col md={6} key={article.id}>
                  <div className="search-result-card h-100 hover-lift shadow-sm p-3 bg-white rounded-4 border">
                    <div className="img-wrapper mb-3 rounded-3 overflow-hidden" style={{ height: '180px' }}>
                      <img src={article.imageUrl || article.image} alt={article.title} className="w-100 h-100 object-fit-cover" />
                    </div>
                    <Badge bg="danger" className="mb-2 text-uppercase">{article.category}</Badge>
                    <h5 className="fw-bold lh-sm" style={{ fontSize: '1.1rem' }}>
                      <Link to={`/article/search/${article.title}/${article.id}`} className="text-dark hover-text-red text-decoration-none">
                        {article.title}
                      </Link>
                    </h5>
                    <p className="small text-muted mb-0">{article.date} • By Admin</p>
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
        </Col>

        {/* Right Sidebar Ad */}
        <Col xl={3} lg={3} className="d-none d-lg-block">
          <div className="sticky-top" style={{ top: '80px' }}>
            <Advertisement slot="right-half-page" />
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default SearchPage;
