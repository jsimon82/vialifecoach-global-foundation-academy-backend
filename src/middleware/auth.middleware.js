import jwt from 'jsonwebtoken';
import { pool } from '../config/postgres.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to authenticate admin users
export async function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access token required' });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user has admin privileges
    const [userRows] = await pool.query(
      'SELECT id, role, email FROM users WHERE id = ? AND role IN (?, ?, ?, ?, ?, ?, ?)',
      [decoded.userId, 'admin', 'owner', 'manager', 'support', 'instructor']
    );
    
    if (userRows.length === 0) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    req.user = userRows[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Middleware to authenticate any user (for regular user endpoints)
export async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access token required' });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const [userRows] = await pool.query(
      'SELECT id, role, email FROM users WHERE id = ?',
      [decoded.userId]
    );
    
    if (userRows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = userRows[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
