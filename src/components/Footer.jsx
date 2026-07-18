import React from 'react';

export default function Footer({ isEngineConnected = false, isAnalyzing = false }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white border-t border-gray-100 py-6 px-6 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-gray-400">
        
        {/* Dynamic Engine Connection Status Indicator */}
        <div className="flex items-center gap-2 transition-colors duration-300">
          <span 
            className={`inline-block w-2 h-2 rounded-full animate-pulse transition-colors duration-300 ${
              isEngineConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          ></span>
          <span className={isEngineConnected ? 'text-gray-600' : 'text-red-500 font-semibold'}>
            Local Engine Status: {isAnalyzing ? 'Analyzing…' : isEngineConnected ? 'Standard Connection Secure' : 'Offline / Connection Refused'}
          </span>
        </div>

        {/* Minimal Copyright Signature */}
        <div>
          &copy; {currentYear} <span className="text-gray-600 font-semibold">Apex Resume</span>. Open Source Utility.
        </div>

      </div>
    </footer>
  );
}