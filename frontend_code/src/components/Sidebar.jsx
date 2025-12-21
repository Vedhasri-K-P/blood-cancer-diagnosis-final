import React from "react";
import { FaHome, FaUser, FaSignOutAlt, FaFileMedicalAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="h-screen w-64 bg-blue-900 text-white flex flex-col p-5 space-y-6 shadow-xl fixed top-0 left-0">
      <h2 className="text-2xl font-bold">🧬 MedVision AI</h2>

      <nav className="flex flex-col gap-4">
        <Link to="/dashboard" className="flex items-center gap-3 hover:text-blue-300">
          <FaHome /> Dashboard
        </Link>
        <Link to="/profile" className="flex items-center gap-3 hover:text-blue-300">
          <FaUser /> Profile
        </Link>
        <Link to="/reports" className="flex items-center gap-3 hover:text-blue-300">
          <FaFileMedicalAlt /> Reports
        </Link>
        <Link to="/logout" className="flex items-center gap-3 hover:text-red-400 mt-auto">
          <FaSignOutAlt /> Logout
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;
