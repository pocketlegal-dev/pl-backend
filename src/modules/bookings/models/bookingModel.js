const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer ID is required']
  },
  lawyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    required: [true, 'Lawyer ID is required']
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service ID is required']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  bookingDate: {
    type: Date,
    required: [true, 'Booking date is required']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  notes: {
    type: String
  },
  customerNotes: {
    type: String
  },
  lawyerNotes: {
    type: String
  },
  cancellationReason: {
    type: String
  },
  cancelledBy: {
    type: String,
    enum: ['customer', 'lawyer', 'admin']
  },
  cancelledAt: {
    type: Date
  },
  isRescheduled: {
    type: Boolean,
    default: false
  },
  originalBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  documentsRequired: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    isRequired: {
      type: Boolean,
      default: true
    }
  }],
  documentsUploaded: [{
    name: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  meetingLink: {
    type: String
  },
  meetingPassword: {
    type: String
  },
  isReviewed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create indexes for faster lookups
bookingSchema.index({ customerId: 1 });
bookingSchema.index({ lawyerId: 1 });
bookingSchema.index({ serviceId: 1 });
bookingSchema.index({ bookingDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking; 