import { Router, Request, Response } from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// ============================================
// LinkedIn OAuth 2.0 Routes
// ============================================

const router = Router();

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '';
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:5000/api/linkedin/callback';

/**
 * Step 1: Redirect user to LinkedIn authorization page
 * Visit: http://localhost:5000/api/linkedin/auth
 */
router.get('/auth', (_req: Request, res: Response) => {
  const scopes = ['openid', 'profile', 'w_member_social'];
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scopes.join(' '))}`;

  console.log('🔗 Redirecting to LinkedIn OAuth...');
  res.redirect(authUrl);
});

/**
 * Step 2: LinkedIn redirects back here with authorization code
 * Exchange code for access token
 */
router.get('/callback', async (req: Request, res: Response) => {
  const { code, error, error_description } = req.query;

  if (error) {
    console.error('❌ LinkedIn OAuth error:', error, error_description);
    return res.status(400).json({
      success: false,
      error: error as string,
      description: error_description as string,
    });
  }

  if (!code) {
    return res.status(400).json({
      success: false,
      error: 'No authorization code received',
    });
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, expires_in } = tokenResponse.data;

    console.log('✅ LinkedIn Access Token obtained!');
    console.log(`   Token: ${access_token.substring(0, 20)}...`);
    console.log(`   Expires in: ${expires_in} seconds (~${Math.round(expires_in / 86400)} days)`);

    // Try to get the user's profile to find person URN (for personal posts)
    let profileInfo: any = null;
    try {
      const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      profileInfo = profileRes.data;
      console.log(`   LinkedIn User: ${profileInfo.name} (sub: ${profileInfo.sub})`);
    } catch (e) {
      console.log('   Could not fetch profile info (not critical)');
    }

    // Update the .env file with the new access token and person URN
    const envPath = path.resolve(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf-8');
      envContent = envContent.replace(
        /LINKEDIN_ACCESS_TOKEN=.*/,
        `LINKEDIN_ACCESS_TOKEN=${access_token}`
      );
      if (profileInfo?.sub) {
        envContent = envContent.replace(
          /LINKEDIN_PERSON_URN=.*/,
          `LINKEDIN_PERSON_URN=urn:li:person:${profileInfo.sub}`
        );
        process.env.LINKEDIN_PERSON_URN = `urn:li:person:${profileInfo.sub}`;
      }
      fs.writeFileSync(envPath, envContent, 'utf-8');
      console.log('   ✅ .env file updated with new access token & person URN');

      // Also update the runtime environment variable
      process.env.LINKEDIN_ACCESS_TOKEN = access_token;
    }

    res.send(`
      <html>
        <head><title>LinkedIn OAuth Success</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
          <h1 style="color: #0077B5;">✅ LinkedIn Connected!</h1>
          <p><strong>Access Token:</strong> <code>${access_token.substring(0, 30)}...</code></p>
          <p><strong>Expires in:</strong> ${Math.round(expires_in / 86400)} days</p>
          ${profileInfo ? `<p><strong>User:</strong> ${profileInfo.name || ''}</p><p><strong>Person URN:</strong> urn:li:person:${profileInfo.sub}</p>` : ''}
          <p style="color: green;">Token has been saved to your .env file automatically.</p>
          <hr />
          <p>You can now close this window and start posting to LinkedIn! 🚀</p>
          <p><a href="http://localhost:3000">← Go to Dashboard</a></p>
        </body>
      </html>
    `);
  } catch (err: any) {
    const errorMsg = err.response?.data || err.message;
    console.error('❌ LinkedIn token exchange failed:', errorMsg);

    res.status(500).json({
      success: false,
      error: 'Token exchange failed',
      details: errorMsg,
    });
  }
});

/**
 * Check current LinkedIn token status
 */
router.get('/status', async (_req: Request, res: Response) => {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;

  if (!token) {
    return res.json({
      success: true,
      connected: false,
      message: 'No LinkedIn access token configured',
      authUrl: 'http://localhost:5000/api/linkedin/auth',
    });
  }

  try {
    const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    res.json({
      success: true,
      connected: true,
      profile: profileRes.data,
    });
  } catch {
    res.json({
      success: true,
      connected: false,
      message: 'Token is invalid or expired',
      authUrl: 'http://localhost:5000/api/linkedin/auth',
    });
  }
});

export default router;
