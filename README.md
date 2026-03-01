# 🚀 SocialAutoPro - Social Media Automation Platform

Enterprise-level social media automation system with intelligent auto-reply, post scheduling, and multi-platform publishing.

## ✨ Features

### 🤖 Facebook Messenger Automation
- **40+ Smart Auto-Reply Rules** with priority-based matching
- **Category-wise Organization**: Sales, Support, Urgent, HR, Enterprise
- **Intelligent Keyword Detection**: Exact and contains matching
- **Real-time Webhook Integration**
- **Message History & Analytics**

### 📱 Multi-Platform Publishing
- Facebook Pages
- LinkedIn (Profile & Company Pages)
- Telegram Channels
- Queue-based publishing with retry logic

### 📊 Analytics & Insights
- Facebook Page Insights
- Lead Generation tracking
- Token health monitoring
- Performance metrics

### 🔧 Technical Features
- TypeScript backend with Express.js
- Next.js frontend with TypeScript
- BullMQ job queue with Redis
- MySQL/TiDB Cloud database
- Real-time webhook processing
- Enterprise-grade error handling

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Facebook      │
│   Messenger     │──────┐
└─────────────────┘      │
                         │ Webhook
┌─────────────────┐      │
│   LinkedIn      │      ▼
│   API           │  ┌──────────────┐      ┌──────────┐
└─────────────────┘──│   Backend    │──────│  Redis   │
                     │   (Node.js)  │      │  Queue   │
┌─────────────────┐  └──────────────┘      └──────────┘
│   Telegram      │      │
│   Bot API       │──────┘
└─────────────────┘      │
                         ▼
                    ┌──────────┐
                    │  MySQL   │
                    │ Database │
                    └──────────┘
```

---

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/socialautopro.git
cd socialautopro
```

2. **Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Setup environment variables**
```bash
# Copy example files
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Edit with your credentials
```

4. **Start services**
```bash
# Option 1: Use PowerShell script (Windows)
.\start-all.ps1

# Option 2: Manual start
# Terminal 1: Redis
redis-server

# Terminal 2: Backend
cd backend
npm run dev

# Terminal 3: Frontend
cd frontend
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Webhook: http://localhost:5000/api/facebook/webhook

---

## 🌐 Production Deployment

### Railway (Backend) - Recommended

See detailed guide: [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)

**Quick Steps:**
1. Push code to GitHub
2. Create Railway project
3. Add Redis service
4. Configure environment variables
5. Deploy automatically

### Vercel (Frontend)

```bash
cd frontend
vercel
```

---

## 📋 Environment Variables

### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=production

# Database
DATABASE_URL=mysql://user:pass@host:port/database

# Redis (Railway auto-provides REDIS_URL)
REDIS_URL=redis://...
# OR for local:
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Facebook
FACEBOOK_PAGE_ID=your_page_id
FACEBOOK_ACCESS_TOKEN=your_page_access_token

# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_ACCESS_TOKEN=your_access_token

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Webhook
FB_WEBHOOK_VERIFY_TOKEN=your_verify_token

# Frontend
FRONTEND_URL=https://your-frontend.vercel.app
```

---

## 🤖 Auto-Reply System

### Categories & Priority

| Priority | Category | Keywords | Use Case |
|----------|----------|----------|----------|
| 50 | Urgent | urgent, asap, now | Immediate attention |
| 45 | Handoff | agent, human | Connect to live agent |
| 40 | Support | support, problem, bug | Technical issues |
| 40 | Enterprise | enterprise, corporate | Business clients |
| 35 | Lead | meeting, demo, call | Sales opportunities |
| 30 | Sales | price, quote, package | Pricing inquiries |
| 20 | Services | website, app, ecommerce | Service information |
| 15 | Info | contact, hours, location | Company details |
| 10 | Greeting | hello, hi | Welcome messages |
| 0 | Default | * | Fallback response |

### Adding Custom Rules

**Via Database:**
```sql
INSERT INTO fb_auto_reply_rules (id, keyword, reply_text, priority, category, match_type)
VALUES (UUID(), 'custom', 'Your reply here', 25, 'sales', 'contains');
```

**Via API:**
```bash
POST /api/facebook/auto-reply-rules
{
  "keyword": "custom",
  "reply_text": "Your reply here",
  "priority": 25,
  "category": "sales"
}
```

---

## 📊 API Endpoints

### Posts
- `GET /api/posts` - List all posts
- `POST /api/posts` - Create and publish post
- `GET /api/posts/:id` - Get post details
- `DELETE /api/posts/:id` - Delete post

### Facebook Messenger
- `GET /api/facebook/webhook` - Webhook verification
- `POST /api/facebook/webhook` - Receive messages
- `GET /api/facebook/messages` - Get message history
- `POST /api/facebook/messages/reply` - Send manual reply

### Auto-Reply Rules
- `GET /api/facebook/auto-reply-rules` - List rules
- `POST /api/facebook/auto-reply-rules` - Create rule
- `PUT /api/facebook/auto-reply-rules/:id` - Update rule
- `DELETE /api/facebook/auto-reply-rules/:id` - Delete rule

### Insights & Analytics
- `GET /api/facebook/insights` - Get page insights
- `GET /api/facebook/insights/summary` - Get summary
- `GET /api/facebook/leads` - Get leads
- `GET /api/facebook/token/health` - Check token status

---

## 🔧 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MySQL / TiDB Cloud
- **Queue**: BullMQ + Redis
- **HTTP Client**: Axios

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **HTTP**: Fetch API

---

## 📈 Monitoring

### Railway Dashboard
- Real-time logs
- Resource usage
- Deployment history
- Environment variables

### Application Logs
```bash
# View Railway logs
railway logs

# Filter by service
railway logs --service backend
```

---

## 🛠️ Troubleshooting

### Webhook Not Receiving Messages
1. Check Railway deployment is live
2. Verify Facebook webhook URL is correct
3. Ensure `FB_WEBHOOK_VERIFY_TOKEN` matches
4. Check webhook subscriptions include `messages`

### Redis Connection Issues
1. Verify Redis service is running on Railway
2. Check `REDIS_URL` environment variable
3. Ensure services are linked in Railway

### Auto-Reply Not Working
1. Check Page Access Token (not User Token)
2. Verify token has `pages_messaging` permission
3. Check auto-reply rules are active
4. Review logs for errors

---

## 📝 License

MIT License - feel free to use for personal or commercial projects.

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push and create a Pull Request

---

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Check documentation in `/docs`
- Review deployment guide

---

## 🎉 Credits

Built with ❤️ for automating social media management.

**Key Technologies:**
- Facebook Graph API
- LinkedIn API
- Telegram Bot API
- Railway Platform
- Vercel Platform

---

**Made by BornoSoft** 🚀
