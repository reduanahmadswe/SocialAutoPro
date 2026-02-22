// ============================================
// Frontend Type Definitions
// ============================================

// --- Posts ---

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
  platform: 'facebook' | 'linkedin' | 'linkedin_page' | 'telegram';
  response: Record<string, any> | null;
  status: 'success' | 'failed';
  error: string | null;
  created_at: string;
}

export interface PostWithLogs extends Post {
  logs: PostLog[];
}

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

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// --- Facebook Messenger ---

export interface FbMessage {
  id: string;
  sender_id: string;
  sender_name: string | null;
  message_text: string;
  direction: 'incoming' | 'outgoing';
  replied: boolean;
  replied_at: string | null;
  created_at: string;
}

export interface FbAutoReplyRule {
  id: string;
  keyword: string;
  reply_text: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- Facebook Insights ---

export interface FbPageInsight {
  id: string;
  metric_name: string;
  metric_value: number;
  period: string;
  end_time: string;
  recorded_at: string;
}

// --- Facebook Leads ---

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
  created_time: string;
  fetched_at: string;
}

export interface LeadStats {
  total: number;
  new_count: number;
  contacted_count: number;
  closed_count: number;
  forms_count: number;
}

// --- Facebook Token ---

export interface TokenDebugInfo {
  isValid: boolean;
  appId: string | null;
  type: string | null;
  expiresAt: string | null;
  scopes: string[];
  error: string | null;
}

export interface FbTokenHealthLog {
  id: string;
  is_valid: boolean;
  expires_at: string | null;
  scopes: string | null;
  error: string | null;
  checked_at: string;
}

// --- Conversations (derived from messages for UI) ---

export interface Conversation {
  sender_id: string;
  sender_name: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  direction: 'incoming' | 'outgoing';
}
