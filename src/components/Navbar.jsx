import React from 'react';

export default function Navbar({ setView, currentView }) {
  return (
    <nav className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Brand Identity / Logo Trigger */}
        <button 
          onClick={() => setView('landing')}
          className="flex items-center gap-2 group transition-opacity hover:opacity-90 focus:outline-none"
        >
          {/* Hexagonal Core Brand Shape matching your structural style */}
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:bg-brand-hover transition-colors">
            A
          </div>
          <span className="text-xl font-extrabold tracking-tight text-gray-900">
            Apex<span className="text-brand-primary">Resume</span>
          </span>
        </button>

        {/* Global Action Navigation Cluster */}
        <div className="flex items-center gap-6">
          
          {/* Quick Portal Switch Links */}
          <div className="hidden sm:flex items-center gap-2 bg-gray-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setView('checker')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                currentView === 'checker' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              ATS Checker
            </button>
            <button
              onClick={() => setView('builder')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                currentView === 'builder' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Resume Builder
            </button>
          </div>

          {/* Clean Muted Utility Link */}
          <a 
            href="#about" 
            className="text-sm font-medium text-gray-500 hover:text-brand-primary transition-colors"
            onClick={(e) => {
              e.preventDefault();
              alert("Apex Resume v1.0.0 — Privacy-focused offline optimizer.");
            }}
          >
            About
          </a>
          
        </div>
      </div>
    </nav>
  );
}