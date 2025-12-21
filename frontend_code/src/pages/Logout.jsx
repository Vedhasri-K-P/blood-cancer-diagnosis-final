// src/pages/Logout.jsx
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Optional: if you want to clear local-only profile too, uncomment:
      // localStorage.removeItem("profile");
    } catch {}

    // Go to Home instead of Login
    const redirectTo = location.state?.from || "/";
    navigate(redirectTo, { replace: true });
  }, [navigate, location.state]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-8">
      <div className="text-gray-600">Signing you out…</div>
    </div>
  );
}
