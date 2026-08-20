import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import API_BASE from '../config/api';

const HoverVideo = ({ src, title }) => {
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      className="hover-video-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0', cursor: 'pointer' }}
    >
      <video
        ref={videoRef}
        src={src.startsWith('http') ? src : `${API_BASE}${src}`}
        muted
        loop
        playsInline
        preload="metadata"
        style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
      />
      {!isHovered && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.5) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'opacity 0.3s ease'
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)', transition: 'transform 0.3s ease'
          }}>
            <i className="bi bi-play-fill" style={{ fontSize: '1.6rem', color: '#da251d', marginLeft: '3px' }}></i>
          </div>
        </div>
      )}
    </div>
  );
};

const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const formatWebinarDateRange = (startStr, endStr, scheduleStr) => {
  if (!startStr) return '';
  const start = new Date(startStr);
  const optionsDate = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
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
      const durList = sched.map(d => `Day ${d.dayNumber}: ${d.duration} mins`).join(', ');
      return `${dateStr} (${durList})`;
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

const WebinarsPage = () => {
  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWebinars = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/webinars`);
        setWebinars(data || []);
      } catch (err) {
        console.error('Error fetching webinars:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWebinars();
  }, []);

  const now = new Date();
  const upcomingWebinars = webinars.filter(w => w.isActive && !w.isRecordedVideo && new Date(w.dateTime) >= now);
  const pastWebinars = webinars.filter(w => !w.isActive || w.isRecordedVideo || new Date(w.dateTime) < now);

  const parseVideoUrl = (url) => {
    if (!url) return { type: null, url: '' };
    const trimmed = url.trim();
    
    // YouTube regex pattern
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = trimmed.match(ytRegex);
    if (ytMatch && ytMatch[1]) {
      return {
        type: 'youtube',
        url: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1&iv_load_policy=3&playlist=${ytMatch[1]}`
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

  return (
    <>
      <Helmet>
        <title>Webinars | Industrial Times</title>
        <meta name="description" content="Join our premium industrial webinars, startups sessions, and live interactive conferences with industrial leaders." />
      </Helmet>

      {/* Header Banner - Brand-Aligned Dark Theme */}
      <div style={{
        background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
        color: '#ffffff',
        padding: '70px 0 60px',
        borderBottom: '3px solid #da251d',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative accent */}
        <div style={{
          position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px',
          borderRadius: '50%', background: 'rgba(218, 37, 29, 0.08)', filter: 'blur(80px)', pointerEvents: 'none'
        }} />
        <Container className="text-center" style={{ position: 'relative', zIndex: 2 }}>
          <Badge
            className="mb-3 px-3 py-2 text-uppercase fw-bold"
            style={{ fontSize: '0.72rem', letterSpacing: '1.5px', background: '#da251d', color: '#fff', border: 'none' }}
          >
            <i className="bi bi-broadcast me-1"></i> Interactive Learning
          </Badge>
          <h1 className="fw-black mb-3" style={{ letterSpacing: '-0.5px', fontSize: '2.6rem', color: '#ffffff', fontWeight: '900' }}>
            Industrial Times Webinars
          </h1>
          <p className="mx-auto" style={{ maxWidth: '620px', fontSize: '1.05rem', lineHeight: '1.7', color: '#cbd5e1' }}>
            Gain direct insights from industry experts, startup innovators, and technology leaders. Register for upcoming live events or watch archived recorded sessions.
          </p>
        </Container>
      </div>

      <div style={{ background: '#0b0f19', minHeight: '60vh' }}>
        <Container className="py-5">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="danger" />
              <p className="mt-3" style={{ color: '#9ca3af' }}>Loading webinars...</p>
            </div>
          ) : (
            <>
              {/* Upcoming Webinars Section */}
              <div className="mb-5">
                <h2 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: '#ffffff', borderBottom: '3px solid #da251d', paddingBottom: '12px', fontSize: '1.5rem' }}>
                  <i className="bi bi-broadcast" style={{ color: '#da251d' }}></i> Upcoming Live Webinars
                </h2>
                
                {upcomingWebinars.length === 0 ? (
                  <div className="text-center py-5 rounded-4" style={{ background: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <i className="bi bi-calendar-x fs-1 mb-3 d-block" style={{ color: '#475569' }}></i>
                    <h5 className="fw-bold" style={{ color: '#cbd5e1' }}>No Upcoming Webinars Scheduled</h5>
                    <p className="mb-0" style={{ color: '#94a3b8' }}>Check back later or register interest with our support desk.</p>
                  </div>
                ) : (
                  <Row className="g-4">
                    {upcomingWebinars.map(webinar => (
                      <Col key={webinar.id} xs={12} md={6} lg={4}>
                        <Card className="h-100 border-0 rounded-4 overflow-hidden position-relative" style={{
                          background: 'rgba(30, 41, 59, 0.4)', boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                          transition: 'all 0.3s ease', border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(218, 37, 29, 0.15)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.2)'; }}
                        >
                          <div style={{ height: '5px', background: '#da251d' }} />
                           <Card.Body className="p-4 d-flex flex-column">
                            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
                              <Badge style={{ fontSize: '0.65rem', fontWeight: '800', background: '#da251d', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '6px' }}>
                                LIVE UPCOMING
                              </Badge>
                              <span className="small fw-bold" style={{ color: '#9ca3af' }}>
                                <i className="bi bi-calendar3 me-1"></i>
                                {formatWebinarDateRange(webinar.dateTime, webinar.dateTimeEnd, webinar.schedule)}
                              </span>
                            </div>
                            
                            <Card.Title className="fw-bold mb-2 lh-base" style={{ fontSize: '1.15rem', color: '#ffffff' }}>
                              <Link to={`/webinar/${slugify(webinar.title)}`} target="_blank" className="text-decoration-none" style={{ color: '#ffffff', transition: 'color 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#da251d'}
                                onMouseLeave={e => e.currentTarget.style.color = '#ffffff'}
                              >
                                {webinar.title}
                              </Link>
                            </Card.Title>
                            
                            {webinar.speaker && (
                              <div className="d-flex align-items-center mb-3 mt-2">
                                <i className="bi bi-person-badge-fill me-2" style={{ fontSize: '1.1rem', color: '#da251d' }}></i>
                                <span className="fw-bold small" style={{ color: '#cbd5e1' }}>{webinar.speaker}</span>
                              </div>
                            )}

                            <Card.Text className="small mb-4 flex-grow-1" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.7', color: '#cbd5e1' }}>
                              {webinar.description || 'No description provided.'}
                            </Card.Text>

                            <div className="d-flex align-items-center justify-content-between mt-auto pt-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                              <span className="fw-bold small" style={{ color: '#cbd5e1' }}>
                                <i className="bi bi-clock me-1" style={{ color: '#da251d' }}></i>
                                {(() => {
                                  let sched = [];
                                  if (webinar.schedule) {
                                    try {
                                      sched = typeof webinar.schedule === 'string' ? JSON.parse(webinar.schedule) : webinar.schedule;
                                    } catch (e) {}
                                  }
                                  if (Array.isArray(sched) && sched.length > 0) {
                                    return sched.map(d => `Day ${d.dayNumber}: ${d.duration}m`).join(' | ');
                                  }
                                  return new Date(webinar.dateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                                })()}
                              </span>
                              <Link to={`/webinar/${slugify(webinar.title)}`} target="_blank"
                                className="btn btn-sm px-3 py-1 rounded-pill fw-bold text-uppercase text-white text-decoration-none"
                                style={{ fontSize: '0.7rem', backgroundColor: '#da251d', border: 'none', transition: 'all 0.2s ease' }}
                                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; }}
                              >
                                Register Now
                              </Link>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </div>

              {/* Past Recorded Webinars Section */}
              <div>
                <h2 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: '#ffffff', borderBottom: '3px solid #475569', paddingBottom: '12px', fontSize: '1.5rem' }}>
                  <i className="bi bi-collection-play-fill" style={{ color: '#9ca3af' }}></i> Past Webinars & Recorded Videos
                </h2>

                {pastWebinars.length === 0 ? (
                  <div className="text-center py-5 rounded-4" style={{ background: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <p className="mb-0" style={{ color: '#cbd5e1' }}>No past recorded webinars available at this time.</p>
                  </div>
                ) : (
                  <Row className="g-4">
                    {pastWebinars.map(webinar => {
                      const parsed = parseVideoUrl(webinar.videoUrl);

                      return (
                        <Col key={webinar.id} xs={12} md={6}>
                          <Card className="h-100 border-0 rounded-4 overflow-hidden" style={{
                            background: 'rgba(30, 41, 59, 0.4)', boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                            transition: 'all 0.3s ease', border: '1px solid rgba(255, 255, 255, 0.05)'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(218, 37, 29, 0.15)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.2)'; }}
                          >
                            {parsed.type === 'direct' ? (
                              <HoverVideo src={parsed.url} title={webinar.title} />
                            ) : (parsed.type === 'youtube' || parsed.type === 'vimeo') && parsed.url ? (
                              <div className="ratio ratio-16x9">
                                <iframe
                                  src={parsed.url}
                                  title={webinar.title}
                                  allowFullScreen
                                  style={{ border: 'none', borderRadius: '16px 16px 0 0', width: '100%', height: '100%' }}
                                ></iframe>
                              </div>
                            ) : (
                              <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '220px', background: '#1e293b', borderRadius: '16px 16px 0 0' }}>
                                <i className="bi bi-play-circle-fill fs-1 mb-2" style={{ color: '#475569' }}></i>
                                <span className="small" style={{ color: '#cbd5e1' }}>Recording processing/unavailable</span>
                              </div>
                            )}
                            <Card.Body className="p-4">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <Badge style={{ fontSize: '0.6rem', background: '#475569', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px' }}>ARCHIVED</Badge>
                                <span className="small" style={{ color: '#9ca3af' }}><i className="bi bi-calendar3 me-1"></i> {formatWebinarDateRange(webinar.dateTime, webinar.dateTimeEnd, webinar.schedule)}</span>
                              </div>
                              <Card.Title className="fw-bold mb-2" style={{ fontSize: '1.1rem', color: '#ffffff' }}>
                                {webinar.title}
                              </Card.Title>
                              {webinar.speaker && (
                                <p className="small fw-bold mb-2" style={{ color: '#cbd5e1' }}>Speaker: {webinar.speaker}</p>
                              )}
                              <Card.Text className="small mb-0" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: '#cbd5e1' }}>
                                {webinar.description}
                              </Card.Text>
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                )}
              </div>
            </>
          )}
        </Container>
      </div>
    </>
  );
};

export default WebinarsPage;
