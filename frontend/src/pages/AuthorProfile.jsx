import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Badge, Card } from 'react-bootstrap';
import Advertisement from '../components/Advertisement';
import API_BASE from '../config/api';

const AuthorProfile = () => {
  const { name } = useParams();
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    const fetchAuthorArticles = async () => {
       try {
         const res = await fetch(`${API_BASE}/api/articles`);
         const data = await res.json();
         // Filter articles by author name (mocking this as 'Admin' for now if no author object exists)
         setArticles(data.filter(a => (a.author && a.author.toLowerCase() === name.toLowerCase()) || (!a.author && name.toLowerCase() === 'admin')));
       } catch (e) {
         console.error(e);
       }
    };
    fetchAuthorArticles();
  }, [name]);

  return (
    <Container fluid="xl" className="py-5">
      <Row className="g-4">
        {/* Left Sidebar Ad */}
        <Col xl={2} lg={2} className="d-none d-lg-block">
          <div className="sticky-top" style={{ top: '80px' }}>
            <Advertisement slot="left-skyscraper" />
          </div>
        </Col>

        {/* Main Content */}
        <Col xl={7} lg={7} md={12} xs={12}>
          <div className="author-header bg-dark text-white p-4 p-md-5 rounded-4 mb-5 shadow-lg position-relative overflow-hidden">
             <div className="position-absolute top-0 end-0 p-5 opacity-10">
                <i className="bi bi-person-badge display-1"></i>
             </div>
             <Row className="align-items-center position-relative z-index-1">
                <Col md="auto" className="mb-4 mb-md-0">
                   <div className="bg-danger rounded-circle d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                      <span className="display-6 fw-black">{name.charAt(0)}</span>
                   </div>
                </Col>
                <Col>
                   <Badge bg="danger" className="mb-2 text-uppercase fw-black x-small">Verified Editorial Member</Badge>
                   <h1 className="display-6 fw-black mb-1">{name}</h1>
                   <p className="small text-white-50 mb-3">Expert Industrial Analyst & Senior Content Strategist</p>
                   <div className="d-flex gap-3">
                      <a href="#" className="text-white opacity-50 hover-opacity-100"><i className="bi bi-linkedin"></i></a>
                      <a href="#" className="text-white opacity-50 hover-opacity-100"><i className="bi bi-twitter-x"></i></a>
                      <a href="#" className="text-white opacity-50 hover-opacity-100"><i className="bi bi-envelope-fill"></i></a>
                   </div>
                </Col>
             </Row>
          </div>

          <h4 className="fw-black text-uppercase mb-4 border-bottom pb-3 small" style={{ letterSpacing: '1px' }}>Latest Contributions by {name}</h4>
          <Row className="g-4">
             {articles.length > 0 ? articles.map(article => (
                <Col md={6} key={article.id}>
                   <Link to={`/article/news/title/${article.id}`} className="text-decoration-none">
                      <div className="bg-white rounded-4 shadow-sm border border-light overflow-hidden hover-lift h-100">
                         <img src={article.image || article.imageUrl} className="w-100" style={{ height: '180px', objectFit: 'cover' }} alt={article.title} />
                         <div className="p-4">
                            <Badge bg="danger" className="mb-2 x-small fw-black text-uppercase">{article.category}</Badge>
                            <h6 className="fw-black text-dark mb-0">{article.title}</h6>
                         </div>
                      </div>
                   </Link>
                </Col>
             )) : (
                <Col className="text-center py-5">
                   <p className="text-muted italic">Awaiting new editorial pieces from this author.</p>
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

export default AuthorProfile;
