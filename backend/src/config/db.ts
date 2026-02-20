import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// PostgreSQL Connection Pool
// ============================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err.message);
  process.exit(-1);
});

// ============================================
// Initialize Database Tables
// ============================================

export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS post_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL,
        response JSONB,
        status VARCHAR(20) NOT NULL,
        error TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes (IF NOT EXISTS not available for indexes in all PG versions)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
      CREATE INDEX IF NOT EXISTS idx_post_logs_post_id ON post_logs(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_logs_platform ON post_logs(platform);
    `);

    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
