import { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);

  // Smooth springs for the cursor follower
  const springX = useSpring(0, { stiffness: 500, damping: 28 });
  const springY = useSpring(0, { stiffness: 500, damping: 28 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      springX.set(e.clientX - 16); // Center the 32px circle
      springY.set(e.clientY - 16);
    };

    const handleMouseOver = (e) => {
      // Check if hovering over clickable elements
      const target = e.target;
      const isClickable = 
        window.getComputedStyle(target).cursor === 'pointer' || 
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'button';
      setIsPointer(isClickable);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [springX, springY]);

  // Hide cursor on touch devices
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null;
  }

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-primary-500 pointer-events-none z-[100] mix-blend-difference"
        style={{
          x: springX,
          y: springY,
          scale: isPointer ? 1.5 : 1,
          backgroundColor: isPointer ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
          transition: 'scale 0.2s ease-out, background-color 0.2s ease-out'
        }}
      />
      <div 
        className="fixed top-0 left-0 w-2 h-2 bg-primary-400 rounded-full pointer-events-none z-[100] mix-blend-difference"
        style={{
          transform: `translate(${position.x - 4}px, ${position.y - 4}px)`,
          transition: 'transform 0.05s linear'
        }}
      />
    </>
  );
}
