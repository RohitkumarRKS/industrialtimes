import React, { useState, useEffect } from 'react';
import Advertisement from './Advertisement';

/* ─────────────────────────────────────────────────────────────────
   MobileStickyAd — Shows a fixed 300×100 banner at the bottom
   of the screen on mobile devices. User can dismiss it.
   Automatically hides when footer enters the viewport to prevent overlap.
 ───────────────────────────────────────────────────────────────── */
const MobileStickyAd = ({ category = null }) => {
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector('footer');
      if (!footer) return;
      
      const footerRect = footer.getBoundingClientRect();
      // Hide ad when the top of the footer starts entering the viewport
      if (footerRect.top < window.innerHeight) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (dismissed || !isVisible) return null;

  return (
    <div className="ad-mobile-only mobile-ad-sticky">
      <button
        className="ad-close-btn"
        onClick={() => setDismissed(true)}
        aria-label="Close ad"
      >
        <i className="bi bi-x"></i>
      </button>
      <Advertisement slot="mobile-banner" category={category} />
    </div>
  );
};

export default MobileStickyAd;
