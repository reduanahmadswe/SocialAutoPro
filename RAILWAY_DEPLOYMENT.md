# 🚀 Railway Deployment Guide - SocialAutoPro

## 📋 Prerequisites
- GitHub account
- Railway account (sign up at railway.app)
- Your project pushed to GitHub

---

## 🎯 Step-by-Step Deployment

### **Step 1: Push Code to GitHub**

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - SocialAutoPro"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/socialautopro.git
git branch -M main
git push -u origin main
```

---

### **Step 2: Create Railway Project**

1. Go to **https://railway.app**
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your **socialautopro** repository
5. Railway will auto-detect Node.js project

---

### **Step 3: Add Redis Service**

1. In your Railway project dashboard
2. Click **"+ New"** → **"Database"** → **"Add Redis"**
3. Railway will automatically create Redis instance
4. Redis connection URL will be available as `REDIS_URL`

---

### **Step 4: Configure Environment Variables**

Click on your backend service → **"Variables"** tab → Add these:

```env
# Server
PORT=5000
NODE_ENV=production

# Database (Your TiDB Cloud)
DATABASE_URL=mysql://2uYGU3rLpbzu1bj.root:3bAAomlFe6lppdp0@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test

# Redis (Auto-provided by Railway)
# REDIS_URL is automatically set by Railway Redis service
# But if you need manual config:
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}

# Facebook
FACEBOOK_PAGE_ID=887450954442549
FACEBOOK_ACCESS_TOKEN=YOUR_PAGE_ACCESS_TOKEN_HERE

# LinkedIn
LINKEDIN_CLIENT_ID=86ygvczyc69ml6
LINKEDIN_CLIENT_SECRET=WPL_AP1.nAOk9CVwX2OMZl26.KgBHTQ==
LINKEDIN_REDIRECT_URI=https://your-app.railway.app/api/linkedin/callback
LINKEDIN_ACCESS_TOKEN=YOUR_LINKEDIN_TOKEN
LINKEDIN_PERSON_URN=urn:li:person:dT9oSRfuWA
LINKEDIN_ORG_ID=110968298

# Telegram
TELEGRAM_BOT_TOKEN=8587732244:AAEcHKf9QROh_wagUslzo-Eu3JEyM9-gSkQ
TELEGRAM_CHAT_ID=-1003712155165

# Facebook Webhook
FB_WEBHOOK_VERIFY_TOKEN=socialautopro_webhook_secret_2026

# Job Intervals
FB_INSIGHTS_INTERVAL_MS=86400000
FB_TOKEN_CHECK_INTERVAL_MS=86400000
FB_LEADS_INTERVAL_MS=21600000

# Frontend URL (Update after frontend deployment)
FRONTEND_URL=https://your-frontend.vercel.app
```

---

### **Step 5: Update Backend for Railway Redis**

Railway provides Redis URL in different format. Update your code:

**File: `backend/src/config/redis.ts`** (if exists) or create it:

```typescript
import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL;

let redisConfig: any;

if (redisUrl) {
  // Railway/Production Redis URL
  redisConfig = redisUrl;
} else {
  // Local development
  redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  };
}

export const redis = new Redis(redisConfig);
```

---

### **Step 6: Build Configuration**

Railway will automatically:
1. Run `npm install` in backend folder
2. Run `npm run build` (compiles TypeScript)
3. Run `npm run start` (starts the server)

Make sure your `backend/package.json` has:
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

---

### **Step 7: Deploy!**

1. Railway will automatically deploy when you push to GitHub
2. Wait for build to complete (2-3 minutes)
3. You'll get a public URL like: `https://socialautopro-production.up.railway.app`

---

### **Step 8: Update Facebook Webhook**

1. Copy your Railway URL: `https://your-app.railway.app`
2. Go to **Facebook Developer Console**
3. Update webhook URL to: `https://your-app.railway.app/api/facebook/webhook`
4. Verify token: `socialautopro_webhook_secret_2026`
5. Subscribe to `messages` events

---

### **Step 9: Deploy Frontend to Vercel**

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts and deploy
```

Update `FRONTEND_URL` in Railway environment variables.

---

## 🔧 Troubleshooting

### **Redis Connection Issues**
Check Railway Redis service is running and linked to your backend service.

### **Build Fails**
Check logs in Railway dashboard. Common issues:
- Missing dependencies
- TypeScript errors
- Wrong Node version

### **Webhook Not Working**
- Ensure Railway app is deployed and running
- Check Facebook webhook configuration
- Verify `FB_WEBHOOK_VERIFY_TOKEN` matches

---

## 📊 Monitoring

**Railway Dashboard:**
- View logs in real-time
- Monitor CPU/Memory usage
- Check deployment history

**Useful Commands:**
```bash
# View logs
railway logs

# Restart service
railway restart

# Open in browser
railway open
```

---

## 💰 Pricing

**Railway Free Tier:**
- $5 free credit/month
- 500 execution hours
- Enough for small projects

**Paid Plan:**
- $5/month for hobby plan
- More resources and uptime

---

## ✅ Post-Deployment Checklist

- [ ] Backend deployed on Railway
- [ ] Redis service added and connected
- [ ] Environment variables configured
- [ ] Facebook webhook updated
- [ ] Frontend deployed on Vercel
- [ ] Test auto-reply functionality
- [ ] Monitor logs for errors

---

## 🚀 Auto-Deploy Setup

Railway automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update auto-reply messages"
git push

# Railway will auto-deploy!
```

---

## 📞 Support

If you face issues:
1. Check Railway logs
2. Verify environment variables
3. Test webhook with Facebook's test tool
4. Check Redis connection

---

**🎉 Your SocialAutoPro is now live and will automatically reply to Facebook messages 24/7!**
