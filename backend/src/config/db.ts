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

    // Create indexes safely (ignore if already exists)
    try { await connection.query(`CREATE INDEX idx_posts_status ON posts(status)`); } catch (_) {}
    try { await connection.query(`CREATE INDEX idx_post_logs_post_id ON post_logs(post_id)`); } catch (_) {}
    try { await connection.query(`CREATE INDEX idx_post_logs_platform ON post_logs(platform)`); } catch (_) {}

    console.log('✅ Database tables initialized (MySQL)');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export default pool;
