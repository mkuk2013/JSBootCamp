import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  role: 'student' | 'admin';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ role }) => {
  if (role === 'admin') {
    const adminToken = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');
    
    if (!adminToken || !adminUser) {
      return <Navigate to="/admin/login" replace />;
    }
    
    return <Outlet />;
  } else {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      return <Navigate to="/login" replace />;
    }
    
    return <Outlet />;
  }
};

export default ProtectedRoute;
