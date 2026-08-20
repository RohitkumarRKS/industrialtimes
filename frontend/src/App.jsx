import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import API_BASE from './config/api';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';
import CategoryPage from './pages/CategoryPage';
import GenericPage from './pages/GenericPage';
import AboutUs from './pages/AboutUs';
import ExternalNews from './pages/ExternalNews';
import AreaNews from './pages/AreaNews';
import TrendingArticleDetail from './pages/TrendingArticleDetail';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import Disclaimer from './pages/Disclaimer';
import Signup from './pages/Signup';
import AdminDashboard from './pages/superadmin/AdminDashboard';
import AdminLogin from './pages/superadmin/AdminLogin';
import ProtectedRoute from './components/ProtectedRoute';
import SearchPage from './pages/SearchPage';
import Favorites from './pages/Favorites';
import AuthorProfile from './pages/AuthorProfile';
import Advertisement from './components/Advertisement';
import StickyBottomAd from './components/StickyBottomAd';
import ColombiaAd from './components/ColombiaAd';
import UpgradePlan from './pages/UpgradePlan';
import UserProfile from './pages/UserProfile';
import PodcastApply from './pages/PodcastApply';
import CorporateChoosePlan from './pages/corporate/CorporateChoosePlan';
import CorporateLogin from './pages/corporate/CorporateLogin';
import CorporatePayment from './pages/corporate/CorporatePayment';
import ReporterDashboard from './pages/ReporterDashboard';
import UserDashboard from './pages/UserDashboard';
import { UtilityBoxLeft, UtilityBoxRight } from './components/HeaderUtilityBoxes';
import BreakingNewsTicker from './components/BreakingNewsTicker';
import WebinarsPage from './pages/WebinarsPage';
import WebinarDetail from './pages/WebinarDetail';
import WebinarRegisterPage from './pages/WebinarRegisterPage';

// Scroll to top helper on route change and refresh
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  useEffect(() => {
    const handleScrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };
    setTimeout(handleScrollToTop, 0);
  }, []);

  return null;
};

// Dynamic Google Analytics tracker for React Router Single Page App route changes
const AnalyticsTracker = ({ googleAnalyticsId }) => {
  const location = useLocation();

  useEffect(() => {
    if (googleAnalyticsId && window.gtag) {
      window.gtag('config', googleAnalyticsId, {
        page_path: location.pathname + location.search
      });
    }
  }, [location, googleAnalyticsId]);

  return null;
};

// Dynamic canonical URL — updates <link rel="canonical"> on every route change
// Fixes "Duplicate without user-selected canonical" in Google Search Console
const CanonicalUrl = () => {
  const location = useLocation();
  let cleanPath = location.pathname;
  if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
    cleanPath = cleanPath.slice(0, -1);
  }
  const canonicalUrl = `https://industrialtimes.in${cleanPath}`;

  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
};

const PublicLayout = () => {
  const location = useLocation();
  const isWebinarRoute = location.pathname.startsWith('/webinar') || location.pathname.startsWith('/webinars');

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navigation />
      {!isWebinarRoute && <BreakingNewsTicker />}
      
      {!isWebinarRoute && (
        <div className="container-fluid py-3" style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #eaeaea' }}>
          <div className="header-fluid-container d-flex flex-column flex-md-row justify-content-center align-items-center gap-4">
            <div className="d-none d-xl-block">
              <UtilityBoxLeft />
            </div>
            {/* Desktop Header Ad */}
            <div className="d-none d-md-block">
              <Advertisement slot="leaderboard" />
            </div>
            {/* Mobile Header Ad — Large Mobile Banner 300×100 (Google AdSense) */}
            <div className="d-block d-md-none w-100 text-center">
              <Advertisement slot="mobile-leaderboard" />
            </div>
            <div className="d-none d-xl-block">
              <UtilityBoxRight />
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow-1">
        <Outlet />
      </main>

      {!isWebinarRoute && <StickyBottomAd />}
      {!isWebinarRoute && <ColombiaAd />}
      <Footer />
    </div>
  );
};

const AdminLayout = () => (
  <div className="admin-layout d-flex flex-column min-vh-100 m-0 p-0" style={{ background: 'transparent' }}>
    <Outlet />
  </div>
);

function App() {
  const GA_MEASUREMENT_ID = 'G-P5M643PL4W';

  const [seoConfig, setSeoConfig] = useState({
    siteTitle: 'Industrial Times',
    metaDescription: 'Your reliable source for the latest industrial news and trends.',
    metaKeywords: 'industry, news, manufacturing, trending',
    googleAnalyticsId: GA_MEASUREMENT_ID
  });

  useEffect(() => {
    const fetchSeo = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/settings/seo`);
        if (data) {
          setSeoConfig({
            siteTitle: data.siteTitle || seoConfig.siteTitle,
            metaDescription: data.metaDescription || seoConfig.metaDescription,
            metaKeywords: data.metaKeywords || seoConfig.metaKeywords,
            googleAnalyticsId: data.googleAnalyticsId || GA_MEASUREMENT_ID
          });
        }
      } catch (err) {
        console.error('Failed to load SEO configuration', err);
      }
    };
    fetchSeo();
  }, []);

  // Ensure window.gtag is available for the AnalyticsTracker (gtag.js is loaded from index.html)
  useEffect(() => {
    if (!window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };
    }
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <AnalyticsTracker googleAnalyticsId={seoConfig.googleAnalyticsId} />
      <CanonicalUrl />
      <Helmet>
        <title>{seoConfig.siteTitle}</title>
        <meta name="description" content={seoConfig.metaDescription} />
        <meta name="keywords" content={seoConfig.metaKeywords} />
      </Helmet>
      <Routes>
        {/* Full Screen Layout (Admin, Login, Signup) */}
        <Route element={<AdminLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/corporate/choose-plan" element={<CorporateChoosePlan />} />
          <Route path="/corporate/login" element={<CorporateLogin />} />
          <Route path="/corporate/payment" element={<CorporatePayment />} />
          <Route path="/reporter-dashboard" element={<ReporterDashboard />} />
          <Route path="/user-dashboard" element={<UserDashboard />} />
          <Route path="/podcast-apply" element={<PodcastApply />} />
          <Route path="/podcast" element={<PodcastApply />} />
          <Route path="/podcast_apply" element={<PodcastApply />} />
          <Route path="/superadmin-login" element={<AdminLogin />} />
          <Route 
            path="/superadmin@123/*" 
            element={
              <ProtectedRoute isAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Public/Standard Site Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/regional" element={<AreaNews />} />
          <Route path="/area-news" element={<AreaNews />} />
          <Route path="/news" element={<CategoryPage categoryOverride="News" />} />
          <Route path="/articles" element={<CategoryPage categoryOverride="Articles" />} />
          <Route path="/trending" element={<CategoryPage categoryOverride="Trending" />} />
          <Route path="/oem" element={<CategoryPage categoryOverride="OEM" />} />
          <Route path="/automation" element={<CategoryPage categoryOverride="Automation" />} />
          <Route path="/interview" element={<CategoryPage categoryOverride="Interview" />} />
          <Route path="/interviews" element={<CategoryPage categoryOverride="Interview" />} />
          <Route path="/startup" element={<CategoryPage categoryOverride="Startup" />} />
          <Route path="/startups" element={<CategoryPage categoryOverride="Startup" />} />
          <Route path="/business" element={<CategoryPage categoryOverride="Business" />} />
          <Route path="/event" element={<CategoryPage categoryOverride="Event" />} />
          <Route path="/events" element={<CategoryPage categoryOverride="Event" />} />
          <Route path="/tender" element={<CategoryPage categoryOverride="Tender" />} />
          <Route path="/tenders" element={<CategoryPage categoryOverride="Tender" />} />
          <Route path="/astrology" element={<CategoryPage categoryOverride="Astrology" />} />
          <Route path="/entertainment" element={<CategoryPage categoryOverride="Entertainment" />} />
          <Route path="/sports" element={<CategoryPage categoryOverride="Sports" />} />
          <Route path="/education" element={<CategoryPage categoryOverride="Education" />} />
          <Route path="/manufacturing" element={<CategoryPage categoryOverride="Manufacturing" />} />
          <Route path="/acquisitions" element={<CategoryPage categoryOverride="Acquisitions" />} />
          <Route path="/mediakit" element={<CategoryPage categoryOverride="Media Kit" />} />
          <Route path="/magazine" element={<CategoryPage categoryOverride="Magazine" />} />
          <Route path="/article/:category/:title/:id" element={<ArticleDetail />} />
          <Route path="/article/:category/:title" element={<ArticleDetail />} />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/careers" element={<GenericPage />} />
          <Route path="/press" element={<GenericPage />} />
          <Route path="/contact" element={<GenericPage />} />
          <Route path="/advertisement" element={<GenericPage />} />
          <Route path="/media-partnership" element={<GenericPage />} />
          <Route path="/rss" element={<GenericPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/grievance" element={<GenericPage />} />
          <Route path="/sitemap" element={<GenericPage />} />
          <Route path="/external" element={<ExternalNews />} />
          <Route path="/trending-article" element={<TrendingArticleDetail />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/author/:id" element={<AuthorProfile />} />
          <Route path="/upgrade" element={<UpgradePlan />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/webinars" element={<WebinarsPage />} />
          <Route path="/webinar/:id" element={<WebinarDetail />} />
          <Route path="/webinar/:id/register" element={<WebinarRegisterPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
