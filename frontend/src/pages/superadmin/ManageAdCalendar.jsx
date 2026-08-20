import React, { useState } from 'react';
import API_BASE from '../../config/api';
import { INDIAN_STATES, INDIAN_STATES_CITIES } from '../../data/indianStatesAndCities';
import AdAvailabilityCalendar from '../../components/AdAvailabilityCalendar';

const AD_SLOTS = [
  { id: 'leaderboard', label: 'Header Leaderboard', dim: '728×90', color: '#3b82f6', icon: 'bi-layout-text-window' },
  { id: 'article-inline', label: 'Article Inline', dim: '728×90', color: '#10b981', icon: 'bi-text-indent-left' },
  { id: 'left-skyscraper', label: 'Left Sidebar', dim: '160×600', color: '#8b5cf6', icon: 'bi-layout-sidebar' },
  { id: 'right-half-page', label: 'Right Sidebar', dim: '300×600', color: '#ef4444', icon: 'bi-layout-sidebar-reverse' },
  { id: 'mobile-banner', label: 'Mobile Banner', dim: '300×50', color: '#f59e0b', icon: 'bi-phone' },
  { id: 'mobile-rectangle', label: 'Mobile Rectangle', dim: '300×250', color: '#06b6d4', icon: 'bi-phone-landscape' },
  { id: 'mobile-inline', label: 'Mobile Inline', dim: '300×200', color: '#d946ef', icon: 'bi-phone-fill' },
];

const ManageAdCalendar = ({ adminInfo: propAdminInfo }) => {
  const getAdminInfo = () => {
    if (propAdminInfo) return propAdminInfo;
    try {
      const mode = sessionStorage.getItem('portalMode');
      const saved = mode === 'user'
        ? localStorage.getItem('userInfo')
        : (localStorage.getItem('adminInfo') || localStorage.getItem('userInfo'));
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.role === 'superadmin' || parsed.isManager)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };
  const adminInfo = getAdminInfo();
  const [selectedSlot, setSelectedSlot] = useState('leaderboard');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const slotInfo = AD_SLOTS.find(s => s.id === selectedSlot) || AD_SLOTS[0];

  return (
    <div className="manage-ads-light">
      <div className="manage-ads-header">
        <div>
          <h2 className="manage-ads-title">
            <i className="bi bi-calendar-check me-2" style={{ color: '#da251d' }}></i>
            Ad Availability Calendar
          </h2>
          <p className="manage-ads-subtitle">View booking availability across all ad slots, states, and cities. Color-coded days show free, booked, and pending slots.</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="publish-field">
            <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: '0.4rem', display: 'block' }}>
              <i className="bi bi-layout-text-window me-1"></i> Ad Slot
            </label>
            <select
              value={selectedSlot}
              onChange={e => setSelectedSlot(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '0.88rem', fontWeight: 600, background: '#f9fafb' }}
            >
              {AD_SLOTS.map(s => (
                <option key={s.id} value={s.id}>{s.label} ({s.dim})</option>
              ))}
            </select>
          </div>
          <div className="publish-field">
            <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: '0.4rem', display: 'block' }}>
              <i className="bi bi-geo-alt me-1"></i> State
            </label>
            <select
              value={selectedState}
              onChange={e => { setSelectedState(e.target.value); setSelectedCity(''); }}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '0.88rem', fontWeight: 600, background: '#f9fafb' }}
            >
              <option value="">— Select State —</option>
              {INDIAN_STATES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
          <div className="publish-field">
            <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: '0.4rem', display: 'block' }}>
              <i className="bi bi-pin-map me-1"></i> City
            </label>
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              disabled={!selectedState}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '0.88rem', fontWeight: 600, background: selectedState ? '#f9fafb' : '#f3f4f6', opacity: selectedState ? 1 : 0.6 }}
            >
              <option value="">— Select City —</option>
              {selectedState && INDIAN_STATES_CITIES[selectedState]?.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Current Selection Info */}
      {selectedState && selectedCity && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <span style={{ padding: '6px 16px', borderRadius: '20px', fontWeight: 700, fontSize: '0.8rem', background: `${slotInfo.color}15`, color: slotInfo.color, border: `1px solid ${slotInfo.color}40` }}>
            <i className={`bi ${slotInfo.icon} me-1`}></i> {slotInfo.label} ({slotInfo.dim})
          </span>
          <span style={{ padding: '6px 16px', borderRadius: '20px', fontWeight: 700, fontSize: '0.8rem', background: '#ecfdf5', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            <i className="bi bi-geo-alt-fill me-1"></i> {selectedCity}, {selectedState}
          </span>
        </div>
      )}

      {/* Calendar */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <AdAvailabilityCalendar
          slot={selectedSlot}
          targetState={selectedState}
          targetCity={selectedCity}
          API_BASE={API_BASE}
          authToken={adminInfo?.token}
        />
      </div>
    </div>
  );
};

export default ManageAdCalendar;
