import axios from 'axios';
import { PublishResult } from '../types';

// ============================================
// LinkedIn Organization Publishing Service
// ============================================

const LINKEDIN_ORG_ID = process.env.LINKEDIN_ORG_ID || '';
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN || '';
const BASE_URL = 'https://api.linkedin.com/v2';

/**
 * Publish a post to LinkedIn Organization Page
 * - If image_url is provided, creates a post with ARTICLE media
 * - Otherwise creates a text-only post
 */
export async function publishToLinkedIn(
  content: string,
  imageUrl?: string | null
): Promise<PublishResult> {
  try {
    if (!LINKEDIN_ORG_ID || !LINKEDIN_ACCESS_TOKEN) {
      throw new Error('LinkedIn credentials not configured (LINKEDIN_ORG_ID or LINKEDIN_ACCESS_TOKEN missing)');
    }

    const author = `urn:li:organization:${LINKEDIN_ORG_ID}`;

    // Build the post body
    const postBody: Record<string, any> = {
      author,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: imageUrl ? 'ARTICLE' : 'NONE',
          ...(imageUrl
            ? {
                media: [
                  {
                    status: 'READY',
                    originalUrl: imageUrl,
                  },
                ],
              }
            : {}),
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const response = await axios.post(`${BASE_URL}/ugcPosts`, postBody, {
      headers: {
        Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    console.log('✅ LinkedIn: Post published successfully');

    return {
      platform: 'linkedin',
      success: true,
      response: response.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Unknown LinkedIn API error';

    console.error('❌ LinkedIn: Publish failed -', errorMessage);

    return {
      platform: 'linkedin',
      success: false,
      error: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
      response: error.response?.data || null,
    };
  }
}
