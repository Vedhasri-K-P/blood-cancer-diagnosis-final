import React from "react";

const Header = () => {
  return (
    <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
      <h1 className="text-2xl font-semibold text-blue-700">Smart Diagnostic Tool</h1>
      <div>
        <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
