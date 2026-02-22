import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { initDatabase } from './config/db';
import { startWorker } from './jobs/post.worker';
import { startFacebookJobs, stopFacebookJobs } from './jobs/facebook.jobs';

// ============================================
// Server Entry Point
// ============================================

const PORT = process.env.PORT || 5000;

async function main(): Promise<void> {
  try {
    // 1. Initialize database tables
    await initDatabase();

    // 2. Start the BullMQ worker
    const worker = startWorker();

    // 3. Start Facebook scheduled jobs
    startFacebookJobs();

    // 4. Start Express server
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 SocialAutoPro Backend running on http://localhost:${PORT}`);
      console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
      console.log(`📮 API Posts:  http://localhost:${PORT}/api/posts`);
      console.log(`📘 Facebook:   http://localhost:${PORT}/api/facebook`);
      console.log(`🔗 Webhook:    http://localhost:${PORT}/api/facebook/webhook\n`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n⚠️ ${signal} received. Shutting down gracefully...`);

      server.close(() => {
        console.log('🔌 HTTP server closed');
      });

      await worker.close();
      console.log('🔌 Worker closed');

      stopFacebookJobs();
      console.log('🔌 Facebook jobs stopped');

      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

main();
