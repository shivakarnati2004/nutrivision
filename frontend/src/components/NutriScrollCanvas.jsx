import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 140;

export default function NutriScrollCanvas() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [scrollPct, setScrollPct] = useState(0);
  const rafRef = useRef(null);

  // Preload all frames
  useEffect(() => {
    const loaded = [];
    let count = 0;
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src = `/sequence/frame-${i}.jpg`;
      img.onload = () => {
        count++;
        setProgress(Math.floor((count / FRAME_COUNT) * 100));
        if (count === FRAME_COUNT) {
          setImages(loaded);
          setIsLoading(false);
        }
      };
      img.onerror = () => {
        count++;
        if (count === FRAME_COUNT) {
          setImages(loaded);
          setIsLoading(false);
        }
      };
      loaded[i] = img;
    }
  }, []);

  // GSAP ScrollTrigger handler
  useEffect(() => {
    if (isLoading || !containerRef.current) return;

    // Let GSAP pin the container. The end value controls the scroll duration (sync).
    const st = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "+=300%", // 3 times the viewport height of scrollable area
      pin: true,
      scrub: 0.5,
      onUpdate: (self) => {
        const pct = self.progress;
        setScrollPct(pct);
        const frame = Math.min(FRAME_COUNT - 1, Math.max(0, Math.floor(pct * FRAME_COUNT)));
        setCurrentFrame(frame);
      }
    });

    return () => {
      st.kill();
    };
  }, [isLoading]);

  // Canvas render loop
  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx || images.length < FRAME_COUNT) return;

      const img = images[currentFrame];
      if (img && img.complete && img.naturalWidth > 0) {
        const cw = canvas.width;
        const ch = canvas.height;
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        // Cover fit
        const scale = Math.max(cw / iw, ch / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const ox = (cw - dw) / 2;
        const oy = (ch - dh) / 2;
        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(img, ox, oy, dw, dh);
      }
      rafRef.current = requestAnimationFrame(render);
    };
    if (!isLoading) {
      rafRef.current = requestAnimationFrame(render);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [images, isLoading, currentFrame]);

  // Resize canvas
  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) {
        const dpr = window.devicePixelRatio || 1;
        canvasRef.current.width = window.innerWidth * dpr;
        canvasRef.current.height = window.innerHeight * dpr;
      }
    };
    window.addEventListener("resize", resize);
    resize();
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#ededed]">
          <div className="w-48 h-1 bg-black/10 overflow-hidden rounded-full">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="mt-4 text-xs tracking-widest uppercase text-gray-500 font-medium font-mono">
            Loading {progress}%
          </span>
        </div>
      )}

      {/* 
        Container for ScrollTrigger. 
        GSAP will strictly pin this 100vh element, naturally synchronizing the timeline.
      */}
      <div
        ref={containerRef}
        className="relative h-screen w-full overflow-hidden bg-black"
      >
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block" }}
        />

        {/* ── Text Overlays ── */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">

            {/* Beat A: "SEE YOUR FOOD DIFFERENTLY" — Glass effect */}
            {scrollPct < 0.25 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: scrollPct < 0.18 ? 1 : 0, y: scrollPct < 0.18 ? 0 : -30 }}
                transition={{ duration: 0.4 }}
                className="text-center max-w-4xl absolute z-10 px-4"
              >
                <div className="inline-block">
                  <h1 className="text-4xl md:text-6xl lg:text-9xl font-black tracking-tighter text-white drop-shadow-2xl">
                    FUTURE OF
                  </h1>
                  <h1 className="text-4xl md:text-6xl lg:text-9xl font-black tracking-tighter text-primary-500 drop-shadow-2xl">
                    HEALTH.
                  </h1>
                  <p className="text-base md:text-lg mt-4 text-white/80 font-light tracking-wide drop-shadow-md">
                    Every ingredient has a story to tell.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Beat B: "ALIGNED NUTRITION" — Glass effect */}
            {scrollPct >= 0.3 && scrollPct < 0.65 && (
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: scrollPct >= 0.35 && scrollPct < 0.58 ? 1 : 0, x: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute left-6 md:left-16 text-left max-w-xl z-10"
              >
                <div className="inline-block">
                  <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white drop-shadow-lg">
                    ALIGNED<br />NUTRITION.
                  </h2>
                  <p className="text-base md:text-lg mt-3 text-white/80 font-light drop-shadow-md">
                    Chaos converges into clarity.<br />Precision in every bite.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Beat C removed as per user request */}

            {/* Scroll Indicator — only at start */}
            {scrollPct < 0.1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                className="absolute bottom-8 flex flex-col items-center"
              >
                <div className="w-[1px] h-12 bg-gradient-to-b from-white/60 to-transparent mb-2" />
                <span className="text-[10px] tracking-[0.3em] uppercase text-white/70 font-mono drop-shadow-md">
                  Scroll to Evolve
                </span>
              </motion.div>
            )}
        </div>
      </div>
    </>
  );
}
