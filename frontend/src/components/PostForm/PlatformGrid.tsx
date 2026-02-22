// components/PostForm/PlatformGrid.tsx
'use client';

import { PublishPlatform } from '@/types';
import { ALL_PLATFORMS } from './constants';
import { PlatformCard } from './PlatformCard';


interface PlatformGridProps {
  selectedPlatforms: PublishPlatform[];
  onPlatformToggle: (platform: PublishPlatform) => void;
}

export function PlatformGrid({ selectedPlatforms, onPlatformToggle }: PlatformGridProps) {
  const isAllSelected = ALL_PLATFORMS.every(p => selectedPlatforms.includes(p));

  const toggleAll = () => {
    if (isAllSelected) {
      ALL_PLATFORMS.forEach(p => {
        if (selectedPlatforms.includes(p)) {
          onPlatformToggle(p);
        }
      });
    } else {
      ALL_PLATFORMS.forEach(p => {
        if (!selectedPlatforms.includes(p)) {
          onPlatformToggle(p);
        }
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Select All Button */}
      <button
        type="button"
        onClick={toggleAll}
        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-between group"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {isAllSelected ? 'Deselect All' : 'Select All Platforms'}
        </span>
        <span className="text-xs bg-slate-100 px-2 py-1 rounded-full group-hover:bg-slate-200">
          {selectedPlatforms.length}/{ALL_PLATFORMS.length}
        </span>
      </button>

      {/* Platform Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ALL_PLATFORMS.map((platform) => (
          <PlatformCard
            key={platform}
            platform={platform}
            isSelected={selectedPlatforms.includes(platform)}
            onToggle={() => onPlatformToggle(platform)}
          />
        ))}
      </div>
    </div>
  );
}