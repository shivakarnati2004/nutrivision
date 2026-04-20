import React, { useEffect, useRef, useState } from 'react';

// Helper for random colors aligned with NutriVision theme
const randomNutritionColors = (count) => {
  const baseColors = ["#10b981", "#34d399", "#6ee7b7", "#3b82f6", "#60a5fa", "#8b5cf6"];
  return new Array(count)
    .fill(0)
    .map(() => baseColors[Math.floor(Math.random() * baseColors.length)]);
};

export default function TubesBackground({ 
  children, 
  className = "",
  enableClickInteraction = true 
}) {
  const canvasRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const tubesRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let cleanup;

    const initTubes = async () => {
      if (!canvasRef.current) return;

      try {
        // Load the external script dynamically
        const module = await import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js');
        const TubesCursor = module.default;

        if (!mounted) return;

        const app = TubesCursor(canvasRef.current, {
          tubes: {
            colors: ["#10b981", "#34d399", "#3b82f6"], // Primary, Accent, Blue
            lights: {
              intensity: 150,
              colors: ["#6ee7b7", "#10b981", "#60a5fa", "#8b5cf6"] // NutriVision glowing palette
            }
          }
        });

        tubesRef.current = app;
        setIsLoaded(true);

        const handleResize = () => {
          if (tubesRef.current && tubesRef.current.resize) {
            tubesRef.current.resize();
          }
        };

        window.addEventListener('resize', handleResize);
        
        cleanup = () => {
          window.removeEventListener('resize', handleResize);
          if (tubesRef.current && tubesRef.current.destroy) {
             tubesRef.current.destroy();
          }
        };

      } catch (error) {
        console.error("Failed to load TubesCursor:", error);
      }
    };

    initTubes();

    return () => {
      mounted = false;
      if (cleanup) cleanup();
    };
  }, []);

  const handleClick = () => {
    if (!enableClickInteraction || !tubesRef.current) return;
    
    const colors = randomNutritionColors(3);
    const lightsColors = randomNutritionColors(4);
    
    tubesRef.current.tubes.setColors(colors);
    tubesRef.current.tubes.setLightsColors(lightsColors);
  };

  return (
    <div 
      className={`relative w-full min-h-screen ${className}`}
      onClick={handleClick}
    >
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 w-full h-full block pointer-events-none"
        style={{ touchAction: 'none', zIndex: 0 }}
      />
      
      {/* Content Overlay */}
      <div className="relative z-10 w-full h-full pointer-events-auto">
        {children}
      </div>
    </div>
  );
}
