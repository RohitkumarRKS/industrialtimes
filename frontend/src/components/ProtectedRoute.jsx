import React from 'react';
import { Navigate } from 'react-router-dom';
import AdminLogin from '../pages/superadmin/AdminLogin';

const ProtectedRoute = ({ children, isAdmin }) => {
  if (isAdmin) {
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
    if (!adminInfo || adminInfo.role !== 'superadmin') {
       return <AdminLogin />;
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
