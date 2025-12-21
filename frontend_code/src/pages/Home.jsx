// src/pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Brain, Search, FileText, Trophy } from "lucide-react";

export default function Home() {

  return (
    // --- THIS IS THE FIX ---
    // Removed "flex items-center" from this div
    <div className="relative"> 
      {/* Background Image */}
      <div className="absolute inset-0 -z-10 opacity-10"
        style={{
          backgroundImage: "url('/images/bg-medical.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(1px)"
        }}
      />
      
      {/* Main Content Container */}
      {/* This 'py-16' (padding) will create the top/bottom space */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        
        {/* --- Hero Section --- */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Welcome to Smart Diagnostic Tool
        </h1>
        <p className="text-lg text-gray-700 mb-8">
          Upload your reports, visualize disease predictions, and download AI-generated results securely.
        </p> 

        <div className="flex flex-wrap items-center gap-4">
          <Link
            to="/signup"
            className="px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Get Started (Sign up)
          </Link>
          <Link
            to="/login"
            className="px-5 py-3 rounded-lg border border-blue-600 text-blue-700 hover:bg-blue-50"
          >
            Sign in
          </Link>
          <Link
            to="/about"
            className="px-5 py-3 rounded-lg text-gray-700 hover:text-black font-medium"
          >
            Learn more →
          </Link>
        </div>

        {/* --- Feature Cards (with icons) --- */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-lg border bg-white shadow-sm">
            <Brain className="w-6 h-6 mb-2 text-blue-600" />
            <h3 className="font-semibold mb-1">AI Predictions</h3>
            <p className="text-sm text-gray-600">Classify blood cancers with confidence scores.</p>
          </div>
          <div className="p-5 rounded-lg border bg-white shadow-sm">
            <Search className="w-6 h-6 mb-2 text-blue-600" />
            <h3 className="font-semibold mb-1">Explainability</h3>
            <p className="text-sm text-gray-600">Grad-CAM heatmaps highlight key regions.</p>
          </div>
          <div className="p-5 rounded-lg border bg-white shadow-sm">
            <FileText className="w-6 h-6 mb-2 text-blue-600" />
            <h3 className="font-semibold mb-1">Reports</h3>
            <p className="text-sm text-gray-600">Download shareable PDF summaries.</p>
          </div>
        </div>

        {/* --- Peer-Reviewed Section --- */}
        <div className="mt-12 p-5 rounded-lg border bg-blue-50/50 flex items-center gap-4">
          <Trophy className="w-8 h-8 text-blue-700 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-800">Based on Peer-Reviewed Research</h3>
            <p className="text-sm text-blue-700">The methodology for this tool was accepted for publication based on its robust performance and clinical applicability.</p>
          </div>
        </div>
        
        <footer className="w-full border-t bg-white"> 
      <div className="max-w-6xl mx-auto px-4 py-8">
        
       

        {/* Standard Footer Links */}
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <p className="text-sm text-gray-500 mb-2 md:mb-0">
            © {new Date().getFullYear()} Smart Diagnostic Tool. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {/* Use Link component if you want client-side routing, otherwise 'a' is fine */}
            <a href="/about" className="text-sm text-gray-600 hover:text-black">About</a> 
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-600">Version 1.0.0</span> 
          </div>
        </div>
        
      </div>
    </footer>

      </div>
    </div>
  );
}