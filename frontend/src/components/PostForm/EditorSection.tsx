// components/PostForm/EditorSection.tsx
'use client';

import { ImagePreview } from './ImagePreview';
import { useState, useEffect, useRef } from 'react';
import { PostFormData } from './types';

interface EditorSectionProps {
  form: PostFormData;
  onChange: (updates: Partial<PostFormData>) => void;
}

export function EditorSection({ form, onChange }: EditorSectionProps) {
  const [charCount, setCharCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_CHARS = 2000;

  useEffect(() => {
    setCharCount(form.content.length);
  }, [form.content]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [form.content]);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
          Compose Post
        </h2>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {showPreview ? 'Hide' : 'Show'} preview
        </button>
      </div>

      {/* Title Input */}
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium text-slate-700">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={form.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Enter an engaging title..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white/50"
        />
      </div>

      {/* Content Textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="content" className="block text-sm font-medium text-slate-700">
            Content <span className="text-red-500">*</span>
          </label>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            charCount > MAX_CHARS * 0.9 ? 'bg-amber-100 text-amber-700' : 
            charCount > MAX_CHARS * 0.7 ? 'bg-blue-100 text-blue-700' : 
            'bg-slate-100 text-slate-600'
          }`}>
            {charCount} / {MAX_CHARS}
          </span>
        </div>
        <textarea
          ref={textareaRef}
          id="content"
          rows={4}
          value={form.content}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Write your post content here..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none overflow-hidden bg-white/50"
          maxLength={MAX_CHARS}
        />
      </div>

      {/* Image URL Input with Preview */}
      <div className="space-y-3">
        <label htmlFor="image_url" className="block text-sm font-medium text-slate-700">
          Image <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input
          id="image_url"
          type="url"
          value={form.image_url}
          onChange={(e) => onChange({ image_url: e.target.value })}
          placeholder="https://example.com/image.jpg"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white/50"
        />
        <ImagePreview imageUrl={form.image_url} onRemove={() => onChange({ image_url: '' })} />
      </div>

      {/* Live Preview (Optional) */}
      {showPreview && (form.title || form.content) && (
        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Live Preview</h3>
          <div className="space-y-3">
            {form.title && (
              <h4 className="font-medium text-slate-800">{form.title}</h4>
            )}
            {form.content && (
              <p className="text-sm text-slate-600 line-clamp-3">{form.content}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}