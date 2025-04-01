const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service ID is required']
  },
  lawyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer'
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  preferredDate: {
    type: Date
  },
  preferredTimeSlot: {
    type: String
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Create indexes for faster lookups
cartSchema.index({ userId: 1 });
cartSchema.index({ userId: 1, serviceId: 1, lawyerId: 1 }, { unique: true });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart; 