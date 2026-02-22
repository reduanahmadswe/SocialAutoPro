import axios from 'axios';
import { PublishResult } from '../types';

// ============================================
// Facebook Page Publishing Service
// ============================================

const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID || '';
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN || '';
const GRAPH_API_VERSION = 'v25.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Publish a post to Facebook Page
 * - If image_url is provided, creates a photo post
 * - Otherwise creates a text-only feed post
 */
export async function publishToFacebook(
  content: string,
  imageUrl?: string | null
): Promise<PublishResult> {
  try {
    if (!FACEBOOK_PAGE_ID || !FACEBOOK_ACCESS_TOKEN) {
      throw new Error('Facebook credentials not configured (FACEBOOK_PAGE_ID or FACEBOOK_ACCESS_TOKEN missing)');
    }

    let response;

    if (imageUrl) {
      // Post with image
      response = await axios.post(
        `${BASE_URL}/${FACEBOOK_PAGE_ID}/photos`,
        null,
        {
          params: {
            url: imageUrl,
            caption: content,
            access_token: FACEBOOK_ACCESS_TOKEN,
          },
        }
      );
    } else {
      // Text-only post
      response = await axios.post(
        `${BASE_URL}/${FACEBOOK_PAGE_ID}/feed`,
        null,
        {
          params: {
            message: content,
            access_token: FACEBOOK_ACCESS_TOKEN,
          },
        }
      );
    }

    console.log('✅ Facebook: Post published successfully');

    return {
      platform: 'facebook',
      success: true,
      response: response.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error?.message ||
      error.message ||
      'Unknown Facebook API error';

    console.error('❌ Facebook: Publish failed -', errorMessage);

    return {
      platform: 'facebook',
      success: false,
      error: errorMessage,
      response: error.response?.data || null,
    };
  }
}
