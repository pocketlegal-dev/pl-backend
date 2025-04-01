const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking ID is required']
  },
  lawyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer'
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  comment: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  adminResponse: {
    type: String
  },
  lawyerResponse: {
    type: String
  }
}, {
  timestamps: true
});

// Ensure that either lawyerId or serviceId is provided
reviewSchema.pre('validate', function(next) {
  if (!this.lawyerId && !this.serviceId) {
    this.invalidate('lawyerId', 'Either lawyer ID or service ID must be provided');
    this.invalidate('serviceId', 'Either lawyer ID or service ID must be provided');
  }
  next();
});

// Create indexes
reviewSchema.index({ userId: 1 });
reviewSchema.index({ bookingId: 1 }, { unique: true });
reviewSchema.index({ lawyerId: 1 });
reviewSchema.index({ serviceId: 1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 