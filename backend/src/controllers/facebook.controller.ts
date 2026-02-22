import { Request, Response } from 'express';
import { ApiResponse } from '../types';
import * as messengerService from '../services/facebook-messenger.service';
import * as insightsService from '../services/facebook-insights.service';
import * as leadsService from '../services/facebook-leads.service';
import * as tokenService from '../services/facebook-token.service';

// ============================================
// Facebook Controller
// ============================================

// ------------------------------------------
// WEBHOOK ENDPOINTS
// ------------------------------------------

/**
 * GET /api/facebook/webhook
 * Facebook Webhook Verification (challenge/response)
 */
export async function verifyWebhook(req: Request, res: Response): Promise<void> {
  const VERIFY_TOKEN = process.env.FB_WEBHOOK_VERIFY_TOKEN || '';

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook: Verification successful');
    res.status(200).send(challenge);
  } else {
    console.warn('⚠️ Webhook: Verification failed — token mismatch');
    res.status(403).json({ success: false, message: 'Verification failed' });
  }
}

/**
 * POST /api/facebook/webhook
 * Handle incoming webhook events from Facebook
 * Supports: messages, feed (comments), leadgen
 */
export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const body = req.body;

  // Facebook expects 200 within 20 seconds
  res.status(200).send('EVENT_RECEIVED');

  // Process events asynchronously
  try {
    if (body.object !== 'page') {
      console.warn(`⚠️ Webhook: Unexpected object type: ${body.object}`);
      return;
    }

    const entries = body.entry || [];

    for (const entry of entries) {
      // --- MESSAGING EVENTS ---
      if (entry.messaging) {
        for (const event of entry.messaging) {
          if (event.message && event.message.text) {
            const senderId = event.sender.id;
            const messageText = event.message.text;

            console.log(`📩 Webhook: Message from ${senderId}: "${messageText}"`);

            const result = await messengerService.processIncomingMessage(senderId, messageText);
            if (result.replied) {
              console.log(`   ↪ Auto-replied with rule: ${result.ruleMatched}`);
            }
          }
        }
      }

      // --- FEED CHANGES (COMMENTS) ---
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === 'feed') {
            console.log(`📝 Webhook: Feed change detected — ${change.value?.item || 'unknown'}`);
            // Log comment events but don't auto-process
            // (existing comment reply feature handles this separately)
          }

          // --- LEADGEN EVENTS ---
          if (change.field === 'leadgen') {
            const leadgenData = change.value;
            const formId = leadgenData?.form_id;
            const leadgenId = leadgenData?.leadgen_id;

            console.log(`📋 Webhook: New lead! Form: ${formId}, Lead: ${leadgenId}`);

            if (formId) {
              try {
                await leadsService.collectLeadsFromForm(formId);
              } catch (err: any) {
                console.error(`❌ Webhook: Failed to collect lead — ${err.message}`);
              }
            }
          }
        }
      }
    }
  } catch (error: any) {
    console.error(`❌ Webhook: Error processing event — ${error.message}`);
  }
}

// ------------------------------------------
// MESSENGER ENDPOINTS
// ------------------------------------------

/**
 * GET /api/facebook/messages
 * Get paginated messages
 */
export async function getMessages(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const direction = req.query.direction as 'incoming' | 'outgoing' | undefined;

    const result = await messengerService.getMessages(page, limit, direction);

    res.json({
      success: true,
      data: result.messages,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    } as ApiResponse);
  } catch (error: any) {
    console.error('❌ Get messages error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
}

/**
 * POST /api/facebook/messages/reply
 * Manual reply to a user
 */
export async function sendManualReply(req: Request, res: Response): Promise<void> {
  try {
    const { sender_id, message } = req.body;

    if (!sender_id || !message) {
      res.status(400).json({ success: false, message: 'sender_id and message are required' });
      return;
    }

    const result = await messengerService.manualReply(sender_id, message);

    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: result,
    } as ApiResponse);
  } catch (error: any) {
    console.error('❌ Manual reply error:', error.message);
    res.status(500).json({ success: false, message: `Failed to send reply: ${error.message}` });
  }
}

// ------------------------------------------
// AUTO-REPLY RULES ENDPOINTS
// ------------------------------------------

/**
 * GET /api/facebook/auto-reply-rules
 */
export async function getAutoReplyRules(_req: Request, res: Response): Promise<void> {
  try {
    const rules = await messengerService.getAutoReplyRules();
    res.json({ success: true, data: rules } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/facebook/auto-reply-rules
 */
export async function createAutoReplyRule(req: Request, res: Response): Promise<void> {
  try {
    const { keyword, reply_text, is_default } = req.body;

    if (!keyword || !reply_text) {
      res.status(400).json({ success: false, message: 'keyword and reply_text are required' });
      return;
    }

    await messengerService.createAutoReplyRule(keyword, reply_text, is_default || false);

    res.status(201).json({ success: true, message: 'Auto-reply rule created' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PUT /api/facebook/auto-reply-rules/:id
 */
export async function updateAutoReplyRule(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updated = await messengerService.updateAutoReplyRule(id, req.body);

    if (!updated) {
      res.status(404).json({ success: false, message: 'Rule not found or no changes made' });
      return;
    }

    res.json({ success: true, message: 'Auto-reply rule updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * DELETE /api/facebook/auto-reply-rules/:id
 */
export async function deleteAutoReplyRule(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const deleted = await messengerService.deleteAutoReplyRule(id);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Rule not found or is a default rule (cannot delete)' });
      return;
    }

    res.json({ success: true, message: 'Auto-reply rule deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ------------------------------------------
// INSIGHTS ENDPOINTS
// ------------------------------------------

/**
 * GET /api/facebook/insights
 * Fetch stored insights
 */
export async function getInsights(req: Request, res: Response): Promise<void> {
  try {
    const metric = req.query.metric as string | undefined;
    const period = req.query.period as string | undefined;
    const days = parseInt(req.query.days as string) || 30;

    const data = await insightsService.getStoredInsights(metric, period, days);

    res.json({ success: true, data } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/facebook/insights/summary
 * Get latest insight values per metric
 */
export async function getInsightsSummary(_req: Request, res: Response): Promise<void> {
  try {
    const data = await insightsService.getInsightsSummary();
    res.json({ success: true, data } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/facebook/insights/collect
 * Manually trigger insights collection
 */
export async function collectInsights(_req: Request, res: Response): Promise<void> {
  try {
    await insightsService.collectDailyInsights();
    res.json({ success: true, message: 'Insights collection triggered' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/facebook/insights/post/:postId
 * Get insights for a specific Facebook post
 */
export async function getPostInsights(req: Request, res: Response): Promise<void> {
  try {
    const { postId } = req.params;
    const data = await insightsService.fetchPostInsights(postId);
    res.json({ success: true, data } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ------------------------------------------
// LEADS ENDPOINTS
// ------------------------------------------

/**
 * GET /api/facebook/leads
 * Get stored leads (paginated)
 */
export async function getLeads(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as any;
    const formId = req.query.form_id as string | undefined;

    const result = await leadsService.getStoredLeads(page, limit, status, formId);

    res.json({
      success: true,
      data: result.leads,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/facebook/leads/stats
 * Get lead statistics
 */
export async function getLeadStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await leadsService.getLeadStats();
    res.json({ success: true, data: stats } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/facebook/leads/collect
 * Manually trigger lead collection from a form
 */
export async function collectLeads(req: Request, res: Response): Promise<void> {
  try {
    const { form_id } = req.body;

    if (!form_id) {
      res.status(400).json({ success: false, message: 'form_id is required' });
      return;
    }

    const result = await leadsService.collectLeadsFromForm(form_id);

    res.json({
      success: true,
      message: `Collected leads: ${result.inserted} new, ${result.skipped} duplicates`,
      data: result,
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PUT /api/facebook/leads/:id/status
 * Update lead status
 */
export async function updateLeadStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'contacted', 'closed'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status. Must be: new, contacted, or closed' });
      return;
    }

    const updated = await leadsService.updateLeadStatus(id, status);

    if (!updated) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }

    res.json({ success: true, message: 'Lead status updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/facebook/leads/:id
 * Get single lead by ID
 */
export async function getLeadById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const lead = await leadsService.getLeadById(id);

    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }

    res.json({ success: true, data: lead } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ------------------------------------------
// TOKEN HEALTH ENDPOINTS
// ------------------------------------------

/**
 * GET /api/facebook/token/health
 * Get current token health status
 */
export async function getTokenHealth(_req: Request, res: Response): Promise<void> {
  try {
    const info = await tokenService.debugToken();
    res.json({ success: true, data: info } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/facebook/token/health/history
 * Get token health check history
 */
export async function getTokenHealthHistory(req: Request, res: Response): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 30;
    const history = await tokenService.getHealthHistory(limit);
    res.json({ success: true, data: history } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/facebook/token/health/check
 * Manually trigger a token health check
 */
export async function runTokenHealthCheck(_req: Request, res: Response): Promise<void> {
  try {
    const info = await tokenService.runTokenHealthCheck();
    res.json({
      success: true,
      message: info.isValid ? 'Token is valid' : 'Token is INVALID',
      data: info,
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
