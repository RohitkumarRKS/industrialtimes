import React from 'react';
import { Navigate } from 'react-router-dom';

const getSafeLocalStorage = (key) => {
  try {
    const value = localStorage.getItem(key);
    if (!value || value === 'undefined') {
      return null;
    }
    return JSON.parse(value);
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    localStorage.removeItem(key);
    return null;
  }
};

const ProtectedRoute = ({ children, isAdmin }) => {
  if (isAdmin) {
    const adminInfo = getSafeLocalStorage('adminInfo');

    if (!adminInfo || adminInfo.role !== 'superadmin') {
       return <Navigate to="/superadmin-login" replace />;
    }
    return children;
  }

  const userInfo = getSafeLocalStorage('userInfo');
  if (!userInfo) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;

