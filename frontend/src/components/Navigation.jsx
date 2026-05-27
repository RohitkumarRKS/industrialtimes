import React, { useState, useEffect } from 'react';
import { Offcanvas, ListGroup, Button, Modal, Form, Dropdown, Row, Col, Spinner } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import MembershipModal from './MembershipModal';
import API_BASE from '../config/api';

const Navigation = () => {
  const [show, setShow] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const getUserInfo = () => {
    try {
      const saved = sessionStorage.getItem('userInfo');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  };
  const userInfo = getUserInfo();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleLogout = () => {
    sessionStorage.removeItem('userInfo');
    handleClose();
    navigate('/');
  };

  const [showLocation, setShowLocation] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMembership, setShowMembership] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Podcast Modal State (Deprecated - now using full page route)

  const handleDateChange = (e) => {
    const date = e.target.value;
    if (date) {
      navigate(`/search?date=${date}`);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: 'bi-house-door' },
    { name: 'News', path: '/news', icon: 'bi-newspaper' },
    { name: 'Regional', path: '/regional', icon: 'bi-geo-alt' },
    { name: 'Articles', path: '/articles', icon: 'bi-file-text' },
    { name: 'Trending', path: '/trending', icon: 'bi-graph-up-arrow' },
    { name: 'OEM', path: '/category/OEM', icon: 'bi-gear' },
    { name: 'Automation', path: '/category/Automation', icon: 'bi-robot' },
    { name: 'Interview', path: '/category/Interview', icon: 'bi-mic' },
    { name: 'Startup', path: '/category/Startup', icon: 'bi-rocket' },
    { name: 'Business', path: '/category/Business', icon: 'bi-briefcase' },
    { name: 'Event', path: '/category/Event', icon: 'bi-calendar-event' },
    { name: 'Video', path: '/category/Video', icon: 'bi-camera-video' },
    { name: 'Entertainment', path: '/category/Entertainment', icon: 'bi-film' },
    { name: 'Sports', path: '/category/Sports', icon: 'bi-trophy' },
    { name: 'Education', path: '/category/Education', icon: 'bi-book' }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [categoryNewsCache, setCategoryNewsCache] = useState({});
  const [isFetchingMegaMenu, setIsFetchingMegaMenu] = useState(false);

  const handleMouseEnter = async (link) => {
    setHoveredCategory(link.name);
    if (link.name === 'Home') return;
    if (!categoryNewsCache[link.name] && !isFetchingMegaMenu) {
      setIsFetchingMegaMenu(true);
      try {
        const catSlug = link.name.toLowerCase();
        let url = `${API_BASE}/api/articles?category=${catSlug}`;
        if (catSlug === 'news') url = `${API_BASE}/api/articles`;
        const res = await fetch(url);
        const data = await res.json();
        setCategoryNewsCache(prev => ({ ...prev, [link.name]: data.slice(0, 4) }));
      } catch (err) {
        console.error(err);
      } finally {
        setIsFetchingMegaMenu(false);
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredCategory(null);
  };

  const isActive = (linkPath) => {
    if (linkPath === '/' && location.pathname === '/') return true;
    if (linkPath !== '/') {
      const pathBase = linkPath.replace('/', '').toLowerCase();
      const currentPath = location.pathname.toLowerCase();
      if (currentPath === linkPath.toLowerCase() || currentPath.startsWith(`/category/${pathBase}`) || currentPath.startsWith(`/${pathBase}`)) {
        return true;
      }
    }
    return false;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${searchTerm}`);
      setSearchTerm('');
    }
  };

  return (
    <>
      <style>{`
      .animated-header-btn {
        position: relative;
        overflow: hidden;
        color: white !important;
        border-radius: 6px;
        padding: 4px 12px;
        font-weight: 700;
        letter-spacing: 0.3px;
        display: flex;
        align-items: center;
        gap: 5px;
        transition: all 0.3s ease;
        z-index: 1;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
        text-transform: uppercase;
        text-decoration: none;
        border: none;
        font-size: 0.68rem;
        height: 30px;
        cursor: pointer;
      }
      .animated-header-btn::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        width: 150px;
        height: 150px;
        background-color: rgba(255,255,255,0.1);
        border-radius: 50%;
        transition: transform 0.4s ease;
        z-index: -1;
      }
      .animated-header-btn:hover::before {
        transform: translate(-50%, -50%) scale(1);
      }
      .animated-header-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(218, 37, 29, 0.4);
        background: linear-gradient(135deg, #e53935 0%, #b71c1c 100%) !important;
        border-color: transparent !important;
      }
    `}</style>
      <header className="main-header">
        <div className="brand-header">
          <div className="header-fluid-container">
            <div className="brand-header-inner reveal">

              {/* LEFT: Mobile hamburger + Logo */}
              <div className="brand-header-left">
                <button className="hamburger-btn d-lg-none" onClick={handleShow} title="Toggle Navigation" style={{ minWidth: '44px', minHeight: '44px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
                <div className="brand-logo">
                  <Link to="/">
                    <img src="/industrialtimes_white.png" alt="Industrial Times" />
                  </Link>
                </div>
              </div>

              {/* RIGHT: Podcast + Corporate + Login — hidden on podcast page */}
              {location.pathname !== '/podcast-apply' && (
              <div className="brand-header-right d-none d-md-flex gap-3 align-items-center">
                <button
                  className="modern-header-btn"
                  onClick={() => window.open('/podcast-apply', '_blank')}
                >
                  <i className="bi bi-mic-fill"></i>
                  <span className="d-none d-md-inline">Podcast</span>
                </button>

                {/* Hide Corporate button if user already has a corporate role */}
                {!(userInfo && userInfo.role === 'corporate') && (
                  <button
                    className="modern-header-btn"
                    onClick={() => window.open('/corporate/choose-plan', '_blank')}
                  >
                    <i className="bi bi-building-fill"></i>
                    <span className="d-none d-md-inline">Corporate</span>
                  </button>
                )}
                {userInfo ? (
                  <Link to="/profile" className="modern-header-btn">
                    <i className="bi bi-person-circle"></i>
                    <span>{userInfo.name.split(' ')[0]}</span>
                  </Link>
                ) : (
                  <Link to="/login" className="modern-header-btn">
                    <i className="bi bi-box-arrow-in-right"></i>
                    <span>Login</span>
                  </Link>
                )}
              </div>
              )}



            </div>
          </div>
        </div>

        {/* ============================================================
          CATEGORY NAV BAR â€” Image 2 Reference
          Width: 1000, Height: 40, Background: #F6F6F6
          Professional flat first-level-menu
      ============================================================ */}
        <div className="first-level-menu d-none d-lg-block">
          <div className="header-fluid-container">
            <nav className="category-nav-flat reveal" style={{ animationDelay: '0.1s' }}>
              <button
                className="hamburger-flat-btn"
                onClick={handleShow}
                title="Toggle Navigation"
                aria-label="Open menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>

              {navLinks.map((link) => (
                <div
                  key={link.name}
                  className="flat-nav-item"
                  style={{ display: 'flex', height: '100%' }}
                  onMouseEnter={() => handleMouseEnter(link)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    to={link.path}
                    className={`flat-nav-link ${isActive(link.path) ? 'active' : ''}`}
                  >
                    {link.name}
                  </Link>
                  {link.name !== 'Home' && (
                    <div className="mega-menu-dropdown">
                      {categoryNewsCache[link.name] ? (
                        <div className="mega-menu-grid">
                          {categoryNewsCache[link.name].map(article => {
                            const articleImg = article.image || article.imageUrl;
                            const fullImgUrl = articleImg ? (articleImg.startsWith('http') ? articleImg : `${API_BASE}${articleImg.startsWith('/') ? '' : '/'}${articleImg}`) : null;
                            const slugCategory = (article.category || 'news').toLowerCase().replace(/ /g, '-');
                            const slugTitle = article.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                            const articleLink = `/article/${slugCategory}/${slugTitle}/${article.id}`;

                            return (
                              <Link to={articleLink} key={article.id} className="mega-menu-card">
                                <div className="mega-menu-thumb">
                                  {fullImgUrl ? <img src={fullImgUrl} className="mega-menu-img" alt={article.title} /> : <div className="d-flex h-100 align-items-center justify-content-center bg-light"><i className="bi bi-image text-muted"></i></div>}
                                </div>
                                <h6 className="mega-menu-title">{article.title}</h6>
                                <div className="mega-menu-meta">
                                  {article.createdAt ? new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (article.date || 'Today')}
                                </div>
                              </Link>
                            );
                          })}
                          {categoryNewsCache[link.name].length === 0 && (
                            <div className="text-muted text-center" style={{ gridColumn: '1 / -1' }}>No recent news in this category.</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center p-4">
                          <Spinner animation="border" size="sm" style={{ color: 'var(--industrial-red)' }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Bookmark Icon Link (Favorites) */}
              <div className="flat-nav-item d-flex align-items-center" style={{ height: '100%', paddingRight: '15px' }}>
                <Link
                  to="/favorites"
                  className={`flat-nav-link ${isActive('/favorites') ? 'active' : ''}`}
                  style={{ padding: '0 15px', color: 'var(--industrial-red)' }}
                  title="Bookmarks"
                >
                  <i className="bi bi-bookmark-fill" style={{ fontSize: '1.2rem' }}></i>
                </Link>
              </div>
            </nav>
          </div>
        </div>

        {/* ============================================================
          SIDEBAR OFFCANVAS â€” Unchanged
      ============================================================ */}
        <Offcanvas show={show} onHide={handleClose} placement="start" className="text-white border-end border-danger border-opacity-50" style={{ width: '320px', backgroundColor: '#000000' }}>
          <Offcanvas.Header closeButton closeVariant="white" className="border-bottom border-secondary border-opacity-25 py-4">
            <Offcanvas.Title>
              <Link to="/" onClick={handleClose}>
                <img src="/industrialtimes_white.png" alt="Industrial Times" className="sidebar-logo" />
              </Link>
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="p-0 d-flex flex-column h-100">
            <div className="flex-grow-1 overflow-auto">
              <div className="p-4 mx-3 my-4 rounded-4 shadow-lg border border-white border-opacity-10" style={{ background: 'linear-gradient(135deg, rgba(218, 37, 29, 0.15), rgba(0, 0, 0, 0.4))', backdropFilter: 'blur(10px)' }}>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div className="bg-danger rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                    <i className={`bi ${userInfo ? 'bi-person-check-fill' : 'bi-person-fill'} text-white small`}></i>
                  </div>
                  <h6 className="text-white fw-black mb-0 small text-uppercase" style={{ letterSpacing: '1px' }}>
                    {userInfo ? `Hi, ${userInfo.name.split(' ')[0]}` : 'Guest Access'}
                  </h6>
                </div>
                <p className="small text-white-50 mb-4" style={{ fontSize: '0.8rem' }}>
                  {userInfo ? `Logged in as ${userInfo.role}` : 'Access premium industrial insights and global market reports.'}
                </p>
                {location.pathname !== '/podcast-apply' && (
                <div className="d-flex gap-2">
                  {userInfo ? (
                    <Button variant="outline-light" size="sm" className="flex-grow-1 rounded-pill fw-bold py-2 border-opacity-25" onClick={handleLogout}>Logout</Button>
                  ) : (
                    <>
                      <Link to="/login" className="btn btn-outline-light btn-sm flex-grow-1 rounded-pill fw-bold py-2 border-opacity-25" onClick={handleClose}>Login</Link>
                      <Link to="/signup" className="btn btn-danger btn-sm flex-grow-1 rounded-pill fw-bold py-2 shadow-sm" onClick={handleClose}>Join Now</Link>
                    </>
                  )}
                </div>
                )}
              </div>

              <div className="px-2">
                <ListGroup variant="flush">
                  {/* Corporate Portal Link — hidden on podcast page */}
                  {!(userInfo && userInfo.role === 'corporate') && location.pathname !== '/podcast-apply' && (
                    <ListGroup.Item className="bg-transparent border-0 py-1 px-2 mb-1">
                      <div
                        className="nav-sidebar-link d-flex align-items-center gap-3 p-2 rounded-3 text-decoration-none transition-all w-100 cursor-pointer"
                        onClick={() => {
                          handleClose();
                          window.open('/corporate/choose-plan', '_blank');
                        }}
                        style={{ background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(244, 67, 54, 0.1))' }}
                      >
                        <div className="icon-wrapper d-flex align-items-center justify-content-center rounded-2 transition-all" style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #ff9800, #f44336)' }}>
                          <i className="bi bi-building-fill text-white small"></i>
                        </div>
                        <span className="fw-bold" style={{ color: '#ff9800' }}>Corporate Portal</span>
                      </div>
                    </ListGroup.Item>
                  )}

                  {/* Podcast Registration — hidden on podcast page */}
                  {location.pathname !== '/podcast-apply' && (
                  <ListGroup.Item className="bg-transparent border-0 py-1 px-2 mb-1">
                    <div
                      className="nav-sidebar-link d-flex align-items-center gap-3 p-2 rounded-3 text-decoration-none transition-all w-100 cursor-pointer"
                      onClick={() => { handleClose(); window.open('/podcast-apply', '_blank'); }}
                    >
                      <div className="icon-wrapper d-flex align-items-center justify-content-center rounded-2 transition-all" style={{ width: '32px', height: '32px', background: 'rgba(218, 37, 29, 0.2)' }}>
                        <i className="bi bi-mic-fill text-danger fs-6"></i>
                      </div>
                      <span className="fw-bold text-danger">Podcast Registration</span>
                    </div>
                  </ListGroup.Item>
                  )}



                  <div className="border-bottom border-secondary border-opacity-25 my-2 mx-3"></div>

                  {/* Dynamic Category Links */}
                  {navLinks.map((link, idx) => (
                    <ListGroup.Item key={link.name} className="bg-transparent border-0 py-1 px-2 mb-1">
                      <Link
                        to={link.path}
                        className={`nav-sidebar-link d-flex align-items-center gap-3 p-2 rounded-3 text-decoration-none transition-all w-100 ${isActive(link.path) ? 'active' : ''}`}
                        onClick={handleClose}
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <div className="icon-wrapper d-flex align-items-center justify-content-center rounded-2 transition-all" style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.05)' }}>
                          <i className={`bi ${link.icon} fs-6`}></i>
                        </div>
                        <span className="fw-medium">{link.name}</span>
                        <i className="bi bi-chevron-right ms-auto x-small opacity-0 transition-all arrow-indicator"></i>
                      </Link>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            </div>

            <div className="p-4 border-top border-secondary border-opacity-25 text-center bg-black bg-opacity-50">
              <div className="d-flex gap-4 justify-content-center text-white-50 mb-3 fs-5">
                <i className="bi bi-linkedin hover-text-red transition-all cursor-pointer"></i>
                <i className="bi bi-twitter-x hover-text-red transition-all cursor-pointer"></i>
                <i className="bi bi-facebook hover-text-red transition-all cursor-pointer"></i>
                <i className="bi bi-instagram hover-text-red transition-all cursor-pointer"></i>
              </div>
              <p className="x-small mb-0 sidebar-copyright-text">&copy; {new Date().getFullYear()} Industrial Times Networks</p>
            </div>
          </Offcanvas.Body>
        </Offcanvas>

      </header>



      {/* MEMBERSHIP PLAN POPUP MODAL */}
      <MembershipModal
        show={showMembership}
        onHide={() => setShowMembership(false)}
        userInfo={userInfo}
      />
    </>
  );
};

export default Navigation;
