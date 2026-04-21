import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"; 
import Globe from "./globe";
import { cn } from "../../lib/utils";

const defaultGlobeConfig = {
  positions: [
    { top: "50%", left: "75%", scale: 1.4 },  // Hero: Right side, balanced
    { top: "25%", left: "50%", scale: 0.9 },  // Innovation: Top side, subtle
    { top: "15%", left: "90%", scale: 2 },  // Discovery: Left side, medium
    { top: "50%", left: "50%", scale: 1.8 },  // Future: Center, large backdrop
  ]
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
  
  // Pre-calculate positions for performance
  const calculatedPositions = useMemo(() => {
    return globeConfig.positions.map(pos => ({
      top: parsePercent(pos.top),
      left: parsePercent(pos.left),
      scale: pos.scale
    }));
  }, [globeConfig.positions]);

  // Simple, direct scroll tracking
  const updateScrollPosition = useCallback(() => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(Math.max(scrollTop / docHeight, 0), 1);
    
    setScrollProgress(progress);

    // Simple section detection
    const viewportCenter = window.innerHeight / 2;
    let newActiveSection = 0;
    let minDistance = Infinity;

    sectionRefs.current.forEach((ref, index) => {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const distance = Math.abs(sectionCenter - viewportCenter);
        
        if (distance < minDistance) {
          minDistance = distance;
          newActiveSection = index;
        }
      }
    });

    // Direct position update - no interpolation
    const currentPos = calculatedPositions[newActiveSection];
    const transform = `translate3d(${currentPos.left}vw, ${currentPos.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${currentPos.scale}, ${currentPos.scale}, 1)`;
    
    setGlobeTransform(transform);
    setActiveSection(newActiveSection);
  }, [calculatedPositions]);

  // Throttled scroll handler with RAF
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
    updateScrollPosition(); // Initial call
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [updateScrollPosition]);

  // Initial globe position
  useEffect(() => {
    const initialPos = calculatedPositions[0];
    const initialTransform = `translate3d(${initialPos.left}vw, ${initialPos.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${initialPos.scale}, ${initialPos.scale}, 1)`;
    setGlobeTransform(initialTransform);
  }, [calculatedPositions]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full max-w-screen overflow-x-hidden min-h-screen bg-background text-foreground",
        className
      )}
    >
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-0.5 bg-gradient-to-r from-border/20 via-border/40 to-border/20 z-50">
        <div 
          className="h-full bg-gradient-to-r from-primary-500 via-emerald-600 to-emerald-900 will-change-transform shadow-sm"
          style={{ 
            transform: `scaleX(${scrollProgress})`,
            transformOrigin: 'left center',
            transition: 'transform 0.15s ease-out',
          }}
        />
      </div>

      {/* Navigation Dot Indicators */}
      <div className="hidden sm:flex fixed right-4 top-1/2 -translate-y-1/2 z-40">
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="relative group">
              <button
                onClick={() => {
                  sectionRefs.current[index]?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'center'
                  });
                }}
                className={cn(
                  "relative w-3 h-3 rounded-full border-2 transition-all duration-300 hover:scale-125",
                  activeSection === index 
                    ? "bg-primary-500 border-primary-500 shadow-lg shadow-primary-500/20" 
                    : "bg-transparent border-dark-400/40 hover:border-primary-500/60"
                )}
                aria-label={`Go to ${section.badge || `section ${index + 1}`}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Globe Background */}
      <div
        className="fixed z-10 pointer-events-none will-change-transform transition-all duration-[1400ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{
          transform: globeTransform,
          filter: `opacity(${activeSection === 3 ? 0.3 : 0.7})`,
        }}
      >
        <div className="scale-75 sm:scale-90 lg:scale-100">
          <Globe />
        </div>
      </div>

      {/* Content Sections */}
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
            <h2 className={cn(
              "font-black mb-8 leading-[1.1] tracking-tighter",
              index === 0 ? "text-5xl md:text-8xl" : "text-4xl md:text-6xl"
            )}>
              <span className="bg-gradient-to-r from-dark-900 to-dark-600 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
                {section.title}
              </span>
              {section.subtitle && (
                <span className="block text-primary-500 text-[0.4em] mt-4 font-bold tracking-widest uppercase">
                  {section.subtitle}
                </span>
              )}
            </h2>
            
            <p className={cn(
              "text-dark-500 dark:text-dark-400 leading-relaxed mb-10 text-lg md:text-xl font-medium max-w-2xl",
              section.align === 'center' && "mx-auto"
            )}>
              {section.description}
            </p>

            {/* Features List */}
            {section.features && (
              <div className="grid gap-4 mb-10">
                {section.features.map((feature) => (
                  <div key={feature.title} className="p-6 glass-card border-white/10">
                    <h3 className="font-bold text-dark-900 dark:text-white text-lg mb-1">{feature.title}</h3>
                    <p className="text-dark-500 dark:text-dark-400 text-sm">{feature.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            {section.actions && (
              <div className={cn(
                "flex flex-col sm:flex-row gap-4",
                section.align === 'center' && "justify-center",
                section.align === 'right' && "justify-end"
              )}>
                {section.actions.map((action) => (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className={cn(
                      "px-8 py-4 rounded-xl font-bold transition-all duration-300 text-sm tracking-widest uppercase",
                      action.variant === 'primary' 
                        ? "bg-primary-500 text-white shadow-xl shadow-primary-500/20 hover:scale-105" 
                        : "border-2 border-dark-900/10 dark:border-white/10 text-dark-900 dark:text-white hover:bg-white/5"
                    )}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
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
