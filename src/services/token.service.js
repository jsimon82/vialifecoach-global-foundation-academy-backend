import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'deepcoach_academy_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function generateToken(payload) {
  try {
    logger.info('Generating JWT token', { userId: payload.id });
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return token;
  } catch (error) {
    logger.error('Error generating token', { error: error.message });
    throw error;
  }
}

export function verifyToken(token) {
  try {
    logger.info('Verifying JWT token');
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    logger.error('Error verifying token', { error: error.message });
    throw error;
  }
}

export function generateRefreshToken(payload) {
  try {
    logger.info('Generating refresh token', { userId: payload.id });
    const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
    return refreshToken;
  } catch (error) {
    logger.error('Error generating refresh token', { error: error.message });
    throw error;
  }
}

export function verifyRefreshToken(token) {
  try {
    logger.info('Verifying refresh token');
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    logger.error('Error verifying refresh token', { error: error.message });
    throw error;
  }
}

export function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
