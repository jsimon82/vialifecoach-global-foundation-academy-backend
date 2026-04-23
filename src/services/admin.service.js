import { pool } from "../config/postgres.js";

// Support Tickets Management
export async function listSupportTickets(accessToken) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id,
        user_id,
        subject,
        message,
        status,
        priority,
        requester_name,
        requester_email,
        contact_name,
        contact_email,
        phone,
        topic,
        date,
        time,
        channel,
        created_at,
        updated_at
      FROM support_tickets 
      ORDER BY created_at DESC
    `);
    return rows;
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    throw error;
  }
}

export async function updateSupportTicket(ticketId, updates, accessToken) {
  try {
    const fields = [];
    const values = [];
    
    if (updates.status) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.priority) {
      fields.push('priority = ?');
      values.push(updates.priority);
    }
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    values.push(ticketId);
    
    const [result] = await pool.query(
      `UPDATE support_tickets SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    
    return result;
  } catch (error) {
    console.error('Error updating support ticket:', error);
    throw error;
  }
}

export async function deleteSupportTicket(ticketId, accessToken) {
  try {
    const [result] = await pool.query(
      'DELETE FROM support_tickets WHERE id = ?',
      [ticketId]
    );
    return result;
  } catch (error) {
    console.error('Error deleting support ticket:', error);
    throw error;
  }
}

// Get single ticket details
export async function getSupportTicketById(ticketId, accessToken) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id,
        user_id,
        subject,
        message,
        status,
        priority,
        requester_name,
        requester_email,
        contact_name,
        contact_email,
        phone,
        topic,
        date,
        time,
        channel,
        created_at,
        updated_at
      FROM support_tickets 
      WHERE id = ?
    `, [ticketId]);
    
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    throw error;
  }
}
