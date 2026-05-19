import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, isAdmin }) => {
  if (isAdmin) {
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
    if (!adminInfo || adminInfo.role !== 'superadmin') {
       return <Navigate to="/superadmin@123" />;
    }
    return children;
  }

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  if (!userInfo) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
