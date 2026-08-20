import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config/api';

const PopupAd = () => {
  const [show, setShow] = useState(false);
  const [ad, setAd] = useState(null);
  const location = useLocation();

  // Do not show popup on admin, login, or signup pages
  const excludedPaths = ['/admin', '/login', '/signup', '/admin-login', '/superadmin@123'];
  const isExcluded = excludedPaths.some(path => location.pathname.startsWith(path));

  useEffect(() => {
    if (isExcluded) {
      setShow(false);
      return;
    }
    const fetchPopupAd = async () => {
      try {
        const state = localStorage.getItem('detectedState') || '';
        const city = localStorage.getItem('detectedCity') || '';
        const params = new URLSearchParams();
        if (state) params.append('state', state);
        if (city) params.append('city', city);
        const { data } = await axios.get(`${API_BASE}/api/ads?${params}`);
        // Find global popup ad or first active popup
        const popupAd = data.find(a => (a.type === 'popup' || a.slot === 'popup') && a.active);
        if (popupAd) {
          setAd(popupAd);
          setShow(true);
        }
      } catch (err) {
        console.error("Failed to fetch popup ad", err);
      }
    };

    fetchPopupAd();
  }, []);

  if (!ad) return null;

  const adImg = ad.imageUrl.startsWith('http') ? ad.imageUrl : `${API_BASE}${ad.imageUrl}`;

  return (
    <Modal 
      show={show} 
      onHide={() => setShow(false)} 
      centered 
      backdrop="static"
      contentClassName="bg-transparent border-0"
    >
      <div className="position-relative">
        <Button 
          variant="light" 
          size="sm" 
          className="position-absolute top-0 end-0 m-2 rounded-circle shadow"
          onClick={() => setShow(false)}
          style={{ zIndex: 10, width: '32px', height: '32px', padding: 0 }}
        >
          <i className="bi bi-x-lg"></i>
        </Button>
        <a href={ad.link || '#'} target="_blank" rel="noopener noreferrer">
          <img 
            src={adImg} 
            alt="Advertisement" 
            className="img-fluid rounded-4 shadow-lg border border-white border-4"
            style={{ maxHeight: '80vh', objectFit: 'contain' }}
          />
        </a>
        {ad.label && (
          <div className="text-center mt-2 text-white x-small fw-bold opacity-75">
            {ad.label}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PopupAd;
