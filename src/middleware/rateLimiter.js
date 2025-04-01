const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const logger = require('../utils/logger');

/**
 * A factory function to create rate limiters with different configurations
 * 
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware
 */
const createRateLimiter = (options) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests, please try again later',
    handler: (req, res, next, options) => {
      logger.warn(`Rate limit exceeded by IP: ${req.ip}`);
      res.status(options.statusCode).json({
        success: false,
        message: options.message,
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // If Redis is configured, use Redis store
  if (process.env.REDIS_URL) {
    try {
      const Redis = require('ioredis');
      const client = new Redis(process.env.REDIS_URL);
      
      mergedOptions.store = new RedisStore({
        sendCommand: (...args) => client.call(...args)
      });
      
      logger.info('Using Redis store for rate limiting');
    } catch (error) {
      logger.error('Failed to connect to Redis for rate limiting:', error);
      logger.info('Falling back to memory store for rate limiting');
    }
  } else {
    logger.info('Using memory store for rate limiting (Redis URL not provided)');
  }

  return rateLimit(mergedOptions);
};

// Standard API rate limiter (100 requests per 15 minutes)
const apiLimiter = createRateLimiter({
  keyGenerator: (req) => req.ip // Default key generator uses IP
});

// Stricter authentication rate limiter (5 attempts per minute)
const authLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts per minute
  message: 'Too many authentication attempts, please try again after a minute',
  keyGenerator: (req) => {
    // Use email as the rate limiting key if available
    const email = req.body.email || 'unknown';
    return `${req.ip}-${email.toLowerCase()}`;
  }
});

// User account creation limiter (10 accounts per day per IP)
const createAccountLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // 10 accounts per day
  message: 'Too many accounts created from this IP, please try again after 24 hours'
});

// Password reset rate limiter (3 requests per hour per email)
const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many password reset requests, please try again after an hour',
  keyGenerator: (req) => {
    const email = req.body.email || 'unknown';
    return `reset-${email.toLowerCase()}`;
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  createAccountLimiter,
  passwordResetLimiter,
  createRateLimiter // Export factory function for custom limiters
}; 