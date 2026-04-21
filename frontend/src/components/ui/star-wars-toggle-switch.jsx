import React from 'react';

const Switch = ({ checked, onChange }) => {
  return (
    <div className="scale-[0.5] sm:scale-[0.6] origin-center -my-6">
      <label className="relative inline-block cursor-pointer select-none">
        <input 
          className="sr-only" 
          type="checkbox" 
          checked={checked}
          onChange={onChange}
        />
        {/* Toggle Container */}
        <div className={`w-[170px] h-[90px] rounded-full transition-all duration-500 overflow-hidden relative border-2 border-white/10
          ${checked 
            ? 'bg-gradient-to-b from-[#070e2b] via-[#2c4770] to-[#628cac]' 
            : 'bg-gradient-to-b from-[#2c4770] via-[#628cac] to-[#a6c5d4]'}`}
        >
          {/* Scenery (Stars/Clouds) */}
          <div className="absolute inset-0 pointer-events-none">
            {checked ? (
              <div className="absolute inset-0">
                <div className="absolute top-2 left-10 w-0.5 h-0.5 bg-white rounded-full shadow-[0_0_2px_white] animate-pulse" />
                <div className="absolute top-8 left-20 w-1 h-1 bg-white rounded-full shadow-[0_0_2px_white] animate-pulse" />
                <div className="absolute top-4 left-32 w-0.5 h-0.5 bg-white rounded-full shadow-[0_0_2px_white] animate-pulse" />
                <div className="absolute top-12 left-8 w-1 h-1 bg-white rounded-full shadow-[0_0_2px_white] animate-pulse" />
              </div>
            ) : (
              <div className="absolute inset-0">
                <div className="absolute top-4 right-10 w-12 h-6 bg-white/20 rounded-full blur-md" />
                <div className="absolute top-10 right-20 w-8 h-4 bg-white/30 rounded-full blur-sm" />
              </div>
            )}
          </div>

          {/* BB8 Droid */}
          <div className={`absolute top-4 transition-all duration-500 flex flex-col items-center
            ${checked ? 'left-[100px]' : 'left-[15px]'}`}
          >
            {/* Head */}
            <div className="relative w-[40px] h-[25px] bg-white rounded-t-full border-b-2 border-gray-400 overflow-hidden">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-dark-900 rounded-full border border-gray-300" />
              <div className="absolute bottom-1 w-full h-1 bg-orange-500" />
            </div>
            {/* Body */}
            <div className={`w-[60px] h-[60px] bg-white rounded-full border-2 border-gray-200 relative overflow-hidden transition-transform duration-500
              ${checked ? 'rotate-[360deg]' : 'rotate-0'}`}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40px] h-[40px] border-4 border-orange-500 rounded-full">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-orange-500" />
                <div className="absolute left-1/2 top-0 w-1 h-full bg-orange-500" />
              </div>
            </div>
          </div>

          {/* Shadow */}
          <div className={`absolute bottom-1 w-[60px] h-2 bg-black/20 rounded-full blur-sm transition-all duration-500
            ${checked ? 'left-[100px]' : 'left-[15px]'}`} 
          />
        </div>
      </label>
    </div>
  );
}

export default Switch;
