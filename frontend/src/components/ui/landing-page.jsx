import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"; 
import { motion } from "framer-motion";
import Globe from "./globe";
import { cn } from "../../lib/utils";

// Reusable ScrollGlobe component following shadcn/ui patterns
const defaultGlobeConfig = {
  positions: [
    { top: "50%", left: "75%", scale: 1.4 },  // Section 0
    { top: "25%", left: "50%", scale: 0.9 },  // Section 1
    { top: "15%", left: "90%", scale: 2 },    // Section 2
    { top: "50%", left: "50%", scale: 1.8 },  // Section 3
  ]
};

// Utility function to smoothly interpolate between values
const lerp = (start, end, factor) => {
  return start + (end - start) * factor;
};

// Parse percentage string to number
const parsePercent = (str) => parseFloat(str.replace('%', ''));

function ScrollGlobe({ sections, globeConfig = defaultGlobeConfig, className }) {
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [globeTransform, setGlobeTransform] = useState("");
  const containerRef = useRef(null);
  const sectionRefs = useRef([]);
  const animationFrameId = useRef();
  
  // Pre-calculate positions
  const calculatedPositions = useMemo(() => {
    return globeConfig.positions.map(pos => ({
      top: parsePercent(pos.top),
      left: parsePercent(pos.left),
      scale: pos.scale
    }));
  }, [globeConfig.positions]);

  // Enhanced scroll tracking with interpolation
  const updateScrollPosition = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Calculate total progress within THIS component
    const totalHeight = rect.height;
    const scrolled = -rect.top;
    const progress = Math.min(Math.max(scrolled / (totalHeight - windowHeight), 0), 1);
    
    setScrollProgress(progress);

    // Continuous position interpolation
    const sectionCount = sections.length;
    const segmentProgress = progress * (sectionCount - 1);
    const index = Math.floor(segmentProgress);
    const nextIndex = Math.min(index + 1, sectionCount - 1);
    const localFactor = segmentProgress - index;

    const startPos = calculatedPositions[index];
    const endPos = calculatedPositions[nextIndex];

    const currentLeft = lerp(startPos.left, endPos.left, localFactor);
    const currentTop = lerp(startPos.top, endPos.top, localFactor);
    const currentScale = lerp(startPos.scale, endPos.scale, localFactor);

    // Apply transform - removed the long CSS transition for immediate reaction
    const transform = `translate3d(${currentLeft}vw, ${currentTop}vh, 0) translate3d(-50%, -50%, 0) scale3d(${currentScale}, ${currentScale}, 1)`;
    
    setGlobeTransform(transform);

    // Section detection for UI elements
    const viewportCenter = windowHeight / 2;
    let newActiveSection = 0;
    let minDistance = Infinity;

    sectionRefs.current.forEach((ref, i) => {
      if (ref) {
        const sRect = ref.getBoundingClientRect();
        const sectionCenter = sRect.top + sRect.height / 2;
        const distance = Math.abs(sectionCenter - viewportCenter);
        if (distance < minDistance) {
          minDistance = distance;
          newActiveSection = i;
        }
      }
    });

    setActiveSection(newActiveSection);
  }, [calculatedPositions, sections.length]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        animationFrameId.current = requestAnimationFrame(() => {
          updateScrollPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateScrollPosition();
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [updateScrollPosition]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full max-w-screen overflow-x-hidden min-h-screen bg-background text-foreground",
        className
      )}
    >
      {/* Dark Overlay to make the globe pop in Light Mode */}
      <div className="absolute inset-0 z-0 bg-dark-950/10 dark:bg-transparent pointer-events-none" />

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-0.5 bg-gradient-to-r from-border/20 via-border/40 to-border/20 z-50">
        <div 
          className="h-full bg-gradient-to-r from-primary-500 via-emerald-600 to-emerald-900 will-change-transform shadow-sm"
          style={{ 
            transform: `scaleX(${scrollProgress})`,
            transformOrigin: 'left center',
            transition: 'transform 0.1s linear',
          }}
        />
      </div>

      {/* Enhanced Navigation */}
      <div className="hidden sm:flex fixed right-4 top-1/2 -translate-y-1/2 z-40">
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="relative group">
              <div
                className={cn(
                  "nav-label absolute right-8 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap bg-background/95 backdrop-blur-md border border-border/60 shadow-xl z-50 transition-all",
                  activeSection === index ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                  <span>{section.badge || `Section ${index + 1}`}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className={cn(
                  "relative w-3 h-3 rounded-full border-2 transition-all duration-300 hover:scale-125",
                  activeSection === index 
                    ? "bg-primary-500 border-primary-500 shadow-lg shadow-primary-500/20" 
                    : "bg-transparent border-dark-400/40 hover:border-primary-500/60"
                )}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Ultra-smooth Responsive Globe - REACTING TO SCROLL */}
      <div
        className="fixed z-10 pointer-events-none will-change-transform"
        style={{
          transform: globeTransform,
          filter: `opacity(${0.7 + (scrollProgress * 0.2)}) drop-shadow(0 0 50px rgba(16, 185, 129, ${0.2 + scrollProgress * 0.3}))`,
        }}
      >
        <div className="scale-75 sm:scale-90 lg:scale-110 drop-shadow-[0_0_80px_rgba(255,255,255,0.15)]">
          <Globe />
        </div>
      </div>

      {/* Dynamic sections */}
      {sections.map((section, index) => (
        <section
          key={section.id}
          ref={(el) => (sectionRefs.current[index] = el)}
          className={cn(
            "relative min-h-screen flex flex-col justify-center px-6 md:px-12 z-20 py-20",
            section.align === 'center' && "items-center text-center",
            section.align === 'right' && "items-end text-right",
            section.align !== 'center' && section.align !== 'right' && "items-start text-left"
          )}
        >
          <div className="w-full max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <span className="inline-block px-4 py-1.5 rounded-full bg-primary-500/10 text-primary-500 text-xs font-black tracking-[0.3em] uppercase mb-4 border border-primary-500/20">
                  {section.badge}
                </span>
                <h2 className={cn(
                  "font-black leading-[1.1] tracking-tighter drop-shadow-2xl",
                  index === 0 ? "text-6xl md:text-9xl" : "text-5xl md:text-7xl"
                )}>
                  <span className="bg-gradient-to-br from-dark-900 via-dark-800 to-dark-600 dark:from-white dark:via-white/90 dark:to-white/60 bg-clip-text text-transparent">
                    {section.title}
                  </span>
                </h2>
              </div>
              
              <p className={cn(
                "text-dark-500 dark:text-dark-400 leading-relaxed text-xl md:text-2xl font-medium max-w-2xl backdrop-blur-sm",
                section.align === 'center' && "mx-auto"
              )}>
                {section.description}
              </p>

              {section.features && (
                <div className="grid gap-6">
                  {section.features.map((feature, i) => (
                    <motion.div 
                      key={feature.title}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-8 glass-card border-white/20 dark:bg-white/5 hover:bg-white/10 transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-2 h-12 bg-primary-500 rounded-full group-hover:scale-y-110 transition-transform" />
                        <div>
                          <h3 className="font-black text-dark-900 dark:text-white text-2xl mb-2">{feature.title}</h3>
                          <p className="text-dark-500 dark:text-dark-400 text-lg leading-relaxed">{feature.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {section.actions && (
                <div className={cn(
                  "flex flex-col sm:flex-row gap-6 mt-10",
                  section.align === 'center' && "justify-center",
                  section.align === 'right' && "justify-end"
                )}>
                  {section.actions.map((action) => (
                    <button
                      key={action.label}
                      onClick={action.onClick}
                      className={cn(
                        "px-10 py-5 rounded-2xl font-black transition-all duration-300 text-sm tracking-[0.2em] uppercase active:scale-95",
                        action.variant === 'primary' 
                          ? "bg-primary-500 text-white shadow-[0_20px_40px_-15px_rgba(16,185,129,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(16,185,129,0.5)] hover:-translate-y-1" 
                          : "bg-white/5 dark:bg-white/5 border-2 border-dark-900/10 dark:border-white/10 text-dark-900 dark:text-white hover:bg-white/10"
                      )}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </section>
      ))}
    </div>
  );
}

export default function GlobeScrollDemo() {
  const demoSections = [
    {
      id: "vision",
      badge: "NutriVision",
      title: "Global Nutrition",
      subtitle: "AI Without Borders",
      description: "Analyze thousands of local and international dishes instantly. Our AI is trained on a global dataset to understand every spice, every grain, and every calorie.",
      align: "left",
      actions: [
        { label: "Start Free", variant: "primary", onClick: () => window.location.href = "/signup" }
      ]
    },
    {
      id: "data",
      badge: "Precision",
      title: "Science-Backed Data",
      description: "Connected to trusted nutritional databases worldwide. We provide micro and macro data with clinical precision, helping you make informed decisions wherever you are.",
      align: "center",
    },
    {
      id: "impact",
      badge: "Impact",
      title: "Healthy Planet",
      subtitle: "Personal Health",
      description: "Your choices affect the world. NutriVision helps you track carbon footprint and sustainability of your diet alongside your personal health goals.",
      align: "left",
      features: [
        { title: "Eco-Tracking", description: "Understand the environmental impact of your meals." },
        { title: "Local Ingredients", description: "Supporting regional agriculture with localized food data." }
      ]
    },
    {
      id: "future",
      badge: "Tomorrow",
      title: "Fueling the Future",
      subtitle: "One Meal at a Time",
      description: "Join millions who are taking control of their longevity. The future of nutrition is personalized, intelligent, and global.",
      align: "center",
      actions: [
        { label: "Join the Movement", variant: "primary", onClick: () => window.location.href = "/signup" }
      ]
    }
  ];

  return (
    <ScrollGlobe 
      sections={demoSections}
      className="bg-transparent"
    />
  );
}
