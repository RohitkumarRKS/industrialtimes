import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer-custom py-5" style={{ background: '#000', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <Container>
        <Row className="gy-5 mb-5 pb-4 justify-content-between">
          {/* Column 1: About & Address */}
          <Col lg={4} md={12} className="pe-lg-5 footer-reveal text-center text-lg-start mb-4 mb-lg-0" style={{ animationDelay: '0.1s' }}>
             <Link to="/" className="d-inline-block mb-4 hover-lift">
                <img 
                  src="/industrialtimes_white.png" 
                  alt="Industrial Times" 
                  style={{ height: '55px', width: 'auto', objectFit: 'contain' }}
                />
             </Link>
             <p className="small lh-lg mb-4 mx-auto mx-lg-0" style={{ color: '#9ca3af', maxWidth: '380px', textAlign: 'justify' }}>
               Industrial Times is the world's leading source of news, analysis, and insights for the manufacturing, automation, and industrial technology sectors. Delivering real-time intelligence to professionals globally.
             </p>
             <div className="address-block small mb-4">
                <div className="d-flex align-items-start gap-3 mb-3 p-0 transition-all hover-text-white">
                  <i className="bi bi-geo-alt-fill text-danger fs-5 mt-1"></i>
                  <span style={{ color: '#9ca3af' }}>Regd. Add.: H.No.79 Teachers Colony, Dimna Road,<br />Mango, Jamshedpur, Jharkhand 831012</span>
                </div>
                <div className="d-flex align-items-center gap-3 mb-3 p-0 transition-all hover-text-white">
                  <i className="bi bi-telephone-fill text-danger fs-5"></i>
                  <span style={{ color: '#9ca3af' }}>Mob: +91 790 345 1885</span>
                </div>
                <div className="d-flex align-items-center gap-3 p-0 transition-all hover-text-white">
                  <i className="bi bi-envelope-fill text-danger fs-5"></i>
                  <span style={{ color: '#9ca3af' }}>Mail : info@radiogeet.com</span>
                </div>
             </div>
             
             <div className="social-links d-flex gap-3 mt-4 justify-content-center justify-content-lg-start">
                <a href="#" className="text-white-50 hover-text-red transition-all fs-5"><i className="bi bi-facebook"></i></a>
                <a href="#" className="text-white-50 hover-text-red transition-all fs-5"><i className="bi bi-twitter-x"></i></a>
                <a href="#" className="text-white-50 hover-text-red transition-all fs-5"><i className="bi bi-linkedin"></i></a>
                <a href="#" className="text-white-50 hover-text-red transition-all fs-5"><i className="bi bi-instagram"></i></a>
                <a href="#" className="text-white-50 hover-text-red transition-all fs-5"><i className="bi bi-youtube"></i></a>
             </div>
          </Col>

          {/* Column 2: Sections */}
          <Col lg={2} md={4} sm={6} xs={6} className="footer-reveal ps-lg-4 text-center text-lg-start" style={{ animationDelay: '0.2s' }}>
            <h6 className="footer-title text-white fw-black text-uppercase letter-spacing-1 mb-4 border-bottom border-danger border-2 pb-2 d-inline-block">Sections</h6>
            <div className="d-flex flex-column align-items-center align-items-lg-start gap-2 footer-links">
              <Link to="/manufacturing" className="text-white-50 text-decoration-none transition-all hover-text-red small">Manufacturing</Link>
              <Link to="/automation" className="text-white-50 text-decoration-none transition-all hover-text-red small">Automation</Link>
              <Link to="/interviews" className="text-white-50 text-decoration-none transition-all hover-text-red small">Interviews</Link>
              <Link to="/startups" className="text-white-50 text-decoration-none transition-all hover-text-red small">Startups</Link>
              <Link to="/events" className="text-white-50 text-decoration-none transition-all hover-text-red small">Events</Link>
              <Link to="/videos" className="text-white-50 text-decoration-none transition-all hover-text-red small">Videos</Link>
            </div>
          </Col>

          {/* Column 3: Corporate */}
          <Col lg={2} md={4} sm={6} xs={6} className="footer-reveal text-center text-lg-start" style={{ animationDelay: '0.3s' }}>
            <h6 className="footer-title text-white fw-black text-uppercase letter-spacing-1 mb-4 border-bottom border-danger border-2 pb-2 d-inline-block">Corporate</h6>
            <div className="d-flex flex-column align-items-center align-items-lg-start gap-2 footer-links">
              <Link to="/about" className="text-white-50 text-decoration-none transition-all hover-text-red small">About Us</Link>
              <Link to="/careers" className="text-white-50 text-decoration-none transition-all hover-text-red small">Careers</Link>
              <Link to="/press" className="text-white-50 text-decoration-none transition-all hover-text-red small">Press Releases</Link>
              <Link to="/contact" className="text-white-50 text-decoration-none transition-all hover-text-red small">Contact Us</Link>
              <Link to="/advertisement" className="text-white-50 text-decoration-none transition-all hover-text-red small">Advertise With Us</Link>
              <Link to="/media-partnership" className="text-white-50 text-decoration-none transition-all hover-text-red small">Media Partnership</Link>
              <Link to="/rss" className="text-white-50 text-decoration-none transition-all hover-text-red small">RSS Feeds</Link>
            </div>
          </Col>

          {/* Column 4: Legal & Policy */}
          <Col lg={2} md={4} sm={12} xs={12} className="footer-reveal text-center text-lg-start" style={{ animationDelay: '0.4s' }}>
            <h6 className="footer-title text-white fw-black text-uppercase letter-spacing-1 mb-4 border-bottom border-danger border-2 pb-2 d-inline-block">Legal & Policy</h6>
            <div className="d-flex flex-column align-items-center align-items-lg-start gap-2 footer-links">
              <Link to="/privacy" className="text-white-50 text-decoration-none transition-all hover-text-red small">Privacy Policy</Link>
              <Link to="/terms" className="text-white-50 text-decoration-none transition-all hover-text-red small">Terms & Conditions</Link>
              <Link to="/disclaimer" className="text-white-50 text-decoration-none transition-all hover-text-red small">Disclaimer</Link>
              <Link to="/grievance" className="text-white-50 text-decoration-none transition-all hover-text-red small">Grievance Redressal</Link>
            </div>
          </Col>
        </Row>

        {/* Bottom Copyright Row */}
        <Row className="pt-4 border-top border-white border-opacity-10 align-items-center footer-reveal" style={{ animationDelay: '0.5s' }}>
          <Col xs={12} className="text-center text-md-start">
            <p className="x-small mb-0 text-white-50 opacity-50 text-uppercase letter-spacing-1 fw-bold">
              &copy; {new Date().getFullYear()} Industrial Times Networks. All rights reserved. Reproduction in whole or in part without permission is prohibited.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
