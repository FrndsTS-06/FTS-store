import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* High-tech frosted glass micro-refraction dot grid */}
      <div 
        className="absolute inset-0 opacity-[0.045]" 
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.7) 1px, transparent 1px)`,
          backgroundSize: '28px 28px'
        }}
      />

      {/* Subtle diagonal ambient glass light ray sweep */}
      <div 
        className="absolute -inset-[100%] opacity-15 rotate-12 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent blur-3xl pointer-events-none"
      />

      {/* Aurora Orb 1 - Deep Indigo & Royal Blue floating in top left */}
      <div 
        className="absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-indigo-600/30 via-blue-600/25 to-sky-500/10 blur-[140px] animate-float-slow"
      />

      {/* Aurora Orb 2 - Electric Purple & Fuchsia drifting in middle right */}
      <div 
        className="absolute top-[25%] -right-32 w-[650px] h-[650px] rounded-full bg-gradient-to-bl from-purple-600/25 via-fuchsia-600/20 to-pink-500/10 blur-[150px] animate-float-reverse"
      />

      {/* Aurora Orb 3 - Radiant Cyan & Teal glow floating near lower left */}
      <div 
        className="absolute -bottom-32 left-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-t from-cyan-500/20 via-blue-600/20 to-teal-400/10 blur-[130px] animate-float"
      />

      {/* Aurora Orb 4 - Subtle Amber & Violet accent drifting in bottom right */}
      <div 
        className="absolute -bottom-20 right-[5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-amber-500/15 via-rose-500/15 to-purple-600/15 blur-[140px] animate-float-slow"
      />
    </div>
  );
};

