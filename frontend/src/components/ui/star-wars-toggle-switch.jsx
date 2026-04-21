import React from 'react';

const Switch = ({ checked, onChange }) => {
  return (
    <div className="scale-[0.5] sm:scale-[0.6] origin-center -my-6 group">
      <label className="relative inline-block cursor-pointer select-none">
        <input 
          className="sr-only" 
          type="checkbox" 
          checked={checked}
          onChange={onChange}
        />
        {/* Toggle Container with Glassmorphism */}
        <div className={`w-[170px] h-[90px] rounded-full transition-all duration-700 overflow-hidden relative 
          border-2 border-white/20 dark:border-white/10 shadow-2xl
          ${checked 
            ? 'bg-gradient-to-b from-[#070e2b] via-[#2c4770] to-[#628cac]' 
            : 'bg-gradient-to-b from-[#2c4770] via-[#628cac] to-[#a6c5d4]'}`}
        >
          {/* Animated Background Details */}
          <div className="absolute inset-0 pointer-events-none">
            {checked ? (
              <div className="absolute inset-0">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i}
                    className="absolute bg-white rounded-full animate-pulse"
                    style={{
                      width: Math.random() * 2 + 1 + 'px',
                      height: Math.random() * 2 + 1 + 'px',
                      top: Math.random() * 100 + '%',
                      left: Math.random() * 100 + '%',
                      animationDelay: Math.random() * 2 + 's'
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-2 right-4 w-16 h-8 bg-white/30 rounded-full blur-xl animate-bounce" style={{ animationDuration: '4s' }} />
                <div className="absolute top-10 right-12 w-12 h-6 bg-white/40 rounded-full blur-lg animate-pulse" />
              </div>
            )}
          </div>

          {/* BB8 Droid - Realistic CSS Build */}
          <div className={`absolute top-4 transition-all duration-700 flex flex-col items-center z-10
            ${checked ? 'left-[105px]' : 'left-[15px]'}`}
          >
            {/* BB8 Head */}
            <div className="relative w-[45px] h-[28px] bg-white rounded-t-full border-b-2 border-gray-300 shadow-lg group-hover:-translate-y-1 transition-transform">
              {/* Lens */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-dark-900 rounded-full border-2 border-gray-200 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full blur-[1px] animate-pulse" />
              </div>
              {/* Antennae */}
              <div className="absolute -top-3 left-3 w-0.5 h-4 bg-gray-400" />
              <div className="absolute -top-2 right-4 w-0.5 h-3 bg-gray-400" />
              {/* Detail Ring */}
              <div className="absolute bottom-1 w-full h-1 bg-orange-500/80" />
            </div>

            {/* BB8 Body */}
            <div className={`w-[65px] h-[65px] bg-white rounded-full border-2 border-gray-100 relative shadow-2xl transition-transform duration-700 mt-[-2px]
              ${checked ? 'rotate-[360deg]' : 'rotate-0'}`}
            >
              <div className="absolute inset-0 rounded-full border-[6px] border-orange-500/20" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45px] h-[45px] border-4 border-orange-500 rounded-full">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-orange-500/50" />
                <div className="absolute left-1/2 top-0 w-1 h-full bg-orange-500/50" />
                <div className="absolute inset-0 bg-gray-50/50 rounded-full flex items-center justify-center font-black text-[10px] text-orange-600">NV</div>
              </div>
            </div>
          </div>

          {/* Dynamic Shadow */}
          <div className={`absolute bottom-1 w-[70px] h-3 bg-black/30 rounded-full blur-md transition-all duration-700
            ${checked ? 'left-[102px]' : 'left-[12px]'}`} 
          />
          
          {/* Glass Overlay for Premium Look */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
        </div>
      </label>
    </div>
  );
}

export default Switch;
