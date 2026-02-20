'use client';

import { useEffect, useState, useCallback } from 'react';
import { Post, PostLog } from '@/types';
import { getAllPosts, deletePost, retryPost, getPostById } from '@/lib/api';
import PostForm from '@/components/PostForm';
import PostList from '@/components/PostList';
import LogViewer from '@/components/LogViewer';
import toast from 'react-hot-toast';

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLogs, setSelectedLogs] = useState<PostLog[] | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const result = await getAllPosts();
      if (result.success && result.data) {
        setPosts(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();

    // Auto-refresh every 5 seconds for pending posts
    const interval = setInterval(() => {
      fetchPosts();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchPosts]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const result = await deletePost(id);
      if (result.success) {
        toast.success('Post deleted');
        fetchPosts();
      }
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const handleRetry = async (id: string) => {
    try {
      const result = await retryPost(id);
      if (result.success) {
        toast.success('Retry started');
        fetchPosts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to retry');
    }
  };

  const handleViewLogs = async (id: string) => {
    try {
      const result = await getPostById(id);
      if (result.success && result.data) {
        setSelectedLogs(result.data.logs);
      }
    } catch (error) {
      toast.error('Failed to load logs');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Posts</h1>
        <p className="text-slate-500 mt-1">
          Create and manage your social media posts
        </p>
      </div>

      {/* Layout: Form + List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1">
          <PostForm onPostCreated={fetchPosts} />
        </div>

        {/* Post List */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-5 animate-pulse border border-slate-200"
                >
                  <div className="h-5 w-48 bg-slate-200 rounded mb-2" />
                  <div className="h-4 w-full bg-slate-100 rounded mb-1" />
                  <div className="h-4 w-2/3 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <PostList
              posts={posts}
              onRetry={handleRetry}
              onDelete={handleDelete}
              onViewLogs={handleViewLogs}
            />
          )}
        </div>
      </div>

      {/* Log Viewer Modal */}
      {selectedLogs !== null && (
        <LogViewer logs={selectedLogs} onClose={() => setSelectedLogs(null)} />
      )}
    </div>
  );
}
