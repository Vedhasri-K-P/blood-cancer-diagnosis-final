import React from 'react';

export default function Footer() {
  return (
    // Removed 'mt-auto' or 'mt-12'. The Grid layout positions this element.
    <footer className="w-full border-t bg-white"> 
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Medical Disclaimer */}
        <div className="mb-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-center md:text-left">
          <h4 className="font-semibold text-yellow-800">Disclaimer</h4>
          <p className="text-sm text-yellow-700">
            This tool is for educational and research purposes only. It is not a substitute 
            for professional medical advice, diagnosis, or treatment.
          </p>
        </div>

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
  );
}
