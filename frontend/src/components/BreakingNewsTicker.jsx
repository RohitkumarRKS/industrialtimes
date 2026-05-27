import React, { useState, useEffect, useRef } from 'react';
import API_BASE from '../config/api';

const BreakingNewsTicker = () => {
  const [headlines, setHeadlines] = useState([]);
  const [speed, setSpeed] = useState(35);
  const [isHovered, setIsHovered] = useState(false);
  const tickerRef = useRef(null);

  useEffect(() => {
    const fetchBreakingNews = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/settings/breaking-news`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setHeadlines(data);
        }
        
        const seoRes = await fetch(`${API_BASE}/api/settings/seo`);
        const seoData = await seoRes.json();
        if (seoData && seoData.breakingNewsSpeed) {
          setSpeed(seoData.breakingNewsSpeed);
        }
      } catch (err) {
        console.error('Failed to fetch breaking news:', err);
      }
    };

    fetchBreakingNews();
    // Refresh every 30 seconds for live updates
    const interval = setInterval(fetchBreakingNews, 30000);
    return () => clearInterval(interval);
  }, []);

  if (headlines.length === 0) return null;

  // Build the ticker text: join all headlines with a separator
  const tickerText = headlines.map(h => h.text).join('    \u25CF    ');
  // Duplicate for seamless loop
  const fullText = tickerText + '    \u25CF    ' + tickerText;

  return (
    <>
      <style>{`
        @keyframes breakingTextGlow {
          0% {
            text-shadow: 0 0 4px rgba(255, 255, 255, 0.2), 0 0 8px rgba(255, 0, 0, 0.8), 0 0 12px rgba(255, 0, 0, 0.6);
          }
          100% {
            text-shadow: 0 0 6px rgba(255, 255, 255, 0.4), 0 0 14px rgba(255, 0, 10, 1), 0 0 22px rgba(255, 0, 10, 0.8), 0 0 30px rgba(255, 0, 10, 0.6);
          }
        }
        @keyframes breakingDotPulse {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 4px rgba(255, 255, 255, 0.8); }
          50% { opacity: 0.4; transform: scale(0.75); box-shadow: 0 0 8px rgba(255, 0, 10, 1); }
        }
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .breaking-news-bar {
          width: calc(100% - var(--header-px) * 2);
          margin: 10px auto;
          padding-left: 16px;
          padding-right: 16px;
          border-radius: 30px;
          background: linear-gradient(90deg, var(--industrial-red, #da251d) 0%, #b91c1c 100%);
          overflow: hidden;
          display: flex;
          align-items: center;
          height: 34px;
          position: relative;
          z-index: 1999;
          border: 1px solid #a81812;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 4px 10px rgba(0, 0, 0, 0.08), 0 0 8px rgba(218, 37, 29, 0.2);
          transition: all 0.3s ease;
        }
        .breaking-news-bar:hover {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 6px 14px rgba(0, 0, 0, 0.12), 0 0 12px rgba(218, 37, 29, 0.35);
          border-color: #c01f18;
        }
        .breaking-news-label {
          display: flex;
          align-items: center;
          padding: 0 10px 0 5px;
          height: 100%;
          flex-shrink: 0;
          z-index: 2;
        }
        .breaking-live-dot {
          width: 8px;
          height: 8px;
          background-color: #fff;
          border-radius: 50%;
          margin-right: 8px;
          display: inline-block;
          animation: breakingDotPulse 1.5s infinite ease-in-out;
        }
        .breaking-news-label-text {
          font-size: 0.82rem;
          font-weight: 900;
          font-style: italic;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: 1px;
          white-space: nowrap;
          animation: breakingTextGlow 2s ease-in-out infinite alternate;
        }
        .breaking-news-separator {
          color: rgba(255, 255, 255, 0.6);
          margin-left: 12px;
          font-size: 1.1rem;
          font-weight: 300;
        }
        .breaking-news-track {
          flex: 1;
          overflow: hidden;
          position: relative;
          height: 100%;
          display: flex;
          align-items: center;
          mask-image: linear-gradient(90deg, transparent 0%, black 2%, black 98%, transparent 100%);
          -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 2%, black 98%, transparent 100%);
        }
        .breaking-news-content {
          display: flex;
          white-space: nowrap;
          animation: tickerScroll ${speed}s linear infinite;
          will-change: transform;
        }
        .breaking-news-content.paused {
          animation-play-state: paused;
        }
        .breaking-news-text {
          font-size: 0.82rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.5px;
          padding: 0 16px;
        }
        @media (max-width: 1200px) {
          .breaking-news-bar {
            width: calc(100% - 5%);
          }
        }
        @media (max-width: 991px) {
          .breaking-news-bar {
            width: calc(100% - 2rem);
          }
        }
        @media (max-width: 576px) {
          .breaking-news-bar {
            height: 28px;
            width: calc(100% - 16px);
            margin: 8px auto;
            padding-left: 12px;
            padding-right: 12px;
            border-radius: 20px;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 6px rgba(0, 0, 0, 0.05), 0 0 6px rgba(218, 37, 29, 0.15);
          }
          .breaking-news-label {
            padding: 0 6px 0 2px;
          }
          .breaking-live-dot {
            width: 6px;
            height: 6px;
            margin-right: 6px;
          }
          .breaking-news-label-text {
            font-size: 0.72rem;
            letter-spacing: 0.5px;
          }
          .breaking-news-separator {
            margin-left: 8px;
            font-size: 0.85rem;
          }
          .breaking-news-text {
            font-size: 0.75rem;
            padding: 0 8px;
          }
        }
      `}</style>
      <div
        className="breaking-news-bar"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="breaking-news-label">
          <span className="breaking-live-dot"></span>
          <span className="breaking-news-label-text">BREAKING NEWS</span>
          <span className="breaking-news-separator">|</span>
        </div>
        <div className="breaking-news-track">
          <div
            className={`breaking-news-content ${isHovered ? 'paused' : ''}`}
            ref={tickerRef}
          >
            <span className="breaking-news-text">{fullText}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default BreakingNewsTicker;
