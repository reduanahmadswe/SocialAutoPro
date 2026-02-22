// components/PostForm/ImagePreview.tsx
'use client';

import { useState, useEffect } from 'react';

interface ImagePreviewProps {
  imageUrl: string;
  onRemove: () => void;
}

export function ImagePreview({ imageUrl, onRemove }: ImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setIsLoading(false);
      setHasError(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      setIsLoading(false);
      setHasError(false);
    };
    img.onerror = () => {
      setIsLoading(false);
      setHasError(true);
    };
  }, [imageUrl]);

  if (!imageUrl) return null;

  return (
    <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center bg-slate-100 py-12">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="flex items-center justify-center bg-red-50 py-8">
          <div className="text-center">
            <svg className="w-8 h-8 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs text-red-600">Invalid image URL</p>
          </div>
        </div>
      )}

      {/* Image */}
      {!hasError && !isLoading && (
        <div className="relative">
          <img 
            src={imageUrl} 
            alt="Preview" 
            className="w-full max-h-80 object-contain bg-slate-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      {/* Remove Button */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 z-10"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* URL Badge */}
      <div className="absolute bottom-2 left-2 right-2 z-10">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
          <p className="text-xs text-white truncate">{imageUrl}</p>
        </div>
      </div>
    </div>
  );
}