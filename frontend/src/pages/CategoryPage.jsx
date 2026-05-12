import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Spinner, Badge } from 'react-bootstrap';
import Advertisement from '../components/Advertisement';

const CategoryPage = ({ categoryOverride }) => {
  const { category: urlCategory } = useParams();
  const category = categoryOverride || urlCategory;
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

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
    return `http://localhost:5000${normalizedPath}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Local News
        const res = await fetch(`http://localhost:5000/api/articles/category/${category}`);
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

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  return (
    <Container className="py-4 reveal">

      <Row className="g-4">
        {/* Left Sidebar Ad */}
        <Col xl={2} lg={2} className="d-none d-lg-block">
          <div className="sticky-top" style={{ top: '80px' }}>
            <Advertisement slot="left-skyscraper" />
          </div>
        </Col>

        {/* Main Content */}
        <Col xl={7} lg={7} md={12}>
          <Row className="g-4 mb-5">
            <Col lg={12} className="mb-4">
               <h4 className="fw-black border-start border-danger border-4 ps-3 text-uppercase small" style={{ letterSpacing: '1px' }}>Local Editorial Highlights</h4>
            </Col>
            {articles.length > 0 ? (
              articles.map(article => (
                <Col lg={6} md={6} key={article.id}>
                  <Link to={`/article/${createSlug(article.category)}/${createSlug(article.title)}/${article.id}`} className="text-decoration-none">
                    <div className="category-feed-section hover-lift h-100 p-0 border-0 shadow-sm bg-white rounded-4 overflow-hidden">
                      <div className="img-zoom-container position-relative bg-dark">
                        <img 
                          src={getImageUrl(article.image || article.imageUrl) || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop'} 
                          alt={article.title} 
                          className="w-100" 
                          style={{ height: '200px', maxHeight: '220px', objectFit: 'cover', opacity: (article.image || article.imageUrl) ? 1 : 0.7 }} 
                        />
                        {article.video || article.videoUrl ? (
                          <div className="position-absolute top-50 start-50 translate-middle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(220, 53, 69, 0.8)', color: 'white' }}>
                            <i className="bi bi-play-fill fs-2"></i>
                          </div>
                        ) : null}
                      </div>
                      <div className="p-4">
                        <Badge bg="light" text="danger" className="mb-2 fw-black text-uppercase x-small border border-danger border-opacity-25">
                          {article.category}
                        </Badge>
                        <h5 className="fw-black mb-3 lh-base text-dark" style={{ fontSize: '1rem', minHeight: '3rem' }}>
                          {article.title}
                        </h5>
                        <p className="small text-muted mb-4 text-truncate-3" style={{ fontSize: '0.85rem' }}>
                          {article.excerpt || article.content?.substring(0, 100)}
                        </p>
                        <div className="d-flex justify-content-between align-items-center border-top pt-3">
                          <span className="x-small fw-bold text-muted">{article.date || 'Today'}</span>
                          <span className="fw-black text-danger x-small text-uppercase">READ STORY &rarr;</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </Col>
              ))
            ) : (
              <Col className="text-center py-5">
                <h6 className="text-muted italic">No editorial stories found for this category. Showing global updates below.</h6>
              </Col>
            )}
          </Row>
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

export default CategoryPage;
