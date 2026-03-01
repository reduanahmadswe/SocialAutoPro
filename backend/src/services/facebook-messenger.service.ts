import axios from 'axios';
import { RowDataPacket } from 'mysql2';
import pool from '../config/db';
import { FbAutoReplyRule } from '../types';

// ============================================
// Facebook Messenger Service
// ============================================

const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID || '';
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN || '';
const GRAPH_API_VERSION = 'v25.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Send a message to a user via Facebook Send API
 */
export async function sendMessage(recipientId: string, messageText: string): Promise<any> {
  try {
    const response = await axios.post(
      `${BASE_URL}/${FACEBOOK_PAGE_ID}/messages`,
      {
        recipient: { id: recipientId },
        message: { text: messageText },
        messaging_type: 'RESPONSE',
      },
      {
        params: { access_token: FACEBOOK_ACCESS_TOKEN },
        headers: { 'Content-Type': 'application/json' },
      }
    );

    console.log(`✅ Messenger: Sent reply to ${recipientId}`);
    return response.data;
  } catch (error: any) {
    const msg = error.response?.data?.error?.message || error.message;
    console.error(`❌ Messenger: Failed to send to ${recipientId} — ${msg}`);
    throw new Error(msg);
  }
}

/**
 * Store an incoming message in the database
 */
export async function storeIncomingMessage(
  senderId: string,
  senderName: string | null,
  messageText: string
): Promise<string> {
  const [result] = await pool.query<any>(
    `INSERT INTO fb_messages (id, sender_id, sender_name, message_text, direction, replied)
     VALUES (UUID(), ?, ?, ?, 'incoming', FALSE)`,
    [senderId, senderName, messageText]
  );

  // Fetch the ID
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM fb_messages WHERE sender_id = ? AND message_text = ? ORDER BY created_at DESC LIMIT 1`,
    [senderId, messageText]
  );

  return rows[0]?.id || '';
}

/**
 * Store an outgoing reply in the database
 */
export async function storeOutgoingMessage(
  recipientId: string,
  messageText: string
): Promise<void> {
  await pool.query(
    `INSERT INTO fb_messages (id, sender_id, sender_name, message_text, direction, replied)
     VALUES (UUID(), ?, 'Page', ?, 'outgoing', TRUE)`,
    [recipientId, messageText]
  );
}

/**
 * Find matching auto-reply rule based on keyword with priority
 * Returns matched rule or default fallback
 * Now supports priority-based matching and categories
 */
export async function findAutoReplyRule(messageText: string): Promise<FbAutoReplyRule | null> {
  const lowerMessage = messageText.toLowerCase().trim();

  // 1. Try keyword match (non-default, active rules) - ORDER BY priority DESC
  const [rules] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM fb_auto_reply_rules 
     WHERE is_default = FALSE AND is_active = TRUE 
     ORDER BY priority DESC, created_at ASC`
  );

  for (const rule of rules as FbAutoReplyRule[]) {
    const lowerKeyword = rule.keyword.toLowerCase();
    
    // Check match_type if available (for upgraded schema)
    const matchType = (rule as any).match_type || 'contains';
    
    if (matchType === 'exact') {
      // Exact match
      if (lowerMessage === lowerKeyword) {
        return rule;
      }
    } else {
      // Contains match (default)
      if (lowerMessage.includes(lowerKeyword)) {
        return rule;
      }
    }
  }

  // 2. Fallback to default rule
  const [defaultRules] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM fb_auto_reply_rules WHERE is_default = TRUE AND is_active = TRUE LIMIT 1`
  );

  if (defaultRules.length > 0) {
    return defaultRules[0] as FbAutoReplyRule;
  }

  return null;
}

/**
 * Process incoming message: store, find rule, auto-reply
 */
export async function processIncomingMessage(
  senderId: string,
  messageText: string
): Promise<{ replied: boolean; replyText?: string; ruleMatched?: string }> {
  // Don't reply to our own page
  if (senderId === FACEBOOK_PAGE_ID) {
    return { replied: false };
  }

  // Fetch sender name from Facebook
  let senderName: string | null = null;
  try {
    const profileRes = await axios.get(`${BASE_URL}/${senderId}`, {
      params: { fields: 'name', access_token: FACEBOOK_ACCESS_TOKEN },
    });
    senderName = profileRes.data.name || null;
  } catch (_) {
    // Profile fetching is optional — privacy restrictions may prevent it
  }

  // Store the incoming message
  const msgId = await storeIncomingMessage(senderId, senderName, messageText);

  // Find auto-reply rule
  const rule = await findAutoReplyRule(messageText);
  if (!rule) {
    console.log(`⚠️ Messenger: No auto-reply rule found for "${messageText}" from ${senderId}`);
    return { replied: false };
  }

  // Send the auto reply
  try {
    await sendMessage(senderId, rule.reply_text);

    // Mark incoming message as replied
    await pool.query(
      `UPDATE fb_messages SET replied = TRUE, replied_at = NOW() WHERE id = ?`,
      [msgId]
    );

    // Store the outgoing reply
    await storeOutgoingMessage(senderId, rule.reply_text);

    return {
      replied: true,
      replyText: rule.reply_text,
      ruleMatched: rule.is_default ? '__DEFAULT__' : rule.keyword,
    };
  } catch (error: any) {
    console.error(`❌ Messenger: Auto-reply failed for ${senderId} — ${error.message}`);
    return { replied: false };
  }
}

/**
 * Get all messages (paginated)
 */
export async function getMessages(
  page: number = 1,
  limit: number = 50,
  direction?: 'incoming' | 'outgoing'
): Promise<{ messages: any[]; total: number }> {
  const offset = (page - 1) * limit;
  let where = '';
  const params: any[] = [];

  if (direction) {
    where = 'WHERE direction = ?';
    params.push(direction);
  }

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM fb_messages ${where}`,
    params
  );

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM fb_messages ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    messages: rows,
    total: countRows[0].total,
  };
}

/**
 * Get all auto-reply rules
 */
export async function getAutoReplyRules(): Promise<FbAutoReplyRule[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM fb_auto_reply_rules ORDER BY is_default ASC, created_at ASC'
  );
  return rows as FbAutoReplyRule[];
}

/**
 * Create an auto-reply rule
 */
export async function createAutoReplyRule(
  keyword: string,
  replyText: string,
  isDefault: boolean = false
): Promise<void> {
  await pool.query(
    `INSERT INTO fb_auto_reply_rules (id, keyword, reply_text, is_default, is_active)
     VALUES (UUID(), ?, ?, ?, TRUE)`,
    [keyword, replyText, isDefault]
  );
}

/**
 * Update an auto-reply rule
 */
export async function updateAutoReplyRule(
  ruleId: string,
  updates: { keyword?: string; reply_text?: string; is_active?: boolean }
): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.keyword !== undefined) { fields.push('keyword = ?'); values.push(updates.keyword); }
  if (updates.reply_text !== undefined) { fields.push('reply_text = ?'); values.push(updates.reply_text); }
  if (updates.is_active !== undefined) { fields.push('is_active = ?'); values.push(updates.is_active); }

  if (fields.length === 0) return false;

  values.push(ruleId);
  const [result] = await pool.query<any>(
    `UPDATE fb_auto_reply_rules SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return result.affectedRows > 0;
}

/**
 * Delete an auto-reply rule
 */
export async function deleteAutoReplyRule(ruleId: string): Promise<boolean> {
  const [result] = await pool.query<any>(
    'DELETE FROM fb_auto_reply_rules WHERE id = ? AND is_default = FALSE',
    [ruleId]
  );
  return result.affectedRows > 0;
}

/**
 * Manual reply — send message and mark manual override
 */
export async function manualReply(
  senderId: string,
  messageText: string
): Promise<any> {
  const result = await sendMessage(senderId, messageText);
  await storeOutgoingMessage(senderId, messageText);

  // Mark all unreplied incoming messages from this sender as replied
  await pool.query(
    `UPDATE fb_messages SET replied = TRUE, replied_at = NOW()
     WHERE sender_id = ? AND direction = 'incoming' AND replied = FALSE`,
    [senderId]
  );

  return result;
}
