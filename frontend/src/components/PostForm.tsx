'use client';

import { useState } from 'react';
import { CreatePostInput } from '@/types';
import { createPost } from '@/lib/api';
import toast from 'react-hot-toast';

interface PostFormProps {
  onPostCreated: () => void;
}

export default function PostForm({ onPostCreated }: PostFormProps) {
  const [form, setForm] = useState<CreatePostInput>({
    title: '',
    content: '',
    image_url: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createPost({
        title: form.title.trim(),
        content: form.content.trim(),
        image_url: form.image_url?.trim() || undefined,
      });

      if (result.success) {
        toast.success('Post created & publishing started! 🚀');
        setForm({ title: '', content: '', image_url: '' });
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">
        Create New Post
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Enter post title..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Content */}
        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Content <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            rows={4}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Write your post content..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
          />
        </div>

        {/* Image URL */}
        <div>
          <label
            htmlFor="image_url"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Image URL{' '}
            <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            id="image_url"
            type="url"
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Platform Preview */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Will publish to:</span>
          <span className="px-2 py-0.5 rounded bg-[#1877F2]/10 text-[#1877F2] font-medium">
            Facebook
          </span>
          <span className="px-2 py-0.5 rounded bg-[#0A66C2]/10 text-[#0A66C2] font-medium">
            LinkedIn
          </span>
          <span className="px-2 py-0.5 rounded bg-[#26A5E4]/10 text-[#26A5E4] font-medium">
            Telegram
          </span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Publishing...
            </span>
          ) : (
            'Create & Publish Post'
          )}
        </button>
      </form>
    </div>
  );
}
