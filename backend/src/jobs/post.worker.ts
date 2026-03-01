import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { RowDataPacket } from 'mysql2';
import pool from '../config/db';
import { publishToFacebook } from '../services/facebook.service';
import { publishToLinkedIn } from '../services/linkedin.service';
import { publishToTelegram } from '../services/telegram.service';
import { QueueJobData, PublishResult, Post, LinkedInTarget, PublishPlatform } from '../types';

// ============================================
// BullMQ Worker - Post Publisher
// ============================================

// Railway provides REDIS_URL, local dev uses REDIS_HOST/PORT
const redisConnection = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
  : new IORedis({
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
 * Publish a post to selected social media platforms
 */
async function publishToAllPlatforms(
  postId: string,
  platforms: PublishPlatform[] = ['facebook', 'linkedin', 'telegram']
): Promise<void> {
  console.log(`\n🚀 Starting publishing for post: ${postId}`);
  console.log(`   📋 Selected platforms: ${platforms.join(', ')}`);

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

  // 2. Build promise array based on selected platforms
  const promises: Promise<PublishResult | PublishResult[]>[] = [];
  const hasFacebook = platforms.includes('facebook');
  const hasLinkedInProfile = platforms.includes('linkedin');
  const hasLinkedInPage = platforms.includes('linkedin_page');
  const hasTelegram = platforms.includes('telegram');

  if (hasFacebook) {
    promises.push(publishToFacebook(fullContent, post.image_url));
  }

  if (hasLinkedInProfile || hasLinkedInPage) {
    let linkedinTarget: LinkedInTarget = 'profile';
    if (hasLinkedInProfile && hasLinkedInPage) linkedinTarget = 'both';
    else if (hasLinkedInPage) linkedinTarget = 'page';
    promises.push(publishToLinkedIn(fullContent, post.image_url, linkedinTarget));
  }

  if (hasTelegram) {
    promises.push(publishToTelegram(post.title, post.content, post.image_url));
  }

  // 3. Execute all in parallel
  const rawResults = await Promise.all(promises);

  // Flatten (LinkedIn returns array)
  const results: PublishResult[] = rawResults.flat() as PublishResult[];

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
      const platforms = job.data.platforms || ['facebook', 'linkedin', 'telegram'];
      await publishToAllPlatforms(job.data.postId, platforms);
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
