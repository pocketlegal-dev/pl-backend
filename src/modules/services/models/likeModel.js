const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
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
likeSchema.pre('validate', function(next) {
  if (!this.lawyerId && !this.serviceId) {
    this.invalidate('lawyerId', 'Either lawyer ID or service ID must be provided');
    this.invalidate('serviceId', 'Either lawyer ID or service ID must be provided');
  }
  next();
});

// Create indexes for faster lookups
likeSchema.index({ userId: 1 });
likeSchema.index({ userId: 1, lawyerId: 1 }, { unique: true, sparse: true });
likeSchema.index({ userId: 1, serviceId: 1 }, { unique: true, sparse: true });

const Like = mongoose.model('Like', likeSchema);

module.exports = Like; 