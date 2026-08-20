import React, { useState, useEffect } from 'react';
import { Offcanvas, ListGroup, Button, Modal, Form, Dropdown, Row, Col, Spinner } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import MembershipModal from './MembershipModal';
import API_BASE from '../config/api';
import { UtilityBoxLeft, UtilityBoxRight } from './HeaderUtilityBoxes';

const MobileConnectWidget = () => {
  return (
    <div className="d-flex flex-column gap-3 w-100 text-center">
      {/* Row 1: Connect With Us */}
      <div className="mb-1">
        <span className="small text-uppercase fw-bold text-muted" style={{ letterSpacing: '1px', fontSize: '0.75rem' }}>Let's Connect With Us</span>
      </div>
      <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-4 border shadow-sm mb-3">
        {/* Facebook */}
        <a
          href="https://www.facebook.com/ITNIndia"
          target="_blank"
          rel="noreferrer"
          className="social-circle-btn bg-white rounded-circle d-flex align-items-center justify-content-center border text-decoration-none"
          style={{ width: '40px', height: '40px', color: '#1877F2', borderColor: '#1877F2', display: 'flex', transition: 'transform 0.2s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <i className="bi bi-facebook fs-5"></i>
        </a>
        {/* Twitter/X */}
        <a
          href="https://x.com/itnindiaa"
          target="_blank"
          rel="noreferrer"
          className="social-circle-btn bg-white rounded-circle d-flex align-items-center justify-content-center border text-decoration-none"
          style={{ width: '40px', height: '40px', color: '#000000', borderColor: '#000000', display: 'flex', transition: 'transform 0.2s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <i className="bi bi-twitter-x fs-5"></i>
        </a>
        {/* Instagram */}
        <a
          href="https://www.instagram.com/itnindia/"
          target="_blank"
          rel="noreferrer"
          className="social-circle-btn bg-white rounded-circle d-flex align-items-center justify-content-center border text-decoration-none"
          style={{ width: '40px', height: '40px', color: '#E4405F', borderColor: '#E4405F', display: 'flex', transition: 'transform 0.2s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <i className="bi bi-instagram fs-5"></i>
        </a>
        {/* LinkedIn */}
        <a
          href="https://www.linkedin.com/company/industrialtimes/"
          target="_blank"
          rel="noreferrer"
          className="social-circle-btn bg-white rounded-circle d-flex align-items-center justify-content-center border text-decoration-none"
          style={{ width: '40px', height: '40px', color: '#0077B5', borderColor: '#0077B5', display: 'flex', transition: 'transform 0.2s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <i className="bi bi-linkedin fs-5"></i>
        </a>
        {/* YouTube */}
        <a
          href="https://www.youtube.com/@itn_india"
          target="_blank"
          rel="noreferrer"
          className="social-circle-btn bg-white rounded-circle d-flex align-items-center justify-content-center border text-decoration-none"
          style={{ width: '40px', height: '40px', color: '#FF0000', borderColor: '#FF0000', display: 'flex', transition: 'transform 0.2s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <i className="bi bi-youtube fs-5"></i>
        </a>
      </div>
    </div>
  );
};

const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
  <button
    ref={ref}
    className="modern-header-btn"
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    style={{
      background: 'linear-gradient(135deg, #242424 0%, #121212 100%)',
      borderColor: 'rgba(255, 255, 255, 0.25)',
      padding: '4px 14px',
      minWidth: '100px',
      justifyContent: 'space-between',
      cursor: 'pointer'
    }}
  >
    {children}
    <i className="bi bi-chevron-down ms-1" style={{ fontSize: '0.6rem', opacity: 0.8 }}></i>
  </button>
));

const Navigation = () => {
  const [show, setShow] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [weather, setWeather] = useState({ temp: null, weatherCode: null, city: 'Detecting...' });

  useEffect(() => {
    const fetchWeatherAndCity = async (lat, lon, fallbackCity) => {
      try {
        let finalCity = fallbackCity;

        // If city is not provided or is Detecting/Unknown, run reverse geocoding to resolve exact GPS city
        if (!finalCity || finalCity === 'Detecting...' || finalCity === 'Unknown') {
          try {
            const reverseRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
            if (reverseRes.ok) {
              const reverseData = await reverseRes.json();
              finalCity = reverseData.city || reverseData.locality || reverseData.principalSubdivision || 'Jamshedpur';
            }
          } catch (err) {
            console.warn('Navigation reverse geocoding failed, using fallback', err);
          }
        }

        if (!finalCity || finalCity === 'Unknown') finalCity = 'Jamshedpur';

        let temp = null;
        let weatherCode = null;

        // Try Open-Meteo first
        try {
          const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`);
          if (!weatherRes.ok) throw new Error(`HTTP error ${weatherRes.status}`);
          const weatherData = await weatherRes.json();

          if (weatherData?.current) {
            temp = Math.round(weatherData.current.temperature_2m);
            weatherCode = weatherData.current.weather_code;
          } else {
            throw new Error('Invalid Open-Meteo format');
          }
        } catch (openMeteoErr) {
          console.warn('Navigation Open-Meteo API failed, trying wttr.in fallback:', openMeteoErr);
          try {
            const queryCity = finalCity && finalCity !== 'Unknown' ? finalCity : 'Jamshedpur';
            const wttrRes = await fetch(`https://wttr.in/${encodeURIComponent(queryCity)}?format=j1`);
            if (!wttrRes.ok) throw new Error(`HTTP error ${wttrRes.status}`);
            const wttrData = await wttrRes.json();
            const currentCond = wttrData?.current_condition?.[0];
            if (currentCond) {
              temp = Math.round(parseFloat(currentCond.temp_C));
              const wwoCode = parseInt(currentCond.weatherCode, 10);

              // Map WWO code to WMO
              if (wwoCode === 113) weatherCode = 0;
              else if (wwoCode === 116) weatherCode = 1;
              else if (wwoCode === 119 || wwoCode === 122) weatherCode = 3;
              else if (wwoCode === 143 || wwoCode === 248 || wwoCode === 260) weatherCode = 45;
              else if ([263, 266, 293, 296, 299, 302, 305, 308, 353, 356, 359].includes(wwoCode)) weatherCode = 61;
              else if ([386, 389, 392, 395].includes(wwoCode)) weatherCode = 95;
              else weatherCode = 3;
            } else {
              throw new Error('Invalid wttr.in format');
            }
          } catch (wttrErr) {
            console.warn('Navigation wttr.in fallback failed too. Using simulated values.', wttrErr);
            const currentHour = new Date().getHours();
            if (currentHour >= 11 && currentHour <= 16) {
              temp = 34;
            } else if (currentHour >= 6 && currentHour < 11) {
              temp = 29;
            } else if (currentHour > 16 && currentHour <= 20) {
              temp = 31;
            } else {
              temp = 26;
            }
            weatherCode = 1;
          }
        }

        setWeather({
          temp,
          weatherCode,
          city: finalCity
        });
      } catch (e) {
        console.error('Navigation weather fetch outer error:', e);
        setWeather({
          temp: 32,
          weatherCode: 0,
          city: fallbackCity || 'Jamshedpur'
        });
      }
    };

    const fetchLocationByIP = async () => {
      try {
        // Try geojs.io (free, HTTPS, CORS-enabled, no rate limits)
        try {
          const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
          if (res.ok) {
            const data = await res.json();
            const city = data.city || 'Jamshedpur';
            const lat = data.latitude;
            const lon = data.longitude;
            if (lat && lon && city !== 'Unknown' && city !== 'Chhindwara') {
              fetchWeatherAndCity(lat, lon, city);
              return;
            }
          }
        } catch (apiErr) {
          console.warn('Navigation geojs.io failed, using fallback:', apiErr);
        }

        // Fallback to static coordinates
        fetchWeatherAndCity(22.8046, 86.2029, 'Jamshedpur');
      } catch (e) {
        console.warn('Navigation failed to fetch location by IP, using fallback', e);
        fetchWeatherAndCity(22.8046, 86.2029, 'Jamshedpur');
      }
    };

    const fetchLocation = () => {
      // Bypass browser GPS prompt to prevent "Allow location" dialog. Directly resolve location via IP-geolocation.
      fetchLocationByIP();
    };

    fetchLocation();
  }, []);

  const currentHour = new Date().getHours();
  const isDayTime = currentHour >= 6 && currentHour < 19;

  const getThemeByWeather = (code) => {
    const isDay = isDayTime;
    if (code === null) return { icon: isDay ? 'bi-sun-fill' : 'bi-moon-stars-fill', iconColor: isDay ? '#ffb300' : '#9ca3af' };
    if (code === 0) return { icon: isDay ? 'bi-sun-fill' : 'bi-moon-stars-fill', iconColor: isDay ? '#ff9800' : '#9ca3af' };
    if (code <= 3) return { icon: 'bi-clouds-fill', iconColor: '#90a4ae' };
    if (code === 45 || code === 48) return { icon: 'bi-cloud-haze2-fill', iconColor: '#b0bec5' };
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { icon: 'bi-cloud-rain-heavy-fill', iconColor: '#29b6f6' };
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return { icon: 'bi-snow', iconColor: '#4dd0e1' };
    if (code >= 95) return { icon: 'bi-cloud-lightning-rain-fill', iconColor: '#ffd54f' };
    return { icon: isDay ? 'bi-sun-fill' : 'bi-moon-stars-fill', iconColor: isDay ? '#ffb300' : '#9ca3af' };
  };

  const weatherTheme = getThemeByWeather(weather.weatherCode);

  const handleMobileLocationClick = () => {
    const city = weather.city || localStorage.getItem('detectedCity') || 'Jamshedpur';
    window.open(`https://www.google.com/search?q=weather+in+${encodeURIComponent(city)}`, '_blank');
  };

  const getUserInfo = () => {
    try {
      const saved = localStorage.getItem('userInfo');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  };
  const userInfo = getUserInfo();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    handleClose();
    navigate('/');
  };

  const [showLocation, setShowLocation] = useState(false);
  const [showMobileLocation, setShowMobileLocation] = useState(false);
  const [showMobileSocial, setShowMobileSocial] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMembership, setShowMembership] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [currentLang, setCurrentLang] = useState('en');

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'bn', label: 'বাংলা (Bengali)' },
    { code: 'mr', label: 'मराठी (Marathi)' },
    { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
    { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'te', label: 'తెలుగు (Telugu)' },
    { code: 'ml', label: 'മലയാളം (Malayalam)' }
  ];

  // Read current language from localStorage or cookies on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('selectedLanguage');
    if (savedLang && languages.some(l => l.code === savedLang)) {
      setCurrentLang(savedLang);
      return;
    }

    const getCookieValues = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      return parts.slice(1).map(p => p.split(';').shift());
    };

    const googtransList = getCookieValues('googtrans');
    let activeLang = 'en';
    for (const val of googtransList) {
      try {
        const decoded = decodeURIComponent(val);
        const match = decoded.match(/\/en\/([a-z]{2})/i);
        if (match && match[1]) {
          const code = match[1].toLowerCase();
          if (code !== 'en' && languages.some(l => l.code === code)) {
            activeLang = code;
            break;
          }
        }
      } catch (e) {
        // ignore
      }
    }
    setCurrentLang(activeLang);
  }, []);

  const handleLanguageChange = (lang) => {
    setCurrentLang(lang);
    localStorage.setItem('selectedLanguage', lang);

    // Clear cookies and set to /en/en if switching back to English
    if (lang === 'en') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.industrialtimes.in;';
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=industrialtimes.in;';

      document.cookie = 'googtrans=/en/en; path=/;';
      if (window.location.hostname.includes('industrialtimes.in')) {
        document.cookie = 'googtrans=/en/en; path=/; domain=.industrialtimes.in;';
        document.cookie = 'googtrans=/en/en; path=/; domain=industrialtimes.in;';
      }
    } else {
      document.cookie = `googtrans=/en/${lang}; path=/;`;
      if (window.location.hostname.includes('industrialtimes.in')) {
        document.cookie = `googtrans=/en/${lang}; path=/; domain=.industrialtimes.in;`;
        document.cookie = `googtrans=/en/${lang}; path=/; domain=industrialtimes.in;`;
      }
    }

    // Update combo box if available in DOM
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = lang === 'en' ? '' : lang;
      select.dispatchEvent(new Event('change'));
    }

    // Force a reload to guarantee standard UI reset
    window.location.reload();
  };

  const getSelectedLanguageLabel = () => {
    const selected = languages.find(l => l.code === currentLang);
    return selected ? selected.label.split(' ')[0] : 'English';
  };

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
    { name: 'OEM', path: '/oem', icon: 'bi-gear' },
    { name: 'Interview', path: '/interview', icon: 'bi-mic' },
    { name: 'Startup', path: '/startup', icon: 'bi-rocket' },
    { name: 'Business', path: '/business', icon: 'bi-briefcase' },
    { name: 'Event', path: '/event', icon: 'bi-calendar-event' },
    { name: 'Entertainment', path: '/entertainment', icon: 'bi-film' },
    { name: 'Sports', path: '/sports', icon: 'bi-trophy' },
    { name: 'Education', path: '/education', icon: 'bi-book' },
    { name: 'Tender', path: '/tender', icon: 'bi-file-earmark-richtext' },
    { name: 'Astrology', path: '/astrology', icon: 'bi-stars' }
  ];

  const sidebarLinks = [
    { name: 'Home', path: '/', icon: 'bi-house-door' },
    { name: 'News', path: '/news', icon: 'bi-newspaper' },
    { name: 'Regional', path: '/regional', icon: 'bi-geo-alt' },
    { name: 'Articles', path: '/articles', icon: 'bi-file-text' },
    { name: 'Trending', path: '/trending', icon: 'bi-graph-up-arrow' },
    { name: 'OEM', path: '/oem', icon: 'bi-gear' },
    { name: 'Automation', path: '/automation', icon: 'bi-robot' },
    { name: 'Interview', path: '/interview', icon: 'bi-mic' },
    { name: 'Webinars', path: '/webinars', icon: 'bi-laptop' },
    { name: 'Startup', path: '/startup', icon: 'bi-rocket' },
    { name: 'Business', path: '/business', icon: 'bi-briefcase' },
    { name: 'Event', path: '/event', icon: 'bi-calendar-event' },
    { name: 'Entertainment', path: '/entertainment', icon: 'bi-film' },
    { name: 'Sports', path: '/sports', icon: 'bi-trophy' },
    { name: 'Education', path: '/education', icon: 'bi-book' },
    { name: 'Tender', path: '/tender', icon: 'bi-file-earmark-richtext' },
    { name: 'Astrology', path: '/astrology', icon: 'bi-stars' }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchDrop, setShowSearchDrop] = useState(false);
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
      const pathBase = linkPath.split('/').filter(Boolean).pop()?.toLowerCase() || '';
      const currentPath = location.pathname.toLowerCase();
      if (currentPath === linkPath.toLowerCase() || currentPath.startsWith(`/category/${pathBase}`) || currentPath.startsWith(`/${pathBase}`)) {
        return true;
      }
      // Special mappings
      if (pathBase === 'regional' && (currentPath.startsWith('/area-news') || currentPath.startsWith('/location/'))) {
        return true;
      }
      if (pathBase === 'webinars' && currentPath.startsWith('/webinar')) {
        return true;
      }
      // Handle article detail pages to highlight their corresponding category
      const pathParts = currentPath.split('/');
      if (pathParts[1] === 'article' && pathParts[2]) {
        const articleCategory = pathParts[2].toLowerCase();
        // Support singular/plural normalization (e.g. interview vs interviews)
        const norm = (str) => str.endsWith('s') ? str.slice(0, -1) : str;
        if (norm(pathBase) === norm(articleCategory)) {
          return true;
        }
      }
    }
    return false;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${searchTerm}`);
      setSearchTerm('');
      setShowSearchDrop(false);
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
      .lang-dropdown-menu {
        background: #121212 !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
        border-radius: 12px !important;
        padding: 8px 0 !important;
        min-width: 180px !important;
        max-height: 320px !important;
        overflow-y: auto !important;
      }
      .lang-dropdown-item {
        color: #e0e0e0 !important;
        font-size: 0.85rem !important;
        font-weight: 500 !important;
        padding: 10px 20px !important;
        background: transparent !important;
        transition: all 0.2s ease !important;
        border: none !important;
      }
      .lang-dropdown-item:hover {
        background: rgba(255, 255, 255, 0.08) !important;
        color: #ffffff !important;
        padding-left: 24px !important;
      }
      .lang-dropdown-item.active {
        background: var(--industrial-red) !important;
        color: #ffffff !important;
      }
    `}</style>
      <header className="main-header">
        <div className="brand-header notranslate" style={{ position: 'relative', zIndex: 10 }}>
          <div className="header-fluid-container">
            <div className="brand-header-inner reveal">

              {/* LEFT: Mobile hamburger + Logo */}
              <div className="brand-header-left">
                <button className="hamburger-btn d-md-none" onClick={handleShow} title="Toggle Navigation" style={{ minWidth: '44px', minHeight: '44px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
                <div className="brand-logo">
                  <a href="/">
                    <img src="/industrialtimes_white.png" alt="Industrial Times" />
                  </a>
                </div>
              </div>

              {/* MOBILE ONLY RIGHT SIDE BUTTONS: Location & Social Connect */}
              <div className="d-flex d-md-none gap-2 align-items-center">
                <div
                  onClick={handleMobileLocationClick}
                  className="d-flex align-items-center justify-content-center px-2 text-white"
                  style={{
                    gap: '4px',
                    height: '32px',
                    borderRadius: '20px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: '2px 6px',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  title={`Weather in ${weather.city}`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <i className={`bi ${weatherTheme.icon}`} style={{ color: weatherTheme.iconColor, fontSize: '1rem' }}></i>
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', lineHeight: 1 }}>{weather.temp !== null ? weather.temp : '--'}</span>
                  <span style={{ fontSize: '0.5rem', opacity: 0.85, fontWeight: '700', marginLeft: '1px' }}>°C</span>
                </div>
                <button
                  className="btn d-flex align-items-center justify-content-center p-0 rounded-circle"
                  style={{ width: '32px', height: '32px', border: 'none', backgroundColor: 'transparent', color: 'white' }}
                  onClick={() => setShowMobileSocial(true)}
                  title="Social Connect"
                >
                  <i className="bi bi-share-fill text-info" style={{ fontSize: '0.9rem' }}></i>
                </button>
                <Dropdown align="end" className="notranslate">
                  <Dropdown.Toggle
                    as="button"
                    className="btn d-flex align-items-center justify-content-center p-0 rounded-circle"
                    style={{ width: '32px', height: '32px', border: 'none', backgroundColor: 'transparent', color: 'white' }}
                  >
                    <i className="bi bi-translate text-danger fs-6"></i>
                  </Dropdown.Toggle>
                  <Dropdown.Menu
                    className="shadow-lg border-0 rounded-3 mt-2 notranslate"
                    style={{
                      background: '#1a1a1a',
                      padding: '6px 0',
                      minWidth: '160px',
                      zIndex: 10000,
                      maxHeight: '300px',
                      overflowY: 'auto'
                    }}
                  >
                    {languages.map((lang) => (
                      <Dropdown.Item
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        active={currentLang === lang.code}
                        className="lang-dropdown-item"
                      >
                        {lang.label}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>

              {/* RIGHT: Podcast + Corporate + Login — hidden on podcast page */}
              {!location.pathname.startsWith('/podcast') && (
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
                    <Link to={
                      userInfo.role === 'superadmin'
                        ? "/superadmin@123/"
                        : userInfo.isManager
                          ? (userInfo.role === 'author' || userInfo.role === 'corporate' ? "/user-dashboard?adminOpen=true" : "/profile?adminOpen=true")
                          : (userInfo.role === 'author' || userInfo.role === 'corporate' ? "/user-dashboard" : "/profile")
                    } className="modern-header-btn">
                      <i className="bi bi-person-circle"></i>
                      <span>{userInfo.name.split(' ')[0]}</span>
                    </Link>
                  ) : (
                    <Link to="/login" className="modern-header-btn">
                      <i className="bi bi-box-arrow-in-right"></i>
                      <span>Login</span>
                    </Link>
                  )}

                  <Dropdown align="end" className="notranslate">
                    <Dropdown.Toggle as={CustomToggle} id="dropdown-language-selector">
                      <i className="bi bi-translate text-danger"></i>
                      <span>{getSelectedLanguageLabel()}</span>
                    </Dropdown.Toggle>

                    <Dropdown.Menu
                      className="shadow-lg border-0 rounded-3 mt-2 notranslate"
                      style={{
                        background: '#1a1a1a',
                        padding: '6px 0',
                        minWidth: '160px',
                        zIndex: 10000,
                        maxHeight: '300px',
                        overflowY: 'auto'
                      }}
                    >
                      {languages.map((lang) => (
                        <Dropdown.Item
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          active={currentLang === lang.code}
                          className="lang-dropdown-item"
                        >
                          {lang.label}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              )}



            </div>
          </div>
        </div>

        {/* ============================================================
          CATEGORY NAV BAR — Image 2 Reference
          Width: 1000, Height: 40, Background: #F6F6F6
          Professional flat first-level-menu
      ============================================================ */}
        <div className="first-level-menu d-none d-md-block notranslate">
          <div className="header-fluid-container" style={{ paddingLeft: '15px', paddingRight: '15px' }}>
            <nav className="category-nav-flat reveal notranslate" style={{ animationDelay: '0.1s', display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', overflow: 'visible' }}>

              {/* Left: Hamburger menu */}
              <button
                className="hamburger-flat-btn"
                onClick={handleShow}
                title="Toggle Navigation"
                aria-label="Open menu"
                style={{ flexShrink: 0, borderRight: 'none', height: '100%', paddingLeft: '0px', paddingRight: '5px' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>

              {/* Middle: Scrollable Category links */}
              <div
                className="category-links-scroll"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: '100%',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  flexGrow: 1,
                  margin: '0',
                  minWidth: 0 // Allow container to shrink and enable horizontal scrolling
                }}
              >
                <style>{`
                  .category-links-scroll::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {navLinks.map((link, idx) => (
                  <div
                    key={link.name}
                    className="flat-nav-item"
                    style={{
                      display: 'flex',
                      height: '100%',
                      flexShrink: 0,
                      marginRight: idx === navLinks.length - 1 ? '15px' : '0px'
                    }}
                  >
                    <Link
                      to={link.path}
                      className={`flat-nav-link ${isActive(link.path) ? 'active' : ''}`}
                    >
                      {link.name}
                    </Link>
                  </div>
                ))}
              </div>

              {/* Right: Fixed Search and Bookmarks */}
              <div className="d-flex align-items-center" style={{ height: '100%', flexShrink: 0 }}>
                {/* Search Toggle Icon */}
                <div className="flat-nav-item d-flex align-items-center position-relative" style={{ height: '100%', paddingRight: '5px' }}>
                  <button
                    onClick={() => setShowSearchDrop(!showSearchDrop)}
                    className={`flat-nav-link ${showSearchDrop ? 'active' : ''}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '0 12px',
                      color: showSearchDrop ? 'var(--industrial-red)' : '#4b5563',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      outline: 'none',
                      height: '100%',
                      transition: 'color 0.2s ease'
                    }}
                    title={showSearchDrop ? "Close search" : "Search news"}
                  >
                    <i className={`bi ${showSearchDrop ? 'bi-x-lg' : 'bi-search'}`} style={{ fontSize: showSearchDrop ? '1.15rem' : '1.05rem' }}></i>
                  </button>

                  {/* Dropdown search bar */}
                  {showSearchDrop && (
                    <div
                      className="shadow-lg rounded-3 border"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        width: '320px',
                        backgroundColor: '#ffffff',
                        padding: '10px',
                        zIndex: 10000,
                        marginTop: '4px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                        borderColor: '#e5e7eb'
                      }}
                    >
                      <form onSubmit={handleSearch} className="d-flex gap-2 align-items-center">
                        <div className="input-group input-group-sm">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="bi bi-search text-muted" style={{ fontSize: '0.8rem' }}></i>
                          </span>
                          <input
                            type="text"
                            className="form-control bg-light border-start-0 text-dark"
                            placeholder="Search keywords, tags..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                            style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                          />
                        </div>
                        <button
                          type="submit"
                          className="btn btn-sm btn-danger px-2 fw-bold"
                          style={{
                            backgroundColor: 'var(--industrial-red)',
                            border: 'none',
                            fontSize: '0.75rem',
                            padding: '5px 10px'
                          }}
                        >
                          Go
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowSearchDrop(false);
                            setSearchTerm('');
                          }}
                          className="btn btn-sm btn-outline-secondary px-2 d-flex align-items-center justify-content-center"
                          style={{
                            fontSize: '0.75rem',
                            padding: '5px 10px',
                            borderColor: '#e5e7eb',
                            color: '#4b5563'
                          }}
                          title="Close search"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Bookmark Icon Link (Favorites) */}
                <div className="flat-nav-item d-flex align-items-center" style={{ height: '100%', paddingRight: '0px' }}>
                  <Link
                    to="/favorites"
                    className={`flat-nav-link ${isActive('/favorites') ? 'active' : ''}`}
                    style={{ padding: '0 15px', color: 'var(--industrial-red)' }}
                    title="Bookmarks"
                  >
                    <i className="bi bi-bookmark-fill" style={{ fontSize: '1.2rem' }}></i>
                  </Link>
                </div>
              </div>
            </nav>
          </div>
        </div>

        {/* ============================================================
          SIDEBAR OFFCANVAS — Unchanged
      ============================================================ */}
        <Offcanvas show={show} onHide={handleClose} placement="start" className="text-white border-end border-danger border-opacity-50 notranslate" style={{ width: '320px', backgroundColor: '#000000' }}>
          <Offcanvas.Header closeButton closeVariant="white" className="border-bottom border-secondary border-opacity-25 py-4">
            <Offcanvas.Title>
              <a
                href="/"
                onClick={handleClose}
              >
                <img src="/industrialtimes_white.png" alt="Industrial Times" className="sidebar-logo" />
              </a>
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
                {!location.pathname.startsWith('/podcast') && (
                  <div className="d-flex gap-2">
                    {userInfo ? (
                      <>
                        <Link to={
                          userInfo.role === 'superadmin'
                            ? "/superadmin@123/"
                            : userInfo.isManager
                              ? (userInfo.role === 'author' || userInfo.role === 'corporate' ? "/user-dashboard?adminOpen=true" : "/profile?adminOpen=true")
                              : (userInfo.role === 'author' || userInfo.role === 'corporate' ? "/user-dashboard" : "/profile")
                        } className="btn btn-danger btn-sm flex-grow-1 rounded-pill fw-bold py-2 shadow-sm text-center text-white text-decoration-none d-flex align-items-center justify-content-center" onClick={handleClose}>Dashboard</Link>
                        <Button variant="outline-light" size="sm" className="flex-grow-1 rounded-pill fw-bold py-2 border-opacity-25" onClick={handleLogout}>Logout</Button>
                      </>
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
                        className="nav-sidebar-link corporate-portal-link d-flex align-items-center gap-3 p-2 rounded-3 text-decoration-none transition-all w-100 cursor-pointer"
                        onClick={() => {
                          handleClose();
                          window.open('/corporate/choose-plan', '_blank');
                        }}
                      >
                        <div className="icon-wrapper d-flex align-items-center justify-content-center rounded-2 transition-all" style={{ width: '32px', height: '32px' }}>
                          <i className="bi bi-building-fill text-white small"></i>
                        </div>
                        <span className="fw-bold">Corporate Portal</span>
                      </div>
                    </ListGroup.Item>
                  )}

                  {/* Podcast Registration — hidden on podcast page */}
                  {!location.pathname.startsWith('/podcast') && (
                    <ListGroup.Item className="bg-transparent border-0 py-1 px-2 mb-1">
                      <div
                        className="nav-sidebar-link d-flex align-items-center gap-3 p-2 rounded-3 text-decoration-none transition-all w-100 cursor-pointer"
                        onClick={() => { handleClose(); window.open('/podcast-apply', '_blank'); }}
                      >
                        <div className="icon-wrapper d-flex align-items-center justify-content-center rounded-2 transition-all" style={{ width: '32px', height: '32px' }}>
                          <i className="bi bi-mic-fill text-white small"></i>
                        </div>
                        <span className="fw-bold">Podcast Registration</span>
                      </div>
                    </ListGroup.Item>
                  )}



                  <div className="border-bottom border-secondary border-opacity-25 my-2 mx-3"></div>

                  {/* Dynamic Category Links */}
                  {sidebarLinks.map((link, idx) => (
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
                <a href="https://www.linkedin.com/company/industrialtimes/" target="_blank" rel="noreferrer" className="text-white-50"><i className="bi bi-linkedin hover-text-red transition-all cursor-pointer"></i></a>
                <a href="https://x.com/itnindiaa" target="_blank" rel="noreferrer" className="text-white-50"><i className="bi bi-twitter-x hover-text-red transition-all cursor-pointer"></i></a>
                <a href="https://www.facebook.com/ITNIndia" target="_blank" rel="noreferrer" className="text-white-50"><i className="bi bi-facebook hover-text-red transition-all cursor-pointer"></i></a>
                <a href="https://www.instagram.com/itnindia/" target="_blank" rel="noreferrer" className="text-white-50"><i className="bi bi-instagram hover-text-red transition-all cursor-pointer"></i></a>
              </div>
              <p className="x-small mb-0 sidebar-copyright-text">&copy; {new Date().getFullYear()} Industrial Times</p>
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

      {/* MOBILE SHARE & CONNECT MODAL */}
      <Modal show={showMobileSocial} onHide={() => setShowMobileSocial(false)} centered size="sm" contentClassName="border-0 rounded-4 overflow-hidden shadow-lg">
        <Modal.Header closeButton className="border-0 bg-light pb-0">
          <Modal.Title className="fw-black text-uppercase small text-dark mt-2" style={{ letterSpacing: '1px' }}>
            <i className="bi bi-people-fill text-danger me-2"></i> Connect With Us
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex justify-content-center align-items-center p-3 bg-light">
          <MobileConnectWidget />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Navigation;
