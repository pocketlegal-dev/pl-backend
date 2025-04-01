const http = require('http');
const app = require('./app');
const logger = require('./utils/logger');

// Get port from environment and store in Express
const port = process.env.PORT || 5000;
app.set('port', port);

// Create HTTP server
const server = http.createServer(app);

// Set up graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  logger.info('Received shutdown signal. Closing HTTP server...');
  server.close(() => {
    logger.info('HTTP server closed.');
    
    // Close database connections and other resources
    const mongoose = require('mongoose');
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed.');
      logger.info('Graceful shutdown completed.');
      process.exit(0);
    });
    
    // Force close after 10 seconds if graceful shutdown fails
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  });
}

// Listen on provided port, on all network interfaces
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// Event listener for HTTP server "error" event
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // Handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

// Event listener for HTTP server "listening" event
function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  logger.info('Server listening on ' + bind);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

// Unhandled rejection and exception handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  
  // It's not safe to resume normal operation after unhandled exceptions
  // Shut down after handling current requests
  gracefulShutdown();
});
