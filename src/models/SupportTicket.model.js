// Support Ticket Model - PostgreSQL Version
export const createSupportTicketsTable = `
CREATE TABLE IF NOT EXISTS support_tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')),
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  requester_name VARCHAR(255),
  requester_email VARCHAR(255),
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  phone VARCHAR(50),
  topic VARCHAR(255),
  date DATE,
  time TIME,
  channel VARCHAR(20) DEFAULT 'web' CHECK (channel IN ('web', 'email', 'phone', 'whatsapp')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;

// Support Ticket Replies Table
export const createSupportTicketRepliesTable = `
CREATE TABLE IF NOT EXISTS support_ticket_replies (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  admin_reply BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_ticket_replies_ticket_id ON support_ticket_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_replies_user_id ON support_ticket_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_replies_created_at ON support_ticket_replies(created_at);
`;

// Initialize support tables
export async function initializeSupportTables() {
  try {
    const { pool } = await import('../config/postgres.js');
    
    // Create main tickets table
    await pool.query(createSupportTicketsTable);
    console.log('✅ Support tickets table initialized');
    
    // Create replies table
    await pool.query(createSupportTicketRepliesTable);
    console.log('✅ Support ticket replies table initialized');
    
  } catch (error) {
    console.error('❌ Error initializing support tables:', error);
    throw error;
  }
}
