import { pool } from './postgres.js';
import { supabase } from './supabase.js';

// Hybrid database operations
export const db = {
  // Local PostgreSQL operations (for program keywords, AI configs)
  async query(text, params) {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed local query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Local PostgreSQL query error:', error);
      throw error;
    }
  },

  // Supabase operations (for applications, users)
  async supabaseQuery(table, options = {}) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select(options.select || '*')
        .eq(options.where?.field, options.where?.value)
        .order(options.orderBy || 'created_at', { ascending: false })
        .limit(options.limit || 100);

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      return { rows: data, rowCount: data.length };
    } catch (error) {
      console.error('Supabase operation error:', error);
      throw error;
    }
  },

  // Combined operations (merge data from both sources)
  async getApplicationsWithKeywords() {
    try {
      // Get applications from Supabase
      const { rows: applications } = await this.supabaseQuery('applications');
      
      // Get program keywords from local PostgreSQL
      const { rows: keywords } = await this.query('SELECT * FROM program_keywords WHERE active = true');
      
      // Combine and process data
      return {
        applications,
        keywords: keywords || []
      };
    } catch (error) {
      console.error('Combined query error:', error);
      throw error;
    }
  }
};

export default db;
