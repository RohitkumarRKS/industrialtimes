import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Spinner } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import Advertisement from '../components/Advertisement';
import API_BASE from '../config/api';

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir"
];

const AreaNews = () => {
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const stateParam = searchParams.get('state');
    const cityParam = searchParams.get('city');
    if (stateParam) {
      setSelectedState(stateParam);
    }
    if (cityParam) {
      setSelectedCity(cityParam);
    }
  }, [location.search]);

  useEffect(() => {
    if (!selectedState) {
      setArticles([]);
      return;
    }
    const fetchNews = async () => {
      setLoading(true);
      try {
        let url = `${API_BASE}/api/articles/location/${selectedState}`;
        if (selectedCity) {
           url += `/${selectedCity}`;
        }
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
  }, [selectedState, selectedCity]);

  const createSlug = (text) => text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    return `${API_BASE}${img.startsWith('/') ? '' : '/'}${img}`;
  };

  return (
    <Container fluid="xl" className="py-4 reveal">
      <div className="d-flex flex-column mb-4 text-center">
        <h1 className="fw-black display-5 text-uppercase mb-2" style={{ letterSpacing: '1px' }}>
          Area-Wise <span style={{ color: 'var(--industrial-red)' }}>News</span>
        </h1>
        <p className="text-secondary small">Stay updated with local happenings across Indian states and cities.</p>
      </div>

      <Row className="justify-content-center mb-5">
        <Col md={8} lg={6}>
          <div className="p-4 rounded-4 shadow-sm border border-secondary border-opacity-10" style={{ background: '#f8f9fa' }}>
            <Row className="g-3">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small text-muted">SELECT STATE</Form.Label>
                  <Form.Select 
                    value={selectedState} 
                    onChange={(e) => { setSelectedState(e.target.value); setSelectedCity(''); }}
                    className="border-0 shadow-sm py-2 rounded-3"
                  >
                    <option value="">Choose State...</option>
                    {indianStates.map(st => <option key={st} value={st}>{st}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small text-muted">CITY (OPTIONAL)</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Enter city name..."
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="border-0 shadow-sm py-2 rounded-3"
                    disabled={!selectedState}
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Left Ad */}
        <Col xl={2} lg={2} className="d-none d-lg-block">
          <div className="sticky-top" style={{ top: '80px' }}>
            <Advertisement slot="left-skyscraper" />
          </div>
        </Col>

        {/* Main Content */}
        <Col xl={7} lg={7} md={12} xs={12}>
          {loading ? (
             <div className="text-center py-5">
               <Spinner animation="border" style={{ color: 'var(--industrial-red)' }} />
             </div>
          ) : !selectedState ? (
             <div className="text-center py-5 bg-light rounded-4 border border-secondary border-dashed">
               <i className="bi bi-geo-alt display-1 text-muted opacity-25"></i>
               <h4 className="mt-3 fw-bold text-secondary">Select a state to view local news</h4>
             </div>
          ) : articles.length > 0 ? (
             <div className="news-grid-2col">
               {articles.map((article) => {
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
                          <span className="x-small text-muted">{new Date(article.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h6 className="news-grid-title">{article.title}</h6>
                        <div className="news-grid-meta">
                          <i className="bi bi-person-fill me-1"></i>
                          {article.author || 'Editorial'}
                        </div>
                      </div>
                    </Link>
                 );
               })}
             </div>
          ) : (
             <div className="text-center py-5 bg-light rounded-4 border border-secondary border-dashed">
               <i className="bi bi-inbox display-1 text-muted opacity-25"></i>
               <h4 className="mt-3 fw-bold text-secondary">No news found for {selectedCity ? `${selectedCity}, ` : ''}{selectedState}</h4>
             </div>
          )}
        </Col>

        {/* Right Ad */}
        <Col xl={3} lg={3} className="d-none d-lg-block">
           <div className="sticky-top" style={{ top: '80px' }}>
              <Advertisement slot="right-half-page" />
           </div>
        </Col>
      </Row>
    </Container>
  );
};

export default AreaNews;
