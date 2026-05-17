import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Advertisement from '../components/Advertisement';
import API_BASE from '../config/api';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('favorites') || '[]');
    setFavorites(saved);
  }, []);

  const removeFavorite = (id) => {
    const updated = favorites.filter(fav => fav.id !== id);
    localStorage.setItem('favorites', JSON.stringify(updated));
    setFavorites(updated);
  };

  const createSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
  };

  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    return `${API_BASE}${img.startsWith('/') ? '' : '/'}${img}`;
  };

  return (
    <Container fluid="xl" className="py-5 reveal">
      <Helmet>
        <title>My Favorites | Industrial Times</title>
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
          <div className="mb-4 mb-md-5 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3">
            <div>
              <h6 className="text-danger fw-bold text-uppercase x-small letter-spacing-1">Personal Collection</h6>
              <h2 className="fw-black display-6">My Bookmarked News</h2>
              <p className="text-muted mb-0">Access your saved articles and industrial reports</p>
            </div>
            <Badge bg="danger" className="rounded-pill px-3 py-2 fw-bold">{favorites.length} SAVED</Badge>
          </div>

          {favorites.length > 0 ? (
            <Row className="g-4">
              {favorites.map(article => {
                const articleImg = getImageUrl(article.image || article.imageUrl);
                const articleLink = `/article/${createSlug(article.category || 'news')}/${createSlug(article.title)}/${article.id}`;
                
                return (
                  <Col md={6} key={article.id}>
                    <div className="favorite-card h-100 hover-lift shadow-sm p-3 bg-white rounded-4 border position-relative">
                      <Button 
                        variant="light" 
                        size="sm" 
                        className="position-absolute top-0 end-0 m-3 rounded-circle shadow-sm"
                        onClick={() => removeFavorite(article.id)}
                        title="Remove from favorites"
                        style={{ zIndex: 10 }}
                      >
                        <i className="bi bi-x-lg text-danger"></i>
                      </Button>
                      <div className="img-wrapper mb-3 rounded-3 overflow-hidden bg-light" style={{ height: '180px' }}>
                        {articleImg ? (
                           <img src={articleImg} alt={article.title} className="w-100 h-100 object-fit-cover" />
                        ) : (
                           <div className="d-flex align-items-center justify-content-center h-100">
                              <i className="bi bi-image text-muted opacity-25 fs-1"></i>
                           </div>
                        )}
                      </div>
                      <Badge bg="dark" className="mb-2 text-uppercase bg-opacity-75">{article.category}</Badge>
                      <h5 className="fw-bold lh-sm" style={{ fontSize: '1.1rem' }}>
                        <Link to={articleLink} className="text-dark hover-text-red text-decoration-none">
                          {article.title}
                        </Link>
                      </h5>
                      <p className="small text-muted mb-0">{article.date || 'Saved Recently'}</p>
                    </div>
                  </Col>
                );
              })}
            </Row>
          ) : (
            <div className="text-center py-5 bg-light rounded-4 border border-dashed">
              <i className="bi bi-heart fs-1 text-muted opacity-25 mb-3 d-block"></i>
              <h4>No favorites saved yet</h4>
              <p className="text-muted">Click the heart icon on any article to save it here for later.</p>
              <Link to="/" className="btn btn-outline-danger rounded-pill px-4 mt-2">Explore Latest News</Link>
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

export default Favorites;
