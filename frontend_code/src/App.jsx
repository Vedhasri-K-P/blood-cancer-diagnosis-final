import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import your route protectors
import ProtectedRoute from "./components/ProtectedRoute"; 
import PublicRoute from "./components/PublicRoute"; 

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer"; // Make sure this import path is correct

// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";

function App() {
  return (
    <Router>
      {/* Main layout using CSS Grid:
        - grid: Enables Grid layout.
        - grid-rows-[auto_1fr_auto]: Defines 3 rows. 
          Row 1 (Navbar) takes its content height.
          Row 2 (Main) takes all remaining flexible space (1fr).
          Row 3 (Footer) takes its content height.
        - min-h-screen: Ensures the grid container is at least the full viewport height.
      */}
      <div className="grid grid-rows-[auto_1fr_auto] min-h-screen bg-gray-50">
        <Navbar />

        {/* Main content area. No 'flex-grow' needed here because 
          the parent grid row ('1fr') handles the expansion.
        */}
        <main>
          <Routes>
            {/* --- PUBLIC ROUTES --- */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Route>

            {/* --- PROTECTED ROUTES --- */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/history" element={<History />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/logout" element={<Logout />} />
            </Route>

            {/* --- GENERAL PUBLIC ROUTES --- */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />

            {/* 404 fallback */}
            <Route path="*" element={<div className="p-8 text-center text-gray-500">404 – Page Not Found</div>} />
          </Routes>
        </main>

        {/* Footer component. It will automatically be placed in the 
          third grid row ('auto') at the bottom. 
        */}
        <Footer /> 
      </div>
    </Router>
  );
}

export default App;
