const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking ID is required']
  },
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
  amount: {
    type: Number,
    required: [true, 'Amount is required']
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'refunded', 'partial_refund'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'other'],
    required: [true, 'Payment method is required']
  },
  transactionId: {
    type: String
  },
  paymentDetails: {
    cardLast4: String,
    cardBrand: String,
    expMonth: Number,
    expYear: Number
  },
  gatewayResponse: {
    type: Object
  },
  refundedAmount: {
    type: Number,
    default: 0
  },
  refundReason: {
    type: String
  },
  refundedAt: {
    type: Date
  },
  receiptUrl: {
    type: String
  },
  invoiceId: {
    type: String
  }
}, {
  timestamps: true
});

// Create indexes for faster lookups
paymentSchema.index({ bookingId: 1 }, { unique: true });
paymentSchema.index({ customerId: 1 });
paymentSchema.index({ lawyerId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment; 