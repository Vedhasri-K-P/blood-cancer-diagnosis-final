// src/components/PublicRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PublicRoute = () => {
  const token = localStorage.getItem('token'); 

  // If token exists, redirect to dashboard
  // Otherwise, show the public page (Home, Login, etc.)
  return token ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default PublicRoute;