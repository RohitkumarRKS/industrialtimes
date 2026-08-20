import React, { useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import Advertisement from '../components/Advertisement';
import MobileStickyAd from '../components/MobileStickyAd';

const Disclaimer = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <Container fluid className="px-md-4 px-xl-5 py-5 reveal">
      <Row className="g-4">
        {/* Left Sidebar Ad */}
        <Col xl={2} lg={2} className="d-none d-lg-block">
          <div className="sticky-top" style={{ top: '135px' }}>
            <Advertisement slot="left-skyscraper" />
          </div>
        </Col>

        {/* Main Content */}
        <Col xl={7} lg={7} md={12} xs={12}>
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border border-light policy-page-content">
            <h1 className="display-6 fw-black mb-4 pb-3 border-bottom border-danger border-opacity-25" style={{ letterSpacing: '-1px' }}>
              Disclaimer
            </h1>

            <p><strong>Last Updated: June 2026</strong></p>
            <p>
              The information provided on Industrial Times Network (www.industrialtimes.in) is published in good faith and for general informational, educational, and news reporting purposes only.
            </p>

            <h2>News Accuracy Disclaimer</h2>
            <p>
              While we strive to ensure that all information published is accurate and up to date, Industrial Times Network makes no warranties or representations regarding the completeness, reliability, suitability, or accuracy of any information contained on the website. Any action you take based on information found on this website is strictly at your own risk.
            </p>

            <h2>Editorial Opinions</h2>
            <p>
              Opinions expressed in articles, editorials, interviews, blogs, comments, or guest contributions belong solely to the respective authors and do not necessarily reflect the views of Industrial Times Network or Radiogeet Digital Pvt. Ltd.
            </p>

            <h2>Professional Advice Disclaimer</h2>
            <p>
              Content available on this website should not be considered legal, financial, medical, investment, technical, or professional advice. Readers are encouraged to seek qualified professional guidance before making decisions based on information published on this platform.
            </p>

            <h2>External Links Disclaimer</h2>
            <p>
              Our website may contain links to third-party websites for additional information and convenience. We do not guarantee the accuracy, relevance, security, or reliability of information provided by third-party websites and are not responsible for any content, products, services, or practices offered by such websites.
            </p>

            <h2>Advertisement Disclaimer</h2>
            <p>
              Industrial Times Network may display advertisements, sponsored content, native advertising, and promotional materials. The presence of advertisements does not imply endorsement, recommendation, or guarantee of any product, service, company, or claim made by advertisers. Users should independently verify all information before engaging with advertisers.
            </p>

            <h2>User Generated Content Disclaimer</h2>
            <p>
              Comments, reviews, opinions, and submissions posted by users are solely the responsibility of the individuals who submit them. Industrial Times Network shall not be held liable for any user-generated content published on the platform.
            </p>

            <h2>Limitation of Liability</h2>
            <p>Under no circumstances shall Radiogeet Digital Pvt. Ltd., Industrial Times Network, its directors, employees, contributors, affiliates, or partners be liable for any direct, indirect, incidental, consequential, or special damages arising from:</p>
            <ul>
              <li>Use of the website</li>
              <li>Reliance on published content</li>
              <li>Website interruptions</li>
              <li>Technical issues</li>
              <li>Third-party content or services</li>
            </ul>

            <h2>Copyright Notice</h2>
            <p>
              All content published on Industrial Times Network, including text, graphics, videos, images, logos, and designs, is protected by applicable copyright and intellectual property laws. Unauthorized reproduction, redistribution, or commercial use of any content without prior written permission is prohibited.
            </p>

            <h2>Consent</h2>
            <p>
              By using this website, you hereby consent to this Disclaimer and agree to its terms.
            </p>

            <h2>Contact Information</h2>
            <p>For any questions regarding this Disclaimer, contact:</p>
            <p>
              Radiogeet Digital Pvt. Ltd.<br/>
              Industrial Times Network<br/>
              79, Teachers Colony, Dimna Road, Mango<br/>
              Jamshedpur – 831012, Jharkhand, India<br/>
              Email: info@industrialtimes.in
            </p>
          </div>

          {/* MOBILE AD — 300×250 */}
          <div className="ad-mobile-only mobile-ad-row mt-4">
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

      <style dangerouslySetInnerHTML={{ __html: `
        .policy-page-content p, .policy-page-content ul, .policy-page-content li, .policy-page-content span {
          font-size: 8pt !important;
          line-height: 1.5;
        }
        .policy-page-content h2, .policy-page-content h3, .policy-page-content h4, .policy-page-content h5, .policy-page-content h6 {
          font-size: 10pt !important;
          font-weight: bold;
          margin-top: 15px;
          margin-bottom: 8px;
        }
      `}} />
    </Container>
  );
};

export default Disclaimer;
