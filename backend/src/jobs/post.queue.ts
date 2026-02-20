import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { QueueJobData } from '../types';

// ============================================
// BullMQ Queue Configuration
// ============================================

const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
});

redisConnection.on('connect', () => {
  console.log('✅ Redis connected (Queue)');
});

redisConnection.on('error', (err) => {
  console.error('❌ Redis connection error (Queue):', err.message);
});

// Create the post publishing queue
export const postQueue = new Queue<QueueJobData>('post-publish', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s → 4s → 8s
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      count: 50, // Keep last 50 failed jobs
    },
  },
});

/**
 * Add a post publishing job to the queue
 */
export async function addPublishJob(postId: string): Promise<void> {
  await postQueue.add(
    'publish-post',
    { postId },
    {
      jobId: `publish-${postId}-${Date.now()}`,
    }
  );
  console.log(`📤 Job added to queue for post: ${postId}`);
}

export { redisConnection };
