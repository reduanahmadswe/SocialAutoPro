import axios from 'axios';
import type {
  ApiResponse,
  Post,
  PostWithLogs,
  CreatePostInput,
  FbMessage,
  FbAutoReplyRule,
  FbPageInsight,
  FbLead,
  LeadStats,
  TokenDebugInfo,
  FbTokenHealthLog,
  PaginatedResponse,
  LeadStatus,
} from '@/types';

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

// ============================================
// Health Check
// ============================================

export async function getHealthCheck(): Promise<
  ApiResponse<{ timestamp: string }>
> {
  const { data } = await api.get('/health');
  return data;
}

// ============================================
// Posts
// ============================================

export async function createPost(
  input: CreatePostInput
): Promise<ApiResponse<Post>> {
  const { data } = await api.post<ApiResponse<Post>>('/posts', input);
  return data;
}

export async function getAllPosts(): Promise<ApiResponse<Post[]>> {
  const { data } = await api.get<ApiResponse<Post[]>>('/posts');
  return data;
}

export async function getPostById(
  id: string
): Promise<ApiResponse<PostWithLogs>> {
  const { data } = await api.get<ApiResponse<PostWithLogs>>(`/posts/${id}`);
  return data;
}

export async function deletePost(id: string): Promise<ApiResponse> {
  const { data } = await api.delete<ApiResponse>(`/posts/${id}`);
  return data;
}

export async function retryPost(
  id: string,
  platforms?: string[]
): Promise<ApiResponse> {
  const { data } = await api.post<ApiResponse>(`/posts/${id}/retry`, {
    platforms,
  });
  return data;
}

// ============================================
// Facebook Messenger
// ============================================

export async function getMessages(params?: {
  page?: number;
  limit?: number;
  direction?: 'incoming' | 'outgoing';
}): Promise<PaginatedResponse<FbMessage>> {
  const { data } = await api.get('/facebook/messages', { params });
  return data;
}

export async function sendReply(
  sender_id: string,
  message: string
): Promise<ApiResponse> {
  const { data } = await api.post('/facebook/messages/reply', {
    sender_id,
    message,
  });
  return data;
}

// ============================================
// Auto-Reply Rules
// ============================================

export async function getAutoReplyRules(): Promise<
  ApiResponse<FbAutoReplyRule[]>
> {
  const { data } = await api.get('/facebook/auto-reply-rules');
  return data;
}

export async function createAutoReplyRule(input: {
  keyword: string;
  reply_text: string;
  is_default?: boolean;
}): Promise<ApiResponse<FbAutoReplyRule>> {
  const { data } = await api.post('/facebook/auto-reply-rules', input);
  return data;
}

export async function updateAutoReplyRule(
  id: string,
  input: { keyword?: string; reply_text?: string; is_active?: boolean }
): Promise<ApiResponse<FbAutoReplyRule>> {
  const { data } = await api.put(`/facebook/auto-reply-rules/${id}`, input);
  return data;
}

export async function deleteAutoReplyRule(id: string): Promise<ApiResponse> {
  const { data } = await api.delete(`/facebook/auto-reply-rules/${id}`);
  return data;
}

// ============================================
// Facebook Insights
// ============================================

export async function getInsights(params?: {
  metric?: string;
  period?: string;
  days?: number;
}): Promise<ApiResponse<FbPageInsight[]>> {
  const { data } = await api.get('/facebook/insights', { params });
  return data;
}

export async function getInsightsSummary(): Promise<
  ApiResponse<FbPageInsight[]>
> {
  const { data } = await api.get('/facebook/insights/summary');
  return data;
}

export async function collectInsights(): Promise<ApiResponse> {
  const { data } = await api.post('/facebook/insights/collect');
  return data;
}

export async function getPostInsights(
  postId: string
): Promise<ApiResponse<FbPageInsight[]>> {
  const { data } = await api.get(`/facebook/insights/post/${postId}`);
  return data;
}

// ============================================
// Facebook Leads
// ============================================

export async function getLeads(params?: {
  page?: number;
  limit?: number;
  status?: LeadStatus;
  form_id?: string;
}): Promise<PaginatedResponse<FbLead>> {
  const { data } = await api.get('/facebook/leads', { params });
  return data;
}

export async function getLeadStats(): Promise<ApiResponse<LeadStats>> {
  const { data } = await api.get('/facebook/leads/stats');
  return data;
}

export async function collectLeads(
  form_id: string
): Promise<ApiResponse<{ inserted: number; skipped: number }>> {
  const { data } = await api.post('/facebook/leads/collect', { form_id });
  return data;
}

export async function getLeadById(id: string): Promise<ApiResponse<FbLead>> {
  const { data } = await api.get(`/facebook/leads/${id}`);
  return data;
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<ApiResponse> {
  const { data } = await api.put(`/facebook/leads/${id}/status`, { status });
  return data;
}

// ============================================
// Token Health
// ============================================

export async function getTokenHealth(): Promise<ApiResponse<TokenDebugInfo>> {
  const { data } = await api.get('/facebook/token/health');
  return data;
}

export async function getTokenHealthHistory(
  limit?: number
): Promise<ApiResponse<FbTokenHealthLog[]>> {
  const { data } = await api.get('/facebook/token/health/history', {
    params: { limit },
  });
  return data;
}

export async function runTokenHealthCheck(): Promise<
  ApiResponse<TokenDebugInfo>
> {
  const { data } = await api.post('/facebook/token/health/check');
  return data;
}

// ============================================
// LinkedIn
// ============================================

export async function getLinkedInStatus(): Promise<
  ApiResponse<{ connected: boolean; profile?: any; authUrl?: string }>
> {
  const { data } = await api.get('/linkedin/status');
  return data;
}

export default api;
