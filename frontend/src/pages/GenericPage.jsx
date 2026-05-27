import React, { useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import Advertisement from '../components/Advertisement';
import MobileStickyAd from '../components/MobileStickyAd';

const pageContents = {
  '/about': {
    title: 'About Us',
    showContact: true,
    paragraphs: [
      'Industrial Times Network (ITN) is a digital industrial media platform dedicated to delivering industrial news, business promotion, digital marketing, podcast interviews, recruitment updates, and event coverage across sectors like steel, mining, power, manufacturing, infrastructure, and Industry 4.0. We help industries, startups, and businesses build visibility through modern media and promotional solutions.',
      'Our Mission: To connect industries, businesses, and professionals through trusted digital media, marketing, and communication services.',
      'Our Vision: To become India\'s leading industrial digital media network empowering industrial growth, innovation, and business connectivity through technology-driven media solutions.'
    ]
  },
  '/careers': {
    title: 'Careers',
    showContact: true,
    paragraphs: [
      'Join our dynamic team at Industrial Times Network (ITN). We are always looking for passionate individuals who are eager to make an impact in the world of industrial media and journalism.',
      'We offer opportunities across editorial, digital marketing, content creation, video production, and business development. If you are passionate about industry, technology, and media — we would love to hear from you.'
    ]
  },
  '/press': {
    title: 'Press Releases',
    showContact: true,
    paragraphs: [
      'Industrial Times Network (ITN) is India\'s growing digital industrial media platform delivering industrial news, business promotions, startup stories, podcast interviews, recruitment updates, and industrial event coverage. We support industries, MSMEs, startups, manufacturers, and technology companies through digital marketing, advertisement publishing, corporate branding, and multimedia content solutions.',
      'Our platform connects businesses with industrial audiences across sectors including steel, mining, power, manufacturing, automation, infrastructure, and Industry 4.0. ITN is committed to promoting industrial innovation, business growth, and digital transformation through modern media communication and industry-focused content services. (Arian Industrial Times)'
    ]
  },
  '/contact': {
    title: 'Contact Us',
    showContact: true,
    paragraphs: [
      'Get in touch with Industrial Times Network (ITN) for any inquiries, support, feedback, or business collaboration. We value your input and are here to help.',
      'Whether you want to advertise, partner for media coverage, submit press releases, or simply reach out for information — our team is ready to assist you.'
    ]
  },
  '/advertisement': {
    title: 'Advertise With Us',
    showContact: true,
    paragraphs: [
      'Industrial Times Network (ITN) offers powerful advertising and digital promotion opportunities for industries, startups, manufacturers, engineering companies, automation brands, and MSMEs. Promote your products, services, events, job openings, and business campaigns through our industrial news portal, social media platforms, podcasts, and multimedia marketing solutions.',
      'We help businesses increase brand visibility, generate leads, and connect with industrial audiences across sectors including steel, mining, power, cement, manufacturing, infrastructure, and Industry 4.0. Partner with ITN to showcase your business to a growing industrial community through targeted and effective digital media promotion.'
    ]
  },
  '/media-partnership': {
    title: 'Media Partnership',
    showContact: true,
    paragraphs: [
      'Industrial Times Network (ITN) offers strategic media partnership opportunities for industrial expos, corporate events, trade fairs, startup summits, technology conferences, and business exhibitions. As a digital industrial media platform, we provide event promotion, press coverage, social media marketing, podcast interviews, brand visibility, and multimedia content support to help partners reach a wider industrial audience.',
      'Our platform connects industries, manufacturers, startups, and business leaders across sectors including steel, mining, power, cement, manufacturing, automation, infrastructure, and Industry 4.0. Partner with ITN to enhance your event visibility, audience engagement, and industrial media presence through professional digital media solutions.'
    ]
  },
  '/rss': {
    title: 'RSS Feeds',
    showContact: false,
    paragraphs: [
      'Subscribe to Industrial Times Network (ITN) RSS feeds to get the latest industrial news, business updates, and event coverage delivered directly to your reader.',
      'Stay updated with real-time content from across sectors including steel, mining, power, manufacturing, automation, infrastructure, and Industry 4.0.'
    ]
  },
  '/privacy': {
    title: 'Privacy Policy',
    showContact: true,
    paragraphs: [
      'Industrial Times Network (ITN) respects your privacy and is committed to protecting your personal information. Any details collected through our website, contact forms, advertisements, subscriptions, or business inquiries are used only for communication, service improvement, marketing support, and customer assistance.',
      'We do not sell or share personal information with unauthorized third parties. By using our website, you agree to our data collection and usage practices. Users are responsible for the accuracy of the information submitted on the platform. ITN reserves the right to update this privacy policy at any time without prior notice.'
    ]
  },
  '/terms': {
    title: 'Terms & Conditions',
    showContact: false,
    paragraphs: [
      'By accessing and using Industrial Times Network (ITN), users agree to comply with all applicable terms, policies, and regulations of the platform. All content, news, advertisements, logos, videos, and media published on the website are the property of ITN or respective owners and may not be copied or reused without permission.',
      'Users must not upload misleading, illegal, harmful, or unauthorized content on the platform. ITN reserves the right to modify, remove, or update website content and services at any time without prior notice. Continued use of the website indicates acceptance of these terms and conditions.'
    ]
  },
  '/disclaimer': {
    title: 'Disclaimer',
    showContact: false,
    paragraphs: [
      'The information published on Industrial Times Network (ITN) is provided for general informational, industrial, and promotional purposes only. While we strive to ensure accuracy and reliability, ITN does not guarantee the completeness, correctness, or timeliness of any content, advertisements, job postings, business promotions, or external links available on the platform.',
      'Opinions expressed in articles, podcasts, interviews, or promotional content belong to their respective authors or organizations. ITN shall not be held responsible for any loss, damage, or business decisions made based on the information provided on this website or associated digital media platforms.'
    ]
  },
  '/grievance': {
    title: 'Grievance Redressal',
    showContact: true,
    paragraphs: [
      'Industrial Times Network (ITN) is committed to maintaining transparency, professionalism, and responsible digital media practices. If any user, company, or organization has concerns regarding published content, advertisements, copyright issues, business promotions, or any information available on the platform, they may contact our support team for resolution.',
      'We aim to review and address all genuine grievances promptly and fairly in accordance with applicable laws and platform policies. Users are requested to provide complete details and supporting information while submitting complaints or concerns.'
    ]
  },
  '/sitemap': {
    title: 'Sitemap',
    showContact: false,
    paragraphs: [
      'Navigate through the Industrial Times Network (ITN) website easily using this comprehensive sitemap. Find all our sections, categories, and pages in one place.'
    ]
  }
};

const GenericPage = () => {
  const location = useLocation();
  const pageData = pageContents[location.pathname] || { title: 'Page Not Found', paragraphs: ['The page you are looking for does not exist or is currently being updated.'], showContact: false };

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
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border border-light">
            <h1 className="display-6 fw-black mb-4 pb-3 border-bottom border-danger border-opacity-25" style={{ letterSpacing: '-1px' }}>
              {pageData.title}
            </h1>
            <div className="text-muted lh-lg" style={{ fontSize: '1rem' }}>
              {pageData.paragraphs.map((para, idx) => (
                <p key={idx} className={idx > 0 ? 'mt-3' : ''}>{para}</p>
              ))}
              
              {pageData.showContact && (
                <div className="mt-5 p-4 bg-light rounded-3 border-start border-danger border-4 shadow-sm">
                  <h5 className="fw-bold mb-3 small text-uppercase">Need Immediate Assistance?</h5>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span>📱</span>
                    <span className="small"><strong>WhatsApp Only:</strong> +91 7903451885</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span>📧</span>
                    <span className="small"><strong>Email:</strong> support@industrialtimes.in</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MOBILE AD — 300×250 */}
          <div className="ad-mobile-only mobile-ad-row">
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
    </Container>
  );
};

export default GenericPage;
