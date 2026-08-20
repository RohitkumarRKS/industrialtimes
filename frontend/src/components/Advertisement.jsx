import React, { useState, useEffect, useRef } from 'react';
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
  'mobile-banner':      { w: 300, h: 50,  label: '300 × 50 – Mobile Banner'       },
  'mobile-rectangle':   { w: 300, h: 250, label: '300 × 250 – Mobile Rectangle'  },
  'mobile-inline':      { w: 300, h: 200, label: '300 × 200 – Mobile Inline'     },
  'top-bottom-banner':  { w: 970, h: 90,  label: '970 × 90 – Top / Bottom Banner' },
  'in-feed-rectangle':  { w: 336, h: 280, label: '336 × 280 – In-Feed Rectangle' },
  'inline-news-footer': { w: 728, h: 90,  label: '728 × 90 – Inline News Footer' },
  'colombia-ad':        { w: 728, h: 90,  label: '728 × 90 – Colombia Ad'         },
  'mobile-leaderboard': { w: 300, h: 100, label: '300 × 100 – Mobile Leaderboard' },
};

// React component to safely inject and execute script tags from raw HTML
// Defer script execution until container has non-zero width to prevent availableWidth=0 error
const GoogleAdRenderer = ({ htmlCode }) => {
  const renderRef = React.useRef(null);
  useEffect(() => {
    if (!renderRef.current || !htmlCode) return;

    let observer = null;
    let rendered = false;

    const renderAd = () => {
      if (rendered || !renderRef.current) return;
      try {
        const slotHtml = document.createRange().createContextualFragment(htmlCode);
        renderRef.current.innerHTML = '';
        renderRef.current.appendChild(slotHtml);
        rendered = true;

        // Double check if the htmlCode does not call push, we call it manually
        const hasPushScript = htmlCode.includes('adsbygoogle.push') || htmlCode.includes('adsbygoogle = window.adsbygoogle');
        if (!hasPushScript) {
          const insElement = renderRef.current.querySelector('ins.adsbygoogle');
          if (insElement && insElement.dataset.adPushed !== 'true') {
            insElement.dataset.adPushed = 'true';
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          }
        }
      } catch (err) {
        console.log('Google Ad Renderer error:', err.message);
      }
    };

    if (renderRef.current.offsetWidth > 0) {
      renderAd();
    } else {
      if (typeof window.ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(() => {
          if (renderRef.current && renderRef.current.offsetWidth > 0) {
            renderAd();
            observer.disconnect();
          }
        });
        observer.observe(renderRef.current);
      } else {
        const interval = setInterval(() => {
          if (renderRef.current && renderRef.current.offsetWidth > 0) {
            renderAd();
            clearInterval(interval);
          }
        }, 500);
        return () => clearInterval(interval);
      }
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, [htmlCode]);
  return <div ref={renderRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />;
};

const Advertisement = ({ slot = 'leaderboard', category = null, className = '', refreshTrigger = 0 }) => {
  const containerRef = useRef(null);
  const [ad, setAd] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isUnderLg, setIsUnderLg] = useState(window.innerWidth < 992);
  const [canLoad, setCanLoad] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsUnderLg(window.innerWidth < 992);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileSlot = ['mobile-banner', 'mobile-rectangle', 'mobile-inline', 'mobile-leaderboard'].includes(slot);

  const dims = SLOT_DIMS[slot] || SLOT_DIMS['leaderboard'];
  const isGoogleSlot = ['left-skyscraper', 'top-bottom-banner', 'in-feed-rectangle', 'inline-news-footer', 'mobile-leaderboard', 'mobile-inline', 'colombia-ad'].includes(slot);

  // Fetch ad for all slots (Google slots will fallback to AdSense if no private ad is uploaded)
  useEffect(() => {
    const shouldHide = (isMobile && !isMobileSlot) || (!isMobile && isMobileSlot) || (isUnderLg && slot === 'left-skyscraper');
    if (shouldHide) return;

    const fetchAd = async () => {
      try {
        const state = localStorage.getItem('detectedState') || '';
        const city = localStorage.getItem('detectedCity') || '';
        const params = new URLSearchParams({ slot });
        if (category) params.append('category', category);
        if (state) params.append('state', state);
        if (city) params.append('city', city);
        const { data } = await axios.get(`${API_BASE}/api/ads?${params}`);
        if (data && data.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.length);
          setAd(data[randomIndex]);
          axios.post(`${API_BASE}/api/ads/${data[randomIndex].id}/impression`).catch(() => {});
        } else {
          setAd(null);
        }
      } catch (err) {
        setAd(null);
      }
    };
    
    fetchAd();

    const handleLocationUpdate = () => fetchAd();
    window.addEventListener('locationFetched', handleLocationUpdate);
    
    return () => window.removeEventListener('locationFetched', handleLocationUpdate);
  }, [slot, category, isGoogleSlot, refreshTrigger, isMobile, isUnderLg]);

  const handleClick = () => {
    if (ad) axios.post(`${API_BASE}/api/ads/${ad.id}/click`).catch(() => {});
  };

  const imgSrc = ad && !ad.isGoogleAd && ad.imageUrl
    ? (ad.imageUrl.startsWith('http') ? ad.imageUrl : `${API_BASE}${ad.imageUrl}`)
    : null;

  // Reset canLoad when slot or refreshTrigger changes, to force redetection and reload
  useEffect(() => {
    setCanLoad(false);
  }, [slot, refreshTrigger]);

  // ResizeObserver to detect when the container has dimensions
  useEffect(() => {
    const shouldHide = (isMobile && !isMobileSlot) || (!isMobile && isMobileSlot) || (isUnderLg && slot === 'left-skyscraper');
    if (shouldHide) {
      setCanLoad(false);
      return;
    }

    if (!isGoogleSlot || ad) return;

    // Minimum width required by Google AdSense to avoid availableWidth=0/low errors
    const minWidth = slot === 'left-skyscraper' ? 120 : (slot === 'right-half-page' ? 160 : 250);

    if (containerRef.current) {
      const initialWidth = containerRef.current.offsetWidth;
      setCanLoad(initialWidth >= minWidth);

      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const width = entry.contentRect.width || (containerRef.current ? containerRef.current.offsetWidth : 0);
          setCanLoad(width >= minWidth);
        }
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [slot, isGoogleSlot, ad, isMobile, isMobileSlot, isUnderLg]);

  // Trigger Google AdSense load when container has valid dimensions and <ins> is rendered
  useEffect(() => {
    if (!canLoad || !isGoogleSlot || ad) return;

    const ins = containerRef.current?.querySelector('ins.adsbygoogle');
    if (!ins) return;

    if (
      ins.dataset.adPushed === 'true' ||
      ins.getAttribute('data-adsbygoogle-status') === 'done' ||
      ins.getAttribute('data-ad-status') === 'filled'
    ) {
      return;
    }

    try {
      ins.dataset.adPushed = 'true';
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.log('Google AdSense load error:', err.message);
    }
  }, [canLoad, isGoogleSlot, ad]);

  // Determine standard layout formats for AdSense
  let adFormat = 'auto';
  if (slot.includes('skyscraper') || slot.includes('half-page')) {
    adFormat = 'vertical';
  } else if (slot.includes('banner') || slot.includes('leaderboard') || slot.includes('footer') || slot.includes('colombia')) {
    adFormat = 'horizontal';
  } else if (slot.includes('rectangle') || slot.includes('inline')) {
    adFormat = 'rectangle';
  }

  // 1. If we are on mobile, DO NOT show any desktop/website ads at all!
  if (isMobile && !isMobileSlot) {
    return null;
  }

  // 2. If we are on desktop, DO NOT show any mobile-specific ads!
  if (!isMobile && isMobileSlot) {
    return null;
  }

  // 3. If the screen is smaller than 992px (lg breakpoint), the Left Skyscraper column
  // is hidden via CSS (d-none d-lg-block and .skyscraper-ad-col { display: none }).
  // Do not render it to avoid Google AdSense 'availableWidth=0' error.
  if (isUnderLg && slot === 'left-skyscraper') {
    return null;
  }

  // Render Google slot directly ONLY if no private ad is uploaded for this slot
  if (isGoogleSlot && !ad) {
    return (
      <div
        ref={containerRef}
        className={`ad-zone ${className}`}
        style={{
          width: dims.w,
          height: dims.h,
          maxWidth: '100%',
          margin: '0 auto',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden'
        }}
      >
        {canLoad && (
          <ins
            key={refreshTrigger}
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', height: '100%' }}
            data-ad-client="ca-pub-3984464028103389"
            data-ad-format={adFormat}
            data-full-width-responsive="true"
          ></ins>
        )}
      </div>
    );
  }

  // Render Private/Sponsor slot
  const isGoogle = !!ad?.isGoogleAd;

  return (
    <div
      ref={containerRef}
      className={`ad-zone ${className}`}
      style={isGoogle ? { width: '100%', maxWidth: '100%', margin: '0 auto', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' } : { width: dims.w, maxWidth: '100%', margin: '0 auto', position: 'relative' }}
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

      {isGoogle ? (
        <div style={{ width: '100%', maxWidth: '100%', border: ad.isSponsored ? '1px solid #e5e7eb' : 'none', position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <GoogleAdRenderer key={refreshTrigger} htmlCode={ad.googleAdCode} />
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
