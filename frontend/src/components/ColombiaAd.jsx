import React, { useState, useEffect, useRef } from 'react';
import Advertisement from './Advertisement';

const ColombiaAd = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [fadeState, setFadeState] = useState('fade-in'); // 'fade-in' | 'fade-out'
  const containerRef = useRef(null);
  const lastRefreshTime = useRef(Date.now());

  // Function to safely trigger ad refresh with custom fade transition
  const triggerRefresh = () => {
    const now = Date.now();
    // Throttle scroll refresh to at most once every 10 seconds to avoid spamming the backend
    if (now - lastRefreshTime.current < 10000) return;
    
    lastRefreshTime.current = now;
    setFadeState('fade-out');
    
    setTimeout(() => {
      setRefreshTrigger(prev => prev + 1);
      setFadeState('fade-in');
    }, 400); // matches CSS fade duration
  };

  // 1. Dynamic Scroll Refresh: Trigger refresh when ad enters the viewport (user scrolled to bottom)
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            triggerRefresh();
          }
        });
      },
      { threshold: 0.1 } // Trigger when at least 10% of the ad is visible
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 2. Auto Rotation: Rotate ad every 25 seconds for active users
  useEffect(() => {
    const timer = setInterval(() => {
      // Rotate if tab is active/visible
      if (document.visibilityState === 'visible') {
        triggerRefresh();
      }
    }, 25000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      ref={containerRef}
      className="colombia-ad-outer-container my-4 text-center border-top border-bottom"
      style={{
        background: 'linear-gradient(to right, #f8fafc, #f1f5f9, #f8fafc)',
        padding: '24px 0',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      <div 
        style={{
          opacity: fadeState === 'fade-in' ? 1 : 0,
          transform: fadeState === 'fade-in' ? 'scale(1)' : 'scale(0.98)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
          width: '100%',
          display: 'block'
        }}
      >
        <Advertisement 
          slot="colombia-ad" 
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  );
};

export default ColombiaAd;
