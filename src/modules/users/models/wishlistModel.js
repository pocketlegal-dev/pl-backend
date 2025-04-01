const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  lawyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer'
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }
}, {
  timestamps: true
});

// Ensure that either lawyerId or serviceId is provided
wishlistSchema.pre('validate', function(next) {
  if (!this.lawyerId && !this.serviceId) {
    this.invalidate('lawyerId', 'Either lawyer ID or service ID must be provided');
    this.invalidate('serviceId', 'Either lawyer ID or service ID must be provided');
  }
  next();
});

// Create indexes for faster lookups
wishlistSchema.index({ userId: 1 });
wishlistSchema.index({ userId: 1, lawyerId: 1 }, { unique: true, sparse: true });
wishlistSchema.index({ userId: 1, serviceId: 1 }, { unique: true, sparse: true });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist; 