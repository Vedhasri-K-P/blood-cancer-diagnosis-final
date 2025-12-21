// src/App.js

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import your new route protectors
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
// import History from "./pages/History"; 
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";

function App() {
  return (
    <Router>
      <Routes>
        
        {/* --- PUBLIC-ONLY ROUTES --- */}
        {/* (Users can only see these if NOT logged in) */}
        <Route element={<PublicRoute />}>
          {/* The Home route has been REMOVED from this section */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* --- PROTECTED ROUTES --- */}
        {/* (Users can only see these IF logged in) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/logout" element={<Logout />} />
          {/* <Route path="/history" element={<History />} /> */}
        </Route>

        {/* --- OTHER PUBLIC ROUTES (like About) --- */}
        {/* (Everyone can see this page) */}
        {/* The Home route has been MOVED here to be visible to everyone */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />

        {/* 404 fallback (optional) */}
        <Route path="*" element={<div style={{ padding: 24 }}>404 – Not Found</div>} />
      
      </Routes>
    </Router>
  );
}

export default App;