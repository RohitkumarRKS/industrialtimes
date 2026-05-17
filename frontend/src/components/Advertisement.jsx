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
  'leaderboard':      { w: 728, h: 90,  label: '728 × 90 – Leaderboard'   },
  'article-inline':   { w: 728, h: 90,  label: '728 × 90 – Inline Ad'     },
  'left-skyscraper':  { w: 160, h: 600, label: '160 × 600 – Skyscraper'   },
  'right-half-page':  { w: 300, h: 600, label: '300 × 600 – Half Page'    },
};

const Advertisement = ({ slot = 'leaderboard', category = null, className = '' }) => {
  const [ad, setAd] = useState(null);
  const dims = SLOT_DIMS[slot] || SLOT_DIMS['leaderboard'];

  // Fetch ad for this slot
  useEffect(() => {
    const fetchAd = async () => {
      try {
        const params = new URLSearchParams({ slot });
        if (category) params.append('category', category);
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
  }, [slot, category]);

  const handleClick = () => {
    if (ad) axios.post(`${API_BASE}/api/ads/${ad.id}/click`).catch(() => {});
  };

  const imgSrc = ad?.imageUrl
    ? (ad.imageUrl.startsWith('http') ? ad.imageUrl : `${API_BASE}${ad.imageUrl}`)
    : null;

  return (
    <div
      className={`ad-zone ${className}`}
      style={{ width: dims.w, maxWidth: '100%', margin: '0 auto' }}
    >
      {imgSrc ? (
        /* ── Live Ad ── */
        <a
          href={ad.link || '#'}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="ad-zone-link"
          onClick={handleClick}
          aria-label={ad.label || 'Advertisement'}
          style={{ width: dims.w, height: dims.h, maxWidth: '100%', display: 'block', overflow: 'hidden' }}
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
          style={{ width: dims.w, height: dims.h, maxWidth: '100%' }}
        >
          <i className="bi bi-image fs-4 d-block mb-1 opacity-40"></i>
          <span className="d-block" style={{ fontSize: '0.8rem', fontWeight: 700 }}>{dims.w} × {dims.h} px</span>
          <small>{dims.label}</small>
        </div>
      )}
    </div>
  );
};

export default Advertisement;
