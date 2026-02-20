# 📘 SocialAutoPro — Single User Social Media Automation System

> **Learning & Testing Version — Full Technical Documentation**

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Database Design](#5-database-design)
6. [Environment Variables](#6-environment-variables)
7. [API Endpoints](#7-api-endpoints)
8. [Automation Flow](#8-automation-flow)
9. [Telegram Setup](#9-telegram-setup)
10. [Facebook Setup](#10-facebook-setup)
11. [LinkedIn Setup](#11-linkedin-setup)
12. [Queue Configuration](#12-queue-configuration)
13. [Error Handling](#13-error-handling)
14. [Testing Procedure](#14-testing-procedure)
15. [Security Notes](#15-security-notes)
16. [Expected Output](#16-expected-output)
17. [Limitations](#17-limitations)
18. [Frontend (Next.js + TypeScript)](#18-frontend-nextjs--typescript)
19. [Installation & Setup Guide](#19-installation--setup-guide)
20. [Future Upgrade Path](#20-future-upgrade-path)

---

## 1️⃣ Project Overview

| Key         | Value                            |
| ----------- | -------------------------------- |
| **Type**    | Single User Automation System    |
| **Purpose** | Learning & Testing               |
| **Stack**   | TypeScript, Node.js, Express, Next.js, PostgreSQL, Redis, BullMQ |

### What It Does

Website e post add করলে automatically publish হবে:

- ✅ **Facebook Page**
- ✅ **LinkedIn Page**
- ✅ **Telegram Channel**

> ⚠️ WhatsApp group automation official API তে supported না, তাই testing version এ include করা হচ্ছে না।

---

## 2️⃣ System Architecture

```
┌─────────────────────────────────┐
│     Admin Panel (Next.js)       │
│     TypeScript + Tailwind CSS   │
└──────────────┬──────────────────┘
               │ HTTP REST API
               ▼
┌─────────────────────────────────┐
│   Backend API (Node.js +        │
│   Express + TypeScript)         │
└──────────────┬──────────────────┘
               │
       ┌───────┼───────┐
       ▼       ▼       ▼
┌──────────┐ ┌─────┐ ┌──────────────┐
│PostgreSQL│ │Redis│ │Social Media  │
│ Database │ │Queue│ │    APIs       │
└──────────┘ └─────┘ └──────────────┘
                        │
            ┌───────────┼───────────┐
            ▼           ▼           ▼
       Facebook     LinkedIn    Telegram
        Page          Page      Channel
```

### Flow Summary

```
User Creates Post → Save to DB → Add to Queue → Worker Processes →
  → Facebook API
  → LinkedIn API
  → Telegram API
→ Update Status → Save Logs
```

---

## 3️⃣ Technology Stack

### Backend

| Technology   | Purpose                        |
| ------------ | ------------------------------ |
| Node.js      | Runtime environment            |
| Express.js   | HTTP server framework          |
| TypeScript   | Type-safe development          |
| Axios        | HTTP client for API calls      |
| BullMQ       | Job queue management           |
| Redis        | Queue broker / caching         |
| PostgreSQL   | Relational database            |
| pg (node-postgres) | PostgreSQL client         |
| dotenv       | Environment variable management|
| uuid         | Unique ID generation           |

### Frontend

| Technology   | Purpose                        |
| ------------ | ------------------------------ |
| Next.js 14   | React framework (App Router)   |
| TypeScript   | Type-safe development          |
| Tailwind CSS | Utility-first CSS framework    |
| Axios        | HTTP client for API calls      |
| React Hot Toast | Toast notifications         |

### DevTools

| Tool                   | Purpose                |
| ---------------------- | ---------------------- |
| Postman                | API testing            |
| ngrok                  | Webhook testing        |
| Meta Developer Account | Facebook integration   |
| LinkedIn Developer App | LinkedIn integration   |
| Telegram BotFather     | Telegram bot setup     |

---

## 4️⃣ Project Structure

```
SocialAutoPro/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts                 # PostgreSQL connection & table init
│   │   │
│   │   ├── controllers/
│   │   │   └── post.controller.ts    # Request handlers
│   │   │
│   │   ├── services/
│   │   │   ├── facebook.service.ts   # Facebook Graph API integration
│   │   │   ├── linkedin.service.ts   # LinkedIn UGC API integration
│   │   │   └── telegram.service.ts   # Telegram Bot API integration
│   │   │
│   │   ├── jobs/
│   │   │   ├── post.queue.ts         # BullMQ queue setup
│   │   │   └── post.worker.ts        # BullMQ worker (job processor)
│   │   │
│   │   ├── routes/
│   │   │   └── post.routes.ts        # Express route definitions
│   │   │
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript interfaces & types
│   │   │
│   │   └── app.ts                    # Express app configuration
│   │
│   ├── .env                          # Environment variables
│   ├── .env.example                  # Environment template
│   ├── package.json
│   ├── tsconfig.json
│   └── server.ts                     # Server entry point
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx            # Root layout
│   │   │   ├── page.tsx              # Home page (dashboard)
│   │   │   ├── globals.css           # Global styles + Tailwind
│   │   │   └── posts/
│   │   │       └── page.tsx          # Post management page
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.tsx            # Navigation bar
│   │   │   ├── PostForm.tsx          # Create post form
│   │   │   ├── PostList.tsx          # List of all posts
│   │   │   ├── PostCard.tsx          # Single post card
│   │   │   ├── StatusBadge.tsx       # Status indicator badge
│   │   │   └── LogViewer.tsx         # Post log viewer
│   │   │
│   │   ├── lib/
│   │   │   └── api.ts               # Axios API client
│   │   │
│   │   └── types/
│   │       └── index.ts             # Shared TypeScript types
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   └── next.config.js
│
├── README.md                         # This file
└── .gitignore
```

---

## 5️⃣ Database Design

### Table: `posts`

| Field        | Type        | Constraint      | Description                          |
| ------------ | ----------- | --------------- | ------------------------------------ |
| `id`         | UUID        | PRIMARY KEY     | Unique post identifier               |
| `title`      | VARCHAR(255)| NOT NULL        | Post title / heading                 |
| `content`    | TEXT        | NOT NULL        | Post body / description              |
| `image_url`  | TEXT        | NULLABLE        | Optional image URL                   |
| `status`     | VARCHAR(20) | DEFAULT 'pending' | pending / published / failed       |
| `created_at` | TIMESTAMP   | DEFAULT NOW()   | Creation timestamp                   |
| `updated_at` | TIMESTAMP   | DEFAULT NOW()   | Last update timestamp                |

### Table: `post_logs`

| Field        | Type        | Constraint      | Description                          |
| ------------ | ----------- | --------------- | ------------------------------------ |
| `id`         | UUID        | PRIMARY KEY     | Unique log entry identifier          |
| `post_id`    | UUID        | FOREIGN KEY     | Reference to posts table             |
| `platform`   | VARCHAR(50) | NOT NULL        | facebook / linkedin / telegram       |
| `response`   | JSONB       | NULLABLE        | Raw API response stored as JSON      |
| `status`     | VARCHAR(20) | NOT NULL        | success / failed                     |
| `error`      | TEXT        | NULLABLE        | Error message if failed              |
| `created_at` | TIMESTAMP   | DEFAULT NOW()   | Log creation timestamp               |

### SQL Schema

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE post_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    response JSONB,
    status VARCHAR(20) NOT NULL,
    error TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_post_logs_post_id ON post_logs(post_id);
CREATE INDEX idx_post_logs_platform ON post_logs(platform);
```

---

## 6️⃣ Environment Variables

### Backend `.env`

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/socialauto

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Facebook
FACEBOOK_PAGE_ID=your_page_id_here
FACEBOOK_ACCESS_TOKEN=your_page_access_token_here

# LinkedIn
LINKEDIN_ORG_ID=your_organization_id_here
LINKEDIN_ACCESS_TOKEN=your_access_token_here

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 7️⃣ API Endpoints

### Base URL: `http://localhost:5000/api`

### Posts

| Method | Endpoint            | Description                |
| ------ | ------------------- | -------------------------- |
| POST   | `/api/posts`        | Create & publish a post    |
| GET    | `/api/posts`        | Get all posts              |
| GET    | `/api/posts/:id`    | Get single post with logs  |
| DELETE | `/api/posts/:id`    | Delete a post              |
| POST   | `/api/posts/:id/retry` | Retry failed post       |

### Create Post

**Request:**
```http
POST /api/posts
Content-Type: application/json

{
  "title": "Event Title",
  "content": "Event Description — your post body goes here",
  "image_url": "https://example.com/image.jpg"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Post created & publishing started",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Event Title",
    "content": "Event Description — your post body goes here",
    "image_url": "https://example.com/image.jpg",
    "status": "pending",
    "created_at": "2026-02-20T10:00:00.000Z"
  }
}
```

### Get All Posts

**Request:**
```http
GET /api/posts
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Event Title",
      "content": "Event Description",
      "image_url": "https://...",
      "status": "published",
      "created_at": "2026-02-20T10:00:00.000Z",
      "updated_at": "2026-02-20T10:00:05.000Z"
    }
  ]
}
```

### Get Single Post (with Logs)

**Request:**
```http
GET /api/posts/:id
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Event Title",
    "content": "Event Description",
    "status": "published",
    "created_at": "...",
    "logs": [
      {
        "id": "log-uuid",
        "platform": "facebook",
        "status": "success",
        "response": { "id": "123_456" },
        "created_at": "..."
      },
      {
        "id": "log-uuid",
        "platform": "telegram",
        "status": "success",
        "response": { "ok": true },
        "created_at": "..."
      }
    ]
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Post not found"
}
```

---

## 8️⃣ Automation Flow

```
┌──────────────────┐
│  1. User creates │
│     post via UI  │
└────────┬─────────┘
         ▼
┌──────────────────┐
│  2. POST /api/   │
│     posts        │
└────────┬─────────┘
         ▼
┌──────────────────┐
│  3. Save to DB   │
│  status: pending │
└────────┬─────────┘
         ▼
┌──────────────────┐
│  4. Add job to   │
│     BullMQ queue │
└────────┬─────────┘
         ▼
┌──────────────────┐
│  5. Worker picks │
│     up the job   │
└────────┬─────────┘
         ▼
┌──────────────────────────────┐
│  6. Publish to all platforms │
│                              │
│  ┌──────────┐ ┌──────────┐  │
│  │ Facebook │ │ LinkedIn │  │
│  └──────────┘ └──────────┘  │
│       ┌──────────┐          │
│       │ Telegram │          │
│       └──────────┘          │
└──────────────┬───────────────┘
               ▼
┌──────────────────┐
│  7. Update post  │
│  status in DB    │
└────────┬─────────┘
         ▼
┌──────────────────┐
│  8. Save API     │
│  response logs   │
└──────────────────┘
```

### Detailed Steps:

1. **Post Create Request** → Frontend form submit করলে backend API call হয়
2. **Save to Database** → Post data PostgreSQL এ save হয় (status: `pending`)
3. **Add to Queue** → BullMQ তে job add হয় post ID সহ
4. **Worker Processes** → Worker automatically job pick করে
5. **API Calls** → Parallel ভাবে তিনটা platform এ publish হয়:
   - Facebook Graph API → Page post
   - LinkedIn UGC API → Organization post
   - Telegram Bot API → Channel message
6. **Update Status** → সব success হলে `published`, কোনো একটা fail হলে `failed`
7. **Save Logs** → প্রতিটা platform এর response আলাদা ভাবে `post_logs` table এ save হয়

---

## 9️⃣ Telegram Setup

### Steps:

1. **Open Telegram** → Mobile বা Desktop যেকোনো version
2. **Search `@BotFather`** → Telegram এর official bot creator
3. **Send `/newbot`** → নতুন bot create করতে
4. **Set bot name** → যেকোনো name দিন (e.g., "SocialAutoPro Bot")
5. **Set bot username** → unique username দিন (must end with `bot`, e.g., `socialautopro_bot`)
6. **Copy Token** → BotFather যে token দিবে সেটা copy করুন
7. **Create Channel** → Telegram এ একটা channel create করুন
8. **Add bot as admin** → Channel settings → Administrators → Add → আপনার bot select করুন
9. **Get `chat_id`**:
   - Channel এ একটা message send করুন
   - Browser এ যান: `https://api.telegram.org/bot<TOKEN>/getUpdates`
   - Response এ `chat.id` পাবেন (channel এর জন্য negative number হবে, e.g., `-1001234567890`)

### Telegram API Reference

**Send Text Message:**
```http
POST https://api.telegram.org/bot<TOKEN>/sendMessage
Content-Type: application/json

{
  "chat_id": "-1001234567890",
  "text": "📢 *Event Title*\n\nEvent Description",
  "parse_mode": "Markdown"
}
```

**Send Photo with Caption:**
```http
POST https://api.telegram.org/bot<TOKEN>/sendPhoto
Content-Type: application/json

{
  "chat_id": "-1001234567890",
  "photo": "https://example.com/image.jpg",
  "caption": "📢 *Event Title*\n\nEvent Description",
  "parse_mode": "Markdown"
}
```

---

## 🔟 Facebook Setup

### Steps:

1. **Go to [Meta for Developers](https://developers.facebook.com/)**
2. **Log in** with your Facebook account
3. **Create App** → "Business" type select করুন
4. **App Dashboard** → "Add Product" → **"Facebook Login"** add করুন
5. **Pages API Setup**:
   - Tools → Graph API Explorer
   - Select your App
   - Click "Get User Access Token"
   - Check permissions: `pages_manage_posts`, `pages_read_engagement`
   - Generate token
6. **Get Page Access Token**:
   - Graph API Explorer এ: `GET /me/accounts`
   - Response এ আপনার page এর `access_token` এবং `id` পাবেন
7. **Copy `PAGE_ID`** এবং **`PAGE_ACCESS_TOKEN`**

> ⚠️ **Note:** Default token 1-2 ঘণ্টায় expire হয়। Long-lived token generate করতে:
> ```
> GET /oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN
> ```

### Facebook API Reference

**Create Page Post (Text):**
```http
POST https://graph.facebook.com/v18.0/{page-id}/feed
Content-Type: application/x-www-form-urlencoded

message=Your Post Content&access_token=PAGE_ACCESS_TOKEN
```

**Create Page Post (With Image URL):**
```http
POST https://graph.facebook.com/v18.0/{page-id}/photos
Content-Type: application/x-www-form-urlencoded

url=https://example.com/image.jpg&caption=Your Post Content&access_token=PAGE_ACCESS_TOKEN
```

---

## 1️⃣1️⃣ LinkedIn Setup

### Steps:

1. **Go to [LinkedIn Developers](https://www.linkedin.com/developers/)**
2. **Create App** → Company page associate করুন
3. **Products tab** → **"Share on LinkedIn"** এবং **"Marketing Developer Platform"** request করুন
4. **Auth tab** → OAuth 2.0 settings:
   - Redirect URL add করুন: `http://localhost:3000/callback`
5. **Get Access Token**:
   - Auth tab → OAuth 2.0 tools → Token Generator
   - Scopes: `w_member_social`, `w_organization_social`
   - Generate token
6. **Get Organization ID**:
   - LinkedIn company page URL দেখুন: `linkedin.com/company/12345678`
   - `12345678` হলো আপনার Organization ID

### LinkedIn API Reference

**Create Organization Post:**
```http
POST https://api.linkedin.com/v2/ugcPosts
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
X-Restli-Protocol-Version: 2.0.0

{
  "author": "urn:li:organization:ORG_ID",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.ShareContent": {
      "shareCommentary": {
        "text": "Your post content here"
      },
      "shareMediaCategory": "NONE"
    }
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  }
}
```

**With Image (shareMediaCategory: "IMAGE"):**
```json
{
  "author": "urn:li:organization:ORG_ID",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.ShareContent": {
      "shareCommentary": {
        "text": "Your post content"
      },
      "shareMediaCategory": "ARTICLE",
      "media": [
        {
          "status": "READY",
          "originalUrl": "https://example.com/image.jpg"
        }
      ]
    }
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  }
}
```

---

## 1️⃣2️⃣ Queue Configuration

### BullMQ Setup

- **Queue Name:** `post-publish`
- **Connection:** Redis (localhost:6379)
- **Concurrency:** 1 (sequential processing)
- **Retry:** 3 attempts with exponential backoff

### Flow:

```typescript
// Adding job to queue
await postQueue.add('publish-post', { postId: 'uuid' }, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,  // 2s, 4s, 8s
  },
});

// Worker processing
const worker = new Worker('post-publish', async (job) => {
  const { postId } = job.data;
  await publishToAllPlatforms(postId);
}, { connection: redisConnection });
```

---

## 1️⃣3️⃣ Error Handling

### Strategy:

| Scenario              | Action                                      |
| --------------------- | ------------------------------------------- |
| API call fails        | Save status: `failed`, log error response   |
| Database error        | Return 500 with error message               |
| Invalid request       | Return 400 with validation message          |
| Queue job fails       | Auto-retry (3 attempts), then mark failed   |
| Server crash          | Graceful shutdown, close DB & Redis         |

### Per-Platform Error Handling:

```
Platform 1 (Facebook)  → ✅ Success → Log success
Platform 2 (LinkedIn)  → ❌ Failed  → Log error, continue
Platform 3 (Telegram)  → ✅ Success → Log success

Final Status: "failed" (because one platform failed)
```

- প্রতিটা platform independently handle হয়
- একটা fail হলে বাকিগুলো বন্ধ হয় না
- সব platform এর result check করে final status set হয়

---

## 1️⃣4️⃣ Testing Procedure

### Prerequisites:

1. ✅ PostgreSQL running (port 5432)
2. ✅ Redis running (port 6379)
3. ✅ All `.env` variables configured

### Step-by-Step:

```bash
# 1. Start PostgreSQL (if not running)
# Windows: Start from Services or pgAdmin

# 2. Start Redis (if not running)
# Windows: redis-server

# 3. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 4. Start backend
cd backend && npm run dev

# 5. Start frontend (new terminal)
cd frontend && npm run dev

# 6. Open browser
# http://localhost:3000
```

### Testing via Postman:

```http
POST http://localhost:5000/api/posts
Content-Type: application/json

{
  "title": "Test Post from Postman",
  "content": "This is a test post to verify social media automation",
  "image_url": "https://picsum.photos/800/400"
}
```

### Verification Checklist:

- [ ] Facebook page এ post দেখা যাচ্ছে
- [ ] LinkedIn page এ post দেখা যাচ্ছে
- [ ] Telegram channel এ message এসেছে
- [ ] Database `posts` table এ status `published`
- [ ] Database `post_logs` table এ তিনটা entry আছে
- [ ] Frontend dashboard এ post status updated

---

## 1️⃣5️⃣ Security Notes

### Testing Level Security:

| Practice                    | Status |
| --------------------------- | ------ |
| Tokens in `.env`            | ✅     |
| `.env` in `.gitignore`      | ✅     |
| No tokens in frontend       | ✅     |
| CORS configured             | ✅     |
| Input validation            | ✅     |
| HTTPS in production         | ⚠️ TODO |

> 🔴 **Warning:** This is a testing/learning version. Production deployment এ additional security measures প্রয়োজন: rate limiting, helmet.js, input sanitization, OAuth flow, etc.

---

## 1️⃣6️⃣ Expected Output

### When Post Created Successfully:

| Platform  | Result                                  |
| --------- | --------------------------------------- |
| Telegram  | ✅ Message posted in channel            |
| Facebook  | ✅ Post created on page                 |
| LinkedIn  | ✅ Organization post created            |
| Database  | ✅ `posts.status` = `published`         |
| Logs      | ✅ 3 entries in `post_logs` with API responses |

### Dashboard View:

- Post card shows **green badge** = published
- Post card shows **red badge** = failed (with retry button)
- Post card shows **yellow badge** = pending
- Click post to see detailed platform-wise logs

---

## 1️⃣7️⃣ Limitations (Testing Version)

| Limitation                  | Note                                   |
| --------------------------- | -------------------------------------- |
| Single user only            | No authentication system               |
| Static tokens               | Manual token management                |
| No OAuth flow               | No login/signup                        |
| No scheduler                | Immediate publish only                 |
| No subscription system      | Free/unlimited                         |
| No analytics                | No engagement tracking                 |
| No WhatsApp                 | Official API not supported for groups  |
| No image upload             | URL-based images only                  |
| Token expiry                | Manual token refresh needed            |

---

## 1️⃣8️⃣ Frontend (Next.js + TypeScript)

### Features:

- 📝 **Post Creation Form** — Title, content, image URL input
- 📋 **Post List** — All posts with status badges
- 📊 **Post Detail** — Platform-wise logs with API responses
- 🔄 **Retry Failed** — Re-publish failed posts
- 🗑️ **Delete Post** — Remove posts from database
- 📱 **Responsive Design** — Mobile-friendly with Tailwind CSS

### Pages:

| Route        | Description             |
| ------------ | ----------------------- |
| `/`          | Dashboard with stats    |
| `/posts`     | Post list + create form |

---

## 1️⃣9️⃣ Installation & Setup Guide

### 1. Clone Repository

```bash
git clone <repo-url>
cd SocialAutoPro
```

### 2. Setup PostgreSQL

```sql
CREATE DATABASE socialauto;
```
> Tables are auto-created on first backend start.

### 3. Setup Redis

```bash
# Windows: Download from https://github.com/microsoftarchive/redis/releases
# Or use WSL: sudo apt install redis-server && redis-server

# Verify:
redis-cli ping
# Should return: PONG
```

### 4. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your tokens

# Frontend
# Create frontend/.env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > frontend/.env.local
```

### 5. Install & Run

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### 6. Access

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **API Health:** http://localhost:5000/api/health

---

## 2️⃣0️⃣ Future Upgrade Path

| Feature              | Description                              |
| -------------------- | ---------------------------------------- |
| 👥 Multi-user system | User registration & authentication       |
| 🔐 OAuth login       | Google, Facebook, LinkedIn SSO           |
| ⏰ Post scheduler    | Schedule posts for future dates          |
| 🤖 AI caption        | Auto-generate captions using AI          |
| 📸 Image upload      | Direct file upload instead of URL        |
| 📊 Dashboard         | Analytics & engagement metrics           |
| 💳 Subscription      | Billing & plan management                |
| 📱 WhatsApp          | When official group API available        |
| 🔔 Notifications     | Email/push notifications on publish      |
| 📝 Post templates    | Reusable post templates                  |

---

## 📄 License

This project is for **learning and testing purposes only**. Use responsibly and follow each platform's API terms of service.

---

> Built with ❤️ for learning social media automation
