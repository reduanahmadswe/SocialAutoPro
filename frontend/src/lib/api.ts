import axios from 'axios';
import { ApiResponse, Post, PostWithLogs, CreatePostInput } from '@/types';

// ============================================
// API Client
// ============================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Create a new post and start publishing
 */
export async function createPost(input: CreatePostInput): Promise<ApiResponse<Post>> {
  const { data } = await api.post<ApiResponse<Post>>('/posts', input);
  return data;
}

/**
 * Get all posts
 */
export async function getAllPosts(): Promise<ApiResponse<Post[]>> {
  const { data } = await api.get<ApiResponse<Post[]>>('/posts');
  return data;
}

/**
 * Get a single post with its logs
 */
export async function getPostById(id: string): Promise<ApiResponse<PostWithLogs>> {
  const { data } = await api.get<ApiResponse<PostWithLogs>>(`/posts/${id}`);
  return data;
}

/**
 * Delete a post
 */
export async function deletePost(id: string): Promise<ApiResponse> {
  const { data } = await api.delete<ApiResponse>(`/posts/${id}`);
  return data;
}

/**
 * Retry a failed post
 */
export async function retryPost(id: string): Promise<ApiResponse> {
  const { data } = await api.post<ApiResponse>(`/posts/${id}/retry`);
  return data;
}

export default api;
