import React, { useState } from 'react';
import Advertisement from './Advertisement';

const StickyBottomAd = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="d-none d-xl-block"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1040,
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.95), #ffffff)',
        borderTop: '1px solid #e5e7eb',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '6px 0',
      }}
    >
      {/* Close Button */}
      <button
        onClick={() => setDismissed(true)}
        title="Close Ad"
        style={{
          position: 'absolute',
          top: '-14px',
          right: '24px',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: '1.5px solid #d1d5db',
          background: '#fff',
          color: '#6b7280',
          fontSize: '0.85rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          transition: 'all 0.2s ease',
          zIndex: 1,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#ef4444';
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.borderColor = '#ef4444';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#fff';
          e.currentTarget.style.color = '#6b7280';
          e.currentTarget.style.borderColor = '#d1d5db';
        }}
      >
        <i className="bi bi-x-lg" style={{ fontSize: '0.7rem' }}></i>
      </button>

      <Advertisement slot="top-bottom-banner" />
    </div>
  );
};

export default StickyBottomAd;
