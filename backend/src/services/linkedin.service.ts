import axios from 'axios';
import { PublishResult, LinkedInTarget } from '../types';

// ============================================
// LinkedIn Publishing Service (Posts API)
// ============================================

const LINKEDIN_API_VERSION = '202601';

/**
 * Upload an image to LinkedIn and return the image URN
 * Flow: initializeUpload → download image → PUT to LinkedIn → return image URN
 */
async function uploadImageToLinkedIn(
  author: string,
  imageUrl: string,
  accessToken: string
): Promise<string> {
  // Step 1: Initialize upload — get upload URL and image URN
  const initResponse = await axios.post(
    'https://api.linkedin.com/rest/images?action=initializeUpload',
    {
      initializeUploadRequest: {
        owner: author,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': LINKEDIN_API_VERSION,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }
  );

  const { uploadUrl, image: imageUrn } = initResponse.data.value;
  console.log('📤 LinkedIn: Image upload initialized, URN:', imageUrn);

  // Step 2: Download the image from the source URL
  const imageResponse = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    timeout: 30000,
  });

  const imageBuffer = Buffer.from(imageResponse.data);
  const contentType = imageResponse.headers['content-type'] || 'image/jpeg';
  console.log(`📥 LinkedIn: Image downloaded (${(imageBuffer.length / 1024).toFixed(1)} KB, ${contentType})`);

  // Step 3: Upload the image binary to LinkedIn's upload URL
  await axios.put(uploadUrl, imageBuffer, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': contentType,
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  console.log('✅ LinkedIn: Image uploaded successfully');
  return imageUrn;
}

/**
 * Make a single LinkedIn post for a given author URN
 */
async function postToLinkedIn(
  author: string,
  content: string,
  accessToken: string,
  imageUrl?: string | null
): Promise<Record<string, any>> {
  const postBody: Record<string, any> = {
    author,
    commentary: content,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };

  // If image URL provided, upload it to LinkedIn and attach as native image
  if (imageUrl) {
    try {
      const imageUrn = await uploadImageToLinkedIn(author, imageUrl, accessToken);
      postBody.content = {
        media: {
          title: content.substring(0, 100),
          id: imageUrn,
        },
      };
    } catch (uploadError: any) {
      console.warn('⚠️ LinkedIn: Image upload failed, posting without image:', uploadError.message);
      // Fall through and post without image rather than failing entirely
    }
  }

  const response = await axios.post('https://api.linkedin.com/rest/posts', postBody, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': LINKEDIN_API_VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
    },
  });

  return response.data || { status: 'created', header: response.headers['x-restli-id'] };
}

/**
 * Publish to LinkedIn personal profile
 */
export async function publishToLinkedInProfile(
  content: string,
  imageUrl?: string | null
): Promise<PublishResult> {
  try {
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN || '';
    const personUrn = process.env.LINKEDIN_PERSON_URN || '';

    if (!accessToken) {
      throw new Error('LinkedIn access token not configured.');
    }
    if (!personUrn) {
      throw new Error('LinkedIn Person URN not configured. Re-authorize at /api/linkedin/auth');
    }

    const data = await postToLinkedIn(personUrn, content, accessToken, imageUrl);
    console.log('✅ LinkedIn Profile: Post published');

    return { platform: 'linkedin', success: true, response: data };
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message || 'Unknown error';
    console.error('❌ LinkedIn Profile:', msg);
    return { platform: 'linkedin', success: false, error: typeof msg === 'string' ? msg : JSON.stringify(msg), response: error.response?.data || null };
  }
}

/**
 * Publish to LinkedIn organization/company page
 */
export async function publishToLinkedInPage(
  content: string,
  imageUrl?: string | null
): Promise<PublishResult> {
  try {
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN || '';
    const orgId = process.env.LINKEDIN_ORG_ID || '';

    if (!accessToken) {
      throw new Error('LinkedIn access token not configured.');
    }
    if (!orgId) {
      throw new Error('LinkedIn Organization ID not configured in .env');
    }

    const author = `urn:li:organization:${orgId}`;
    const data = await postToLinkedIn(author, content, accessToken, imageUrl);
    console.log('✅ LinkedIn Page: Post published');

    return { platform: 'linkedin_page', success: true, response: data };
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message || 'Unknown error';
    console.error('❌ LinkedIn Page:', msg);
    return { platform: 'linkedin_page', success: false, error: typeof msg === 'string' ? msg : JSON.stringify(msg), response: error.response?.data || null };
  }
}

/**
 * Publish to LinkedIn based on target: profile, page, or both
 */
export async function publishToLinkedIn(
  content: string,
  imageUrl?: string | null,
  target: LinkedInTarget = 'profile'
): Promise<PublishResult[]> {
  const results: PublishResult[] = [];

  if (target === 'profile' || target === 'both') {
    results.push(await publishToLinkedInProfile(content, imageUrl));
  }

  if (target === 'page' || target === 'both') {
    results.push(await publishToLinkedInPage(content, imageUrl));
  }

  return results;
}
