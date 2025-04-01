const Payment = require('../models/paymentModel');
const Booking = require('../../bookings/models/bookingModel');
const notificationService = require('../../notifications/services/notificationService');

/**
 * Process payment for a booking
 */
exports.processPayment = async (paymentData) => {
  try {
    const { bookingId, customerId, paymentMethod, amount } = paymentData;
    
    // Get booking if ID provided
    let booking = null;
    if (bookingId) {
      booking = await Booking.findById(bookingId)
        .populate('serviceId', 'name')
        .populate('lawyerId', 'userId');
      
      if (!booking) {
        throw new Error('Booking not found');
      }
    }
    
    // Create payment record
    const payment = new Payment({
      customerId,
      lawyerId: booking ? booking.lawyerId : paymentData.lawyerId,
      bookingId,
      amount: amount || (booking ? booking.totalAmount : 0),
      paymentMethod,
      transactionId: generateTransactionId(),
      status: 'pending'
    });
    
    // TODO: In a real-world application, integrate with a payment gateway here
    // This is a simulation - in production, you'd call a payment processor
    const paymentSuccessful = simulatePaymentProcessing();
    
    if (paymentSuccessful) {
      payment.status = 'success';
      payment.paidAt = Date.now();
      
      // If payment is for a booking, update booking's payment status
      if (booking) {
        booking.paymentStatus = 'paid';
        booking.paymentId = payment._id;
        await booking.save();
      }
      
      // Send notification
      if (booking) {
        await notificationService.sendPaymentNotification(payment, booking, 'success');
      }
    } else {
      payment.status = 'failed';
      payment.failureReason = 'Payment processing failed';
      
      // If payment is for a booking, update booking's payment status
      if (booking) {
        booking.paymentStatus = 'failed';
        await booking.save();
      }
    }
    
    await payment.save();
    return payment;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};

/**
 * Process refund for a payment
 */
exports.processRefund = async (refundData) => {
  try {
    const { paymentId, refundAmount, refundReason, refundedBy } = refundData;
    
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }
    
    // Check if payment can be refunded
    if (payment.status !== 'success') {
      throw new Error('Only successful payments can be refunded');
    }
    
    if (payment.refunded) {
      throw new Error('Payment has already been refunded');
    }
    
    // Determine refund type
    const isPartialRefund = refundAmount && refundAmount < payment.amount;
    
    // Process refund
    // TODO: In a real-world application, integrate with a payment gateway here
    
    // Update payment record
    payment.refunded = true;
    payment.refundedAt = Date.now();
    payment.refundAmount = refundAmount || payment.amount;
    payment.refundReason = refundReason;
    payment.refundedBy = refundedBy;
    payment.status = isPartialRefund ? 'partial_refund' : 'refunded';
    
    await payment.save();
    
    // If payment is for a booking, update booking's payment status
    if (payment.bookingId) {
      const booking = await Booking.findById(payment.bookingId);
      if (booking) {
        booking.paymentStatus = isPartialRefund ? 'partial_refund' : 'refunded';
        await booking.save();
        
        // Send notification
        await notificationService.sendPaymentNotification(payment, booking, 'refunded');
      }
    }
    
    return payment;
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
};

/**
 * Get payment by ID
 */
exports.getPaymentById = async (paymentId) => {
  try {
    const payment = await Payment.findById(paymentId)
      .populate('customerId', 'name email')
      .populate({
        path: 'lawyerId',
        select: 'userId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .populate('bookingId', 'serviceId bookingDate status');
      
    return payment;
  } catch (error) {
    console.error('Error getting payment:', error);
    throw error;
  }
};

/**
 * Get payments with filtering
 */
exports.getPayments = async (filters, pagination) => {
  try {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;
    
    const query = {};
    
    // Add filters
    if (filters.customerId) query.customerId = filters.customerId;
    if (filters.lawyerId) query.lawyerId = filters.lawyerId;
    if (filters.status) query.status = filters.status;
    if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;
    if (filters.refunded) query.refunded = filters.refunded === 'true';
    
    // Date range
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }
    
    // Get payments with pagination
    const payments = await Payment.find(query)
      .populate('customerId', 'name email')
      .populate({
        path: 'lawyerId',
        select: 'userId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .populate('bookingId', 'serviceId bookingDate status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Payment.countDocuments(query);
    
    return {
      payments,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    };
  } catch (error) {
    console.error('Error getting payments:', error);
    throw error;
  }
};

/**
 * Generate a random transaction ID
 * This is for demonstration purposes only
 */
function generateTransactionId() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `TXN-${timestamp}-${random}`;
}

/**
 * Simulate payment processing
 * This is for demonstration purposes only
 */
function simulatePaymentProcessing() {
  // In a real application, this would integrate with a payment processor
  // For demo purposes, we'll simulate success with 95% probability
  return Math.random() < 0.95;
} 