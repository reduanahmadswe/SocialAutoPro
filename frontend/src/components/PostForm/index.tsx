// components/PostForm/index.tsx
'use client';

import { useState } from 'react';
import { CreatePostInput, PublishPlatform } from '@/types';
import { createPost } from '@/lib/api';
import toast from 'react-hot-toast';
import { EditorSection } from './EditorSection';
import { PlatformGrid } from './PlatformGrid';
import { PublishSummary } from './PublishSummary';
import { PostFormData } from './types';
import { ALL_PLATFORMS } from './constants';

interface PostFormProps {
  onPostCreated: () => void;
}

export default function PostForm({ onPostCreated }: PostFormProps) {
  const [form, setForm] = useState<PostFormData>({
    title: '',
    content: '',
    image_url: '',
  });
  const [selectedPlatforms, setSelectedPlatforms] = useState<PublishPlatform[]>([...ALL_PLATFORMS]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error('Select at least one platform');
      return;
    }

    setIsSubmitting(true);
    try {
      const hasProfile = selectedPlatforms.includes('linkedin');
      const hasPage = selectedPlatforms.includes('linkedin_page');
      let linkedin_target: 'profile' | 'page' | 'both' | undefined;
      if (hasProfile && hasPage) linkedin_target = 'both';
      else if (hasProfile) linkedin_target = 'profile';
      else if (hasPage) linkedin_target = 'page';

      const result = await createPost({
        title: form.title.trim(),
        content: form.content.trim(),
        image_url: form.image_url?.trim() || undefined,
        platforms: selectedPlatforms,
        linkedin_target,
      });

      if (result.success) {
        toast.success('Post created & publishing started! 🚀');
        setForm({ title: '', content: '', image_url: '' });
        setSelectedPlatforms([...ALL_PLATFORMS]);
        onPostCreated();
      } else {
        toast.error(result.message || 'Failed to create post');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormChange = (updates: Partial<PostFormData>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - Editor (takes 3/5 on desktop) */}
        <div className="lg:col-span-3">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 p-4 sm:p-6 hover:shadow-2xl transition-shadow duration-300">
            <EditorSection 
              form={form} 
              onChange={handleFormChange} 
            />
          </div>
        </div>

        {/* Right Column - Platform Selection & Summary (2/5 on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Platform Selection Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 p-4 sm:p-6 hover:shadow-2xl transition-shadow duration-300">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
              Publishing Platforms
            </h2>
            <PlatformGrid
              selectedPlatforms={selectedPlatforms}
              onPlatformToggle={(platform) => {
                setSelectedPlatforms(prev =>
                  prev.includes(platform)
                    ? prev.filter(p => p !== platform)
                    : [...prev, platform]
                );
              }}
            />
          </div>

          {/* Summary Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 p-4 sm:p-6 hover:shadow-2xl transition-shadow duration-300 lg:sticky lg:top-24">
            <PublishSummary
              form={form}
              selectedPlatforms={selectedPlatforms}
              isSubmitting={isSubmitting}
            />
            
            {/* Publish Button */}
            <button
              type="submit"
              disabled={isSubmitting || !form.title.trim() || !form.content.trim() || selectedPlatforms.length === 0}
              className="w-full mt-6 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Publishing to {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 && 's'}...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Publish Post
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>

            {/* Validation Messages */}
            {(!form.title.trim() || !form.content.trim() || selectedPlatforms.length === 0) && (
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>
                    {!form.title.trim() && 'Title is required • '}
                    {!form.content.trim() && 'Content is required • '}
                    {selectedPlatforms.length === 0 && 'Select at least one platform'}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}