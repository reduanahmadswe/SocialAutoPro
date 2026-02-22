'use client';

import { Post } from '@/types';
import PostCard from './PostCard';

interface PostListProps {
  posts: Post[];
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onViewLogs: (id: string) => void;
}

export default function PostList({ posts, onRetry, onDelete, onViewLogs }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
        <h3 className="text-slate-600 font-medium mb-1">No posts yet</h3>
        <p className="text-sm text-slate-400">
          Create your first post to start publishing across platforms
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          Recent Posts
        </h2>
        <span className="text-sm text-slate-500">
          {posts.length} post{posts.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onRetry={() => onRetry(post.id)}
            onDelete={() => onDelete(post.id)}
            onViewLogs={() => onViewLogs(post.id)}
          />
        ))}
      </div>
    </div>
  );
}
