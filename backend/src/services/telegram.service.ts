import axios from 'axios';
import { PublishResult } from '../types';

// ============================================
// Telegram Channel Publishing Service
// ============================================

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const BASE_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * Publish a message to Telegram Channel
 * - If image_url is provided, sends a photo with caption
 * - Otherwise sends a text message with Markdown formatting
 */
export async function publishToTelegram(
  title: string,
  content: string,
  imageUrl?: string | null
): Promise<PublishResult> {
  try {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      throw new Error('Telegram credentials not configured (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing)');
    }

    // Format the message with title
    const formattedText = `📢 *${escapeMarkdown(title)}*\n\n${escapeMarkdown(content)}`;

    let response;

    if (imageUrl) {
      // Send photo with caption
      response = await axios.post(`${BASE_URL}/sendPhoto`, {
        chat_id: TELEGRAM_CHAT_ID,
        photo: imageUrl,
        caption: formattedText,
        parse_mode: 'MarkdownV2',
      });
    } else {
      // Send text message
      response = await axios.post(`${BASE_URL}/sendMessage`, {
        chat_id: TELEGRAM_CHAT_ID,
        text: formattedText,
        parse_mode: 'MarkdownV2',
      });
    }

    console.log('✅ Telegram: Message sent successfully');

    return {
      platform: 'telegram',
      success: true,
      response: response.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.description ||
      error.message ||
      'Unknown Telegram API error';

    console.error('❌ Telegram: Send failed -', errorMessage);

    return {
      platform: 'telegram',
      success: false,
      error: errorMessage,
      response: error.response?.data || null,
    };
  }
}

/**
 * Escape special characters for Telegram MarkdownV2
 */
function escapeMarkdown(text: string): string {
  return text.replace(/([_\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}
