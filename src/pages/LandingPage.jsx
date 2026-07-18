import React from 'react';

export default function LandingPage({ setView }) {
  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-12 flex flex-col items-center justify-center animate-fade-in">
      
      {/* Main hero heading for the landing experience. */}
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight text-center mb-4">
        Optimize and Build Your Way to the <span className="text-brand-primary">Apex</span>
      </h1>
      <p className="text-lg text-gray-500 text-center max-w-2xl mb-12">
        A completely local, privacy-first toolset to analyze keyword compatibility and design flawless, high-scoring professional resumes.
      </p>

      {/* Feature cards for switching between the two main workflows. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mb-16">
        
        {/* Resume analysis entry point. */}
        <button 
          onClick={() => setView('checker')}
          className="bg-white border-2 border-gray-100 hover:border-brand-primary rounded-2xl p-8 text-left shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group flex flex-col justify-between min-h-[220px]"
        >
          <div>
            <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center mb-5 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors duration-300">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Resume ATS Checker</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Upload your current resume against a target title and company to locate critical keyword gaps instantly.
            </p>
          </div>
          <span className="mt-4 text-sm font-semibold text-brand-primary group-hover:text-brand-hover flex items-center gap-1">
            Analyze Resume &rarr;
          </span>
        </button>

        {/* Resume creation entry point. */}
        <button 
          onClick={() => setView('builder')}
          className="bg-white border-2 border-gray-100 hover:border-brand-primary rounded-2xl p-8 text-left shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group flex flex-col justify-between min-h-[220px]"
        >
          <div>
            <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center mb-5 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors duration-300">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Perfect Score Builder</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Generate an aligned structural template optimized precisely to capture full formatting compatibility scores.
            </p>
          </div>
          <span className="mt-4 text-sm font-semibold text-brand-primary group-hover:text-brand-hover flex items-center gap-1">
            Build Workspace &rarr;
          </span>
        </button>

      </div>

      {/* Privacy note shown beneath the feature cards. */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 max-w-2xl text-center">
        <p className="text-xs text-gray-500 font-medium">
           <span className="text-gray-700">100% Privacy Ensured:</span> All file processing, keyword matching, and model tasks are computed fully inside your local environment. Data never exits your system.
        </p>
      </div>
    </div>
  );
}