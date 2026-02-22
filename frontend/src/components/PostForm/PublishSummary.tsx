// components/PostForm/PublishSummary.tsx
'use client';

import { PublishPlatform } from '@/types';
import { PostFormData } from './types';
import { PLATFORM_CONFIG } from './constants';


interface PublishSummaryProps {
  form: PostFormData;
  selectedPlatforms: PublishPlatform[];
  isSubmitting: boolean;
}

export function PublishSummary({ form, selectedPlatforms, isSubmitting }: PublishSummaryProps) {
  const contentPreview = form.content.length > 100 
    ? `${form.content.substring(0, 100)}...` 
    : form.content;

  return (
    <div className="space-y-4 sm:space-y-5">
      <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
        <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
        Publishing Summary
      </h2>

      {/* Selected Platforms */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Platforms ({selectedPlatforms.length})
        </h3>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {selectedPlatforms.map(platform => {
            const config = PLATFORM_CONFIG[platform];
            return (
              <span
                key={platform}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium"
                style={{ 
                  backgroundColor: config.bg,
                  color: config.color
                }}
              >
                <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0">{config.icon}</span>
                <span className="truncate">{config.label}</span>
              </span>
            );
          })}
          {selectedPlatforms.length === 0 && (
            <p className="text-xs text-slate-400 italic">No platforms selected</p>
          )}
        </div>
      </div>

      {/* Post Preview */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Post Preview
        </h3>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          {form.title && (
            <h4 className="font-medium text-slate-800 text-sm line-clamp-1">
              {form.title}
            </h4>
          )}
          {form.content && (
            <p className="text-xs text-slate-600 line-clamp-2">
              {contentPreview}
            </p>
          )}
          {!form.title && !form.content && (
            <p className="text-xs text-slate-400 italic">No content yet</p>
          )}
        </div>
      </div>

      {/* Image Preview (if exists) */}
      {form.image_url && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Attached Image
          </h3>
          <div className="relative h-16 w-16 rounded-lg overflow-hidden border border-slate-200">
            <img 
              src={form.image_url} 
              alt="" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-slate-200 pt-3 sm:pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Total characters</span>
          <span className="font-medium text-slate-800">{form.content.length}</span>
        </div>
      </div>
    </div>
  );
}