import React, { useState, useEffect } from 'react';
import { Offcanvas, ListGroup, Button, Modal, Form, Dropdown, Row, Col } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import MembershipModal from './MembershipModal';
import API_BASE from '../config/api';

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir"
];

const Navigation = () => {
  const [show, setShow] = useState(false);
  const [weather, setWeather] = useState({ temp: null, humidity: null, city: 'Detecting...', lat: null, lon: null });
  const [currentTime, setCurrentTime] = useState(new Date());
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
    navigate('/login');
  };

  const [showLocation, setShowLocation] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMembership, setShowMembership] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Podcast Modal State
  const [showPodcastModal, setShowPodcastModal] = useState(false);
  const [submittingPodcast, setSubmittingPodcast] = useState(false);
  const [podcastData, setPodcastData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    website: '',
    background: '',
    earliestAvailability: ''
  });

  const handlePodcastSubmit = async (e) => {
    e.preventDefault();
    setSubmittingPodcast(true);
    try {
      const response = await fetch(`${API_BASE}/api/podcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(podcastData)
      });
      const data = await response.json();
      if (response.ok) {
        alert("Thank you! Your podcast guest application has been submitted successfully.");
        setShowPodcastModal(false);
        setPodcastData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          website: '',
          background: '',
          earliestAvailability: ''
        });
      } else {
        alert(data.error || "Submission failed. Please try again.");
      }
    } catch (err) {
      alert("Server error. Please try again later.");
    } finally {
      setSubmittingPodcast(false);
    }
  };

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeatherAndCity = async (lat, lon, fallbackCity) => {
      try {
        let finalCity = fallbackCity;
        // Reverse Geocode to get precise city if not known
        if (!finalCity || finalCity === 'Unknown') {
          const reverseRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
          const reverseData = await reverseRes.json();
          finalCity = reverseData.city || reverseData.locality || reverseData.principalSubdivision || 'Unknown';
        }

        // Fetch Weather with Temperature and Humidity
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m`);
        const weatherData = await weatherRes.json();
        
        if (weatherData?.current) {
          setWeather({ 
            temp: Math.round(weatherData.current.temperature_2m), 
            humidity: Math.round(weatherData.current.relative_humidity_2m),
            city: finalCity,
            lat,
            lon
          });
        } else {
          setWeather({ temp: null, humidity: null, city: finalCity, lat, lon });
        }
      } catch (e) {
        console.error("Weather fetch error:", e);
        setWeather(prev => ({ ...prev, city: finalCity || 'Unknown Location' }));
      }
    };

    const fetchFallbackIP = async () => {
      try {
        const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
        const geoData = await geoRes.json();
        let city = geoData.city || geoData.region;
        let lat = geoData.latitude;
        let lon = geoData.longitude;

        // Fix for inaccurate ISP IP routing (Jio/Airtel often map to central India like Chhindwara)
        // If the IP lookup maps to a known wrong ISP hub, force the user's actual city
        if (city === 'Chhindwara' || city === 'Madhya Pradesh' || !city) {
            city = 'Jamshedpur';
            lat = 22.8046;
            lon = 86.2029;
        }

        if (lat && lon) {
          fetchWeatherAndCity(lat, lon, city);
        } else {
          // Hard fallback
          fetchWeatherAndCity(22.8046, 86.2029, 'Jamshedpur');
        }
      } catch (e) {
        // Ultimate fallback
        fetchWeatherAndCity(22.8046, 86.2029, 'Jamshedpur');
      }
    };

    const fetchAutoLocation = () => {
      let resolved = false;

      const executeFallback = () => {
        if (!resolved) {
          resolved = true;
          fetchFallbackIP();
        }
      };

      // Manually force a fallback if geolocation doesn't respond in 4 seconds
      const fallbackTimer = setTimeout(executeFallback, 4000);

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(fallbackTimer);
              fetchWeatherAndCity(position.coords.latitude, position.coords.longitude, null);
            }
          },
          (error) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(fallbackTimer);
              executeFallback();
            }
          },
          { timeout: 4000, maximumAge: 60000 }
        );
      } else {
        executeFallback();
      }
    };

    fetchAutoLocation();
  }, []);

  const handleDateChange = (e) => {
    const date = e.target.value;
    if (date) {
      navigate(`/search?date=${date}`);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).toUpperCase();
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: 'bi-house-door' },
    { name: 'States', path: '/area-news', icon: 'bi-geo-alt' },
    { name: 'Articles', path: '/articles', icon: 'bi-file-text' },
    { name: 'Interviews', path: '/interviews', icon: 'bi-mic' },
    { name: 'Trending', path: '/trending', icon: 'bi-graph-up-arrow' },
    { name: 'Manufacturing', path: '/manufacturing', icon: 'bi-gear-fill' },
    { name: 'Automation', path: '/automation', icon: 'bi-robot' },
    { name: 'Acquisitions', path: '/acquisitions', icon: 'bi-briefcase' },
    { name: 'Startups', path: '/startups', icon: 'bi-rocket-takeoff' },
    { name: 'Events', path: '/events', icon: 'bi-calendar-event' },
    { name: 'Videos', path: '/videos', icon: 'bi-play-circle' },
    { name: 'Media Kit', path: '/mediakit', icon: 'bi-collection-play' },
    { name: 'Magazine', path: '/magazine', icon: 'bi-book' },
  ];

  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${searchTerm}`);
      setSearchTerm('');
    }
  };

  return (
    <>
    <header className="main-header">

      <div className="top-utility-bar d-none d-md-block" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #eaeaea', fontSize: '0.85rem' }}>
        <div className="header-fluid-container d-flex justify-content-between align-items-center py-2">
          
          {/* Left: Location | Date & Time | Weather */}
          <div className="d-flex align-items-center gap-2 gap-md-3">
            
            {/* Auto Location Display with Google Link */}
            {weather.lat ? (
              <a 
                href={`https://www.google.com/search?q=weather+in+${weather.city}`}
                target="_blank" rel="noreferrer"
                className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill utility-btn border transition-all text-decoration-none"
                title="View Location & Forecast on Google"
              >
                <i className="bi bi-geo-alt-fill text-danger pulse-animation"></i>
                <span className="fw-bold text-dark">{weather.city}</span>
              </a>
            ) : (
              <div className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill utility-btn border transition-all">
                <i className="bi bi-geo-alt-fill text-danger pulse-animation"></i>
                <span className="fw-bold text-dark">{weather.city}</span>
              </div>
            )}

            {/* Weather & Humidity Box */}
            {weather.temp !== null && (
              <a 
                href={`https://www.google.com/search?q=weather+in+${weather.city}`}
                target="_blank" rel="noreferrer"
                className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill utility-btn border transition-all text-decoration-none"
                title="View Extended Forecast"
              >
                <i className="bi bi-cloud-sun-fill text-warning"></i>
                <span className="fw-bold text-dark">{weather.temp}°C</span>
                {weather.humidity !== null && (
                  <span className="text-muted border-start border-secondary ps-2 ms-1 fw-bold" style={{ fontSize: '0.8rem' }}>
                    <i className="bi bi-droplet-fill text-info me-1"></i>{weather.humidity}%
                  </span>
                )}
              </a>
            )}

            {/* Auto Calendar Display */}
            <div className="d-none d-lg-flex align-items-center gap-2 px-3 py-1 rounded-pill utility-btn border transition-all">
              <i className="bi bi-calendar3 text-primary"></i>
              <span className="fw-bold text-dark">{formatDate(currentTime)}</span>
              <span className="text-muted border-start border-secondary ps-2 ms-1">{formatTime(currentTime)}</span>
            </div>

          </div>

          {/* Right: Translate | Links | Sign In | Social Icons */}
          <div className="d-flex align-items-center gap-2 gap-md-3">
            
            <Link to="/login" className="utility-signin small fw-black">
              {userInfo ? userInfo.name.split(' ')[0] : 'Sign In'}
            </Link>

            <div className="utility-social d-none d-md-flex gap-2">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="facebook"><i className="bi bi-facebook"></i></a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="twitter"><i className="bi bi-twitter-x"></i></a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="instagram"><i className="bi bi-instagram"></i></a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="youtube"><i className="bi bi-youtube"></i></a>
            </div>
          </div>

        </div>
      </div>
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

            {/* RIGHT: Favorites + Podcast + Login */}
            <div className="brand-header-right">
              <button 
                className="brand-action-link podcast-header-btn" 
                onClick={() => setShowPodcastModal(true)}
              >
                <i className="bi bi-mic-fill"></i>
                <span className="d-none d-md-inline">Podcast</span>
              </button>
              <Link to="/favorites" className="brand-action-link" title="My Favorites">
                <i className="bi bi-heart-fill text-danger"></i>
                <span className="d-none d-md-inline">Favorites</span>
              </Link>
              <div 
                className="brand-action-link upgrade-header-btn cursor-pointer"
                onClick={() => window.open('/corporate/choose-plan', '_blank')}
              >
                <i className="bi bi-building-fill"></i>
                <span className="d-none d-md-inline text-uppercase fw-black">Corporate</span>
              </div>
              {userInfo && (
                <Link to="/profile" className="brand-action-link">
                  <i className="bi bi-person-circle text-danger"></i>
                  <span>{userInfo.name.split(' ')[0]}</span>
                </Link>
              )}
            </div>



          </div>
        </div>
      </div>

      {/* ============================================================
          CATEGORY NAV BAR — Image 2 Reference
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
              <Link
                key={link.name}
                to={link.path}
                className={`flat-nav-link ${location.pathname === link.path ? 'active' : ''}`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* ============================================================
          SIDEBAR OFFCANVAS — Unchanged
      ============================================================ */}
      <Offcanvas show={show} onHide={handleClose} placement="start" className="text-white border-end border-danger border-opacity-50" style={{ width: '320px', backgroundColor: '#000000' }}>
        <Offcanvas.Header closeButton closeVariant="white" className="border-bottom border-secondary border-opacity-25 py-4">
          <Offcanvas.Title>
            <img src="/industrialtimes_white.png" alt="Industrial Times" style={{ height: '35px' }} />
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
            </div>

            <div className="px-2">
              <ListGroup variant="flush">
                {navLinks.map((link, idx) => (
                  <ListGroup.Item key={link.name} className="bg-transparent border-0 py-1 px-2 mb-1">
                    <Link
                      to={link.path}
                      className={`nav-sidebar-link d-flex align-items-center gap-3 p-2 rounded-3 text-decoration-none transition-all w-100 ${location.pathname === link.path ? 'active' : ''}`}
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
                <ListGroup.Item className="bg-transparent border-0 py-1 px-2 mb-1">
                    <div
                      className="nav-sidebar-link d-flex align-items-center gap-3 p-2 rounded-3 text-decoration-none transition-all w-100 cursor-pointer"
                      onClick={() => { handleClose(); setShowPodcastModal(true); }}
                    >
                      <div className="icon-wrapper d-flex align-items-center justify-content-center rounded-2 transition-all" style={{ width: '32px', height: '32px', background: 'rgba(218, 37, 29, 0.2)' }}>
                        <i className="bi bi-mic-fill text-danger fs-6"></i>
                      </div>
                      <span className="fw-bold text-danger">Podcast Registration</span>
                    </div>
                </ListGroup.Item>
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

      {/* PODCAST REGISTRATION MODAL — Moved to bottom to avoid clipping */}
      <Modal 
        show={showPodcastModal} 
        onHide={() => setShowPodcastModal(false)} 
        size="lg" 
        centered
        className="podcast-modal"
        backdrop="static"
      >
        <Modal.Header closeButton className="border-0 pb-0 px-4 pt-4">
          <Modal.Title className="fw-black fs-2">Be Our Guest!</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2 px-4 pb-4">
          <p className="text-muted mb-4" style={{ fontSize: '0.95rem' }}>
            Want to be on our show? Give us a little bit of information about yourself and the topic(s) you'd like to discuss in your episode.
          </p>
          
          <Form onSubmit={handlePodcastSubmit}>
            <Row className="mb-4">
              <Form.Group as={Col} md={6}>
                <Form.Label className="fw-bold small mb-1">NAME <span className="text-danger">(REQUIRED)</span></Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Sarah" 
                  required 
                  value={podcastData.firstName}
                  onChange={(e) => setPodcastData({...podcastData, firstName: e.target.value})}
                />
                <Form.Text className="text-muted x-small">First</Form.Text>
              </Form.Group>
              <Form.Group as={Col} md={6}>
                <Form.Label className="fw-bold small mb-1">&nbsp;</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Kirkwold" 
                  required 
                  value={podcastData.lastName}
                  onChange={(e) => setPodcastData({...podcastData, lastName: e.target.value})}
                />
                <Form.Text className="text-muted x-small">Last</Form.Text>
              </Form.Group>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold small mb-1">EMAIL <span className="text-danger">(REQUIRED)</span></Form.Label>
              <Form.Control 
                type="email" 
                placeholder="test@test.com" 
                required 
                value={podcastData.email}
                onChange={(e) => setPodcastData({...podcastData, email: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold small mb-1">PHONE <span className="text-danger">(REQUIRED)</span></Form.Label>
              <Form.Control 
                type="tel" 
                placeholder="555-555-5555" 
                required 
                value={podcastData.phone}
                onChange={(e) => setPodcastData({...podcastData, phone: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold small mb-1">YOUR WEBSITE</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="www.gravity.com" 
                value={podcastData.website}
                onChange={(e) => setPodcastData({...podcastData, website: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold small mb-1">WHAT IS YOUR BACKGROUND? <span className="text-danger">(REQUIRED)</span></Form.Label>
              <Form.Control 
                as="textarea" 
                rows={6} 
                placeholder="Emerging marketing technology, content innovation, and building human connections in digital spaces. I would love to be a guest on your show!" 
                required 
                value={podcastData.background}
                onChange={(e) => setPodcastData({...podcastData, background: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-4" style={{ maxWidth: '250px' }}>
              <Form.Label className="fw-bold small mb-1">EARLIEST AVAILABILITY <span className="text-danger">(REQUIRED)</span></Form.Label>
              <Form.Control 
                type="date" 
                required 
                value={podcastData.earliestAvailability}
                onChange={(e) => setPodcastData({...podcastData, earliestAvailability: e.target.value})}
              />
            </Form.Group>

            <Button variant="primary" type="submit" className="px-5 fw-bold" disabled={submittingPodcast}>
              {submittingPodcast ? 'SUBMITTING...' : 'SUBMIT'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

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
