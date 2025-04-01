#!/usr/bin/env node

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { seedDatabase } = require('../src/utils/seedData');
const logger = require('../src/utils/logger');

// Load environment variables
dotenv.config();

const { MONGODB_URI } = process.env;

if (!MONGODB_URI) {
  logger.error('MONGODB_URI is required');
  process.exit(1);
}

// Connect to the database
mongoose.connect(MONGODB_URI)
  .then(async () => {
    logger.info('Connected to MongoDB');
    
    try {
      // Seed the database
      const result = await seedDatabase();
      
      // Output the results
      logger.info('Seed completed successfully');
      logger.info('Seed results:', result);
      
      process.exit(0);
    } catch (error) {
      logger.error('Seed failed:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    logger.error('Database connection error:', err);
    process.exit(1);
  }); 