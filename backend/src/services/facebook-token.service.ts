import axios from 'axios';
import { RowDataPacket } from 'mysql2';
import pool from '../config/db';

// ============================================
// Facebook Token Health Service
// ============================================

const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN || '';
const GRAPH_API_VERSION = 'v25.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export interface TokenDebugInfo {
  isValid: boolean;
  appId: string | null;
  type: string | null;
  expiresAt: Date | null;
  scopes: string[];
  error: string | null;
}

/**
 * Debug / introspect the current access token via Facebook Debug Token API
 */
export async function debugToken(): Promise<TokenDebugInfo> {
  try {
    const response = await axios.get(`${BASE_URL}/debug_token`, {
      params: {
        input_token: FACEBOOK_ACCESS_TOKEN,
        access_token: FACEBOOK_ACCESS_TOKEN,
      },
    });

    const data = response.data.data;

    const isValid = data.is_valid === true;
    const expiresAt = data.expires_at && data.expires_at > 0
      ? new Date(data.expires_at * 1000)
      : null; // 0 = never expires (long-lived page token)
    const scopes = data.scopes || [];

    return {
      isValid,
      appId: data.app_id || null,
      type: data.type || null,
      expiresAt,
      scopes,
      error: isValid ? null : (data.error?.message || 'Token is invalid'),
    };
  } catch (error: any) {
    const msg = error.response?.data?.error?.message || error.message;
    return {
      isValid: false,
      appId: null,
      type: null,
      expiresAt: null,
      scopes: [],
      error: msg,
    };
  }
}

/**
 * Store token health check result in database
 */
export async function storeHealthCheck(info: TokenDebugInfo): Promise<void> {
  await pool.query(
    `INSERT INTO fb_token_health_logs (id, is_valid, expires_at, scopes, error)
     VALUES (UUID(), ?, ?, ?, ?)`,
    [
      info.isValid,
      info.expiresAt,
      info.scopes.length > 0 ? info.scopes.join(',') : null,
      info.error,
    ]
  );
}

/**
 * Run daily token health check — called by scheduler
 * Checks validity, stores result, logs errors
 */
export async function runTokenHealthCheck(): Promise<TokenDebugInfo> {
  console.log('\n🔐 Running token health check...');

  const info = await debugToken();

  // Store result
  await storeHealthCheck(info);

  if (info.isValid) {
    const expiresMsg = info.expiresAt
      ? `Expires: ${info.expiresAt.toISOString()}`
      : 'Never expires (long-lived page token)';
    console.log(`✅ Token Health: VALID — ${expiresMsg}`);
    console.log(`   Scopes: ${info.scopes.join(', ')}`);

    // Warn if token expires within 7 days
    if (info.expiresAt) {
      const daysUntilExpiry = (info.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntilExpiry < 7) {
        console.warn(`⚠️ TOKEN WARNING: Expires in ${Math.round(daysUntilExpiry)} days! Renew ASAP.`);
        // TODO: Send admin alert (email / Telegram notification)
        await sendAdminAlert(
          `⚠️ Facebook Token Expiring Soon!\n\nYour Facebook Page access token expires in ${Math.round(daysUntilExpiry)} days.\nPlease renew it before it becomes invalid.`
        );
      }
    }
  } else {
    console.error(`❌ Token Health: INVALID — ${info.error}`);
    // Send admin alert
    await sendAdminAlert(
      `🚨 Facebook Token INVALID!\n\nError: ${info.error}\n\nAll Facebook automation is now non-functional. Please generate a new token immediately.`
    );
  }

  console.log('🔐 Token health check complete\n');
  return info;
}

/**
 * Send admin alert via Telegram (uses existing Telegram bot)
 */
async function sendAdminAlert(message: string): Promise<void> {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('⚠️ Cannot send admin alert — Telegram not configured');
    return;
  }

  try {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: `🤖 SocialAutoPro Alert\n\n${message}`,
        parse_mode: 'HTML',
      }
    );
    console.log('📨 Admin alert sent via Telegram');
  } catch (error: any) {
    console.error(`❌ Failed to send admin alert: ${error.message}`);
  }
}

/**
 * Get token health history
 */
export async function getHealthHistory(limit: number = 30): Promise<any[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM fb_token_health_logs ORDER BY checked_at DESC LIMIT ?',
    [limit]
  );
  return rows;
}

/**
 * Get latest token health status
 */
export async function getLatestHealth(): Promise<any | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM fb_token_health_logs ORDER BY checked_at DESC LIMIT 1'
  );
  return rows.length > 0 ? rows[0] : null;
}
