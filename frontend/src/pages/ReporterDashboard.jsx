import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ReporterDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const saved = sessionStorage.getItem('userInfo');
    if (saved) {
      navigate('/user-dashboard', { replace: true });
    } else {
      navigate('/login');
    }
  }, [navigate]);

  return null;
};

export default ReporterDashboard;
