// Simple in-memory rate limiter middleware
// For production, consider using express-rate-limit with Redis store

const rateLimitStore = new Map();

/**
 * Creates a rate limiter middleware
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.maxRequests - Maximum requests per window
 * @param {string} options.message - Error message when rate limited
 * @param {boolean} options.skipSuccessfulRequests - Skip counting successful requests
 */
export function createRateLimiter({ 
  windowMs = 60 * 1000, // 1 minute default
  maxRequests = 10,     // 10 requests per window default
  message = "Too many requests, please try again later",
  skipSuccessfulRequests = false
} = {}) {
  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Get or create rate limit record for this client
    let record = rateLimitStore.get(clientIp);
    
    if (!record || now - record.windowStart > windowMs) {
      // New window
      record = {
        windowStart: now,
        count: 0,
        firstRequest: now
      };
    }
    
    // Check if request should be counted (based on skipSuccessfulRequests)
    if (!skipSuccessfulRequests || res.statusCode >= 400) {
      record.count++;
    }
    
    rateLimitStore.set(clientIp, record);
    
    // Set rate limit headers
    const remaining = Math.max(0, maxRequests - record.count);
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil((record.windowStart + windowMs) / 1000));
    
    if (record.count > maxRequests) {
      return res.status(429).json({ 
        message,
        retryAfter: Math.ceil((record.windowStart + windowMs - now) / 1000)
      });
    }
    
    next();
  };
}

// Pre-configured rate limiters
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,            // 5 login attempts per 15 minutes
  message: "Too many login attempts, please try again in 15 minutes"
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,       // 1 minute
  maxRequests: 100,          // 100 requests per minute
  message: "Too many requests, please slow down"
});

// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    // Remove entries older than 10 minutes
    if (now - record.firstRequest > 10 * 60 * 1000) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);
