const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  lawyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    required: [true, 'Lawyer ID is required']
  },
  testimonial: {
    type: String,
    required: [true, 'Testimonial text is required']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes for faster lookups
testimonialSchema.index({ userId: 1 });
testimonialSchema.index({ lawyerId: 1 });
testimonialSchema.index({ isPublished: 1 });

const Testimonial = mongoose.model('Testimonial', testimonialSchema);

module.exports = Testimonial;

 