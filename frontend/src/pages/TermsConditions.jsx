import React, { useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import Advertisement from '../components/Advertisement';
import MobileStickyAd from '../components/MobileStickyAd';

const TermsConditions = () => {
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
              Terms & Conditions
            </h1>

            <p><strong>Last Updated: June 2026</strong></p>
            <p>
              Welcome to Industrial Times Network, operated by Radiogeet Digital Pvt. Ltd. By accessing or using our website (www.industrialtimes.in), mobile applications, or any related services, you agree to comply with and be bound by these Terms & Conditions.
            </p>

            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing, browsing, or using Industrial Times Network, you acknowledge that you have read, understood, and agree to be legally bound by these Terms & Conditions and our Privacy Policy. If you do not agree with any part of these terms, please discontinue use of our services immediately.
            </p>

            <h2>2. Eligibility</h2>
            <p>
              You must be at least 18 years of age or have the consent of a parent or legal guardian to use our services.
            </p>

            <h2>3. Intellectual Property Rights</h2>
            <p>
              All content published on Industrial Times Network, including articles, news reports, graphics, logos, videos, images, designs, trademarks, and software, is the property of Radiogeet Digital Pvt. Ltd. or its licensors and is protected by applicable intellectual property laws.
            </p>
            <p>You may:</p>
            <ul>
              <li>View and read content for personal, non-commercial use.</li>
              <li>Share links to our content through social media and other platforms.</li>
            </ul>
            <p>You may not:</p>
            <ul>
              <li>Copy, reproduce, distribute, republish, modify, or commercially exploit any content without prior written permission.</li>
              <li>Use our content for AI training, automated scraping, or data extraction without authorization.</li>
            </ul>

            <h2>4. User Conduct</h2>
            <p>Users agree not to:</p>
            <ul>
              <li>Violate any applicable laws or regulations.</li>
              <li>Upload or distribute harmful, defamatory, abusive, obscene, or unlawful content.</li>
              <li>Attempt unauthorized access to our systems or services.</li>
              <li>Disrupt the operation or security of the website.</li>
              <li>Impersonate another person or organization.</li>
            </ul>

            <h2>5. User Generated Content</h2>
            <p>
              Comments, reviews, opinions, and other content submitted by users remain their responsibility. By submitting content, you grant Industrial Times Network a worldwide, royalty-free, nonexclusive license to use, publish, reproduce, modify, and distribute such content in any media format. We reserve the right to remove any content without prior notice.
            </p>

            <h2>6. News and Editorial Content</h2>
            <p>
              Industrial Times Network strives to provide accurate and timely information. However, we do not guarantee the completeness, reliability, or accuracy of any news, opinions, reports, or articles published on our platform. Users should independently verify information before relying upon it.
            </p>

            <h2>7. Third-Party Links</h2>
            <p>Our website may contain links to third-party websites for user convenience. We do not control, endorse, or assume responsibility for:</p>
            <ul>
              <li>Third-party content</li>
              <li>Privacy practices</li>
              <li>Products or services offered by external websites</li>
            </ul>
            <p>Users access such websites at their own risk.</p>

            <h2>8. Advertising and Sponsored Content</h2>
            <p>
              Industrial Times Network may display advertisements, sponsored articles, promotional content, and affiliate links. Sponsored content will be identified where required. We are not responsible for claims made by advertisers or third-party sponsors.
            </p>

            <h2>9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Radiogeet Digital Pvt. Ltd., its directors, employees, partners, and affiliates shall not be liable for:</p>
            <ul>
              <li>Direct or indirect damages</li>
              <li>Loss of profits</li>
              <li>Loss of data</li>
              <li>Business interruption</li>
              <li>Errors or omissions in content</li>
              <li>Reliance on published information arising from the use of our services.</li>
            </ul>

            <h2>10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Radiogeet Digital Pvt. Ltd., Industrial Times Network, its officers, employees, and affiliates from any claims, damages, liabilities, or expenses arising from your use of the services or violation of these terms.
            </p>

            <h2>11. Suspension or Termination</h2>
            <p>
              We reserve the right to suspend or terminate access to our services at any time without prior notice if a user violates these Terms & Conditions or applicable laws.
            </p>

            <h2>12. Governing Law</h2>
            <p>
              These Terms & Conditions shall be governed by and construed in accordance with the laws of India, including the Information Technology Act, 2000 and applicable amendments. Any disputes shall be subject to the exclusive jurisdiction of courts located in Jamshedpur, Jharkhand, India.
            </p>

            <h2>13. Changes to Terms</h2>
            <p>
              Industrial Times Network reserves the right to update or modify these Terms & Conditions at any time. Continued use of the services after changes constitutes acceptance of the revised terms.
            </p>

            <h2>14. Contact Information</h2>
            <p>For any questions regarding these Terms & Conditions, contact:</p>
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

export default TermsConditions;
