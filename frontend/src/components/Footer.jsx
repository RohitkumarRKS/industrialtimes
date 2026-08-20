import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer-premium notranslate">
      <Container>
        <Row className="gy-4 border-bottom border-secondary border-opacity-25 pb-4 mb-4 align-items-start">
          {/* Column 1: Brand & Social */}
          <Col lg={4} md={12} className="pe-lg-5 footer-reveal text-center text-lg-start mb-4 mb-lg-0" style={{ animationDelay: '0.1s' }}>
            <a href="/" className="d-inline-block mb-3 hover-lift">
              <img
                src="/industrialtimes_white.png"
                alt="Industrial Times"
                className="footer-logo"
              />
            </a>
            <p className="small lh-lg mb-3 mx-auto mx-lg-0 footer-text">
              Industrial Times is a leading digital news and media platform delivering breaking news, industry updates, business insights, technology trends, startup stories, interviews, and current affairs from India and across the globe. Our mission is to provide accurate, reliable, and impactful journalism that informs, educates, and empowers our audience.
            </p>

            <div className="social-links d-flex gap-3 mt-3 justify-content-center justify-content-lg-start">
              <a href="https://www.facebook.com/ITNIndia" target="_blank" rel="noreferrer" className="social-icon-btn"><i className="bi bi-facebook"></i></a>
              <a href="https://www.linkedin.com/company/industrialtimes/" target="_blank" rel="noreferrer" className="social-icon-btn"><i className="bi bi-linkedin"></i></a>
              <a href="https://www.instagram.com/itnindia/" target="_blank" rel="noreferrer" className="social-icon-btn"><i className="bi bi-instagram"></i></a>
              <a href="https://x.com/itnindiaa" target="_blank" rel="noreferrer" className="social-icon-btn"><i className="bi bi-twitter-x"></i></a>
              <a href="https://www.youtube.com/@itn_india" target="_blank" rel="noreferrer" className="social-icon-btn"><i className="bi bi-youtube"></i></a>
            </div>
          </Col>

          {/* Column 2: Links */}
          <Col lg={8} md={12} className="footer-reveal" style={{ animationDelay: '0.2s' }}>
            <Row className="gy-4 justify-content-between">
              <Col lg={3} md={6} sm={6} xs={6} className="text-start">
                <h6 className="footer-title">Sections</h6>
                <div className="d-flex flex-column align-items-start gap-2 footer-links small">
                  <Link to="/news" className="footer-link">News</Link>
                  <Link to="/regional" className="footer-link">Regional</Link>
                  <Link to="/oem" className="footer-link">OEM</Link>
                  <Link to="/automation" className="footer-link">Automation</Link>
                </div>
              </Col>
              <Col lg={3} md={6} sm={6} xs={6} className="text-start">
                <h6 className="footer-title">More Sections</h6>
                <div className="d-flex flex-column align-items-start gap-2 footer-links small">
                  <Link to="/interview" className="footer-link">Interviews</Link>
                  <Link to="/startup" className="footer-link">Startups</Link>
                  <Link to="/business" className="footer-link">Business</Link>
                  <Link to="/event" className="footer-link">Events</Link>
                </div>
              </Col>
              <Col lg={3} md={6} sm={6} xs={6} className="text-start">
                <h6 className="footer-title">Corporate</h6>
                <div className="d-flex flex-column align-items-start gap-2 footer-links small">
                  <Link to="/about" className="footer-link">About Us</Link>
                  <Link to="/careers" className="footer-link">Careers</Link>
                  <Link to="/contact" className="footer-link">Contact Us</Link>
                  <Link to="/advertisement" className="footer-link">Advertise With Us</Link>
                  <Link to="/media-partnership" className="footer-link">Media Partnership</Link>
                  <Link to="/press" className="footer-link">Press Releases</Link>
                </div>
              </Col>
              <Col lg={3} md={6} sm={6} xs={6} className="text-start">
                <h6 className="footer-title">Legal & Policy</h6>
                <div className="d-flex flex-column align-items-start gap-2 footer-links small">
                  <Link to="/privacy" className="footer-link">Privacy Policy</Link>
                  <Link to="/terms" className="footer-link">Terms & Conditions</Link>
                  <Link to="/disclaimer" className="footer-link">Disclaimer</Link>
                  <Link to="/grievance" className="footer-link">Grievance Redressal</Link>
                  <Link to="/rss" className="footer-link">RSS Feeds</Link>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Contact Info Multi-Column */}
        <Row className="gy-4 pb-4 footer-reveal justify-content-center" style={{ animationDelay: '0.3s' }}>
          <Col lg={12} className="text-center text-lg-start mb-2">
            <div style={{ borderBottom: '2px solid #dc3545', display: 'inline-block', paddingBottom: '8px' }}>
              <h6 className="text-white fw-bold m-0 fs-5 text-uppercase letter-spacing-1">Global Offices</h6>
            </div>
          </Col>

          <Col lg={4} md={6} sm={12}>
            <div className="contact-card p-4 rounded-4 text-start mx-auto mx-lg-0" style={{ maxWidth: '400px' }}>
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="contact-icon-wrapper">
                  <i className="bi bi-building fs-5"></i>
                </div>
                <div>
                  <h6 className="text-white text-uppercase fw-bold m-0 fs-6">Headquarter</h6>
                </div>
              </div>
              <div className="address-block small footer-icon-text text-white-50 d-flex flex-column gap-3">
                <div className="d-flex align-items-start gap-2 justify-content-start">
                  <i className="bi bi-geo-alt mt-1"></i>
                  <span className="text-start">H.No. 79 Teachers Colony, Dimna Road,<br />Mango, Jamshedpur, Jharkhand – 831012</span>
                </div>
                <div className="d-flex align-items-center gap-2 justify-content-start">
                  <i className="bi bi-envelope"></i>
                  <span>info@industrialtimes.in</span>
                </div>
                <div className="d-flex align-items-center gap-2 justify-content-start">
                  <i className="bi bi-telephone"></i>
                  <span>+91 7903451885</span>
                </div>
              </div>
            </div>
          </Col>

          <Col lg={4} md={6} sm={12}>
            <div className="contact-card p-4 rounded-4 text-start mx-auto mx-lg-0" style={{ maxWidth: '400px' }}>
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="contact-icon-wrapper">
                  <i className="bi bi-geo-alt-fill fs-5"></i>
                </div>
                <div>
                  <h6 className="text-white text-uppercase fw-bold m-0 fs-6">Regional Office</h6>
                </div>
              </div>
              <div className="address-block small footer-icon-text text-white-50 d-flex flex-column gap-3">
                <div className="d-flex align-items-start gap-2 justify-content-start">
                  <i className="bi bi-geo-alt mt-1"></i>
                  <span className="text-start">B-8, 3rd floor, Sector-2, Near Sector 15 Metro Station, Noida, UP-201301</span>
                </div>
                <div className="d-flex align-items-center gap-2 justify-content-start">
                  <i className="bi bi-envelope"></i>
                  <span>sales@industrialtimes.in</span>
                </div>
                <div className="d-flex align-items-center gap-2 justify-content-start">
                  <i className="bi bi-telephone"></i>
                  <span>+91 7903451885</span>
                </div>
              </div>
            </div>
          </Col>

          <Col lg={4} md={6} sm={12}>
            <div className="contact-card p-4 rounded-4 text-start mx-auto mx-lg-0" style={{ maxWidth: '400px' }}>
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="contact-icon-wrapper">
                  <i className="bi bi-pin-map-fill fs-5"></i>
                </div>
                <div>
                  <h6 className="text-white text-uppercase fw-bold m-0 fs-6">Our Studio</h6>
                </div>
              </div>
              <div className="address-block small footer-icon-text text-white-50 d-flex flex-column gap-3">
                <div className="d-flex align-items-start gap-2 justify-content-start">
                  <i className="bi bi-geo-alt mt-1"></i>
                  <span className="text-start">Plot No. 114, Behind HDFC Bank,<br />New Baradwari, Jamshedpur, Jharkhand – 831001</span>
                </div>
                <div className="d-flex align-items-center gap-2 justify-content-start">
                  <i className="bi bi-envelope"></i>
                  <span>info@industrialtimes.in</span>
                </div>
                <div className="d-flex align-items-center gap-2 justify-content-start">
                  <i className="bi bi-telephone"></i>
                  <span>+91 7903451885</span>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
      {/* Copyright */}
      <div className="footer-bottom">
        <Container>
          <Row className="align-items-center py-3">
            <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
              <p className="mb-0 small text-white-50">
                &copy; {new Date().getFullYear()} Industrial Times . All Rights Reserved.
              </p>
            </Col>
            <Col md={6} className="text-center text-md-end">
              <div className="footer-bottom-links small">
                <Link to="/privacy">Privacy Policy</Link>
                <span className="mx-2 text-white-50">|</span>
                <Link to="/terms">Terms &amp; Conditions</Link>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </footer>
  );
};

export default Footer;
