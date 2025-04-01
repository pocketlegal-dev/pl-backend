const paymentController = require('../../../../src/modules/payments/controllers/paymentController');
const Payment = require('../../../../src/modules/payments/models/paymentModel');
const Booking = require('../../../../src/modules/bookings/models/bookingModel');
const paymentService = require('../../../../src/modules/payments/services/paymentService');
const ErrorHandler = require('../../../../src/utils/errorHandler');

// Mock the models and services
jest.mock('../../../../src/modules/payments/models/paymentModel');
jest.mock('../../../../src/modules/bookings/models/bookingModel');
jest.mock('../../../../src/modules/payments/services/paymentService');

describe('Payment Controller', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'mockUserId', role: 'customer' }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  describe('processPayment', () => {
    it('should process a payment and return 200 status', async () => {
      // Setup
      req.body = {
        bookingId: 'mockBookingId',
        paymentMethod: 'credit_card',
        amount: 250
      };
      
      const mockPayment = {
        _id: 'mockPaymentId',
        customerId: 'mockUserId',
        bookingId: 'mockBookingId',
        amount: 250,
        paymentMethod: 'credit_card',
        status: 'success',
        transactionId: 'txn_123456',
        paidAt: new Date()
      };
      
      paymentService.processPayment = jest.fn().mockResolvedValue(mockPayment);
      
      // Execute
      await paymentController.processPayment(req, res, next);
      
      // Assert
      expect(paymentService.processPayment).toHaveBeenCalledWith({
        bookingId: 'mockBookingId',
        customerId: 'mockUserId',
        paymentMethod: 'credit_card',
        amount: 250
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payment processed successfully',
        payment: mockPayment
      });
    });
    
    it('should call next with error if payment processing fails', async () => {
      // Setup
      req.body = {
        bookingId: 'mockBookingId',
        paymentMethod: 'credit_card'
      };
      
      const mockError = new Error('Payment processing failed');
      paymentService.processPayment = jest.fn().mockRejectedValue(mockError);
      
      // Execute
      await paymentController.processPayment(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });
  
  describe('processRefund', () => {
    it('should process a refund and return 200 status', async () => {
      // Setup
      req.params.id = 'mockPaymentId';
      req.body = {
        refundAmount: 250,
        refundReason: 'Customer request'
      };
      
      const mockRefundedPayment = {
        _id: 'mockPaymentId',
        customerId: 'mockUserId',
        bookingId: 'mockBookingId',
        amount: 250,
        status: 'refunded',
        refunded: true,
        refundAmount: 250,
        refundReason: 'Customer request',
        refundedAt: new Date()
      };
      
      paymentService.processRefund = jest.fn().mockResolvedValue(mockRefundedPayment);
      
      // Execute
      await paymentController.processRefund(req, res, next);
      
      // Assert
      expect(paymentService.processRefund).toHaveBeenCalledWith({
        paymentId: 'mockPaymentId',
        refundAmount: 250,
        refundReason: 'Customer request',
        refundedBy: 'mockUserId'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Refund processed successfully',
        payment: mockRefundedPayment
      });
    });
    
    it('should call next with error if refund processing fails', async () => {
      // Setup
      req.params.id = 'mockPaymentId';
      req.body = {
        refundAmount: 250,
        refundReason: 'Customer request'
      };
      
      const mockError = new Error('Refund processing failed');
      paymentService.processRefund = jest.fn().mockRejectedValue(mockError);
      
      // Execute
      await paymentController.processRefund(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });
  
  describe('getPaymentById', () => {
    it('should return a payment by ID', async () => {
      // Setup
      req.params.id = 'mockPaymentId';
      
      const mockPayment = {
        _id: 'mockPaymentId',
        customerId: 'mockUserId',
        bookingId: 'mockBookingId',
        amount: 250,
        status: 'success'
      };
      
      Payment.findById = jest.fn().mockReturnThis();
      Payment.populate = jest.fn().mockResolvedValue(mockPayment);
      
      // Execute
      await paymentController.getPaymentById(req, res, next);
      
      // Assert
      expect(Payment.findById).toHaveBeenCalledWith('mockPaymentId');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        payment: mockPayment
      });
    });
    
    it('should return 404 if payment is not found', async () => {
      // Setup
      req.params.id = 'nonexistentPaymentId';
      
      Payment.findById = jest.fn().mockReturnThis();
      Payment.populate = jest.fn().mockResolvedValue(null);
      
      // Execute
      await paymentController.getPaymentById(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
  });
  
  describe('getUserPayments', () => {
    it('should return payments for the current user', async () => {
      // Setup
      req.query = {
        page: '1',
        limit: '10',
        status: 'success'
      };
      
      const mockPayments = [
        {
          _id: 'payment1',
          customerId: 'mockUserId',
          bookingId: 'booking1',
          amount: 250,
          status: 'success',
          paidAt: new Date()
        }
      ];
      
      const mockCount = 1;
      
      Payment.find = jest.fn().mockReturnThis();
      Payment.populate = jest.fn().mockReturnThis();
      Payment.sort = jest.fn().mockReturnThis();
      Payment.skip = jest.fn().mockReturnThis();
      Payment.limit = jest.fn().mockResolvedValue(mockPayments);
      Payment.countDocuments = jest.fn().mockResolvedValue(mockCount);
      
      // Execute
      await paymentController.getUserPayments(req, res, next);
      
      // Assert
      expect(Payment.find).toHaveBeenCalledWith({
        customerId: 'mockUserId',
        status: 'success'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: mockPayments.length,
        totalPages: 1,
        currentPage: 1,
        payments: mockPayments
      });
    });
    
    it('should call next with error if fetching payments fails', async () => {
      // Setup
      const mockError = new Error('Database error');
      Payment.find = jest.fn().mockReturnThis();
      Payment.populate = jest.fn().mockReturnThis();
      Payment.sort = jest.fn().mockReturnThis();
      Payment.skip = jest.fn().mockReturnThis();
      Payment.limit = jest.fn().mockRejectedValue(mockError);
      
      // Execute
      await paymentController.getUserPayments(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });
  
  describe('getLawyerPayments', () => {
    it('should return payments for a lawyer', async () => {
      // Setup
      req.user.role = 'lawyer';
      req.query = {
        page: '1',
        limit: '10',
        status: 'success'
      };
      
      const mockPayments = [
        {
          _id: 'payment1',
          lawyerId: 'mockUserId',
          bookingId: 'booking1',
          amount: 250,
          status: 'success',
          paidAt: new Date()
        }
      ];
      
      const mockCount = 1;
      
      Payment.find = jest.fn().mockReturnThis();
      Payment.populate = jest.fn().mockReturnThis();
      Payment.sort = jest.fn().mockReturnThis();
      Payment.skip = jest.fn().mockReturnThis();
      Payment.limit = jest.fn().mockResolvedValue(mockPayments);
      Payment.countDocuments = jest.fn().mockResolvedValue(mockCount);
      
      // Execute
      await paymentController.getLawyerPayments(req, res, next);
      
      // Assert
      expect(Payment.find).toHaveBeenCalledWith({
        lawyerId: 'mockUserId',
        status: 'success'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: mockPayments.length,
        totalPages: 1,
        currentPage: 1,
        payments: mockPayments
      });
    });
    
    it('should return 403 if user is not a lawyer', async () => {
      // Setup
      req.user.role = 'customer';
      
      // Execute
      await paymentController.getLawyerPayments(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
      expect(next.mock.calls[0][0].statusCode).toBe(403);
    });
  });
}); 