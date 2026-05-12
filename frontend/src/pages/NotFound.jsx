import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <Container>
      <div className="not-found-container reveal">
        <div className="not-found-glow"></div>
        <h1 className="error-code">404</h1>
        <h2 className="fw-black text-uppercase mb-3" style={{ letterSpacing: '2px' }}>Oops! Page Not Found</h2>
        <p className="text-white-50 mb-5 mx-auto" style={{ maxWidth: '500px' }}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable in our industrial database.
        </p>
        <Link to="/">
          <Button variant="danger" className="not-found-btn">
            <i className="bi bi-house-door-fill me-2"></i> Back to Home
          </Button>
        </Link>
      </div>
    </Container>
  );
};

export default NotFound;
