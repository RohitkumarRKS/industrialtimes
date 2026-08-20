import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../config/api';
import { INDIAN_STATES, INDIAN_STATES_CITIES } from '../../data/indianStatesAndCities';

/* ─── SLOT CONFIG (same as UserDashboard) ─── */
const AD_SLOTS = [
  { id: 'leaderboard', label: 'Header Leaderboard', dim: '728 × 90' },
  { id: 'right-half-page', label: 'Right Sidebar', dim: '300 × 600' },
  { id: 'article-inline', label: 'Article Inline', dim: '728 × 90' },
];

const ManageAdPricing = ({ adminInfo: propAdminInfo }) => {
  const [allPricing, setAllPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [slotPrices, setSlotPrices] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [filterText, setFilterText] = useState('');

  const adminInfo = (() => {
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
  })();
  const config = { headers: { Authorization: `Bearer ${adminInfo?.token}` } };

  const fetchAllPricing = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/api/ad-area-pricing`, config);
      setAllPricing(data || []);
    } catch (err) {
      console.error('Failed to fetch pricing', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllPricing(); }, []);

  // When state or city changes, populate slot prices from existing data
  useEffect(() => {
    if (!selectedState) {
      setSlotPrices({});
      return;
    }
    const existing = {};
    allPricing
      .filter(p => p.state === selectedState && p.city === (selectedCity || ''))
      .forEach(p => {
        existing[`${p.slot}_reporter`] = p.reporterPricePerDay;
        existing[`${p.slot}_corporate`] = p.corporatePricePerDay;
      });
    
    const prices = {};
    AD_SLOTS.forEach(s => {
      prices[`${s.id}_reporter`] = existing[`${s.id}_reporter`] !== undefined ? existing[`${s.id}_reporter`] : '';
      prices[`${s.id}_corporate`] = existing[`${s.id}_corporate`] !== undefined ? existing[`${s.id}_corporate`] : '';
    });
    setSlotPrices(prices);
  }, [selectedState, selectedCity, allPricing]);

  // Reset city when state changes
  const handleStateChange = (state) => {
    setSelectedState(state);
    setSelectedCity('');
  };

  const handleSaveBulk = async () => {
    if (!selectedState) {
      setMsg({ text: 'Please select a state first.', type: 'warning' });
      return;
    }

    const hasPrice = Object.values(slotPrices).some(v => v !== '' && v !== null && v !== undefined && parseFloat(v) > 0);
    if (!hasPrice) {
      setMsg({ text: 'Please set at least one slot price.', type: 'warning' });
      return;
    }

    setSaving(true);
    setMsg({ text: '', type: '' });

    const slotsObj = {};
    AD_SLOTS.forEach(s => {
      const repVal = slotPrices[`${s.id}_reporter`];
      const corpVal = slotPrices[`${s.id}_corporate`];
      
      if (repVal !== '' || corpVal !== '') {
        slotsObj[s.id] = {
          reporterPricePerDay: repVal !== '' ? parseFloat(repVal) : 0,
          corporatePricePerDay: corpVal !== '' ? parseFloat(corpVal) : 0
        };
      }
    });

    try {
      await axios.post(`${API_BASE}/api/ad-area-pricing/bulk`, {
        state: selectedState,
        city: selectedCity || '',
        slots: slotsObj
      }, config);

      const locationLabel = selectedCity ? `${selectedCity}, ${selectedState}` : `${selectedState} (all cities default)`;
      setMsg({ text: `✅ Pricing saved successfully for ${locationLabel}!`, type: 'success' });
      fetchAllPricing();
      setTimeout(() => setMsg({ text: '', type: '' }), 4000);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to save', type: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, state, city, slot) => {
    const locationLabel = city ? `${city}, ${state}` : `${state} (default)`;
    if (!window.confirm(`Delete pricing for ${locationLabel} — ${slot}?`)) return;
    try {
      await axios.delete(`${API_BASE}/api/ad-area-pricing/${id}`, config);
      setMsg({ text: 'Pricing rule deleted.', type: 'success' });
      fetchAllPricing();
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    } catch (err) {
      setMsg({ text: 'Failed to delete.', type: 'danger' });
    }
  };

  // Group pricing for the overview table
  const getLocationKey = (p) => `${p.state}|||${p.city || ''}`;
  const locationKeys = [...new Set(allPricing.map(getLocationKey))].sort();
  const filteredLocations = locationKeys.filter(k => k.toLowerCase().includes(filterText.toLowerCase()));

  const getSlotLabel = (slotId) => AD_SLOTS.find(s => s.id === slotId)?.label || slotId;

  const cities = selectedState ? (INDIAN_STATES_CITIES[selectedState] || []) : [];

  return (
    <div className="manage-ads-light">
      {/* Header */}
      <div className="manage-ads-header">
        <div>
          <h2 className="manage-ads-title">
            <i className="bi bi-cash-coin me-2" style={{ color: '#da251d' }}></i>
            Ad Pricing Management
          </h2>
          <p className="manage-ads-subtitle">
            Set advertisement rates per day for each state, city, and ad slot. Configure separate pricing for reporters and corporate users.
          </p>
        </div>
      </div>

      {/* Status Message */}
      {msg.text && (
        <div style={{
          padding: '12px 20px', borderRadius: '10px', marginBottom: '1rem',
          fontWeight: 600, fontSize: '0.85rem',
          background: msg.type === 'success' ? '#f0fdf4' : msg.type === 'warning' ? '#fefce8' : '#fef2f2',
          color: msg.type === 'success' ? '#15803d' : msg.type === 'warning' ? '#a16207' : '#dc2626',
          border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : msg.type === 'warning' ? '#fef08a' : '#fecaca'}`
        }}>
          {msg.text}
        </div>
      )}

      {/* ── SET PRICING CARD ── */}
      <div style={{
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px',
        padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="bi bi-gear-fill" style={{ color: '#8b5cf6' }}></i>
          Set Pricing by Location
        </h3>

        {/* State & City Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem', maxWidth: '700px' }}>
          <div>
            <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: '6px', display: 'block' }}>
              Select State <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={selectedState}
              onChange={e => handleStateChange(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px',
                border: '1.5px solid #e5e7eb', fontSize: '0.88rem', fontWeight: 600,
                background: '#fafafa', outline: 'none'
              }}
            >
              <option value="">— Select State —</option>
              {INDIAN_STATES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: '6px', display: 'block' }}>
              Select City <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 500 }}>(Leave empty for state-wide default)</span>
            </label>
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              disabled={!selectedState}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px',
                border: '1.5px solid #e5e7eb', fontSize: '0.88rem', fontWeight: 600,
                background: selectedState ? '#fafafa' : '#f3f4f6', outline: 'none',
                opacity: selectedState ? 1 : 0.6
              }}
            >
              <option value="">— All Cities (Default Rate) —</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Info banner about pricing logic */}
        {selectedState && (
          <div style={{
            background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px',
            padding: '10px 14px', marginBottom: '1.2rem', fontSize: '0.78rem',
            color: '#1e40af', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: '8px'
          }}>
            <i className="bi bi-info-circle-fill" style={{ fontSize: '0.9rem', marginTop: '1px' }}></i>
            <span>
              {selectedCity
                ? <><strong>{selectedCity}</strong> will have its own pricing. If removed later, it falls back to the state-wide default.</>
                : <>Setting <strong>state-wide default</strong> pricing for {selectedState}. You can override specific cities by selecting a city above.</>
              }
            </span>
          </div>
        )}

        {/* Slot Pricing Grid */}
        {selectedState && (
          <>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.2rem', marginBottom: '1.5rem'
            }}>
              {AD_SLOTS.map(slot => {
                const existingPrice = allPricing.find(p => p.state === selectedState && p.city === (selectedCity || '') && p.slot === slot.id);
                const hasReporterPrice = slotPrices[`${slot.id}_reporter`] !== undefined && slotPrices[`${slot.id}_reporter`] !== '';
                const hasCorporatePrice = slotPrices[`${slot.id}_corporate`] !== undefined && slotPrices[`${slot.id}_corporate`] !== '';
                return (
                  <div key={slot.id} style={{
                    background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '14px',
                    padding: '1.2rem', transition: 'all 0.2s',
                    borderColor: (hasReporterPrice || hasCorporatePrice) ? '#8b5cf6' : '#e5e7eb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#1f2937' }}>
                        {slot.label}
                      </h4>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px',
                        borderRadius: '6px', background: '#eff6ff', color: '#3b82f6'
                      }}>
                        {slot.dim}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {/* Reporter Price Box */}
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10b981', marginBottom: '4px', display: 'block' }}>
                          Reporter Rate / Day
                        </label>
                        <div style={{ position: 'relative' }}>
                          <span style={{
                            position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                            fontSize: '0.85rem', fontWeight: 800, color: '#6b7280'
                          }}>₹</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            value={slotPrices[`${slot.id}_reporter`] || ''}
                            onChange={e => setSlotPrices({ ...slotPrices, [`${slot.id}_reporter`]: e.target.value })}
                            style={{
                              width: '100%', padding: '8px 10px 8px 24px', borderRadius: '8px',
                              border: '1.5px solid #d1d5db', fontSize: '0.9rem', fontWeight: 750,
                              outline: 'none', background: '#fff'
                            }}
                          />
                        </div>
                      </div>

                      {/* Corporate Price Box */}
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#8b5cf6', marginBottom: '4px', display: 'block' }}>
                          Corporate Rate / Day
                        </label>
                        <div style={{ position: 'relative' }}>
                          <span style={{
                            position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                            fontSize: '0.85rem', fontWeight: 800, color: '#6b7280'
                          }}>₹</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            value={slotPrices[`${slot.id}_corporate`] || ''}
                            onChange={e => setSlotPrices({ ...slotPrices, [`${slot.id}_corporate`]: e.target.value })}
                            style={{
                              width: '100%', padding: '8px 10px 8px 24px', borderRadius: '8px',
                              border: '1.5px solid #d1d5db', fontSize: '0.9rem', fontWeight: 750,
                              outline: 'none', background: '#fff'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '8px', fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600 }}>
                      {existingPrice && (
                        <div style={{ marginTop: '4px', color: '#4b5563' }}>
                          • Configured: <span style={{ color: '#059669', fontWeight: 700 }}>Rep: ₹{parseFloat(existingPrice.reporterPricePerDay).toLocaleString()}</span> | <span style={{ color: '#7c3aed', fontWeight: 700 }}>Corp: ₹{parseFloat(existingPrice.corporatePricePerDay).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveBulk}
              disabled={saving}
              style={{
                padding: '12px 32px', borderRadius: '10px', border: 'none',
                background: '#8b5cf6', color: '#fff', fontWeight: 800,
                fontSize: '0.88rem', cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1, transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <i className={`bi ${saving ? 'bi-arrow-repeat' : 'bi-check-circle-fill'}`}></i>
              {saving ? 'Saving...' : `Save Pricing for ${selectedCity ? `${selectedCity}, ` : ''}${selectedState}`}
            </button>
          </>
        )}
      </div>

      {/* ── OVERVIEW TABLE ── */}
      <div style={{
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px',
        padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="bi bi-table" style={{ color: '#10b981' }}></i>
            All Configured Pricing
            <span style={{
              fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px',
              borderRadius: '20px', background: '#f0fdf4', color: '#15803d',
              border: '1px solid #bbf7d0'
            }}>
              {locationKeys.length} Locations
            </span>
          </h3>
          <input
            type="text"
            placeholder="Search state or city..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            style={{
              padding: '8px 14px', borderRadius: '8px', border: '1px solid #e5e7eb',
              fontSize: '0.82rem', width: '220px', outline: 'none'
            }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>Loading pricing data...</div>
        ) : filteredLocations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
            <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
            <p style={{ marginTop: '0.5rem' }}>
              {filterText ? 'No locations match your search.' : 'No pricing configured yet. Select a state above to start.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: '#374151', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: '#374151', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Slot</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#374151', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rates / Day</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: '#374151', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: '#374151', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Updated</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: '#374151', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLocations.map(locationKey => {
                  const [state, city] = locationKey.split('|||');
                  const locationRecords = allPricing.filter(p => p.state === state && (p.city || '') === city);
                  return locationRecords.map((record, idx) => (
                    <tr key={record.id} style={{
                      borderBottom: '1px solid #f3f4f6',
                      background: idx % 2 === 0 ? '#fff' : '#fafafa'
                    }}>
                      {idx === 0 && (
                        <td rowSpan={locationRecords.length} style={{
                          padding: '10px 14px', fontWeight: 700, color: '#1f2937',
                          verticalAlign: 'top', borderRight: '1px solid #f3f4f6'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="bi bi-geo-alt-fill" style={{ color: '#da251d', fontSize: '0.85rem' }}></i>
                            <div>
                              <div>{state}</div>
                              {city ? (
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>
                                  <i className="bi bi-building me-1" style={{ fontSize: '0.65rem' }}></i>{city}
                                </div>
                              ) : (
                                <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontStyle: 'italic' }}>
                                  State-wide default
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      )}
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                        {getSlotLabel(record.slot)}
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 500 }}>
                          {AD_SLOTS.find(s => s.id === record.slot)?.dim || ''}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, fontSize: '0.85rem' }}>
                        <div style={{ color: '#059669' }}>
                          Rep: ₹{parseFloat(record.reporterPricePerDay).toLocaleString()}
                        </div>
                        <div style={{ color: '#7c3aed', marginTop: '2px' }}>
                          Corp: ₹{parseFloat(record.corporatePricePerDay).toLocaleString()}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem',
                          fontWeight: 700, textTransform: 'uppercase',
                          background: record.city ? '#faf5ff' : '#f0fdf4',
                          color: record.city ? '#7c3aed' : '#15803d',
                          border: `1px solid ${record.city ? '#e9d5ff' : '#bbf7d0'}`
                        }}>
                          {record.city ? 'City' : 'State'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.78rem', color: '#6b7280' }}>
                        {new Date(record.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <button
                          onClick={() => { setSelectedState(state); setSelectedCity(city || ''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          style={{
                            padding: '5px 12px', borderRadius: '6px', border: '1px solid #e5e7eb',
                            background: '#fff', color: '#3b82f6', fontWeight: 700,
                            fontSize: '0.72rem', cursor: 'pointer', marginRight: '6px'
                          }}
                        >
                          <i className="bi bi-pencil-fill me-1"></i>Edit
                        </button>
                        <button
                          onClick={() => handleDelete(record.id, record.state, record.city, getSlotLabel(record.slot))}
                          style={{
                            padding: '5px 12px', borderRadius: '6px', border: '1px solid #fecaca',
                            background: '#fef2f2', color: '#dc2626', fontWeight: 700,
                            fontSize: '0.72rem', cursor: 'pointer'
                          }}
                        >
                          <i className="bi bi-trash3-fill me-1"></i>Delete
                        </button>
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem', marginTop: '1.5rem'
      }}>
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px',
          padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: '#eff6ff', color: '#3b82f6', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
          }}>
            <i className="bi bi-geo-alt-fill"></i>
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1f2937' }}>
              {[...new Set(allPricing.map(p => p.state))].length}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>States Configured</div>
          </div>
        </div>
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px',
          padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: '#faf5ff', color: '#8b5cf6', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
          }}>
            <i className="bi bi-building"></i>
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1f2937' }}>
              {[...new Set(allPricing.filter(p => p.city).map(p => `${p.state}-${p.city}`))].length}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>City Overrides</div>
          </div>
        </div>
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px',
          padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: '#f0fdf4', color: '#10b981', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
          }}>
            <i className="bi bi-tags-fill"></i>
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1f2937' }}>{allPricing.length}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>Total Pricing Rules</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAdPricing;
