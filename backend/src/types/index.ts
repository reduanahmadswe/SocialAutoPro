// ============================================
// SocialAutoPro - Type Definitions
// ============================================

export interface Post {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  status: PostStatus;
  created_at: Date;
  updated_at: Date;
}

export interface PostLog {
  id: string;
  post_id: string;
  platform: Platform;
  response: Record<string, any> | null;
  status: LogStatus;
  error: string | null;
  created_at: Date;
}

export interface PostWithLogs extends Post {
  logs: PostLog[];
}

export type PostStatus = 'pending' | 'published' | 'failed';
export type LogStatus = 'success' | 'failed';
export type Platform = 'facebook' | 'linkedin' | 'telegram';

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

export interface PublishResult {
  platform: Platform;
  success: boolean;
  response?: Record<string, any>;
  error?: string;
}

export interface QueueJobData {
  postId: string;
}
