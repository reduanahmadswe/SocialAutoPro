import { Router } from 'express';
import {
  // Webhook
  verifyWebhook,
  handleWebhook,
  // Messenger
  getMessages,
  sendManualReply,
  // Auto-Reply Rules
  getAutoReplyRules,
  createAutoReplyRule,
  updateAutoReplyRule,
  deleteAutoReplyRule,
  // Insights
  getInsights,
  getInsightsSummary,
  collectInsights,
  getPostInsights,
  // Leads
  getLeads,
  getLeadStats,
  collectLeads,
  updateLeadStatus,
  getLeadById,
  // Token Health
  getTokenHealth,
  getTokenHealthHistory,
  runTokenHealthCheck,
} from '../controllers/facebook.controller';

// ============================================
// Facebook Routes
// ============================================

const router = Router();

// --- Webhook ---
router.get('/webhook', verifyWebhook);
router.post('/webhook', handleWebhook);

// --- Messenger ---
router.get('/messages', getMessages);
router.post('/messages/reply', sendManualReply);

// --- Auto-Reply Rules ---
router.get('/auto-reply-rules', getAutoReplyRules);
router.post('/auto-reply-rules', createAutoReplyRule);
router.put('/auto-reply-rules/:id', updateAutoReplyRule);
router.delete('/auto-reply-rules/:id', deleteAutoReplyRule);

// --- Insights ---
router.get('/insights', getInsights);
router.get('/insights/summary', getInsightsSummary);
router.post('/insights/collect', collectInsights);
router.get('/insights/post/:postId', getPostInsights);

// --- Leads ---
router.get('/leads', getLeads);
router.get('/leads/stats', getLeadStats);
router.post('/leads/collect', collectLeads);
router.get('/leads/:id', getLeadById);
router.put('/leads/:id/status', updateLeadStatus);

// --- Token Health ---
router.get('/token/health', getTokenHealth);
router.get('/token/health/history', getTokenHealthHistory);
router.post('/token/health/check', runTokenHealthCheck);

export default router;
