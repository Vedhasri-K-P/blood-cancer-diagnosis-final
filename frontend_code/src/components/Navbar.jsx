// src/components/Navbar.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Navbar() {
  const [authed, setAuthed] = useState(!!localStorage.getItem("token"));
  const [userName, setUserName] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}")?.name || "";
    } catch {
      return "";
    }
  });

  const location = useLocation();
  const navigate = useNavigate();

  // keep navbar in sync if login/logout happens in other tabs
  useEffect(() => {
    const onStorage = () => {
      setAuthed(!!localStorage.getItem("token"));
      try {
        setUserName(JSON.parse(localStorage.getItem("user") || "{}")?.name || "");
      } catch {
        setUserName("");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // also re-check on route change
  useEffect(() => {
    setAuthed(!!localStorage.getItem("token"));
    try {
      setUserName(JSON.parse(localStorage.getItem("user") || "{}")?.name || "");
    } catch {
      setUserName("");
    }
  }, [location.pathname]);

  return (
    <nav className="w-full border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold">
          🧬 Smart Diagnostic Tool
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-700 hover:text-black">Home</Link>
          <Link to="/about" className="text-gray-700 hover:text-black">About</Link>
          {authed && (
            <>
              <Link to="/dashboard" className="text-gray-700 hover:text-black">Dashboard</Link>
              <Link to="/reports" className="text-gray-700 hover:text-black">Reports</Link>
              <Link to="/profile" className="text-gray-700 hover:text-black">Profile</Link>
            </>
          )}

          {!authed ? (
            <>
              <Link
                to="/login"
                className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="px-3 py-1 rounded border border-blue-600 text-blue-700 hover:bg-blue-50"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-600">Hi, {userName || "User"}</span>
              <button
                onClick={() => navigate("/logout")}
                className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
