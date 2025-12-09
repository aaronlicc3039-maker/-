import React, { useState } from 'react';
import Scene from './components/Scene';
import GestureController from './components/GestureController';
import { AppState } from './types';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.FORMED);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      
      {/* Fixed Luxury Header */}
      <header className="absolute top-0 left-0 w-full z-10 flex flex-col items-center pt-8 pointer-events-none select-none">
        <h1 className="font-serif text-4xl md:text-6xl text-center font-bold tracking-widest
          text-transparent bg-clip-text bg-gradient-to-b from-gold-300 via-gold-500 to-gold-900
          drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] animate-glow px-4">
          祝小曾圣诞节快乐！
        </h1>
        <div className="w-64 h-1 mt-4 bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-80" />
        <p className="mt-2 text-gold-100 text-xs md:text-sm tracking-[0.3em] uppercase opacity-70">
          Grand Luxury Interactive Edition
        </p>
      </header>

      {/* Instructions Overlay (Fades out or stays subtle) */}
      <div className="absolute bottom-10 right-10 z-10 text-right pointer-events-none opacity-60 mix-blend-screen hidden md:block">
        <p className="text-gold-100 text-sm font-serif italic">Controls</p>
        <div className="text-emerald-500 text-xs mt-1 space-y-1">
          <p>Open Palm <span className="text-white">→ Unleash Chaos</span></p>
          <p>Closed Fist <span className="text-white">→ Restore Form</span></p>
          <p>Mouse/Touch <span className="text-white">→ Rotate View</span></p>
        </div>
      </div>

      {/* 3D Scene */}
      <div className="w-full h-full">
        <Scene appState={appState} />
      </div>

      {/* Interaction Logic */}
      <GestureController onStateChange={setAppState} />
      
      {/* Manual Toggle for non-camera users */}
      <button 
        onClick={() => setAppState(prev => prev === AppState.FORMED ? AppState.CHAOS : AppState.FORMED)}
        className="absolute bottom-8 right-8 md:hidden z-20 px-6 py-3 
        bg-emerald-950 border border-gold-500 text-gold-300 rounded-full 
        font-serif text-sm uppercase tracking-wider shadow-[0_0_15px_rgba(255,215,0,0.3)]
        active:scale-95 transition-transform"
      >
        {appState === AppState.FORMED ? 'Unleash' : 'Restore'}
      </button>

    </div>
  );
}

export default App;
