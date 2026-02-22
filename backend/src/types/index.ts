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
export type Platform = 'facebook' | 'linkedin' | 'linkedin_page' | 'telegram';

export type LinkedInTarget = 'profile' | 'page' | 'both';

export type PublishPlatform = 'facebook' | 'linkedin' | 'linkedin_page' | 'telegram';

export interface CreatePostInput {
  title: string;
  content: string;
  image_url?: string;
  platforms?: PublishPlatform[];
  linkedin_target?: LinkedInTarget;
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
  platforms?: PublishPlatform[];
  linkedinTarget?: LinkedInTarget;
}

// ============================================
// Facebook Messenger Types
// ============================================

export interface FbMessage {
  id: string;
  sender_id: string;
  sender_name: string | null;
  message_text: string;
  direction: 'incoming' | 'outgoing';
  replied: boolean;
  replied_at: Date | null;
  created_at: Date;
}

export interface FbAutoReplyRule {
  id: string;
  keyword: string;
  reply_text: string;
  is_default: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// Facebook Insights Types
// ============================================

export interface FbPageInsight {
  id: string;
  metric_name: string;
  metric_value: number;
  period: string;
  end_time: string;
  recorded_at: Date;
}

// ============================================
// Facebook Lead Ads Types
// ============================================

export type LeadStatus = 'new' | 'contacted' | 'closed';

export interface FbLead {
  id: string;
  lead_id: string;
  form_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  full_data: Record<string, any>;
  status: LeadStatus;
  created_time: Date;
  fetched_at: Date;
}

// ============================================
// Facebook Token Health Types
// ============================================

export interface FbTokenHealthLog {
  id: string;
  is_valid: boolean;
  expires_at: Date | null;
  scopes: string | null;
  error: string | null;
  checked_at: Date;
}

// ============================================
// Webhook Event Types
// ============================================

export interface WebhookMessageEntry {
  id: string;
  time: number;
  messaging?: WebhookMessagingEvent[];
  changes?: WebhookChangeEvent[];
}

export interface WebhookMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text: string;
  };
}

export interface WebhookChangeEvent {
  field: string;
  value: any;
}
