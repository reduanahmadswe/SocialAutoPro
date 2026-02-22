// components/PostForm/PlatformCard.tsx
'use client';

import { PublishPlatform } from '@/types';
import { PLATFORM_CONFIG } from './constants';


interface PlatformCardProps {
  platform: PublishPlatform;
  isSelected: boolean;
  onToggle: () => void;
}

export function PlatformCard({ platform, isSelected, onToggle }: PlatformCardProps) {
  const config = PLATFORM_CONFIG[platform];

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`group relative w-full p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 ${
        isSelected
          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50/50 shadow-lg shadow-blue-500/10'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div 
          className={`p-2 sm:p-2.5 rounded-xl transition-all duration-300 flex-shrink-0 ${
            isSelected ? 'bg-white shadow-sm' : 'bg-slate-50 group-hover:bg-slate-100'
          }`}
          style={{ color: config.color }}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 text-left min-w-0">
          <h3 className="font-semibold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <span className="truncate">{config.label}</span>
            {config.isPage && (
              <span className="text-[10px] font-medium bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full flex-shrink-0">
                Page
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
            {config.description}
          </p>
        </div>

        {/* Check Indicator */}
        <div className={`relative w-5 h-5 rounded-full border-2 transition-all duration-300 flex-shrink-0 ${
          isSelected 
            ? 'border-blue-500 bg-blue-500 scale-110' 
            : 'border-slate-300 bg-white'
        }`}>
          {isSelected && (
            <svg 
              className="absolute inset-0 w-full h-full text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      {/* Glow Effect */}
      {isSelected && (
        <div className="absolute inset-0 -z-10 bg-blue-500/5 blur-xl rounded-2xl opacity-50" />
      )}
    </button>
  );
}