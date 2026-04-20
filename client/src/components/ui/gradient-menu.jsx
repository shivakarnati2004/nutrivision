import React from 'react';
import { NavLink } from 'react-router-dom';

export default function GradientMenu({ items }) {
  return (
    <div className="flex justify-center items-center py-4 pointer-events-auto">
      <ul className="flex gap-4 sm:gap-6">
        {items.map(({ title, to, icon, gradientFrom, gradientTo }, idx) => (
          <li key={idx} className="list-none">
            <NavLink
              to={to}
              end={to === '/'}
              style={{ '--gradient-from': gradientFrom, '--gradient-to': gradientTo }}
              className={({ isActive }) => 
                `relative w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] shadow-xl rounded-full flex items-center justify-center transition-all duration-500 hover:w-[140px] sm:hover:w-[180px] hover:shadow-none group cursor-pointer ${
                  isActive ? 'bg-dark-900 shadow-none w-[140px] sm:w-[180px]' : 'bg-dark-950/80 backdrop-blur-md border border-white/10'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Gradient background on hover or active */}
                  <span className={`absolute inset-0 rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></span>
                  
                  {/* Blur glow */}
                  <span className={`absolute top-[10px] inset-x-0 h-full rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] blur-[15px] -z-10 transition-all duration-500 ${isActive ? 'opacity-50' : 'opacity-0 group-hover:opacity-50'}`}></span>

                  {/* Icon */}
                  <span className={`relative z-10 transition-all duration-500 delay-0 flex items-center justify-center ${isActive ? 'scale-0 opacity-0 absolute' : 'scale-100 group-hover:scale-0 group-hover:opacity-0 group-hover:absolute'}`}>
                    <span className="text-xl sm:text-2xl text-gray-300">{icon}</span>
                  </span>

                  {/* Title */}
                  <span className={`absolute text-white uppercase tracking-wider text-xs sm:text-sm font-bold transition-all duration-500 delay-150 ${isActive ? 'scale-100' : 'scale-0 group-hover:scale-100'}`}>
                    {title}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
