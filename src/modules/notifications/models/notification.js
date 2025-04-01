const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  type: {
    type: String,
    enum: ['booking', 'payment', 'system', 'chat', 'review', 'other'],
    default: 'system'
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel'
  },
  relatedModel: {
    type: String,
    enum: ['Booking', 'Payment', 'Review', 'User', 'Chat']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  actionUrl: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Indexes to optimize queries
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });

// Virtual for time ago (can be used in frontend)
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  
  // Convert milliseconds to seconds
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 60) return `${seconds} seconds ago`;
  
  // Convert to minutes
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  
  // Convert to hours
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  
  // Convert to days
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} days ago`;
  
  // Convert to months
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} months ago`;
  
  // Convert to years
  const years = Math.floor(months / 12);
  return `${years} years ago`;
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;