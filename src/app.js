const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const passport = require('passport');
const connectDB = require('./config/database');
const logger = require('./utils/logger');
const swagger = require('./config/swagger');
const passportConfig = require('./config/passport');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

// Import route modules
const userRoutes = require('./modules/users/routes/userRoutes');
const serviceRoutes = require('./modules/services/routes/serviceRoutes');
const bookingRoutes = require('./modules/bookings/routes/bookingRoutes');
const paymentRoutes = require('./modules/payments/routes/paymentRoutes');
const notificationRoutes = require('./modules/notifications/routes/notificationRoutes');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet()); // Set security headers
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Apply rate limiting to all requests
app.use(apiLimiter);

// Middleware
app.use(express.json({ limit: '10kb' })); // Body parser with size limit
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Configure CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL] // Restrict to frontend in production
    : '*', // Allow all in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Compress responses
app.use(compression());

// Logging
// Use different log formats based on environment
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', { stream: logger.stream }));
} else {
  app.use(morgan('dev', { stream: logger.stream }));
}

// Add request ID middleware
app.use(logger.requestLogger);

// Initialize Passport
app.use(passport.initialize());

// Swagger Documentation
app.use('/api-docs', swagger.serve, swagger.setup);

// Apply stricter rate limiting to auth routes
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Pocket Legal API',
    documentation: '/api-docs',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Log error
  logger.error(`${err.statusCode || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
    stack: err.stack,
    user: req.user ? req.user.id : 'unauthenticated'
  });
  
  // Send error response
  res.status(err.statusCode || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? err.message || 'Server Error'
      : {
          message: err.message || 'Server Error',
          stack: err.stack
        }
  });
});

// 404 middleware
app.use((req, res) => {
  logger.warn(`404 - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  res.status(404).json({
    success: false,
    error: 'Resource not found'
  });
});

module.exports = app;
