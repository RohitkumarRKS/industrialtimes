import React, { useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import Advertisement from '../components/Advertisement';
import MobileStickyAd from '../components/MobileStickyAd';

const AboutUs = () => {
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
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border border-light about-us-content">
            <h1 className="display-6 fw-black mb-4 pb-3 border-bottom border-danger border-opacity-25" style={{ letterSpacing: '-1px' }}>
              About Us
            </h1>

            <h2>About Industrial Times</h2>
            <h3>Welcome to Industrial Times</h3>
            <p>
              Industrial Times is a digital news and media platform dedicated to delivering accurate, timely, and insightful coverage of industry, business, manufacturing, automation, technology, startups, infrastructure, energy, and economic developments from India and around the world. Our mission is to bridge the gap between industries, businesses, innovators, policymakers, and professionals by providing reliable news, expert insights, interviews, market trends, and industry-focused analysis.
            </p>

            <h2>Our Vision</h2>
            <p>
              To become India's most trusted industrial news platform by promoting knowledge sharing, innovation, industrial growth, and informed decisionmaking across sectors.
            </p>

            <h2>What We Cover</h2>
            <p>Industrial Times covers a wide range of topics, including:</p>
            <ul>
              <li>Manufacturing & Industry 4.0</li>
              <li>Automation & Digital Transformation</li>
              <li>Business & Corporate News</li>
              <li>Startups & Entrepreneurship</li>
              <li>Infrastructure & Development</li>
              <li>Energy & Sustainability</li>
              <li>Government Policies & Industrial Reforms</li>
              <li>Acquisitions & Investments</li>
              <li>Education & Skill Development</li>
              <li>Events, Exhibitions & Conferences</li>
              <li>Regional Industrial Developments</li>
              <li>Technology & Innovation</li>
            </ul>

            <h2>Our Editorial Approach</h2>
            <p>
              We are committed to publishing factual, unbiased, and informative content. Our editorial team strives to verify information through credible sources and present balanced reporting that serves the interests of our readers and the industrial community. Opinions expressed in interviews, guest articles, or contributed content belong to their respective authors and do not necessarily reflect the views of Industrial Times.
            </p>

            <h2>Our Audience</h2>
            <p>Industrial Times serves:</p>
            <ul>
              <li>Industry Professionals</li>
              <li>Business Leaders</li>
              <li>Entrepreneurs and Startup Founders</li>
              <li>Engineers and Technologists</li>
              <li>Investors and Analysts</li>
              <li>Students and Researchers</li>
              <li>Government and Policy Stakeholders</li>
            </ul>

            <h2>Our Commitment</h2>
            <p>
              We believe that access to reliable information empowers better decisions. Through responsible journalism and industry-focused reporting, Industrial Times aims to contribute to the growth of India's industrial ecosystem and global competitiveness.
            </p>

            <h2>Contact Us</h2>
            <p>
              For editorial inquiries, business collaborations, advertising opportunities, press releases, or feedback, please contact us through our Contact Us page.<br/>
              <strong>Website:</strong> <a href="https://industrialtimes.in" target="_blank" rel="noreferrer">https://industrialtimes.in</a><br/>
              <strong>Email:</strong> <a href="mailto:info@industrialtimes.in">info@industrialtimes.in</a>
            </p>

            <h2>Ownership & Operations</h2>
            <p>
              Industrial Times is operated and managed by a professional team committed to delivering high-quality digital journalism and industry-focused content. The platform is supported by experienced professionals with expertise in industrial technologies, business communications, and digital media.
            </p>
            <p>
              Industrial Times is a digital media initiative supported by Radiogeet Digital Pvt. Ltd., an organization engaged in industrial automation, instrumentation, digital solutions, and Industry 4.0 technologies.
            </p>
            <p>Thank you for being a part of the Industrial Times community.</p>

            <h2>Our Registered Address:</h2>
            <p>
              <strong>Radiogeet Digital Pvt. Ltd.</strong><br/>
              79 Teachers Colony<br/>
              Dimna Road, Mango<br/>
              Jamshedpur 831012<br/>
              <strong>Phone:</strong> +91 7903451885<br/>
              <strong>Email:</strong> <a href="mailto:info@radiogeet.com">info@radiogeet.com</a>
            </p>

            <h2>Head Office</h2>
            <p>
              B-8, 3rd floor, Sector-2, Near Sector 15 Metro Station, Noida, UP-201301<br/>
              <strong>Phone:</strong> +91 8796556086<br/>
              <strong>Email:</strong> <a href="mailto:info@industrialtimes.in">info@industrialtimes.in</a>
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
        .about-us-content p, .about-us-content ul, .about-us-content li, .about-us-content span {
          font-size: 8pt !important;
          line-height: 1.5;
        }
        .about-us-content h2, .about-us-content h3, .about-us-content h4, .about-us-content h5, .about-us-content h6 {
          font-size: 10pt !important;
          font-weight: bold;
          margin-top: 15px;
          margin-bottom: 8px;
        }
      `}} />
    </Container>
  );
};

export default AboutUs;
