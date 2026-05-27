import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../config/api';

/* ─────────────────────────────────────────────────────────────────
   Advertisement Component
   Props:
     slot      — 'leaderboard' | 'left-skyscraper' | 'right-half-page'
     category  — optional category targeting string
     className — extra CSS classes
───────────────────────────────────────────────────────────────── */
const SLOT_DIMS = {
  'leaderboard':        { w: 728, h: 90,  label: '728 × 90 – Leaderboard'        },
  'article-inline':     { w: 728, h: 90,  label: '728 × 90 – Inline Ad'          },
  'left-skyscraper':    { w: 160, h: 600, label: '160 × 600 – Skyscraper'        },
  'right-half-page':    { w: 300, h: 600, label: '300 × 600 – Half Page'         },
  'mobile-banner':      { w: 300, h: 100, label: '300 × 100 – Mobile Banner'      },
  'mobile-rectangle':   { w: 300, h: 250, label: '300 × 250 – Mobile Rectangle'  },
  'mobile-inline':      { w: 300, h: 200, label: '300 × 200 – Mobile Inline'     },
  'top-bottom-banner':  { w: 970, h: 90,  label: '970 × 90 – Top / Bottom Banner' },
  'in-feed-rectangle':  { w: 336, h: 280, label: '336 × 280 – In-Feed Rectangle' },
  'inline-news-footer': { w: 728, h: 90,  label: '728 × 90 – Inline News Footer' },
};

const Advertisement = ({ slot = 'leaderboard', category = null, className = '' }) => {
  const [ad, setAd] = useState(null);
  const dims = SLOT_DIMS[slot] || SLOT_DIMS['leaderboard'];

  // Fetch ad for this slot
  useEffect(() => {
    const fetchAd = async () => {
      try {
        const state = sessionStorage.getItem('detectedState') || '';
        const city = sessionStorage.getItem('detectedCity') || '';
        const params = new URLSearchParams({ slot });
        if (category) params.append('category', category);
        if (state) params.append('state', state);
        if (city) params.append('city', city);
        const { data } = await axios.get(`${API_BASE}/api/ads?${params}`);
        if (data && data.length > 0) {
          setAd(data[0]);
          // Count impression
          axios.post(`${API_BASE}/api/ads/${data[0].id}/impression`).catch(() => {});
        }
      } catch (err) {
        // silently fail — show placeholder
      }
    };
    
    fetchAd();

    const handleLocationUpdate = () => fetchAd();
    window.addEventListener('locationFetched', handleLocationUpdate);
    
    return () => window.removeEventListener('locationFetched', handleLocationUpdate);
  }, [slot, category]);

  const handleClick = () => {
    if (ad) axios.post(`${API_BASE}/api/ads/${ad.id}/click`).catch(() => {});
  };

  const imgSrc = ad && !ad.isGoogleAd && ad.imageUrl
    ? (ad.imageUrl.startsWith('http') ? ad.imageUrl : `${API_BASE}${ad.imageUrl}`)
    : null;

  // React component to safely inject and execute script tags from raw HTML
  const GoogleAdRenderer = ({ htmlCode }) => {
    const containerRef = React.useRef(null);
    useEffect(() => {
      if (!containerRef.current || !htmlCode) return;
      const slotHtml = document.createRange().createContextualFragment(htmlCode);
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(slotHtml);
    }, [htmlCode]);
    return <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />;
  };

  return (
    <div
      className={`ad-zone ${className}`}
      style={{ width: dims.w, maxWidth: '100%', margin: '0 auto', position: 'relative' }}
    >
      {ad?.isSponsored && (
        <>
          <div style={{ position: 'absolute', top: '-18px', left: 0, right: 0, textAlign: 'center', fontSize: '0.65rem', color: '#9ca3af', letterSpacing: '0.5px', zIndex: 10 }}>
            ADVERTISEMENT
          </div>
          <div style={{ position: 'absolute', top: 0, right: 0, background: '#fff', padding: '2px 6px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#4b5563', borderBottomLeftRadius: '4px', borderLeft: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', cursor: 'pointer', opacity: 0.9 }}>
            <span>AdChoices</span>
            <i className="bi bi-info-circle text-primary" style={{ fontSize: '0.75rem' }}></i>
            <i className="bi bi-three-dots-vertical" style={{ fontSize: '0.75rem' }}></i>
          </div>
        </>
      )}

      {ad?.isGoogleAd ? (
        <div style={{ width: dims.w, height: dims.h, maxWidth: '100%', border: ad.isSponsored ? '1px solid #e5e7eb' : 'none', position: 'relative' }}>
          <GoogleAdRenderer htmlCode={ad.googleAdCode} />
        </div>
      ) : imgSrc ? (
        /* ── Live Ad ── */
        <a
          href={ad.link || '#'}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="ad-zone-link"
          onClick={handleClick}
          aria-label={ad.label || 'Advertisement'}
          style={{ width: dims.w, height: dims.h, maxWidth: '100%', display: 'block', overflow: 'hidden', border: ad.isSponsored ? '1px solid #e5e7eb' : 'none' }}
        >
          <img
            src={imgSrc}
            alt={ad.label || 'Advertisement'}
            className="ad-zone-img"
            style={{ width: dims.w, height: dims.h, maxWidth: '100%', objectFit: 'cover', display: 'block' }}
          />
        </a>
      ) : (
        /* ── Empty Placeholder ── */
        <div
          className="ad-zone-placeholder"
          style={{ width: dims.w, height: dims.h, maxWidth: '100%', fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700 }}
        >
          ADVERTISEMENT
        </div>
      )}
    </div>
  );
};

export default Advertisement;
