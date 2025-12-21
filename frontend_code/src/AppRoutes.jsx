// AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Logout from './pages/Logout';

const AppRoutes = () => {
  const location = useLocation();
  const isLoggedIn = !!localStorage.getItem('email');

  const ProtectedRoute = ({ element }) => {
    return isLoggedIn ? element : <Navigate to="/login" />;
  };

  const HideNavFooterRoutes = ['/login', '/signup'];
  const hideNavAndFooter = HideNavFooterRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      {!hideNavAndFooter && <Navbar />}
      <main className="flex-grow bg-gray-50">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/about" element={<About />} />
          <Route path="/logout" element={<Logout />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
          <Route path="/reports" element={<ProtectedRoute element={<Reports />} />} />
          <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {!hideNavAndFooter && <Footer />}
    </div>
  );
};

export default AppRoutes;
