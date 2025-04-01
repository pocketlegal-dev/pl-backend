const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Add the logging plugin to track DB operations
const addLoggingPlugin = () => {
  mongoose.plugin(schema => {
    // Add logging for save operations
    schema.pre(['save', 'updateOne', 'findOneAndUpdate', 'deleteOne', 'findOneAndDelete'], function(next) {
      this._startTime = Date.now();
      next();
    });
    
    schema.post(['save', 'updateOne', 'findOneAndUpdate', 'deleteOne', 'findOneAndDelete'], function(doc, next) {
      const duration = Date.now() - this._startTime;
      const operation = this.op;
      const collection = this.model.collection.name;
      const query = this.getQuery ? this.getQuery() : this;
      
      logger.db(operation, collection, query, 
        doc ? (doc._id ? doc._id.toString() : 'Multiple documents') : null, 
        duration);
      
      next();
    });
  });
};

const connectDB = async () => {
  try {
    // Configure Mongoose before connecting
    mongoose.set('debug', process.env.NODE_ENV !== 'production');
    addLoggingPlugin();
    
    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB; 