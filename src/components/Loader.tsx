import React from 'react';
import { useTranslation } from 'react-i18next';

interface LoaderProps {
  text?: string;
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({ text, className = '' }) => {
  const { t } = useTranslation();
  const displayText = text || t('common.loading', 'Cargando...');

  return (
    <div className={`flex flex-col justify-around items-center w-full h-full p-8 min-h-[240px] min-w-[360px] ${className}`}>
      <div className="relative w-40 h-40 flex justify-center items-center">
        {/* Outer Orbit Ring */}
        <div className="absolute w-full h-full border-2 border-zinc-200 dark:border-zinc-700 rounded-full border-dashed animate-[spin_10s_linear_infinite]"></div>
        
        {/* Inner Orbit Ring */}
        <div className="absolute w-24 h-24 border border-zinc-200/50 dark:border-zinc-700/50 rounded-full border-dashed animate-[spin_8s_linear_infinite_reverse]"></div>

        {/* Planet */}
        <div className="absolute w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] overflow-hidden">
          {/* Planet Details */}
          <div className="absolute top-2 left-2 w-5 h-5 bg-white/20 rounded-full blur-[1px]"></div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-black/20 rounded-full blur-[2px]"></div>
          <div className="absolute top-1/2 left-1/4 w-8 h-1.5 bg-white/10 rounded-full -rotate-45"></div>
        </div>

        {/* Orbiting Moon 1 (Outer) */}
        <div className="absolute w-40 h-40 animate-[spin_3s_linear_infinite]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-zinc-100 dark:bg-zinc-300 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] border border-zinc-200 flex items-center justify-center overflow-hidden">
            {/* Crater */}
            <div className="absolute top-1 left-0.5 w-1.5 h-1.5 bg-black/10 rounded-full"></div>
          </div>
        </div>
        
        {/* Orbiting Moon 2 (Inner) */}
        <div className="absolute w-24 h-24 animate-[spin_2s_linear_infinite_reverse]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-amber-200 rounded-full shadow-[0_0_8px_rgba(253,230,138,0.6)]"></div>
        </div>
      </div>
      
      {/* Loading Text */}
      <div className="mt-12 text-zinc-500 dark:text-zinc-400 font-medium tracking-widest uppercase text-xl animate-pulse">
        {displayText}
      </div>
    </div>
  );
};

export default Loader;
