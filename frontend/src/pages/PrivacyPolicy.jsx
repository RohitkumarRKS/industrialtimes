import React, { useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import Advertisement from '../components/Advertisement';
import MobileStickyAd from '../components/MobileStickyAd';

const PrivacyPolicy = () => {
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
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border border-light privacy-policy-content">
            <h1 className="display-6 fw-black mb-4 pb-3 border-bottom border-danger border-opacity-25" style={{ letterSpacing: '-1px' }}>
              Privacy Policy
            </h1>

            <p>
              This Privacy Policy governs the manner in which Radiogeet Digital Pvt. Ltd. (INDUSTRIAL TIMES NETWORK) collects, uses, maintains and discloses information collected from users (each, a "User") in respect of the Sites and Mobile Applications and all internet and mobile based products and services offered by Radiogeet Digital Pvt. Ltd. (www.industrialtimes.in). "You" and / or "Your" and / or "User" shall include and mean the person who is accessing the aforesaid websites through any means available now and / or maybe available in the future.
            </p>

            <h2>Governing Law and Meanings:-</h2>
            <p>
              These Terms of Use are being governed by the Laws of India and meaning of words used herein in connection with the use of the said website shall bear the meaning as may be envisaged and interpreted by the Information Technology Act, 2000 and any of its Amendment Acts.
            </p>

            <h2>WHAT INFORMATION DO WE GATHER ABOUT YOU?</h2>
            <p>
              The information gathered when you interact with INDUSTRIAL TIMES falls into two categories: 1) Personal information, which includes personal information you supply when you subscribe, order, complete a survey, register for one of our sites, enter a contest or provide your email address and 2) Non-personal information collected through technology, which includes tracking information collected by us as well as third parties.
            </p>

            <h3>Personal Information That You Give Us or Ask a Third Party to Share with Us</h3>
            <h4>Registration Information</h4>
            <p>
              Registration for INDUSTRIAL TIMES may require that you supply certain personal information, including a unique email address and demographic information (ZIP code, age, sex, household income, job industry and job title) to register. You may register or enhance your profile by linking your Facebook or Google accounts on INDUSTRIAL TIMES. By doing this, you are asking them to send us certain information from those social media accounts, and you are authorizing us to collect, store, and use what they send us in accordance with this Privacy Policy. Social media registration features may collect your IP address, the page you are visiting on our site, and may set a cookie to enable the feature to function properly. Social media features and widgets are either hosted by a third party or hosted directly on our website. You can disassociate your INDUSTRIAL TIMES registration from third-party accounts any time. Kindly note that INDUSTRIAL TIMES shall not responsible for any information collected by the third party from you.
            </p>

            <h4>User Generated Content and Public Activities (Including Comments and Reader Reviews)</h4>
            <p>
              We offer you opportunities to engage in public activities on INDUSTRIAL TIMES and other INDUSTRIAL TIMES Services. "Public activities" are any actions you take on INDUSTRIAL TIMES that are designed to be visible to other users, including comments, recommendations, reader reviews, ratings or any other items that you submit. Any information you disclose in your public activities, along with your screen name or ID, or any image or photo, becomes public and may be used by INDUSTRIAL TIMES for online and offline promotional or commercial uses in any and all media. If you choose to engage in public activities, you should be aware that any personal information you submit can be read, collected and used by other users of these areas. We are not responsible for the personal information you choose to submit in the course of your public activities and we have no responsibility to publish, take down, remove or edit any of your public activities or submissions. For more information, see Terms of Service. Public activities may be included in our RSS feeds, APIs and other distribution formats. As a result, your public activities may appear on other websites, blogs, or feeds. Keep in mind that we are not responsible for any personal information you choose to make public via your public activities, and you agree that such sharing will be deemed to have been done by you, not INDUSTRIAL TIMES including but not limited to sharing of information in your connected social media accounts. When you share or recommend links to content on a third-party platform (such as Facebook, Google+ and Twitter), that action and any information you share will be covered by their privacy policy.
            </p>

            <h4>Contests, Sweepstakes and Special Offers</h4>
            <p>
              INDUSTRIAL TIMES collects personal information from you when you participate in sweepstakes, contests or special offers. If this information is also being collected by a third party other than INDUSTRIAL TIMES, we will notify you at the same time. If you do not want any personal information shared, you should not participate in the sweepstakes, contest or special offer.
            </p>

            <h4>Reader Surveys, Reader Panels and Market Research</h4>
            <p>
              INDUSTRIAL TIMES may collect personal information from you in connection with voluntary surveys conducted via INDUSTRIAL TIMES. Data may be collected through INDUSTRIAL TIMES, on the phone or through the mail. The information you provide may be shared, but only in the aggregate, with advertisers and partners unless we notify you otherwise at the time of collection. Members of our Reader Panels agree to participate in surveys, polls or discussions about their readership of INDUSTRIAL TIMES, their household/personal characteristics and their purchase behaviour.
            </p>

            <h4>Conferences and Live Events</h4>
            <p>
              We often receive information about attendees to our live events from sign-in and registration lists. We may share this information with event or promotion sponsors, in which case we will notify you when we collect the information.
            </p>

            <h3>Non-Personal Information Collected Using Technology</h3>
            <h4>Information Collected by Us Using Technology</h4>
            <p>
              We use various internet technologies to manage INDUSTRIAL TIMES and track use of the Services. Non-personal information that we collect using these technologies may be combined with other information about you.
            </p>
            <p>
              <strong>Device Information.</strong> We may collect non-personal information about the computer, mobile device or other device you use to access INDUSTRIAL TIMES, such as IP address, geolocation information, unique device identifiers, browser type, browser language and other transactional information.
            </p>
            <p>
              <strong>Cookies, Beacons, Local Storage and Other Similar Technologies.</strong> We use "cookies," web beacons, tags and scripts, and other similar technologies including local storage objects such as HTML5. These technologies allow us to manage access to and use of the Services, recognize you and provide personalization, and help us understand how people use INDUSTRIAL TIMES. You will not be able to access certain areas of our websites, including INDUSTRIAL TIMES, if your computer does not accept cookies from us. We do not respond to browser-based "do not track" signals. For more detailed information about our use of cookies and local storage, and how to manage them, see Frequently Asked Questions About Cookies. We may transmit non-personally identifiable website usage information to third parties in order to show you advertising for INDUSTRIAL TIMES when you visit other sites. For more information about our third-party ad server, or to learn your choices about not having this non-personal information used to target ads to you, please click here.
            </p>
            <p>
              <strong>Local Storage Objects.</strong> We may use Local Storage Objects (LSOs) such as HTML5 to store content information and preferences. Third parties with whom we partner to provide certain features on our site or to display advertising based upon your web browsing activity use LSOs such as HTML 5 or Flash to collect and store information. Various browsers may offer their own management tools for removing HTML5 LSOs. To manage Flash LSOs please click here.
            </p>
            <p>
              <strong>Analytics, Log Files and Reading History.</strong> As is true of most websites, we gather certain information automatically and store it in log files. This information may include internet protocol (IP) addresses (the region or general location where your computer or device is accessing the internet), browser type, operating system and other usage information about the use of INDUSTRIAL TIMES, including a history of the pages you view. We may combine this automatically collected log information with other information we collect about you. We do this to improve services we offer you, including customized Recommendations, advertising and currency display, to improve marketing, and to track access and use of INDUSTRIAL TIMES across the devices that you use to access INDUSTRIAL TIMES. We have hired third parties to provide us information, reports and analysis about the usage, browsing patterns of our users. They may independently record the type of device and operating system you are using, general location information, as well as events that occur within our apps, such as how often you use our apps.
            </p>
            <p>
              <strong>Location Information.</strong> Some of our mobile applications can deliver content based on your current location if you choose to enable that feature of the app. If you enable the location-based feature, your current location will be stored locally on your device, which will then be used by the app. If you elect to have a location-based search saved to your history, we will store that information on our servers. If you do not enable the location-based service, or if an app does not have that feature, the app will not transmit to us, and we will not collect or store, location information. The ads in our apps are not targeted to you based on your current GPS location, but they may be targeted to you based on your ZIP code or device's IP address.
            </p>

            <h4>Third Parties</h4>
            <p>
              Some of the services and advertisements included in INDUSTRIAL TIMES, including on INDUSTRIAL TIMES and within our mobile apps, are delivered or served by third-party companies, which may collect information about your use of INDUSTRIAL TIMES. These companies may place or recognize cookies, web beacons or other technology to track certain non-personal information about our website users. For example, in the course of serving certain advertisements, an advertiser may place or recognize a unique cookie on your browser in order to collect certain information about your use of INDUSTRIAL TIMES. For another example, an advertiser or ad server may also be able to collect your device’s unique identifier in the course of serving an ad. In many cases, this information could be used to show you ads on other websites based on your interests.
            </p>
            <p>
              We do not have access to, nor control over, these third parties' use of cookies or other tracking technologies or how they may be used. Third parties that may be using cookies to serve advertising on our websites include Google AdSense and other advertising networks.
            </p>
            <p>
              For example, we use Google to serve advertisements onto INDUSTRIAL TIMES, which use the Google Doubleclick cookie, and in some cases, a unique device identifier, to show you ads based on your visit to INDUSTRIAL TIMES and other sites on the internet. You may opt out of the use of the Google Doubleclick cookie by visiting the <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">Google ad and content network privacy policy</a>.
            </p>
            <p>
              You have choices about the collection of information by third parties on our website:<br/>
              1) If you would like more about your option not to accept advertiser cookies, please visit the <a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer">Network Advertising Initiative opt-out page</a>.<br/>
              2) If you would like to opt-out of having interest-based ad targeting, visit <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">Your Ad Choices</a>.<br/>
              Your access to our websites should not be affected if you do not accept cookies served by third parties.
            </p>

            <h2>WHAT DO WE DO WITH THE INFORMATION WE GATHER ABOUT YOU?</h2>
            
            <h4>Provide the Services You Request</h4>
            <p>
              We use the information we gather about you to enable your use of INDUSTRIAL TIMES and fulfil your requests for certain products and services, such as sending out electronic newsletters and enabling you to participate in and renew paid services, polls, contests and message boards.
            </p>

            <h4>Statistical Analysis</h4>
            <p>
              We perform statistical, demographic and marketing analyses of users of INDUSTRIAL TIMES, and their subscribing and purchasing patterns, for product development purposes and to generally inform advertisers about the nature of our subscriber base. We use this information for analysis purposes, including analysis to improve customer relationships.
            </p>

            <h4>Customizing Your Experience</h4>
            <p>
              We use the information that we collect to allow advertising to be targeted to the users for whom such advertising is most pertinent. We also use this information to customize certain features of INDUSTRIAL TIMES to provide you with an enhanced experienced based on the type of device you are using to access INDUSTRIAL TIMES, and in certain cases, provide you with requested services.
            </p>

            <h4>Relevant Advertising</h4>
            <p>
              We may use demographic and preference information to allow advertising on INDUSTRIAL TIMES Service to be targeted to the users for whom they are most pertinent. This means users see advertising that is most likely to interest them, and advertisers send their messages to people who are most likely to be receptive, improving both the viewer's experience and the effectiveness of the ads. We disclose information to third parties only in aggregate or de-identified form.
            </p>

            <h4>Email Newsletters</h4>
            <p>
              INDUSTRIAL TIMES will periodically send you email newsletters or promotional email about services offered by INDUSTRIAL TIMES and its advertisers. For details about INDUSTRIAL TIMES email, please see below:
            </p>

            <h2>WHAT IS OUR EMAIL POLICY?</h2>
            <p>
              We will not send you marketing messages if you have unsubscribed. You can choose not to receive messages in the future by following the "unsubscribe" instructions located near the bottom of each email. We will not share, sell, rent, swap or authorize any third party to use your email address for commercial purposes without your permission. However, we will only share your email id with our registered partners in conformance with law. If you feel you have received an email from us in error, please contact info@industrialtimes.in
            </p>
            <p>
              <strong>Email Newsletters.</strong> Industrial Times offers several email newsletters. If you no longer wish to receive a specific newsletter, follow the "unsubscribe" instructions located near the bottom of each newsletter.
            </p>
            <p>
              <strong>Survey Email.</strong> We may invite you to participate in user surveys asking for feedback on industrialtimes.in and existing or prospective products and services, as well as information to better understand our users. User surveys greatly help us to improve our Services, and any information we obtain in such surveys will not be shared with third parties, except in aggregate form.
            </p>
            <p>
              <strong>Emails from You.</strong> If you send us an email, we will use your email address to respond directly to your questions or comments.
            </p>
            <p>
              <strong>Email This Article Feature.</strong> Addresses you provide in the “Email” share feature may be saved for your convenience for future articles you may wish to email; but they are not used for any other purpose, and will not be shared with any third parties.
            </p>

            <h2>WITH WHOM DO WE SHARE THE INFORMATION THAT WE GATHER?</h2>
            
            <h4>Within INDUSTRIAL TIMES</h4>
            <p>
              If you have registered to use INDUSTRIAL TIMES, we will not sell, rent, swap or authorize any third party to use your email address without your permission. In the future, we may sell, buy, merge or partner with other companies or businesses. In such transactions, we may include your information among the transferred assets.
            </p>

            <h4>Third Parties</h4>
            <p>
              We also share information about our audience in aggregate or de-identified form. Nothing in this Privacy Policy is intended to restrict our use or sharing of aggregated or de-identified information in any way.
            </p>
            <p>
              If you are a print subscriber, we may exchange or rent your name and mailing address (but not your email address) and certain other information, such as when you first subscribed to INDUSTRIAL TIMES with other reputable companies that offer marketing information or products through direct mail. If you prefer that we do not share this information, you may opt-out by emailing us at info@radiogeet.com, reach out to us here. Or write to us at:
            </p>
            <p>
              Radiogeet Digital Pvt. Ltd.<br/>
              79, Teachers Colony, Dimna Road, Mango, Jamshedpur 831012, India.
            </p>
            <p>
              Please include your account number and phone number in the body of your email or letter, and include "Opt-out" in the subject line. We may share information about attendees to our live events with sponsors or other third parties. If so, we will notify you when you provide us the information.
            </p>

            <h4>Service Providers</h4>
            <p>
              We contract with other companies to provide services on our behalf, including credit-card and billing processing, ad serving, shipping, email distribution, list processing and analytics or promotions management. We provide these companies only with the information they need to perform their services. These service providers are restricted from using personal information in any way other than to provide services for INDUSTRIAL TIMES, and they may not share, resell or use the data for their own direct marketing purposes.
            </p>
            <p>
              We reserve the right to disclose your opt-out information to third parties so they can suppress your name from future solicitations, in accordance with applicable laws. We may occasionally release personal information as required by law, for example, to comply with a court order or subpoena.
            </p>

            <h2>HOW DO I CHANGE OR UPDATE MY PERSONAL INFORMATION?</h2>
            <p>
              <strong>Manage Your INDUSTRIAL TIMES Account in the My Account Area.</strong> You may review and update your INDUSTRIAL TIMES membership or account information and access your transaction history in the My Account area. We will respond to inquiries regarding deletion of data within a reasonable timeframe.
            </p>
            <p>
              <strong>Data Retention.</strong> We will retain your information for at least as long as your account is active, as needed to provide you services or as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements. As a matter of course, we will delete personally identifiable information associated with accounts that have been inactive for at least 15 years.
            </p>

            <h2>HOW DO I OPT-OUT?</h2>
            <p>
              If, at any time, you prefer not to receive email marketing information from us, simply follow the unsubscribe options at the bottom of each email. If you experience difficulty with the unsubscribe process, feel free to contact us at info@radiogeet.com and provide your email address along with the name of the newsletter from which you would like to unsubscribe.
            </p>
            
            <h4>Use of Third Party Personal Information</h4>
            <p>
              If you choose to use "email this article" or give a Gift subscription, we require the recipient’s name and email address. We will automatically send them a one-time email about the service. INDUSTRIAL TIMES does not store this information.
            </p>

            <h2>IS MY INFORMATION PROTECTED?</h2>
            <p>
              To prevent unauthorized access, maintain data accuracy and ensure the appropriate use of information, we have put in place commercially reasonable physical, technical and administrative controls to protect the information. Please note that no method of transmission over the internet, or method of electronic storage, is 100% secure.
            </p>

            <h2>OTHER INFORMATION</h2>
            <h4>Compliance With Legal Process</h4>
            <p>
              We may access, preserve and disclose personal information if we are required to do so by law or we have a good faith belief that such action is necessary to (1) comply with the law or with legal process; (2) protect and defend our rights and property; (3) protect against misuse or unauthorized use of INDUSTRIAL TIMES; or (4) protect the personal safety or property of our users or the public (among other things, this means that if you provide false information or attempt to pose as someone else, information about you may be disclosed as part of any investigation into your actions).
            </p>

            <h4>Changes to This Policy</h4>
            <p>
              We evaluate this privacy policy periodically in light of changing business practices, technology and legal requirements. As a result, it is updated from time to time. Any such changes will be posted on this page. If we make a significant or material change in the way we use or share your personal information, you will be notified via email and/or prominent notice.
            </p>

            <h2>REACH OUT TO US:</h2>
            <p>
              For any complaint related to our services or content of the website, the aggrieved person may raise the query/ complaint within a period of 7 (seven) days from the date of first publication to the designated grievance officer, as below:
            </p>
            <p>
              Mr. S K Singh<br/>
              Grievance Officer<br/>
              Radiogeet Digital Pvt. Ltd.<br/>
              Industrial Times Network<br/>
              Jamshedpur 831012<br/>
              info@industrialtimes.in
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
        .privacy-policy-content p, .privacy-policy-content ul, .privacy-policy-content li, .privacy-policy-content span {
          font-size: 8pt !important;
          line-height: 1.5;
        }
        .privacy-policy-content h2, .privacy-policy-content h3, .privacy-policy-content h4, .privacy-policy-content h5, .privacy-policy-content h6 {
          font-size: 10pt !important;
          font-weight: bold;
          margin-top: 15px;
          margin-bottom: 8px;
        }
      `}} />
    </Container>
  );
};

export default PrivacyPolicy;
