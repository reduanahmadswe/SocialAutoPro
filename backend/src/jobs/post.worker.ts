import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { RowDataPacket } from 'mysql2';
import pool from '../config/db';
import { publishToFacebook } from '../services/facebook.service';
import { publishToLinkedIn } from '../services/linkedin.service';
import { publishToTelegram } from '../services/telegram.service';
import { QueueJobData, PublishResult, Post } from '../types';

// ============================================
// BullMQ Worker - Post Publisher
// ============================================

const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
});

redisConnection.on('connect', () => {
  console.log('✅ Redis connected (Worker)');
});

redisConnection.on('error', (err) => {
  console.error('❌ Redis connection error (Worker):', err.message);
});

/**
 * Publish a post to all social media platforms
 */
async function publishToAllPlatforms(postId: string): Promise<void> {
  console.log(`\n🚀 Starting publishing for post: ${postId}`);

  // 1. Fetch post from database
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM posts WHERE id = ?',
    [postId]
  );

  if (rows.length === 0) {
    throw new Error(`Post not found: ${postId}`);
  }

  const post = rows[0] as Post;
  const fullContent = `${post.title}\n\n${post.content}`;

  // 2. Publish to all platforms in parallel
  const results: PublishResult[] = await Promise.all([
    publishToFacebook(fullContent, post.image_url),
    publishToLinkedIn(fullContent, post.image_url),
    publishToTelegram(post.title, post.content, post.image_url),
  ]);

  // 3. Save logs for each platform
  for (const result of results) {
    await pool.query(
      `INSERT INTO post_logs (id, post_id, platform, response, status, error)
       VALUES (UUID(), ?, ?, ?, ?, ?)`,
      [
        postId,
        result.platform,
        result.response ? JSON.stringify(result.response) : null,
        result.success ? 'success' : 'failed',
        result.error || null,
      ]
    );
  }

  // 4. Determine overall status
  const allSucceeded = results.every((r) => r.success);
  const allFailed = results.every((r) => !r.success);
  const finalStatus = allSucceeded ? 'published' : 'failed';

  // 5. Update post status
  await pool.query(
    'UPDATE posts SET status = ?, updated_at = NOW() WHERE id = ?',
    [finalStatus, postId]
  );

  console.log(`\n📊 Publishing results for post ${postId}:`);
  results.forEach((r) => {
    const icon = r.success ? '✅' : '❌';
    console.log(`   ${icon} ${r.platform}: ${r.success ? 'success' : r.error}`);
  });
  console.log(`   📌 Final status: ${finalStatus}\n`);

  // If any platform failed, throw to trigger BullMQ retry
  if (!allSucceeded && !allFailed) {
    // Partial failure — don't retry (some succeeded)
    console.log('⚠️ Partial failure — not retrying to avoid duplicates');
  } else if (allFailed) {
    throw new Error('All platforms failed to publish');
  }
}

// ============================================
// Create and start the worker
// ============================================

export function startWorker(): Worker<QueueJobData> {
  const worker = new Worker<QueueJobData>(
    'post-publish',
    async (job: Job<QueueJobData>) => {
      console.log(`\n📋 Processing job: ${job.id} | Post: ${job.data.postId}`);
      await publishToAllPlatforms(job.data.postId);
    },
    {
      connection: redisConnection as any,
      concurrency: 1,
      limiter: {
        max: 5,
        duration: 60000, // Max 5 jobs per minute
      },
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Job completed: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job failed: ${job?.id} — ${err.message}`);
  });

  worker.on('error', (err) => {
    console.error('❌ Worker error:', err.message);
  });

  console.log('🔄 Post publishing worker started');
  return worker;
}
