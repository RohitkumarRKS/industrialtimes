import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
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

const PublicLayout = () => (
  <div className="d-flex flex-column min-vh-100">
    <Navigation />
    <div className="container-fluid py-3 text-center" style={{ backgroundColor: '#f8f9fa' }}>
      <Advertisement slot="leaderboard" />
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
  return (
    <Router>
      <Routes>
        {/* Full Screen Layout (Admin, Login, Signup) */}
        <Route element={<AdminLayout />}>
          <Route path="/superadmin@123" element={<AdminLogin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/corporate/choose-plan" element={<CorporateChoosePlan />} />
          <Route path="/corporate/login" element={<CorporateLogin />} />
          <Route path="/corporate/payment" element={<CorporatePayment />} />
          <Route path="/reporter-dashboard" element={<ReporterDashboard />} />
          <Route path="/user-dashboard" element={<UserDashboard />} />
          <Route path="/podcast-apply" element={<PodcastApply />} />
          <Route 
            path="/admin/*" 
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
          <Route path="/area-news" element={<AreaNews />} />
          <Route path="/articles" element={<CategoryPage categoryOverride="Articles" />} />
          <Route path="/interviews" element={<CategoryPage categoryOverride="Interviews" />} />
          <Route path="/trending" element={<CategoryPage categoryOverride="Trending" />} />
          <Route path="/manufacturing" element={<CategoryPage categoryOverride="Manufacturing" />} />
          <Route path="/automation" element={<CategoryPage categoryOverride="Automation" />} />
          <Route path="/acquisitions" element={<CategoryPage categoryOverride="Acquisitions" />} />
          <Route path="/startups" element={<CategoryPage categoryOverride="Startups" />} />
          <Route path="/events" element={<CategoryPage categoryOverride="Events" />} />
          <Route path="/videos" element={<CategoryPage categoryOverride="Videos" />} />
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
          <Route path="/profile/:name" element={<AuthorProfile />} />
          <Route path="/upgrade" element={<UpgradePlan />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
