import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import AtsChecker from './pages/AtsChecker';
import ResumeBuilder from './pages/ResumeBuilder';

export default function App() {
  // Simple view router for switching between the main app sections.
  const [currentView, setCurrentView] = useState('landing');
  const [isEngineConnected, setIsEngineConnected] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const isAnalyzingRef = useRef(false);
  const suppressOfflineUntilRef = useRef(0);

  const checkEngineConnection = useCallback(async () => {
    if (isAnalyzingRef.current) {
      return;
    }

    if (Date.now() < suppressOfflineUntilRef.current) {
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 2500);
      const response = await fetch('http://localhost:11434/api/tags', {
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);
      setIsEngineConnected(response.ok);
    } catch (error) {
      if (error?.name === 'AbortError') {
        setIsEngineConnected(false);
        return;
      }

      if (Date.now() < suppressOfflineUntilRef.current) {
        return;
      }

      setIsEngineConnected(false);
    }
  }, []);

  useEffect(() => {
    checkEngineConnection();

    const intervalId = window.setInterval(() => {
      checkEngineConnection();
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, [checkEngineConnection]);

  const handleAnalysisStateChange = useCallback((nextState = {}) => {
    if (typeof nextState.isAnalyzing === 'boolean') {
      isAnalyzingRef.current = nextState.isAnalyzing;
      setIsAnalyzing(nextState.isAnalyzing);
    }

    if (nextState.connected === true) {
      suppressOfflineUntilRef.current = Date.now() + 10000;
      setIsEngineConnected(true);
    } else if (nextState.connected === false) {
      setIsEngineConnected(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-neutral-surface flex flex-col font-sans select-none text-gray-800">
      {/* Shared top navigation for the app shell. */}
      <Navbar setView={setCurrentView} currentView={currentView} />

      {/* Main content area for the active view. */}
      <main className="flex-grow flex flex-col justify-center items-center">
        {currentView === 'landing' && <LandingPage setView={setCurrentView} />}
        {currentView === 'checker' && (
          <AtsChecker
            setView={setCurrentView}
            onAnalysisStateChange={handleAnalysisStateChange}
          />
        )}
        {currentView === 'builder' && <ResumeBuilder setView={setCurrentView} />}
      </main>

      {/* Shared footer with engine status and activity state. */}
      <Footer isEngineConnected={isEngineConnected} isAnalyzing={isAnalyzing} />
    </div>
  );
}