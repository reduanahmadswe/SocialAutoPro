import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// MySQL Connection Pool
// ============================================

const pool = mysql.createPool(process.env.DATABASE_URL as string);

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
        INSERT INTO fb_auto_reply_rules (id, keyword, reply_text, is_default, is_active)
        VALUES
          (UUID(), '__DEFAULT__', 'Thank you for your message! We will get back to you shortly.', TRUE, TRUE),
          (UUID(), 'hello', 'Hi there! 👋 Welcome to BornoSoft. How can we help you today?', FALSE, TRUE),
          (UUID(), 'price', 'Thank you for your interest! Please visit our website for pricing details or let us connect you with our sales team.', FALSE, TRUE),
          (UUID(), 'help', 'We are happy to help! Please describe your question and our team will respond soon.', FALSE, TRUE)
      `);
      console.log('   📝 Default auto-reply rules inserted');
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
