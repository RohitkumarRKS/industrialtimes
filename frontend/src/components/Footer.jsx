import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer-premium pt-5 pb-3">
      <Container>
        <Row className="gy-4 mb-5 pb-4">
          {/* Column 1: About & Address */}
          <Col lg={5} md={12} className="pe-lg-5 footer-reveal text-center text-lg-start mb-4 mb-lg-0" style={{ animationDelay: '0.1s' }}>
             <Link to="/" className="d-inline-block mb-4 hover-lift">
                <img 
                  src="/industrialtimes_white.png" 
                  alt="Industrial Times" 
                  style={{ height: '55px', width: 'auto', objectFit: 'contain' }}
                />
             </Link>
             <p className="small lh-lg mb-4 mx-auto mx-lg-0 footer-text">
               Industrial Times is the world's leading source of news, analysis, and insights for the manufacturing, automation, and industrial technology sectors. Delivering real-time intelligence to professionals globally.
             </p>
             <div className="address-block small mb-4">
                <div className="d-flex align-items-start gap-3 mb-3 p-0 transition-all footer-icon-text">
                  <i className="bi bi-geo-alt-fill text-danger fs-5 mt-1"></i>
                  <span>Regd. Add.: H.No.79 Teachers Colony, Dimna Road,<br />Mango, Jamshedpur, Jharkhand 831012</span>
                </div>
                <div className="d-flex align-items-center gap-3 mb-3 p-0 transition-all footer-icon-text">
                  <i className="bi bi-telephone-fill text-danger fs-5"></i>
                  <span>Mob: +91 790 345 1885</span>
                </div>
                <div className="d-flex align-items-center gap-3 p-0 transition-all footer-icon-text">
                  <i className="bi bi-envelope-fill text-danger fs-5"></i>
                  <span>Mail: info@radiogeet.com</span>
                </div>
             </div>
             
             <div className="social-links d-flex gap-3 mt-4 justify-content-center justify-content-lg-start">
                <a href="#" className="social-icon-btn"><i className="bi bi-facebook"></i></a>
                <a href="#" className="social-icon-btn"><i className="bi bi-twitter-x"></i></a>
                <a href="#" className="social-icon-btn"><i className="bi bi-linkedin"></i></a>
                <a href="#" className="social-icon-btn"><i className="bi bi-instagram"></i></a>
                <a href="#" className="social-icon-btn"><i className="bi bi-youtube"></i></a>
             </div>
          </Col>

          {/* Column 2: Sections */}
          <Col lg={2} md={4} sm={6} xs={6} className="footer-reveal text-start offset-lg-1" style={{ animationDelay: '0.2s' }}>
            <h6 className="footer-title">Sections</h6>
            <div className="d-flex flex-column gap-3 footer-links">
              <Link to="/manufacturing" className="footer-link">Manufacturing</Link>
              <Link to="/automation" className="footer-link">Automation</Link>
              <Link to="/interviews" className="footer-link">Interviews</Link>
              <Link to="/startups" className="footer-link">Startups</Link>
              <Link to="/events" className="footer-link">Events</Link>
              <Link to="/videos" className="footer-link">Videos</Link>
            </div>
          </Col>

          {/* Column 3: Corporate */}
          <Col lg={2} md={4} sm={6} xs={6} className="footer-reveal text-start" style={{ animationDelay: '0.3s' }}>
            <h6 className="footer-title">Corporate</h6>
            <div className="d-flex flex-column gap-3 footer-links">
              <Link to="/about" className="footer-link">About Us</Link>
              <Link to="/careers" className="footer-link">Careers</Link>
              <Link to="/press" className="footer-link">Press Releases</Link>
              <Link to="/contact" className="footer-link">Contact Us</Link>
              <Link to="/advertisement" className="footer-link">Advertise With Us</Link>
              <Link to="/media-partnership" className="footer-link">Media Partnership</Link>
              <Link to="/rss" className="footer-link">RSS Feeds</Link>
            </div>
          </Col>

          {/* Column 4: Legal & Policy */}
          <Col lg={2} md={4} sm={12} xs={12} className="footer-reveal text-start" style={{ animationDelay: '0.4s' }}>
            <h6 className="footer-title">Legal & Policy</h6>
            <div className="d-flex flex-column gap-3 footer-links">
              <Link to="/privacy" className="footer-link">Privacy Policy</Link>
              <Link to="/terms" className="footer-link">Terms & Conditions</Link>
              <Link to="/disclaimer" className="footer-link">Disclaimer</Link>
              <Link to="/grievance" className="footer-link">Grievance Redressal</Link>
            </div>
          </Col>
        </Row>

        {/* Bottom Copyright Row */}
        <Row className="pt-4 mt-2 align-items-center footer-bottom-row footer-reveal" style={{ animationDelay: '0.5s' }}>
          <Col xs={12} className="text-center">
            <p className="x-small mb-0 footer-copyright">
              &copy; {new Date().getFullYear()} Industrial Times Networks. All rights reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
