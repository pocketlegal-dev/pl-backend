#!/usr/bin/env node

/**
 * Health check script for Docker and monitoring
 * 
 * This script makes a HTTP request to the /health endpoint
 * and exits with code 0 (success) or 1 (failure)
 * 
 * Usage:
 * - In Docker: HEALTHCHECK CMD node scripts/healthcheck.js
 * - Standalone: npm run healthcheck
 */

const http = require('http');
const https = require('https');

// Configuration
const options = {
  host: process.env.HEALTH_CHECK_HOST || 'localhost',
  port: process.env.HEALTH_CHECK_PORT || process.env.PORT || 5000,
  path: process.env.HEALTH_CHECK_PATH || '/health',
  method: 'GET',
  timeout: process.env.HEALTH_CHECK_TIMEOUT || 2000, // 2 seconds
  headers: {
    'User-Agent': 'HealthCheck/1.0',
  }
};

// Determine if we need HTTP or HTTPS
const protocol = process.env.HEALTH_CHECK_PROTOCOL === 'https' ? https : http;

// Output prefix
const prefix = '[Health Check]';

// Make the request
const req = protocol.request(options, (res) => {
  console.log(`${prefix} Status: ${res.statusCode}`);
  
  // Check if response has a valid status code
  if (res.statusCode >= 200 && res.statusCode < 300) {
    // Health check passed
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`${prefix} Response: ${JSON.stringify(response)}`);
        console.log(`${prefix} Health check passed`);
        process.exit(0); // Success
      } catch (e) {
        console.error(`${prefix} Error parsing response: ${e.message}`);
        process.exit(1); // Failure
      }
    });
  } else {
    // Health check failed due to status code
    console.error(`${prefix} Health check failed: Unexpected status code ${res.statusCode}`);
    process.exit(1); // Failure
  }
});

// Handle request timeout
req.setTimeout(options.timeout, () => {
  console.error(`${prefix} Health check failed: Request timed out after ${options.timeout}ms`);
  req.destroy();
  process.exit(1); // Failure
});

// Handle request errors
req.on('error', (err) => {
  console.error(`${prefix} Health check failed: ${err.message}`);
  process.exit(1); // Failure
});

// End request
req.end(); 