const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format with colors for better readability in development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Add request ID if available
    if (metadata.requestId) {
      msg = `${timestamp} [${level}] [${metadata.requestId}]: ${message}`;
    }
    
    // Add metadata if present
    if (Object.keys(metadata).length > 0 && metadata.requestId === undefined) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
  })
);

// Set log level based on environment
const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Create the logger
const logger = winston.createLogger({
  level,
  format: logFormat,
  defaultMeta: { service: 'pocketlegal-api' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: consoleFormat
    }),
    
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ],
  // Exit on error
  exitOnError: false
});

// Create a stream object with a 'write' function that will be used by morgan
logger.stream = {
  write: function(message) {
    // Remove the new line character added by morgan
    logger.info(message.trim());
  }
};

// Add requestId to log context
logger.requestLogger = function(req, res, next) {
  // Generate or get request ID
  const requestId = req.headers['x-request-id'] || 
                    req.headers['x-correlation-id'] || 
                    require('crypto').randomBytes(16).toString("hex");
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);
  
  // Create child logger with request context
  req.logger = logger.child({ requestId });
  
  next();
};

// Database operation logging with metadata
logger.db = (operation, collection, query, result, duration) => {
  logger.debug(`DB ${operation} | ${collection}`, {
    operation,
    collection,
    query: typeof query === 'object' ? JSON.stringify(query) : query,
    result: result ? (typeof result === 'object' ? JSON.stringify(result) : result) : null,
    duration: `${duration}ms`
  });
};

module.exports = logger; 