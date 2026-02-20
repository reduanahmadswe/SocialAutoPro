// ============================================
// Frontend Type Definitions
// ============================================

export interface Post {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  status: 'pending' | 'published' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface PostLog {
  id: string;
  post_id: string;
  platform: 'facebook' | 'linkedin' | 'telegram';
  response: Record<string, any> | null;
  status: 'success' | 'failed';
  error: string | null;
  created_at: string;
}

export interface PostWithLogs extends Post {
  logs: PostLog[];
}

export interface CreatePostInput {
  title: string;
  content: string;
  image_url?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}
