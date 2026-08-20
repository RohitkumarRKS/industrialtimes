import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import API_BASE from '../config/api';

const formatWebinarDateRange = (startStr, endStr, scheduleStr) => {
  if (!startStr) return '';
  const start = new Date(startStr);
  const optionsDate = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
  const optionsTime = { hour: '2-digit', minute: '2-digit' };
  
  let sched = [];
  if (scheduleStr) {
    try {
      sched = typeof scheduleStr === 'string' ? JSON.parse(scheduleStr) : scheduleStr;
    } catch (e) {}
  }

  const dateStr = start.toLocaleDateString('en-IN', optionsDate);
  const timeStr = start.toLocaleTimeString('en-IN', optionsTime);

  if (Array.isArray(sched) && sched.length > 0) {
    if (sched.length === 1) {
      return `${dateStr} (${sched[0].duration} mins)`;
    } else {
      const totalDur = sched.reduce((acc, curr) => acc + (parseInt(curr.duration) || 0), 0);
      return `${dateStr} (${sched.length} Days • Total ${totalDur} mins)`;
    }
  }
  
  if (!endStr) {
    return `${dateStr} at ${timeStr}`;
  }
  
  const end = new Date(endStr);
  if (start.toDateString() === end.toDateString()) {
    return `${dateStr} (${timeStr} - ${end.toLocaleTimeString('en-IN', optionsTime)})`;
  } else {
    return `${dateStr} ${timeStr} - ${end.toLocaleDateString('en-IN', optionsDate)} ${end.toLocaleTimeString('en-IN', optionsTime)}`;
  }
};

const WebinarDetail = () => {
  const { id } = useParams();
  const [webinar, setWebinar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gstRate, setGstRate] = useState(18);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef(null);
  const detailsRef = useRef(null);

  const scrollToDetails = () => {
    if (detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchWebinarDetails = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/webinars/${id}`);
        setWebinar(data);
      } catch (err) {
        console.error('Error fetching webinar detail:', err);
        setError('Webinar not found or server error.');
      } finally {
        setLoading(false);
      }
    };

    const fetchGst = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/platform-settings/public`);
        if (data && data.webinarGstRate !== undefined) {
          setGstRate(data.webinarGstRate);
        }
      } catch (err) {
        console.error('Failed to load GST rate:', err);
      }
    };

    fetchWebinarDetails();
    fetchGst();
  }, [id]);

  const parseVideoUrl = (url) => {
    if (!url) return { type: null, url: '' };
    const trimmed = url.trim();
    
    // YouTube regex pattern
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = trimmed.match(ytRegex);
    if (ytMatch && ytMatch[1]) {
      return {
        type: 'youtube',
        url: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0&modestbranding=1&iv_load_policy=3&playlist=${ytMatch[1]}`
      };
    }
    
    // Vimeo regex pattern
    const vimeoRegex = /(?:vimeo\.com\/)(?:channels\/[^\/]+\/|groups\/[^\/]+\/|album\/[^\/]+\/video\/|video\/|showcase\/[^\/]+\/video\/)?([0-9]+)/;
    const vimeoMatch = trimmed.match(vimeoRegex);
    if (vimeoMatch && vimeoMatch[1]) {
      return {
        type: 'vimeo',
        url: `https://player.vimeo.com/video/${vimeoMatch[1]}`
      };
    }
    
    // Direct/Uploaded Video
    const fullUrl = trimmed.startsWith('http') ? trimmed : `${API_BASE}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
    return {
      type: 'direct',
      url: fullUrl
    };
  };

  const handleVideoHoverEnter = () => {
    if (videoRef.current && !isVideoPlaying) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleVideoHoverLeave = () => {
    if (videoRef.current && !isVideoPlaying) {
      videoRef.current.pause();
    }
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        videoRef.current.muted = false;
        videoRef.current.play().catch(() => {});
        setIsVideoPlaying(true);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#070913', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
        <Spinner animation="border" variant="danger" />
        <p className="mt-3" style={{ color: '#cbd5e1' }}>Loading webinar landing page...</p>
      </div>
    );
  }

  if (error || !webinar) {
    return (
      <div style={{ minHeight: '100vh', background: '#070913', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ffffff', padding: '20px' }}>
        <Container className="text-center" style={{ maxWidth: '600px' }}>
          <Alert variant="danger">{error || 'Webinar details could not be loaded.'}</Alert>
          <Link to="/webinars" className="btn btn-danger rounded-pill fw-bold mt-3" style={{ backgroundColor: '#da251d', border: 'none' }}>Back to Webinars</Link>
        </Container>
      </div>
    );
  }

  const isPast = new Date(webinar.dateTime) < new Date();
  const hasVideo = webinar.videoUrl && webinar.videoUrl.trim() !== '';
  const parsedVideo = parseVideoUrl(webinar.videoUrl);

  return (
    <>
      <Helmet>
        <title>{webinar.title} | Webinar | Industrial Times</title>
        <meta name="description" content={webinar.description ? webinar.description.substring(0, 160) : 'Join our webinar.'} />
      </Helmet>

      <div className="webinar-landing-page">
        {/* Decorative background accents */}
        <div className="landing-accent-1"></div>
        <div className="landing-accent-2"></div>

        {/* Hero Section */}
        <div className="landing-hero-section">
          <Container style={{ position: 'relative', zIndex: 2 }}>
            <nav aria-label="breadcrumb" className="mb-4">
              <ol className="breadcrumb" style={{ background: 'transparent', marginBottom: 0, padding: 0 }}>
                <li className="breadcrumb-item"><Link to="/" className="text-decoration-none" style={{ color: '#da251d', fontWeight: 600 }}>Home</Link></li>
                <li className="breadcrumb-item"><Link to="/webinars" className="text-decoration-none" style={{ color: '#da251d', fontWeight: 600 }}>Webinars</Link></li>
                <li className="breadcrumb-item active" aria-current="page" style={{ color: '#9ca3af' }}>{webinar.title}</li>
              </ol>
            </nav>

            <Row className="align-items-center g-5">
              <Col lg={hasVideo ? 6 : 8}>
                <div className="mb-4 d-flex flex-wrap gap-2 align-items-center">
                  {webinar.isRecordedVideo ? (
                    <span className="landing-badge landing-badge-secondary">
                      <i className="bi bi-film me-1"></i> Recorded Session
                    </span>
                  ) : isPast ? (
                    <span className="landing-badge landing-badge-secondary">
                      <i className="bi bi-clock-history me-1"></i> Past Event
                    </span>
                  ) : (
                    <span className="landing-badge landing-badge-live">
                      <span className="live-dot"></span> Live Registration Open
                    </span>
                  )}
                  <span className="landing-date-tag">
                    <i className="bi bi-calendar-event-fill me-1"></i>
                    {formatWebinarDateRange(webinar.dateTime, webinar.dateTimeEnd, webinar.schedule)}
                  </span>
                </div>

                <h1 className="landing-title">{webinar.title}</h1>

                {webinar.speaker && (
                  <div className="landing-speaker-card">
                    <div className="speaker-avatar">
                      <i className="bi bi-person-fill"></i>
                    </div>
                    <div>
                      <span className="speaker-label">Presented By</span>
                      <span className="speaker-name">{webinar.speaker}</span>
                    </div>
                  </div>
                )}

                {!isPast && webinar.isActive && !webinar.isRecordedVideo && (
                  <div className="mt-4">
                    <Link
                      to={`/webinar/${webinar.id}/register`}
                      target="_blank"
                      className="landing-cta-btn"
                    >
                      <i className="bi bi-person-plus-fill me-2"></i> Register Now
                    </Link>
                  </div>
                )}

                {webinar.whatsAppGroupLink && webinar.whatsAppGroupLink.trim() !== '' && (
                  <div className="mt-3">
                    <a
                      href={webinar.whatsAppGroupLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="landing-whatsapp-btn"
                    >
                      <i className="bi bi-whatsapp me-2"></i> Join WhatsApp Community
                    </a>
                  </div>
                )}
              </Col>

              {/* Video Section in Hero */}
              {hasVideo && (
                <Col lg={6}>
                  <div className="landing-video-container">
                    {parsedVideo.type === 'direct' ? (
                      <div
                        className="ratio ratio-16x9 uploaded-video-wrapper"
                        onMouseEnter={handleVideoHoverEnter}
                        onMouseLeave={handleVideoHoverLeave}
                        onClick={handleVideoClick}
                        style={{ cursor: 'pointer', backgroundColor: '#000000' }}
                      >
                        <video
                          ref={videoRef}
                          src={parsedVideo.url}
                          controls={isVideoPlaying}
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          className="landing-video"
                          style={{ objectFit: 'contain' }}
                        />
                        {!isVideoPlaying && (
                          <div className="video-play-overlay" style={{ zIndex: 2 }}>
                            <div className="play-btn-circle">
                              <i className="bi bi-play-fill"></i>
                            </div>
                            <span className="play-label">Hover to preview • Click to play</span>
                          </div>
                        )}
                      </div>
                    ) : (parsedVideo.type === 'youtube' || parsedVideo.type === 'vimeo') && parsedVideo.url ? (
                      <div className="ratio ratio-16x9" style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.08)' }}>
                        <iframe
                          src={parsedVideo.url}
                          title={webinar.title}
                          allowFullScreen
                          style={{ border: 'none', width: '100%', height: '100%' }}
                        ></iframe>
                      </div>
                    ) : null}
                  </div>
                </Col>
              )}
            </Row>
          </Container>
          
          {/* Bouncing Scroll Down Indicator */}
          <div className="scroll-down-indicator" onClick={scrollToDetails}>
            <span className="scroll-text">Scroll Down to Discover</span>
            <i className="bi bi-chevron-double-down scroll-arrow"></i>
          </div>
        </div>

        {/* Info Cards Section */}
        <div className="landing-info-section" ref={detailsRef}>
          <Container>
            <Row className="g-4 justify-content-center">
              <Col xs={6} md={3}>
                <div className="info-card">
                  <i className="bi bi-clock-fill info-card-icon"></i>
                  <span className="info-card-label">Duration</span>
                  <span className="info-card-value">
                    {(() => {
                      let sched = [];
                      if (webinar.schedule) {
                        try {
                          sched = typeof webinar.schedule === 'string' ? JSON.parse(webinar.schedule) : webinar.schedule;
                        } catch (e) {}
                      }
                      if (Array.isArray(sched) && sched.length > 0) {
                        const total = sched.reduce((acc, curr) => acc + (parseInt(curr.duration) || 0), 0);
                        return `${total} mins`;
                      }
                      return '45 mins';
                    })()}
                  </span>
                </div>
              </Col>
              <Col xs={6} md={3}>
                <div className="info-card">
                  <i className={`bi ${isPast ? 'bi-check-circle-fill' : 'bi-broadcast'} info-card-icon`}></i>
                  <span className="info-card-label">Status</span>
                  <span className={`info-card-value ${isPast ? '' : 'text-live'}`}>
                    {isPast ? 'Completed' : 'Upcoming'}
                  </span>
                </div>
              </Col>
              <Col xs={6} md={3}>
                <div className="info-card">
                  <i className="bi bi-currency-rupee info-card-icon"></i>
                  <span className="info-card-label">Entry Fee</span>
                  <span className="info-card-value">
                    {webinar.isPaymentEnabled ? `₹${webinar.entryFee || 99} + GST` : 'Free'}
                  </span>
                </div>
              </Col>
              <Col xs={6} md={3}>
                <div className="info-card">
                  <i className="bi bi-laptop info-card-icon"></i>
                  <span className="info-card-label">Platform</span>
                  <span className="info-card-value">Online Link</span>
                </div>
              </Col>
            </Row>
          </Container>
        </div>

        {/* Description Section */}
        <div className="landing-description-section">
          <Container>
            <Row className="justify-content-center">
              <Col lg={8}>
                <div className="description-card">
                  <h2 className="description-heading">
                    <i className="bi bi-file-text me-2" style={{ color: '#da251d' }}></i>
                    About This Webinar
                  </h2>
                  <div className="description-text">
                    {webinar.description || 'No description available.'}
                  </div>
                </div>

                {(() => {
                  let sched = [];
                  if (webinar.schedule) {
                    try {
                      sched = typeof webinar.schedule === 'string' ? JSON.parse(webinar.schedule) : webinar.schedule;
                    } catch (e) {}
                  }
                  if (Array.isArray(sched) && sched.length > 0) {
                    return (
                      <div className="description-card mt-4">
                        <h2 className="description-heading">
                          <i className="bi bi-calendar3 me-2" style={{ color: '#da251d' }}></i>
                          Webinar Schedule
                        </h2>
                        <div className="d-flex flex-column gap-3 mt-3">
                          {sched.map((day, idx) => {
                            let formattedTime = day.startTime;
                            try {
                              const [hour, minute] = day.startTime.split(':');
                              const dateObj = new Date();
                              dateObj.setHours(parseInt(hour), parseInt(minute));
                              formattedTime = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                            } catch (err) {}

                            return (
                              <div key={idx} className="p-3 rounded-3 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}>
                                <div className="d-flex align-items-center gap-3">
                                  <div className="d-flex align-items-center justify-content-center fw-bold rounded-circle text-white" style={{ width: '40px', height: '40px', backgroundColor: '#da251d', fontSize: '0.9rem', flexShrink: 0 }}>
                                    D{day.dayNumber}
                                  </div>
                                  <div>
                                    <span className="d-block fw-bold" style={{ color: '#ffffff' }}>
                                      {new Date(`${day.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                    <span className="small" style={{ color: '#cbd5e1' }}>
                                      <i className="bi bi-clock me-1 text-danger"></i> Starts at {formattedTime} IST
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-2 mt-sm-0 text-sm-end">
                                  <span className="badge bg-danger px-3 py-2 rounded-pill fw-bold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                                    {day.duration} Minutes
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {!isPast && (
                  <div className="text-center mt-5 pb-4">
                    <Link
                      to={`/webinar/${webinar.id}/register`}
                      target="_blank"
                      className="landing-cta-btn landing-cta-btn-lg"
                    >
                      <i className="bi bi-person-plus-fill me-2"></i> Click Here to Register
                    </Link>
                    <p className="mt-3" style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
                      <i className="bi bi-shield-lock-fill me-1"></i> Secure registration • Instant confirmation
                    </p>
                  </div>
                )}
              </Col>
            </Row>
          </Container>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .webinar-landing-page {
          min-height: 100vh;
          background: #070913;
          color: #ffffff;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .landing-accent-1 {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: rgba(218, 37, 29, 0.08);
          filter: blur(120px);
          top: -200px;
          left: -150px;
          pointer-events: none;
        }

        .landing-accent-2 {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: rgba(218, 37, 29, 0.04);
          filter: blur(100px);
          bottom: -100px;
          right: -100px;
          pointer-events: none;
        }

        /* Hero Section */
        .landing-hero-section {
          min-height: calc(100vh - 110px);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 40px 0 100px;
          background: linear-gradient(180deg, #070913 0%, #0b0f19 100%);
        }

        .landing-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          border-radius: 30px;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .landing-badge-live {
          background: rgba(218, 37, 29, 0.08);
          color: #da251d;
          border: 1px solid rgba(218, 37, 29, 0.2);
        }

        .landing-badge-secondary {
          background: #1e293b;
          color: #cbd5e1;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #da251d;
          animation: livePulse 1.5s ease-in-out infinite;
        }

        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        .landing-date-tag {
          font-size: 0.82rem;
          font-weight: 600;
          color: #94a3b8;
        }

        .landing-title {
          font-size: 2.8rem;
          font-weight: 900;
          line-height: 1.15;
          color: #ffffff;
          letter-spacing: -1px;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .landing-title {
            font-size: 1.8rem;
            letter-spacing: -0.5px;
          }
        }

        /* Speaker Card */
        .landing-speaker-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-left: 4px solid #da251d;
          border-radius: 12px;
          max-width: 400px;
        }

        .speaker-avatar {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #da251d;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 1.3rem;
          flex-shrink: 0;
        }

        .speaker-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
        }

        .speaker-name {
          display: block;
          font-size: 1.1rem;
          font-weight: 800;
          color: #ffffff;
        }

        /* CTA Button */
        .landing-cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 36px;
          background: #da251d;
          color: #fff;
          border: none;
          border-radius: 50px;
          font-size: 1rem;
          font-weight: 800;
          text-transform: uppercase;
          text-decoration: none;
          letter-spacing: 0.5px;
          transition: all 0.3s ease;
          box-shadow: 0 6px 24px rgba(218, 37, 29, 0.2);
        }

        .landing-cta-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 36px rgba(218, 37, 29, 0.4);
          filter: brightness(1.08);
          color: #fff;
        }

        .landing-cta-btn-lg {
          padding: 18px 48px;
          font-size: 1.1rem;
        }

        /* Video Section */
        .landing-video-container {
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
          background: #1e293b;
        }

        .uploaded-video-wrapper {
          position: relative;
          cursor: pointer;
          border-radius: 16px;
          overflow: hidden;
        }

        .landing-video {
          width: 100%;
          height: 100%;
          display: block;
          border-radius: 16px;
          object-fit: contain;
          background: #000;
        }

        .video-play-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.6) 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: opacity 0.3s ease;
        }

        .play-btn-circle {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: rgba(255,255,255,0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 30px rgba(0,0,0,0.3);
          transition: transform 0.3s ease;
        }

        .uploaded-video-wrapper:hover .play-btn-circle {
          transform: scale(1.08);
        }

        .play-btn-circle i {
          font-size: 1.8rem;
          color: #da251d;
          margin-left: 4px;
        }

        .play-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: rgba(255,255,255,0.9);
          text-shadow: 0 1px 3px rgba(0,0,0,0.5);
        }

        /* Info Cards Section */
        .landing-info-section {
          padding: 50px 0;
          background: #0b0f19;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .info-card {
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 24px 20px;
          text-align: center;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }

        .info-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(218, 37, 29, 0.1);
        }

        .info-card-icon {
          display: block;
          font-size: 1.4rem;
          color: #da251d;
          margin-bottom: 8px;
        }

        .info-card-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          margin-bottom: 6px;
        }

        .info-card-value {
          display: block;
          font-size: 1.15rem;
          font-weight: 800;
          color: #ffffff;
        }

        .text-live {
          color: #da251d !important;
        }

        /* Description Section */
        .landing-description-section {
          padding: 60px 0 80px;
          background: #070913;
        }

        .description-card {
          background: rgba(30, 41, 59, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 40px;
        }

        .description-heading {
          font-size: 1.5rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid rgba(255, 255, 255, 0.06);
        }

        .description-text {
          font-size: 1.05rem;
          line-height: 1.8;
          color: #cbd5e1;
          white-space: pre-wrap;
        }

        /* Breadcrumb Override */
        .breadcrumb {
          font-size: 0.82rem;
        }

        .breadcrumb-item + .breadcrumb-item::before {
          color: #475569;
        }

        /* Scroll Down Indicator */
        .scroll-down-indicator {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          z-index: 10;
          opacity: 0.8;
          transition: opacity 0.3s ease;
        }

        .scroll-down-indicator:hover {
          opacity: 1;
        }

        .scroll-text {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #94a3b8;
        }

        .scroll-arrow {
          font-size: 1.2rem;
          color: #da251d;
          animation: bounceArrow 2s infinite;
        }

        @keyframes bounceArrow {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-8px);
          }
          60% {
            transform: translateY(-4px);
          }
        }

        .landing-whatsapp-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 36px;
          background: #25d366;
          color: #fff;
          border: none;
          border-radius: 50px;
          font-size: 1rem;
          font-weight: 800;
          text-transform: uppercase;
          text-decoration: none;
          letter-spacing: 0.5px;
          transition: all 0.3s ease;
          box-shadow: 0 6px 24px rgba(37, 211, 102, 0.2);
        }

        .landing-whatsapp-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 36px rgba(37, 211, 102, 0.4);
          filter: brightness(1.08);
          color: #fff;
        }
      `}} />
    </>
  );
};

export default WebinarDetail;
