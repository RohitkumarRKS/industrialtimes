import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

/**
 * AdAvailabilityCalendar
 * Reusable calendar showing ad slot availability per state+city.
 *
 * Props:
 *   slot        – e.g. "leaderboard"
 *   targetState – e.g. "Maharashtra"
 *   targetCity  – e.g. "Mumbai"
 *   API_BASE    – backend URL
 *   authToken   – optional bearer token
 *   compact     – if true, renders in smaller mode
 */
const AdAvailabilityCalendar = ({ slot, targetState, targetCity, API_BASE, authToken, compact = false, onSelectDate }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    if (!slot || !targetState || !targetCity) {
      setBookings([]);
      return;
    }
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
        const { data } = await axios.get(
          `${API_BASE}/api/ads/availability?slot=${encodeURIComponent(slot)}&state=${encodeURIComponent(targetState)}&city=${encodeURIComponent(targetCity)}`,
          { headers }
        );
        setBookings(data || []);
      } catch (e) {
        console.error('Failed to fetch availability', e);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, [slot, targetState, targetCity, API_BASE, authToken]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const monthName = currentMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  // Build a map of date -> status
  const dateStatusMap = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      if (!b.startDate || !b.endDate) return;
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        if (!map[key]) map[key] = [];
        map[key].push(b);
      }
    });
    return map;
  }, [bookings]);

  const getDayStatus = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const entries = dateStatusMap[dateStr];
    if (!entries || entries.length === 0) return 'free';
    const hasPending = entries.some(e => e.type === 'pending');
    const hasBooked = entries.some(e => e.type === 'booked');
    if (hasBooked) return 'booked';
    if (hasPending) return 'pending';
    return 'free';
  };

  const getDayBookings = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStatusMap[dateStr] || [];
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  if (!slot || !targetState || !targetCity) {
    return (
      <div className="ad-cal-placeholder">
        <i className="bi bi-calendar3" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
        <p>Select a slot, state, and city to view availability</p>
      </div>
    );
  }

  return (
    <div className={`ad-cal ${compact ? 'ad-cal--compact' : ''}`}>
      <div className="ad-cal-header">
        <span className="ad-cal-month">{monthName}</span>
        <div className="ad-cal-actions">
          <button className="ad-cal-nav" onClick={prevMonth} type="button"><i className="bi bi-chevron-left"></i></button>
          <button className="ad-cal-nav" onClick={nextMonth} type="button"><i className="bi bi-chevron-right"></i></button>
        </div>
      </div>

      {loading ? (
        <div className="ad-cal-loading">
          <i className="bi bi-arrow-repeat spin"></i> Loading availability...
        </div>
      ) : (
        <>
          <div className="ad-cal-grid">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
              <div key={idx} className="ad-cal-weekday">{d}</div>
            ))}
            {/* Empty cells for offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="ad-cal-day ad-cal-day--empty"></div>
            ))}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const status = getDayStatus(day);
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;
              const isPast = new Date(dateStr) < new Date(todayStr);
              return (
                <div
                  key={day}
                  className={`ad-cal-day ad-cal-day--${status} ${isToday ? 'ad-cal-day--today' : ''} ${isPast ? 'ad-cal-day--past' : ''} ${selectedDay === day ? 'ad-cal-day--selected' : ''}`}
                  onClick={() => {
                    if (onSelectDate && status === 'free') {
                      onSelectDate(dateStr);
                    } else {
                      setSelectedDay(selectedDay === day ? null : day);
                    }
                  }}
                  title={status === 'booked' ? 'Booked' : status === 'pending' ? 'On Hold (Pending Approval)' : 'Available'}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="ad-cal-legend">
            <span className="ad-cal-legend-item"><span className="ad-cal-dot ad-cal-dot--free"></span>Available</span>
            <span className="ad-cal-legend-item"><span className="ad-cal-dot ad-cal-dot--booked"></span>Booked</span>
            <span className="ad-cal-legend-item"><span className="ad-cal-dot ad-cal-dot--pending"></span>On Hold</span>
          </div>

          {/* Selected day details */}
          {selectedDay && getDayBookings(selectedDay).length > 0 && (
            <div className="ad-cal-details">
              <div className="ad-cal-details-title">
                <i className="bi bi-info-circle me-1"></i>
                Bookings on {selectedDay} {currentMonth.toLocaleString('en-IN', { month: 'short' })}
              </div>
              {getDayBookings(selectedDay).map((b, idx) => (
                <div key={idx} className="ad-cal-booking-item">
                  <span className={`ad-cal-booking-badge ad-cal-booking-badge--${b.type}`}>
                    {b.type === 'booked' ? 'LIVE' : b.type === 'pending' ? 'PENDING' : 'INACTIVE'}
                  </span>
                  <span className="ad-cal-booking-name">Slot {b.type === 'booked' ? 'Booked' : b.type === 'pending' ? 'Pending' : 'Unavailable'}</span>
                  <span className="ad-cal-booking-dates">{b.startDate} → {b.endDate}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdAvailabilityCalendar;
