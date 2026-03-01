import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// MySQL Connection Pool
// ============================================

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL as string,
  ssl: {
    rejectUnauthorized: true
  }
});

// ============================================
// Initialize Database Tables
// ============================================

export async function initDatabase(): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS post_logs (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        post_id CHAR(36),
        platform VARCHAR(50) NOT NULL,
        response JSON,
        status VARCHAR(20) NOT NULL,
        error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      )
    `);

    // ========== Facebook Messages ==========
    await connection.query(`
      CREATE TABLE IF NOT EXISTS fb_messages (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        sender_id VARCHAR(100) NOT NULL,
        sender_name VARCHAR(255),
        message_text TEXT NOT NULL,
        direction ENUM('incoming', 'outgoing') NOT NULL DEFAULT 'incoming',
        replied BOOLEAN DEFAULT FALSE,
        replied_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ========== Facebook Auto Reply Rules ==========
    await connection.query(`
      CREATE TABLE IF NOT EXISTS fb_auto_reply_rules (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        keyword VARCHAR(255) NOT NULL,
        reply_text TEXT NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        priority INT DEFAULT 0,
        category VARCHAR(50) DEFAULT 'general',
        match_type ENUM('exact', 'contains') DEFAULT 'contains',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // ========== Facebook Page Insights ==========
    await connection.query(`
      CREATE TABLE IF NOT EXISTS fb_page_insights (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        metric_name VARCHAR(100) NOT NULL,
        metric_value BIGINT DEFAULT 0,
        period VARCHAR(50) NOT NULL,
        end_time VARCHAR(50) NOT NULL,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_metric_period_time (metric_name, period, end_time)
      )
    `);

    // ========== Facebook Leads ==========
    await connection.query(`
      CREATE TABLE IF NOT EXISTS fb_leads (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        lead_id VARCHAR(100) NOT NULL UNIQUE,
        form_id VARCHAR(100) NOT NULL,
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(100),
        full_data JSON,
        status ENUM('new', 'contacted', 'closed') DEFAULT 'new',
        created_time TIMESTAMP NOT NULL,
        fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ========== Facebook Token Health Logs ==========
    await connection.query(`
      CREATE TABLE IF NOT EXISTS fb_token_health_logs (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        is_valid BOOLEAN NOT NULL,
        expires_at TIMESTAMP NULL,
        scopes TEXT,
        error TEXT,
        checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes safely (ignore if already exists)
    try { await connection.query(`CREATE INDEX idx_posts_status ON posts(status)`); } catch (_) {}
    try { await connection.query(`CREATE INDEX idx_post_logs_post_id ON post_logs(post_id)`); } catch (_) {}
    try { await connection.query(`CREATE INDEX idx_post_logs_platform ON post_logs(platform)`); } catch (_) {}
    try { await connection.query(`CREATE INDEX idx_fb_messages_sender ON fb_messages(sender_id)`); } catch (_) {}
    try { await connection.query(`CREATE INDEX idx_fb_messages_direction ON fb_messages(direction)`); } catch (_) {}
    try { await connection.query(`CREATE INDEX idx_fb_leads_form ON fb_leads(form_id)`); } catch (_) {}
    try { await connection.query(`CREATE INDEX idx_fb_leads_status ON fb_leads(status)`); } catch (_) {}
    try { await connection.query(`CREATE INDEX idx_fb_insights_metric ON fb_page_insights(metric_name)`); } catch (_) {}
    try { await connection.query(`CREATE INDEX idx_fb_token_health ON fb_token_health_logs(checked_at)`); } catch (_) {}

    // Insert default auto-reply rule if none exists
    const [existingRules] = await connection.query<any[]>(
      'SELECT COUNT(*) as count FROM fb_auto_reply_rules'
    );
    if (existingRules[0].count === 0) {
      await connection.query(`
        INSERT INTO fb_auto_reply_rules (id, keyword, reply_text, is_default, is_active, priority, category, match_type)
        VALUES
          -- DEFAULT FALLBACK
          (UUID(), '__DEFAULT__', '👋 Thanks for messaging BornoSoft! 🚀\n\nPlease tell us what service you are looking for:\n\n1️⃣ Website Development\n2️⃣ eCommerce Store\n3️⃣ Mobile App\n4️⃣ Digital Marketing\n5️⃣ Get a Quote\n6️⃣ Talk to Support\n\nOur team will assist you shortly! 😊', TRUE, TRUE, 0, 'general', 'contains'),
          
          -- GREETING (Priority: 10)
          (UUID(), 'hello', '� W elcome to BornoSoft!\n\nWe provide:\n🌐 Website Development\n🛒 eCommerce Solutions\n📱 Mobile Apps\n� Digimtal Marketing\n\nHow can we help you today? 🚀', FALSE, TRUE, 10, 'greeting', 'contains'),
          (UUID(), 'hi', '👋 Hi there! Welcome to BornoSoft.\n\nWe build websites, apps & digital solutions.\n\nWhat brings you here today? 😊', FALSE, TRUE, 10, 'greeting', 'contains'),
          (UUID(), 'assalamualaikum', 'وعليكم السلام! 🤲\n\nWelcome to BornoSoft. How can we assist you today?\n\nPlease share your requirements! 😊', FALSE, TRUE, 10, 'greeting', 'contains'),
          (UUID(), 'good morning', '🌅 Good Morning!\n\nWelcome to BornoSoft. Ready to discuss your project?\n\nLet us know how we can help! 💼', FALSE, TRUE, 10, 'greeting', 'contains'),
          
          -- SERVICES (Priority: 20)
          (UUID(), 'service', '� BorngoSoft Services:\n\n🌐 Website Development\n🛒 eCommerce Development\n� Mobile Apmp Development\n💻 Custom Software (ERP/CRM)\n📈 Digital Marketing & SEO\n\nWhich service interests you? 🎯', FALSE, TRUE, 20, 'services', 'contains'),
          (UUID(), 'website', '🌐 Website Development!\n\nWe build:\n✅ Business Websites\n✅ Corporate Websites\n✅ Portfolio Websites\n✅ Landing Pages\n✅ WordPress/Custom\n\nPlease share:\n1️⃣ Business or eCommerce?\n2️⃣ Domain & Hosting status?\n3️⃣ Timeline?\n\nWe will prepare a proposal! 📋', FALSE, TRUE, 20, 'services', 'contains'),
          (UUID(), 'ecommerce', '🛒 eCommerce Store Development!\n\nFeatures:\n✅ Product Management\n✅ Payment Gateway (bKash, Nagad, SSL)\n✅ Inventory System\n✅ Order Tracking\n✅ Mobile Responsive\n\nPlease share:\n📦 How many products?\n💳 Payment methods needed?\n📅 Timeline?\n\nLet us build your online store! 🚀', FALSE, TRUE, 20, 'services', 'contains'),
          (UUID(), 'app', '📱 Mobile App Development!\n\nWe build:\n✅ Android Apps\n✅ iOS Apps\n✅ Cross-platform (Flutter/React Native)\n✅ Play Store & App Store Publishing\n\nShare your app idea and we will provide a detailed proposal! 🎯', FALSE, TRUE, 20, 'services', 'contains'),
          (UUID(), 'digital marketing', '📈 Digital Marketing Services!\n\nWe offer:\n✅ SEO (Google Ranking)\n✅ Facebook Ads\n✅ Google Ads\n✅ Social Media Management\n✅ Lead Generation\n\nBoost your business online! 🚀\n\nInterested? Let us discuss your goals! 💬', FALSE, TRUE, 20, 'services', 'contains'),
          (UUID(), 'software', '💻 Custom Software Development!\n\nWe build:\n✅ ERP Systems\n✅ CRM Solutions\n✅ Inventory Management\n✅ POS Systems\n✅ Custom Business Software\n\nShare your requirements for a tailored solution! 🎯', FALSE, TRUE, 20, 'services', 'contains'),
          
          -- PRICING & SALES (Priority: 30)
          (UUID(), 'price', '💰 Pricing Information:\n\n📌 Basic Website: ৳25,000+\n📌 eCommerce Store: ৳50,000+\n📌 Mobile App: ৳1,50,000+\n📌 Digital Marketing: Custom packages\n\nPricing depends on features & requirements.\n\nShare your project details for exact quotation! 📋', FALSE, TRUE, 30, 'sales', 'contains'),
          (UUID(), 'quote', '📋 Get Your Quotation!\n\nPlease share:\n✅ Project type (Website/App/Marketing)\n✅ Features needed\n✅ Timeline\n✅ Budget range\n\nWe will respond within 1 hour! ⏳', FALSE, TRUE, 30, 'sales', 'contains'),
          (UUID(), 'package', '� Our Packasges:\n\n🥉 BASIC: Website + Hosting (৳25K)\n🥈 STANDARD: eCommerce + Payment (৳50K)\n🥇 PREMIUM: Full Custom Solution (৳1L+)\n\nCustom packages available!\n\nWhich one suits your needs? 💼', FALSE, TRUE, 30, 'sales', 'contains'),
          (UUID(), 'discount', '🎉 Special Offer!\n\nGet 10% discount on:\n✅ New projects this month\n✅ Bulk orders\n✅ Long-term contracts\n\nContact us now to claim your discount! 💰', FALSE, TRUE, 30, 'sales', 'contains'),
          (UUID(), 'budget', '� Budget D iscussion:\n\nWe work with various budgets!\n\nPlease share:\n1️⃣ Your budget range\n2️⃣ Must-have features\n3️⃣ Timeline\n\nWe will suggest the best solution! 🎯', FALSE, TRUE, 30, 'sales', 'contains'),
          
          -- SUPPORT & TECHNICAL (Priority: 40)
          (UUID(), 'support', '🛠️ Technical Support!\n\nOur support team is ready to help.\n\nPlease share:\n✅ Issue description\n✅ Screenshots (if any)\n✅ Your website/app URL\n\nWe will resolve it ASAP! ⚡', FALSE, TRUE, 40, 'support', 'contains'),
          (UUID(), 'problem', '⚠️ Having an issue?\n\nDon not worry, we are here to help!\n\nPlease describe:\n1️⃣ What is the problem?\n2️⃣ When did it start?\n3️⃣ Any error messages?\n\nOur team will fix it quickly! 🔧', FALSE, TRUE, 40, 'support', 'contains'),
          (UUID(), 'bug', '🐛 Bug Report:\n\nThank you for reporting!\n\nPlease provide:\n✅ Steps to reproduce\n✅ Screenshots\n✅ Device/Browser info\n\nWe will investigate and fix it! 🔍', FALSE, TRUE, 40, 'support', 'contains'),
          (UUID(), 'error', '❌ Error Detected?\n\nLet us fix it!\n\nPlease share:\n1️⃣ Error message\n2️⃣ Screenshot\n3️⃣ What were you doing?\n\nOur tech team will resolve it! 💻', FALSE, TRUE, 40, 'support', 'contains'),
          
          -- URGENT & HIGH PRIORITY (Priority: 50)
          (UUID(), 'urgent', '🚨 URGENT REQUEST!\n\nWe understand it is urgent.\n\nPlease share your phone number — our team will call you within 10 minutes! ☎️\n\nOr describe your requirement here for immediate assistance. ⚡', FALSE, TRUE, 50, 'urgent', 'contains'),
          (UUID(), 'asap', '⚡ ASAP Request!\n\nWe are prioritizing your request.\n\nPlease share:\n✅ Your contact number\n✅ Brief requirement\n✅ Deadline\n\nOur team will contact you immediately! 📞', FALSE, TRUE, 50, 'urgent', 'contains'),
          (UUID(), 'now', '⏰ Need it NOW?\n\nWe are ready to help!\n\nShare your phone number for instant callback.\n\nOr describe your urgent need here! 🚀', FALSE, TRUE, 50, 'urgent', 'contains'),
          
          -- LEAD MANAGEMENT (Priority: 35)
          (UUID(), 'meeting', '📅 Schedule a Meeting!\n\nPlease share:\n✅ Preferred date & time\n✅ Meeting type (Zoom/Google Meet/Phone)\n✅ Discussion topic\n\nWe will confirm your appointment! 🤝', FALSE, TRUE, 35, 'lead', 'contains'),
          (UUID(), 'appointment', '📆 Book Your Appointment!\n\nAvailable slots:\n🕐 Morning: 10 AM - 12 PM\n🕐 Afternoon: 2 PM - 5 PM\n\nWhich time works for you? 😊', FALSE, TRUE, 35, 'lead', 'contains'),
          (UUID(), 'demo', '🎯 Live Demo Request!\n\nWe would love to show you our work!\n\nPlease share:\n📅 Preferred date & time\n💻 Which product/service demo?\n\nWe will arrange it! 🚀', FALSE, TRUE, 35, 'lead', 'contains'),
          (UUID(), 'call', '📞 Request a Call!\n\nPlease share your phone number and preferred time.\n\nOur team will call you back! ☎️', FALSE, TRUE, 35, 'lead', 'contains'),
          
          -- COMPANY INFO (Priority: 15)
          (UUID(), 'contact', '📞 Contact BornoSoft:\n\n📧 Email: info@bornosoft.com\n📱 Phone: +880 1XXX-XXXXXX\n🌐 Website: www.bornosoft.com\n📍 Location: Dhaka, Bangladesh\n\nFeel free to reach out anytime! 😊', FALSE, TRUE, 15, 'info', 'contains'),
          (UUID(), 'hours', '🕐 Business Hours:\n\n📅 Saturday – Thursday: 9:00 AM – 6:00 PM\n📅 Friday: Closed\n\nYou can message anytime — we will reply during working hours! 💬', FALSE, TRUE, 15, 'info', 'contains'),
          (UUID(), 'location', '📍 BornoSoft Office:\n\nAddress: [Your Address]\nCity: Dhaka, Bangladesh\n\n🌐 Visit: www.bornosoft.com\n📧 Email: info@bornosoft.com\n\nVisit us or contact online! 😊', FALSE, TRUE, 15, 'info', 'contains'),
          (UUID(), 'about', '🏢 About BornoSoft:\n\nWe are a leading software company providing:\n✅ 100+ completed projects\n✅ 5+ years experience\n✅ Expert team\n✅ 24/7 support\n\nYour trusted tech partner! 🚀', FALSE, TRUE, 15, 'info', 'contains'),
          
          -- HR & CAREER (Priority: 25)
          (UUID(), 'career', '🚀 Join BornoSoft Team!\n\nWe are hiring:\n✅ Web Developers\n✅ App Developers\n✅ Digital Marketers\n✅ UI/UX Designers\n\nSend your CV to:\n📧 careers@bornosoft.com\n\nWe will contact shortlisted candidates! 🎯', FALSE, TRUE, 25, 'hr', 'contains'),
          (UUID(), 'job', '💼 Job Opportunities at BornoSoft!\n\nInterested in joining our team?\n\nPlease send:\n✅ Your CV\n✅ Portfolio (if any)\n✅ Expected salary\n\nTo: careers@bornosoft.com 📧', FALSE, TRUE, 25, 'hr', 'contains'),
          
          -- PAYMENT & BILLING (Priority: 35)
          (UUID(), 'payment', '💳 Payment Methods:\n\nWe accept:\n✔ Bank Transfer\n✔ bKash: 01XXX-XXXXXX\n✔ Nagad: 01XXX-XXXXXX\n✔ Rocket\n✔ Credit/Debit Card\n\nOfficial invoice provided! 📄', FALSE, TRUE, 35, 'billing', 'contains'),
          (UUID(), 'invoice', '📄 Invoice Request:\n\nPlease share:\n✅ Your project/order ID\n✅ Email address\n\nWe will send your invoice immediately! 📧', FALSE, TRUE, 35, 'billing', 'contains'),
          
          -- PORTFOLIO & REVIEWS (Priority: 20)
          (UUID(), 'portfolio', '🎨 Our Portfolio:\n\n🌐 www.bornosoft.com/portfolio\n\nWe have completed:\n✅ 100+ websites\n✅ 50+ eCommerce stores\n✅ 20+ mobile apps\n\nCheck our work and let us build yours! 🚀', FALSE, TRUE, 20, 'portfolio', 'contains'),
          (UUID(), 'review', '⭐ Client Reviews:\n\nOur clients love us!\n\n⭐⭐⭐⭐⭐ 4.9/5 rating\n✅ 100+ satisfied clients\n✅ On-time delivery\n✅ Quality work\n\nRead reviews: www.bornosoft.com/reviews 😊', FALSE, TRUE, 20, 'portfolio', 'contains'),
          
          -- HUMAN HANDOFF (Priority: 45)
          (UUID(), 'agent', '🤝 Connecting to Live Agent...\n\nPlease wait a moment.\n\nOur team member will respond shortly.\n\nMeanwhile, feel free to share your query! 💬', FALSE, TRUE, 45, 'handoff', 'contains'),
          (UUID(), 'human', '👤 Connecting you with a human agent...\n\nOur team will take over this conversation.\n\nPlease describe your requirement! 😊', FALSE, TRUE, 45, 'handoff', 'contains'),
          
          -- ENTERPRISE & CORPORATE (Priority: 40)
          (UUID(), 'enterprise', '🏢 Enterprise Solutions!\n\nWe provide:\n✅ Large-scale systems\n✅ Custom ERP/CRM\n✅ Dedicated team\n✅ Long-term support\n\nLet us discuss your enterprise needs! 💼', FALSE, TRUE, 40, 'enterprise', 'contains'),
          (UUID(), 'corporate', '🏛️ Corporate Solutions!\n\nWe serve corporate clients with:\n✅ Professional websites\n✅ Business software\n✅ Dedicated support\n✅ SLA agreements\n\nSchedule a corporate meeting! 📊', FALSE, TRUE, 40, 'enterprise', 'contains'),
          (UUID(), 'partnership', '🤝 Partnership Opportunity!\n\nInterested in partnering with BornoSoft?\n\nWe offer:\n✅ White-label solutions\n✅ Reseller programs\n✅ Revenue sharing\n\nContact: partnerships@bornosoft.com 📧', FALSE, TRUE, 40, 'enterprise', 'contains')
      `);
      console.log('   📝 Enterprise-level auto-reply rules inserted (40+ professional messages with priority & categories)');
    }

    console.log('✅ Database tables initialized (MySQL)');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export default pool;
