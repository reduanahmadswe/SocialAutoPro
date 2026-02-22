import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as api from './api';
import type { LeadStatus } from '@/types';

// ============================================
// Query Keys
// ============================================

export const queryKeys = {
  health: ['health'] as const,
  posts: ['posts'] as const,
  post: (id: string) => ['posts', id] as const,
  messages: (params?: Record<string, unknown>) =>
    ['messages', params] as const,
  autoReplyRules: ['autoReplyRules'] as const,
  insights: (params?: Record<string, unknown>) =>
    ['insights', params] as const,
  insightsSummary: ['insightsSummary'] as const,
  leads: (params?: Record<string, unknown>) => ['leads', params] as const,
  leadStats: ['leadStats'] as const,
  lead: (id: string) => ['leads', id] as const,
  tokenHealth: ['tokenHealth'] as const,
  tokenHistory: ['tokenHistory'] as const,
  linkedinStatus: ['linkedinStatus'] as const,
};

// ============================================
// Health
// ============================================

export function useHealthCheck() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: api.getHealthCheck,
    refetchInterval: 30000,
  });
}

// ============================================
// Posts
// ============================================

export function usePosts() {
  return useQuery({
    queryKey: queryKeys.posts,
    queryFn: api.getAllPosts,
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: queryKeys.post(id),
    queryFn: () => api.getPostById(id),
    enabled: !!id,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createPost,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.posts });
      toast.success('Post created successfully');
    },
    onError: () => toast.error('Failed to create post'),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deletePost,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.posts });
      toast.success('Post deleted');
    },
    onError: () => toast.error('Failed to delete post'),
  });
}

export function useRetryPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, platforms }: { id: string; platforms?: string[] }) =>
      api.retryPost(id, platforms),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.posts });
      toast.success('Post retry started');
    },
    onError: () => toast.error('Failed to retry post'),
  });
}

// ============================================
// Messenger
// ============================================

export function useMessages(params?: {
  page?: number;
  limit?: number;
  direction?: 'incoming' | 'outgoing';
}) {
  return useQuery({
    queryKey: queryKeys.messages(params as Record<string, unknown>),
    queryFn: () => api.getMessages(params),
    refetchInterval: 10000,
  });
}

export function useSendReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sender_id,
      message,
    }: {
      sender_id: string;
      message: string;
    }) => api.sendReply(sender_id, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
      toast.success('Reply sent');
    },
    onError: () => toast.error('Failed to send reply'),
  });
}

// ============================================
// Auto-Reply Rules
// ============================================

export function useAutoReplyRules() {
  return useQuery({
    queryKey: queryKeys.autoReplyRules,
    queryFn: api.getAutoReplyRules,
  });
}

export function useCreateAutoReplyRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createAutoReplyRule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.autoReplyRules });
      toast.success('Rule created');
    },
    onError: () => toast.error('Failed to create rule'),
  });
}

export function useUpdateAutoReplyRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      keyword?: string;
      reply_text?: string;
      is_active?: boolean;
    }) => api.updateAutoReplyRule(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.autoReplyRules });
      toast.success('Rule updated');
    },
    onError: () => toast.error('Failed to update rule'),
  });
}

export function useDeleteAutoReplyRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteAutoReplyRule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.autoReplyRules });
      toast.success('Rule deleted');
    },
    onError: () => toast.error('Failed to delete rule'),
  });
}

// ============================================
// Insights
// ============================================

export function useInsights(params?: {
  metric?: string;
  period?: string;
  days?: number;
}) {
  return useQuery({
    queryKey: queryKeys.insights(params as Record<string, unknown>),
    queryFn: () => api.getInsights(params),
  });
}

export function useInsightsSummary() {
  return useQuery({
    queryKey: queryKeys.insightsSummary,
    queryFn: api.getInsightsSummary,
  });
}

export function useCollectInsights() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.collectInsights,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['insights'] });
      toast.success('Insights collected');
    },
    onError: () => toast.error('Failed to collect insights'),
  });
}

// ============================================
// Leads
// ============================================

export function useLeads(params?: {
  page?: number;
  limit?: number;
  status?: LeadStatus;
  form_id?: string;
}) {
  return useQuery({
    queryKey: queryKeys.leads(params as Record<string, unknown>),
    queryFn: () => api.getLeads(params),
  });
}

export function useLeadStats() {
  return useQuery({
    queryKey: queryKeys.leadStats,
    queryFn: api.getLeadStats,
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: queryKeys.lead(id),
    queryFn: () => api.getLeadById(id),
    enabled: !!id,
  });
}

export function useUpdateLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      api.updateLeadStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: queryKeys.leadStats });
      toast.success('Lead status updated');
    },
    onError: () => toast.error('Failed to update lead'),
  });
}

export function useCollectLeads() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.collectLeads,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: queryKeys.leadStats });
      toast.success(data.message || 'Leads collected');
    },
    onError: () => toast.error('Failed to collect leads'),
  });
}

// ============================================
// Token Health
// ============================================

export function useTokenHealth() {
  return useQuery({
    queryKey: queryKeys.tokenHealth,
    queryFn: api.getTokenHealth,
    refetchInterval: 60000,
  });
}

export function useTokenHealthHistory(limit?: number) {
  return useQuery({
    queryKey: queryKeys.tokenHistory,
    queryFn: () => api.getTokenHealthHistory(limit),
  });
}

export function useRunTokenHealthCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.runTokenHealthCheck,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tokenHealth });
      qc.invalidateQueries({ queryKey: queryKeys.tokenHistory });
      toast.success('Token health check completed');
    },
    onError: () => toast.error('Token health check failed'),
  });
}

// ============================================
// LinkedIn
// ============================================

export function useLinkedInStatus() {
  return useQuery({
    queryKey: queryKeys.linkedinStatus,
    queryFn: api.getLinkedInStatus,
  });
}
