import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import API_BASE from './config/api';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';
import CategoryPage from './pages/CategoryPage';
import GenericPage from './pages/GenericPage';
import ExternalNews from './pages/ExternalNews';
import AreaNews from './pages/AreaNews';
import TrendingArticleDetail from './pages/TrendingArticleDetail';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/superadmin/AdminDashboard';
import AdminLogin from './pages/superadmin/AdminLogin';
import ProtectedRoute from './components/ProtectedRoute';
import SearchPage from './pages/SearchPage';
import Favorites from './pages/Favorites';
import AuthorProfile from './pages/AuthorProfile';
import Advertisement from './components/Advertisement';
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

const PublicLayout = () => (
  <div className="d-flex flex-column min-vh-100">
    <Navigation />
    <BreakingNewsTicker />
    <div className="container-fluid py-3" style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #eaeaea' }}>
      <div className="header-fluid-container d-flex flex-column flex-lg-row justify-content-center align-items-center gap-4">
        <UtilityBoxLeft />
        <Advertisement slot="leaderboard" />
        <UtilityBoxRight />
      </div>
    </div>
    <main className="flex-grow-1">
      <Outlet />
    </main>

    <Footer />
  </div>
);

const AdminLayout = () => (
  <div className="admin-layout d-flex flex-column min-vh-100 m-0 p-0" style={{ background: '#f5f5f0' }}>
    <Outlet />
  </div>
);

function App() {
  const [seoConfig, setSeoConfig] = useState({
    siteTitle: 'Industrial Times',
    metaDescription: 'Your reliable source for the latest industrial news and trends.',
    metaKeywords: 'industry, news, manufacturing, trending',
    googleAnalyticsId: ''
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
            googleAnalyticsId: data.googleAnalyticsId || ''
          });
        }
      } catch (err) {
        console.error('Failed to load SEO configuration', err);
      }
    };
    fetchSeo();
  }, []);

  return (
    <Router>
      <Helmet>
        <title>{seoConfig.siteTitle}</title>
        <meta name="description" content={seoConfig.metaDescription} />
        <meta name="keywords" content={seoConfig.metaKeywords} />
        {seoConfig.googleAnalyticsId && (
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${seoConfig.googleAnalyticsId}`}></script>
        )}
        {seoConfig.googleAnalyticsId && (
          <script>
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${seoConfig.googleAnalyticsId}');
            `}
          </script>
        )}
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
          <Route path="/interview" element={<CategoryPage categoryOverride="Interviews" />} />
          <Route path="/interviews" element={<CategoryPage categoryOverride="Interviews" />} />
          <Route path="/startup" element={<CategoryPage categoryOverride="Startups" />} />
          <Route path="/startups" element={<CategoryPage categoryOverride="Startups" />} />
          <Route path="/business" element={<CategoryPage categoryOverride="Business" />} />
          <Route path="/event" element={<CategoryPage categoryOverride="Events" />} />
          <Route path="/events" element={<CategoryPage categoryOverride="Events" />} />
          <Route path="/video" element={<CategoryPage categoryOverride="Videos" />} />
          <Route path="/videos" element={<CategoryPage categoryOverride="Videos" />} />
          <Route path="/entertainment" element={<CategoryPage categoryOverride="Entertainment" />} />
          <Route path="/sports" element={<CategoryPage categoryOverride="Sports" />} />
          <Route path="/education" element={<CategoryPage categoryOverride="Education" />} />
          <Route path="/manufacturing" element={<CategoryPage categoryOverride="Manufacturing" />} />
          <Route path="/acquisitions" element={<CategoryPage categoryOverride="Acquisitions" />} />
          <Route path="/mediakit" element={<CategoryPage categoryOverride="Media Kit" />} />
          <Route path="/magazine" element={<CategoryPage categoryOverride="Magazine" />} />
          <Route path="/article/:category/:title/:id" element={<ArticleDetail />} />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/about" element={<GenericPage />} />
          <Route path="/careers" element={<GenericPage />} />
          <Route path="/press" element={<GenericPage />} />
          <Route path="/contact" element={<GenericPage />} />
          <Route path="/advertisement" element={<GenericPage />} />
          <Route path="/media-partnership" element={<GenericPage />} />
          <Route path="/rss" element={<GenericPage />} />
          <Route path="/privacy" element={<GenericPage />} />
          <Route path="/terms" element={<GenericPage />} />
          <Route path="/disclaimer" element={<GenericPage />} />
          <Route path="/grievance" element={<GenericPage />} />
          <Route path="/sitemap" element={<GenericPage />} />
          <Route path="/external" element={<ExternalNews />} />
          <Route path="/trending-article" element={<TrendingArticleDetail />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/author/:id" element={<AuthorProfile />} />
          <Route path="/upgrade" element={<UpgradePlan />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
