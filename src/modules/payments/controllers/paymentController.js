const Payment = require('../models/paymentModel');
const Booking = require('../../bookings/models/bookingModel');
const Lawyer = require('../../users/models/lawyerModel');
const ErrorHandler = require('../../../utils/errorHandler');

// Process payment
exports.processPayment = async (req, res, next) => {
  try {
    const { bookingId, paymentMethod } = req.body;
    
    // Check if booking exists
    const booking = await Booking.findOne({
      _id: bookingId,
      customerId: req.user.id
    });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if payment already exists
    const existingPayment = await Payment.findOne({ bookingId });
    if (existingPayment && existingPayment.status === 'success') {
      return res.status(400).json({
        success: false,
        message: 'Payment already processed for this booking'
      });
    }
    
    // TODO: In a real application, integrate with payment gateway here
    // This would include validation, processing the transaction, etc.
    
    // For demo purposes, create a successful payment record
    const payment = new Payment({
      bookingId,
      customerId: booking.customerId,
      lawyerId: booking.lawyerId,
      amount: booking.totalAmount,
      paymentMethod,
      status: 'success',
      transactionId: `DEMO_${Date.now()}`,
      paymentDetails: {
        cardLast4: '4242',
        cardBrand: 'Visa',
        expMonth: 12,
        expYear: 2025
      },
      receiptUrl: `https://example.com/receipts/DEMO_${Date.now()}`
    });
    
    await payment.save();
    
    // Update booking payment status and payment ID
    booking.paymentStatus = 'completed';
    booking.paymentId = payment._id;
    
    // If this is a pending booking, confirm it after payment
    if (booking.status === 'pending') {
      booking.status = 'confirmed';
    }
    
    await booking.save();
    
    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      payment,
      booking
    });
  } catch (error) {
    next(error);
  }
};

// Get payment by ID
exports.getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('bookingId', 'bookingDate startTime endTime status')
      .populate({
        path: 'lawyerId',
        select: 'userId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // Check if user is authorized to view this payment
    if (
      req.user.role !== 'admin' &&
      payment.customerId.toString() !== req.user.id &&
      !await Lawyer.findOne({ userId: req.user.id, _id: payment.lawyerId })
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.status(200).json({
      success: true,
      payment
    });
  } catch (error) {
    next(error);
  }
};

// Get user payments
exports.getUserPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    let query = { customerId: req.user.id };
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    const payments = await Payment.find(query)
      .populate('bookingId', 'bookingDate startTime endTime status')
      .populate({
        path: 'lawyerId',
        select: 'userId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Payment.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: payments.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      payments
    });
  } catch (error) {
    next(error);
  }
};

// Process refund
exports.processRefund = async (req, res, next) => {
  try {
    const { paymentId, refundReason, refundAmount } = req.body;
    
    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // Only admin or the lawyer can process refunds
    const isLawyer = await Lawyer.findOne({ userId: req.user.id, _id: payment.lawyerId });
    if (req.user.role !== 'admin' && !isLawyer) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Check if payment is eligible for refund
    if (payment.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: 'Only successful payments can be refunded'
      });
    }
    
    if (payment.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'This payment has already been refunded'
      });
    }
    
    // Calculate refund amount
    const amount = refundAmount || payment.amount;
    
    // Validate refund amount
    if (amount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed original payment amount'
      });
    }
    
    // TODO: In a real application, integrate with payment gateway here
    // This would include processing the refund through the payment processor
    
    // Update payment record
    payment.status = amount === payment.amount ? 'refunded' : 'partial_refund';
    payment.refundedAmount = amount;
    payment.refundReason = refundReason;
    payment.refundedAt = Date.now();
    
    await payment.save();
    
    // Update booking payment status
    const booking = await Booking.findById(payment.bookingId);
    if (booking) {
      booking.paymentStatus = payment.status;
      await booking.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      payment
    });
  } catch (error) {
    next(error);
  }
}; 