import { collectDailyInsights } from '../services/facebook-insights.service';
import { runTokenHealthCheck } from '../services/facebook-token.service';
import { collectLeadsFromForm, getTrackedFormIds } from '../services/facebook-leads.service';

// ============================================
// Facebook Scheduled Jobs
// ============================================

// Store interval references for cleanup
const intervals: NodeJS.Timeout[] = [];

/**
 * Schedule daily insights collection
 * Runs every 24 hours (configurable via env)
 */
function scheduleInsightsCollection(): void {
  const INTERVAL_MS = parseInt(process.env.FB_INSIGHTS_INTERVAL_MS || '86400000', 10); // Default: 24h

  console.log(`⏰ Scheduled: Insights collection every ${INTERVAL_MS / 1000 / 60} minutes`);

  // Run once on startup (delayed by 30s to let DB init)
  setTimeout(async () => {
    try {
      await collectDailyInsights();
    } catch (error: any) {
      console.error(`❌ Initial insights collection failed: ${error.message}`);
    }
  }, 30000);

  // Then run on interval
  const interval = setInterval(async () => {
    try {
      await collectDailyInsights();
    } catch (error: any) {
      console.error(`❌ Scheduled insights collection failed: ${error.message}`);
    }
  }, INTERVAL_MS);

  intervals.push(interval);
}

/**
 * Schedule daily token health check
 * Runs every 24 hours (configurable via env)
 */
function scheduleTokenHealthCheck(): void {
  const INTERVAL_MS = parseInt(process.env.FB_TOKEN_CHECK_INTERVAL_MS || '86400000', 10); // Default: 24h

  console.log(`⏰ Scheduled: Token health check every ${INTERVAL_MS / 1000 / 60} minutes`);

  // Run once on startup (delayed by 15s)
  setTimeout(async () => {
    try {
      await runTokenHealthCheck();
    } catch (error: any) {
      console.error(`❌ Initial token health check failed: ${error.message}`);
    }
  }, 15000);

  // Then run on interval
  const interval = setInterval(async () => {
    try {
      await runTokenHealthCheck();
    } catch (error: any) {
      console.error(`❌ Scheduled token health check failed: ${error.message}`);
    }
  }, INTERVAL_MS);

  intervals.push(interval);
}

/**
 * Schedule lead collection for all tracked forms
 * Runs every 6 hours (configurable via env)
 */
function scheduleLeadCollection(): void {
  const INTERVAL_MS = parseInt(process.env.FB_LEADS_INTERVAL_MS || '21600000', 10); // Default: 6h

  console.log(`⏰ Scheduled: Lead collection every ${INTERVAL_MS / 1000 / 60} minutes`);

  // Run on interval only (not on startup — forms may not be registered yet)
  const interval = setInterval(async () => {
    try {
      const formIds = await getTrackedFormIds();
      if (formIds.length === 0) {
        console.log('📋 Lead collection: No tracked forms, skipping');
        return;
      }

      console.log(`📋 Lead collection: Processing ${formIds.length} form(s)`);
      for (const formId of formIds) {
        try {
          await collectLeadsFromForm(formId);
        } catch (error: any) {
          console.error(`❌ Lead collection failed for form ${formId}: ${error.message}`);
        }
      }
    } catch (error: any) {
      console.error(`❌ Scheduled lead collection failed: ${error.message}`);
    }
  }, INTERVAL_MS);

  intervals.push(interval);
}

/**
 * Start all Facebook scheduled jobs
 */
export function startFacebookJobs(): void {
  console.log('\n📅 Starting Facebook scheduled jobs...');

  scheduleInsightsCollection();
  scheduleTokenHealthCheck();
  scheduleLeadCollection();

  console.log('📅 All Facebook jobs scheduled\n');
}

/**
 * Stop all scheduled jobs (for graceful shutdown)
 */
export function stopFacebookJobs(): void {
  for (const interval of intervals) {
    clearInterval(interval);
  }
  intervals.length = 0;
  console.log('🔌 Facebook jobs stopped');
}
