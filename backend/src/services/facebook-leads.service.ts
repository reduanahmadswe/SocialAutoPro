import axios from 'axios';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/db';
import { FbLead, LeadStatus } from '../types';

// ============================================
// Facebook Lead Ads Service
// ============================================

const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN || '';
const GRAPH_API_VERSION = 'v25.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Fetch leads from a specific Lead Ad form
 */
export async function fetchLeadsFromForm(formId: string, limit: number = 50): Promise<any[]> {
  const allLeads: any[] = [];
  let url: string | null = `${BASE_URL}/${formId}/leads`;

  try {
    while (url) {
      const response: any = await axios.get(url, {
        params: {
          access_token: FACEBOOK_ACCESS_TOKEN,
          limit,
        },
      });

      const data = response.data.data || [];
      allLeads.push(...data);

      // Handle pagination
      url = response.data.paging?.next || null;
    }

    console.log(`✅ Leads: Fetched ${allLeads.length} leads from form ${formId}`);
    return allLeads;
  } catch (error: any) {
    const msg = error.response?.data?.error?.message || error.message;
    console.error(`❌ Leads: Failed to fetch from form ${formId} — ${msg}`);
    throw new Error(msg);
  }
}

/**
 * Extract name, email, phone from lead field_data
 */
function extractLeadFields(fieldData: any[]): { name: string | null; email: string | null; phone: string | null } {
  const result = { name: null as string | null, email: null as string | null, phone: null as string | null };

  if (!Array.isArray(fieldData)) return result;

  for (const field of fieldData) {
    const fname = (field.name || '').toLowerCase();
    const value = Array.isArray(field.values) ? field.values[0] : null;

    if (!value) continue;

    if (fname.includes('full_name') || fname.includes('name')) {
      result.name = value;
    } else if (fname.includes('email')) {
      result.email = value;
    } else if (fname.includes('phone') || fname.includes('phone_number')) {
      result.phone = value;
    }
  }

  return result;
}

/**
 * Store leads in the database, preventing duplicates via lead_id UNIQUE key
 */
export async function storeLeads(formId: string, leads: any[]): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  for (const lead of leads) {
    const leadId = lead.id;
    const createdTime = lead.created_time;
    const { name, email, phone } = extractLeadFields(lead.field_data || []);

    try {
      const [result] = await pool.query<ResultSetHeader>(
        `INSERT IGNORE INTO fb_leads (id, lead_id, form_id, name, email, phone, full_data, status, created_time)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, 'new', ?)`,
        [leadId, formId, name, email, phone, JSON.stringify(lead), createdTime]
      );

      if (result.affectedRows > 0) {
        inserted++;
      } else {
        skipped++;
      }
    } catch (error: any) {
      console.error(`❌ Leads: Failed to store lead ${leadId} — ${error.message}`);
      skipped++;
    }
  }

  console.log(`📋 Leads: Inserted ${inserted}, Skipped ${skipped} duplicates`);
  return { inserted, skipped };
}

/**
 * Fetch and store leads from a form — convenience method
 */
export async function collectLeadsFromForm(formId: string): Promise<{ inserted: number; skipped: number }> {
  const leads = await fetchLeadsFromForm(formId);
  return storeLeads(formId, leads);
}

/**
 * Get all stored leads (paginated, filterable)
 */
export async function getStoredLeads(
  page: number = 1,
  limit: number = 50,
  status?: LeadStatus,
  formId?: string
): Promise<{ leads: any[]; total: number }> {
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const params: any[] = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  if (formId) {
    conditions.push('form_id = ?');
    params.push(formId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM fb_leads ${where}`,
    params
  );

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM fb_leads ${where} ORDER BY created_time DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    leads: rows,
    total: countRows[0].total,
  };
}

/**
 * Update lead status
 */
export async function updateLeadStatus(leadId: string, status: LeadStatus): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE fb_leads SET status = ? WHERE id = ?',
    [status, leadId]
  );
  return result.affectedRows > 0;
}

/**
 * Get lead by ID
 */
export async function getLeadById(id: string): Promise<FbLead | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM fb_leads WHERE id = ?',
    [id]
  );
  return rows.length > 0 ? (rows[0] as FbLead) : null;
}

/**
 * Get lead stats summary
 */
export async function getLeadStats(): Promise<any> {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
      SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted_count,
      SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_count,
      COUNT(DISTINCT form_id) as forms_count
    FROM fb_leads
  `);
  return rows[0];
}

/**
 * Get all leadgen form IDs we have leads for
 */
export async function getTrackedFormIds(): Promise<string[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT DISTINCT form_id FROM fb_leads ORDER BY form_id'
  );
  return rows.map((r: any) => r.form_id);
}
