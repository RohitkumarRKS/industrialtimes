import React, { useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import Advertisement from '../components/Advertisement';

const pageContents = {
  '/about': { title: 'About Us', content: 'We are a leading provider of news and information, delivering the latest updates on industry, technology, and global markets. Our team of dedicated journalists and experts work around the clock to bring you the most accurate and timely news.' },
  '/careers': { title: 'Careers', content: 'Join our dynamic team. We are always looking for passionate individuals who are eager to make an impact in the world of media and journalism.' },
  '/press': { title: 'Press Releases', content: 'Read the latest press releases and official announcements from our organization and partners.' },
  '/contact': { title: 'Contact Us', content: 'Get in touch with us for any inquiries, support, or feedback. We value your input and are here to help.' },
  '/advertisement': { title: 'Advertise With Us', content: 'Reach a global audience by advertising on our platform. Contact our sales team for more information on available ad spaces and rates.' },
  '/media-partnership': { title: 'Media Partnership', content: 'Partner with us to amplify your brand and reach new heights. Let us collaborate for mutual success.' },
  '/rss': { title: 'RSS Feeds', content: 'Subscribe to our RSS feeds to get the latest news delivered directly to your reader.' },
  '/privacy': { title: 'Privacy Policy', content: 'Your privacy is important to us. Read our comprehensive privacy policy to understand how we collect, use, and protect your personal information.' },
  '/terms': { title: 'Terms & Conditions', content: 'By using our website, you agree to these terms and conditions. Please read them carefully before proceeding.' },
  '/disclaimer': { title: 'Disclaimer', content: 'The information provided on this website is for general informational purposes only. We make no representations or warranties of any kind, express or implied.' },
  '/grievance': { title: 'Grievance Redressal', content: 'If you have any grievances or complaints, please reach out to our dedicated grievance officer.' },
  '/sitemap': { title: 'Sitemap', content: 'Navigate through our website easily using this comprehensive sitemap.' }
};

const GenericPage = () => {
  const location = useLocation();
  const pageData = pageContents[location.pathname] || { title: 'Page Not Found', content: 'The page you are looking for does not exist or is currently being updated.' };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <Container fluid="xl" className="py-5 reveal">
      <Row className="g-4">
        {/* Left Sidebar Ad */}
        <Col xl={2} lg={2} className="d-none d-lg-block">
          <div className="sticky-top" style={{ top: '80px' }}>
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
              <p>{pageData.content}</p>
              
              {/* Dummy text to make the page look filled */}
              {pageData.title !== 'Page Not Found' && (
                <>
                  <p className="mt-4">
                    This is a placeholder page for <strong>{pageData.title}</strong>. 
                    In a full production environment, this section would contain detailed, legally reviewed 
                    content specific to this topic. For now, it demonstrates the routing functionality.
                  </p>
                  <p>
                    We are committed to providing the best experience for our users. If you have any specific
                    questions regarding our policies or corporate information, please use the Contact Us page
                    or reach out via the email address listed in the footer.
                  </p>
                  <div className="mt-5 p-4 bg-light rounded-3 border-start border-danger border-4 shadow-sm">
                    <h5 className="fw-bold mb-2 small text-uppercase">Need immediate assistance?</h5>
                    <p className="mb-0 small">Please call our support line at +91 790 345 1885 during normal business hours.</p>
                  </div>
                </>
              )}
            </div>
          </div>
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

export default GenericPage;
