import axios from 'axios';
import { RowDataPacket } from 'mysql2';
import pool from '../config/db';

// ============================================
// Facebook Page Insights Service
// ============================================

const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID || '';
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN || '';
const GRAPH_API_VERSION = 'v25.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// Metrics we track (validated against Graph API v25.0)
const PAGE_METRICS = [
  'page_views_total',
  'page_post_engagements',
  'page_impressions_unique',
  'page_video_views',
];

const POST_METRICS = [
  'post_impressions',
  'post_impressions_unique',
  'post_engaged_users',
  'post_clicks',
];

/**
 * Fetch page-level insights from Facebook Graph API
 */
export async function fetchPageInsights(
  period: 'day' | 'week' | 'days_28' = 'day',
  since?: string,
  until?: string
): Promise<any[]> {
  try {
    const params: any = {
      metric: PAGE_METRICS.join(','),
      period,
      access_token: FACEBOOK_ACCESS_TOKEN,
    };

    if (since) params.since = since;
    if (until) params.until = until;

    const response = await axios.get(`${BASE_URL}/${FACEBOOK_PAGE_ID}/insights`, { params });

    const metrics = response.data.data || [];
    console.log(`✅ Insights: Fetched ${metrics.length} page metrics (period: ${period})`);
    return metrics;
  } catch (error: any) {
    const msg = error.response?.data?.error?.message || error.message;
    console.error(`❌ Insights: Failed to fetch page insights — ${msg}`);
    throw new Error(msg);
  }
}

/**
 * Fetch insights for a specific post
 */
export async function fetchPostInsights(postId: string): Promise<any[]> {
  try {
    const response = await axios.get(`${BASE_URL}/${postId}/insights`, {
      params: {
        metric: POST_METRICS.join(','),
        access_token: FACEBOOK_ACCESS_TOKEN,
      },
    });

    return response.data.data || [];
  } catch (error: any) {
    const msg = error.response?.data?.error?.message || error.message;
    console.error(`❌ Insights: Failed to fetch post insights for ${postId} — ${msg}`);
    throw new Error(msg);
  }
}

/**
 * Store page insights into the database
 * Uses INSERT ... ON DUPLICATE KEY UPDATE to prevent duplicates
 */
export async function storePageInsights(metrics: any[]): Promise<number> {
  let stored = 0;

  for (const metric of metrics) {
    const metricName = metric.name;
    const period = metric.period;
    const values = metric.values || [];

    for (const dataPoint of values) {
      let metricValue = 0;

      // Handle different value types (some metrics return objects)
      if (typeof dataPoint.value === 'number') {
        metricValue = dataPoint.value;
      } else if (typeof dataPoint.value === 'object' && dataPoint.value !== null) {
        // Sum all values in the object (e.g., reactions by type)
        metricValue = Object.values(dataPoint.value).reduce(
          (sum: number, v: any) => sum + (typeof v === 'number' ? v : 0),
          0
        );
      }

      const endTime = dataPoint.end_time;

      try {
        await pool.query(
          `INSERT INTO fb_page_insights (id, metric_name, metric_value, period, end_time)
           VALUES (UUID(), ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE metric_value = VALUES(metric_value), recorded_at = NOW()`,
          [metricName, metricValue, period, endTime]
        );
        stored++;
      } catch (error: any) {
        console.error(`❌ Insights: Failed to store ${metricName} — ${error.message}`);
      }
    }
  }

  console.log(`📊 Insights: Stored/updated ${stored} data points`);
  return stored;
}

/**
 * Fetch and store daily insights — called by scheduler
 */
export async function collectDailyInsights(): Promise<void> {
  console.log('\n📊 Running daily insights collection...');

  try {
    // Fetch day metrics (last 2 days for overlap/completeness)
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const since = twoDaysAgo.toISOString().split('T')[0];
    const until = now.toISOString().split('T')[0];

    const metrics = await fetchPageInsights('day', since, until);
    await storePageInsights(metrics);

    console.log('✅ Daily insights collection complete\n');
  } catch (error: any) {
    console.error(`❌ Daily insights collection failed: ${error.message}\n`);
  }
}

/**
 * Get stored insights from the database
 */
export async function getStoredInsights(
  metricName?: string,
  period?: string,
  days: number = 30
): Promise<any[]> {
  let where = 'WHERE recorded_at >= DATE_SUB(NOW(), INTERVAL ? DAY)';
  const params: any[] = [days];

  if (metricName) {
    where += ' AND metric_name = ?';
    params.push(metricName);
  }

  if (period) {
    where += ' AND period = ?';
    params.push(period);
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM fb_page_insights ${where} ORDER BY end_time DESC, metric_name ASC`,
    params
  );

  return rows;
}

/**
 * Get insights summary (latest values for each metric)
 */
export async function getInsightsSummary(): Promise<any[]> {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT pi.*
    FROM fb_page_insights pi
    INNER JOIN (
      SELECT metric_name, period, MAX(end_time) as max_end_time
      FROM fb_page_insights
      WHERE period = 'day'
      GROUP BY metric_name, period
    ) latest ON pi.metric_name = latest.metric_name
      AND pi.period = latest.period
      AND pi.end_time = latest.max_end_time
    ORDER BY pi.metric_name
  `);

  return rows;
}
