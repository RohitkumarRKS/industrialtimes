import React, { useState, useEffect } from 'react';

const utilityStyles = `
  .social-circle-btn {
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
  }
  .social-circle-btn:hover {
    transform: translateY(-4px) scale(1.15);
    box-shadow: 0 8px 20px rgba(0,0,0,0.15) !important;
    border-color: transparent !important;
  }
  .utility-box-right {
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
  }
  .utility-box-right:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(218, 37, 29, 0.15) !important;
    border-color: rgba(218, 37, 29, 0.3) !important;
  }
`;

export const UtilityBoxLeft = () => {
  const [weather, setWeather] = useState({ temp: null, humidity: null, weatherCode: null, city: 'Detecting...', lat: null, lon: null, state: '' });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeatherAndCity = async (lat, lon, fallbackCity, detectedState) => {
      try {
        let finalCity = fallbackCity;
        let finalState = detectedState || '';
        if (!finalCity || finalCity === 'Unknown' || !finalState) {
          const reverseRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
          const reverseData = await reverseRes.json();
          finalCity = reverseData.city || reverseData.locality || reverseData.principalSubdivision || 'Unknown';
          finalState = reverseData.principalSubdivision || '';
        }

        if (finalState) sessionStorage.setItem('detectedState', finalState);
        if (finalCity && finalCity !== 'Unknown') sessionStorage.setItem('detectedCity', finalCity);
        window.dispatchEvent(new Event('locationFetched'));

        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code`);
        const weatherData = await weatherRes.json();
        
        if (weatherData?.current) {
          setWeather({ 
            temp: Math.round(weatherData.current.temperature_2m), 
            humidity: Math.round(weatherData.current.relative_humidity_2m),
            weatherCode: weatherData.current.weather_code,
            city: finalCity, lat, lon, state: finalState
          });
        } else {
          setWeather({ temp: null, humidity: null, weatherCode: null, city: finalCity, lat, lon, state: finalState });
        }
      } catch (e) {
        setWeather(prev => ({ ...prev, city: fallbackCity || 'Unknown Location' }));
      }
    };

    const fetchLocationByIP = async () => {
      try {
        const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
        const geoData = await geoRes.json();
        let city = geoData.city || geoData.region;
        let lat = geoData.latitude;
        let lon = geoData.longitude;
        let state = geoData.region || '';

        if (city === 'Chhindwara' || city === 'Madhya Pradesh' || !city) {
            city = 'Jamshedpur'; lat = 22.8046; lon = 86.2029; state = 'Jharkhand';
        }

        if (lat && lon) {
          fetchWeatherAndCity(lat, lon, city, state);
        } else {
          fetchWeatherAndCity(22.8046, 86.2029, 'Jamshedpur', 'Jharkhand');
        }
      } catch (e) {
        fetchWeatherAndCity(22.8046, 86.2029, 'Jamshedpur', 'Jharkhand');
      }
    };

    fetchLocationByIP();

    const safetyTimer = setTimeout(() => {
      setWeather(prev => {
        if (prev.city === 'Detecting...') {
          sessionStorage.setItem('detectedState', 'Jharkhand');
          sessionStorage.setItem('detectedCity', 'Jamshedpur');
          window.dispatchEvent(new Event('locationFetched'));
          return { temp: null, humidity: null, weatherCode: null, city: 'Jamshedpur', lat: 22.8046, lon: 86.2029, state: 'Jharkhand' };
        }
        return prev;
      });
    }, 8000);

    return () => clearTimeout(safetyTimer);
  }, []);

  const formatDate = (date) => date.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const formatTime = (date) => date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();

  const isDayTime = currentTime.getHours() >= 6 && currentTime.getHours() < 19;
  
  const getThemeByWeather = (code, isDay) => {
    if (code === null) return { bg: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', text: 'text-dark', icon: isDay ? 'bi-cloud-sun-fill' : 'bi-moon-stars-fill', iconColor: isDay ? '#FDB813' : '#6b7280' };
    if (code === 0) return isDay ? { bg: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', text: 'text-dark', icon: 'bi-sun-fill', iconColor: '#ff9800' } : { bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', text: 'text-dark', icon: 'bi-moon-stars-fill', iconColor: '#303f9f' };
    if (code <= 3) return { bg: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)', text: 'text-dark', icon: 'bi-clouds-fill', iconColor: '#78909c' };
    if (code === 45 || code === 48) return { bg: 'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)', text: 'text-dark', icon: 'bi-cloud-haze2-fill', iconColor: '#9e9e9e' };
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { bg: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', text: 'text-dark', icon: 'bi-cloud-rain-heavy-fill', iconColor: '#1976d2' };
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return { bg: 'linear-gradient(135deg, #e6e9f0 0%, #eef1f5 100%)', text: 'text-dark', icon: 'bi-snow', iconColor: '#00bcd4' };
    if (code >= 95) return { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: 'text-white', icon: 'bi-cloud-lightning-rain-fill', iconColor: '#ffeb3b' };
    return { bg: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', text: 'text-dark', icon: isDay ? 'bi-cloud-sun-fill' : 'bi-moon-stars-fill', iconColor: isDay ? '#FDB813' : '#6b7280' };
  };

  const theme = getThemeByWeather(weather.weatherCode, isDayTime);

  return (
    <>
    <style>{utilityStyles}</style>
    <a href={`https://www.google.com/search?q=weather+in+${weather.city}`} target="_blank" rel="noreferrer" className={`utility-box-left rounded-4 px-3 py-2 shadow-sm d-flex align-items-center position-relative overflow-hidden text-decoration-none transition-all hover-lift ${theme.text}`} style={{ minWidth: '260px', maxWidth: '280px', height: '90px', background: theme.bg }}>
      <div className="position-absolute top-0 start-0 w-100 h-100 opacity-25" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 100%)', zIndex: 0 }}></div>
      <div className="position-relative z-index-1 w-100 d-flex justify-content-between align-items-center">
        
        {/* Left: Icon & Temp */}
        <div className="d-flex align-items-center">
          <i className={`bi ${theme.icon} display-5 me-2 pulse-animation`} style={{ color: theme.iconColor }}></i>
          <div className="fw-bold lh-1" style={{ fontSize: '2rem' }}>{weather.temp !== null ? weather.temp : '--'}°</div>
        </div>

        {/* Right: Info */}
        <div className="d-flex flex-column text-end ps-2">
          <div className="fw-bold" style={{ fontSize: '0.85rem' }}><i className="bi bi-geo-alt-fill text-danger me-1"></i><span className={theme.text}>{weather.city}</span></div>
          <div className="lh-1 mt-1 mb-1 opacity-75 fw-bold" style={{ fontSize: '0.7rem' }}>{formatDate(currentTime).split(',')[0]}, {formatTime(currentTime)}</div>
          <div className="lh-1 fw-bold opacity-75" style={{ fontSize: '0.7rem' }}>Hum: {weather.humidity || '--'}% | Wind: 8km/h</div>
        </div>

      </div>
    </a>
    </>
  );
};

export const UtilityBoxRight = () => {
  return (
    <>
    <style>{utilityStyles}</style>
    <div className="utility-box-right rounded-4 px-3 py-2 shadow-sm border border-secondary border-opacity-25 d-flex flex-column justify-content-center position-relative overflow-hidden" style={{ minWidth: '260px', maxWidth: '280px', height: '90px', background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)' }}>
      <div className="position-absolute top-0 start-0 w-100 h-100 opacity-50" style={{ background: 'linear-gradient(225deg, rgba(255,255,255,0.8) 0%, transparent 100%)', zIndex: 0 }}></div>
      <div className="position-relative z-index-1 w-100">
        <div className="d-flex align-items-center justify-content-center mb-2">
           <h6 className="fw-black text-uppercase mb-0 text-dark" style={{ letterSpacing: '1px', fontSize: '0.75rem', opacity: 0.8 }}>Let's Connect With Us</h6>
        </div>
        <div className="d-flex justify-content-between align-items-center px-1">
          <a href="https://facebook.com/IndustrialTimes" target="_blank" rel="noreferrer" className="text-decoration-none">
            <div className="social-circle-btn bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm border border-light" style={{ width: '34px', height: '34px', color: '#1877F2' }}>
              <i className="bi bi-facebook fs-6"></i>
            </div>
          </a>
          <a href="https://twitter.com/IndustrialTimes" target="_blank" rel="noreferrer" className="text-decoration-none">
            <div className="social-circle-btn bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm border border-light" style={{ width: '34px', height: '34px', color: '#000000' }}>
              <i className="bi bi-twitter-x fs-6"></i>
            </div>
          </a>
          <a href="https://instagram.com/IndustrialTimes" target="_blank" rel="noreferrer" className="text-decoration-none">
            <div className="social-circle-btn bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm border border-light" style={{ width: '34px', height: '34px' }}>
              <i className="bi bi-instagram fs-6" style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}></i>
            </div>
          </a>
          <a href="https://linkedin.com/company/IndustrialTimes" target="_blank" rel="noreferrer" className="text-decoration-none">
            <div className="social-circle-btn bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm border border-light" style={{ width: '34px', height: '34px', color: '#0077B5' }}>
              <i className="bi bi-linkedin fs-6"></i>
            </div>
          </a>
          <a href="https://youtube.com/IndustrialTimes" target="_blank" rel="noreferrer" className="text-decoration-none">
            <div className="social-circle-btn bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm border border-light" style={{ width: '34px', height: '34px', color: '#FF0000' }}>
              <i className="bi bi-youtube fs-6"></i>
            </div>
          </a>
        </div>
      </div>
    </div>
    </>
  );
};
