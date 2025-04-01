const bookingController = require('../../../../src/modules/bookings/controllers/bookingController');
const Booking = require('../../../../src/modules/bookings/models/bookingModel');
const Service = require('../../../../src/modules/services/models/serviceModel');
const Lawyer = require('../../../../src/modules/users/models/lawyerModel');
const Cart = require('../../../../src/modules/users/models/cartModel');
const ErrorHandler = require('../../../../src/utils/errorHandler');

// Mock the models
jest.mock('../../../../src/modules/bookings/models/bookingModel');
jest.mock('../../../../src/modules/services/models/serviceModel');
jest.mock('../../../../src/modules/users/models/lawyerModel');
jest.mock('../../../../src/modules/users/models/cartModel');

describe('Booking Controller', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'mockUserId' }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  describe('createBooking', () => {
    it('should create a booking and return 201 status', async () => {
      // Setup
      const bookingData = {
        serviceId: 'mockServiceId',
        lawyerId: 'mockLawyerId',
        bookingDate: '2023-07-15',
        startTime: '2023-07-15T10:00:00',
        endTime: '2023-07-15T11:00:00',
        notes: 'Test booking'
      };
      
      req.body = bookingData;
      
      const mockService = {
        _id: 'mockServiceId',
        name: 'Legal Consultation',
        basePrice: 100
      };
      
      const mockLawyer = {
        _id: 'mockLawyerId',
        hourlyRate: 150,
        userId: {
          _id: 'mockLawyerUserId',
          name: 'John Lawyer'
        }
      };
      
      const mockBooking = {
        _id: 'mockBookingId',
        customerId: 'mockUserId',
        serviceId: 'mockServiceId',
        lawyerId: 'mockLawyerId',
        bookingDate: new Date('2023-07-15'),
        startTime: new Date('2023-07-15T10:00:00'),
        endTime: new Date('2023-07-15T11:00:00'),
        totalAmount: 250,
        status: 'pending',
        notes: 'Test booking'
      };
      
      Service.findById = jest.fn().mockResolvedValue(mockService);
      Lawyer.findById = jest.fn().mockReturnThis();
      Lawyer.populate = jest.fn().mockResolvedValue(mockLawyer);
      Booking.prototype.save = jest.fn().mockResolvedValue(mockBooking);
      
      // Execute
      await bookingController.createBooking(req, res, next);
      
      // Assert
      expect(Service.findById).toHaveBeenCalledWith('mockServiceId');
      expect(Lawyer.findById).toHaveBeenCalledWith('mockLawyerId');
      expect(Booking.prototype.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Booking created successfully',
        booking: mockBooking
      });
    });
    
    it('should return 404 if service is not found', async () => {
      // Setup
      req.body = {
        serviceId: 'nonexistentServiceId',
        lawyerId: 'mockLawyerId',
        bookingDate: '2023-07-15',
        startTime: '2023-07-15T10:00:00',
        endTime: '2023-07-15T11:00:00'
      };
      
      Service.findById = jest.fn().mockResolvedValue(null);
      
      // Execute
      await bookingController.createBooking(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
    
    it('should return 404 if lawyer is not found', async () => {
      // Setup
      req.body = {
        serviceId: 'mockServiceId',
        lawyerId: 'nonexistentLawyerId',
        bookingDate: '2023-07-15',
        startTime: '2023-07-15T10:00:00',
        endTime: '2023-07-15T11:00:00'
      };
      
      const mockService = {
        _id: 'mockServiceId',
        name: 'Legal Consultation',
        basePrice: 100
      };
      
      Service.findById = jest.fn().mockResolvedValue(mockService);
      Lawyer.findById = jest.fn().mockReturnThis();
      Lawyer.populate = jest.fn().mockResolvedValue(null);
      
      // Execute
      await bookingController.createBooking(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
  });
  
  describe('createBookingFromCart', () => {
    it('should create bookings from cart items and return 201 status', async () => {
      // Setup
      req.body = {
        paymentMethod: 'credit_card'
      };
      
      const mockCartItems = [
        {
          _id: 'cartItem1',
          userId: 'mockUserId',
          serviceId: {
            _id: 'service1',
            name: 'Service 1',
            basePrice: 100
          },
          lawyerId: {
            _id: 'lawyer1',
            hourlyRate: 150
          },
          quantity: 1,
          notes: 'Cart item 1 notes',
          preferredDate: new Date('2023-07-15')
        },
        {
          _id: 'cartItem2',
          userId: 'mockUserId',
          serviceId: {
            _id: 'service2',
            name: 'Service 2',
            basePrice: 200
          },
          lawyerId: {
            _id: 'lawyer2',
            hourlyRate: 200
          },
          quantity: 1,
          notes: 'Cart item 2 notes',
          preferredDate: new Date('2023-07-16')
        }
      ];
      
      const mockBookings = [
        {
          _id: 'booking1',
          customerId: 'mockUserId',
          serviceId: 'service1',
          lawyerId: 'lawyer1',
          bookingDate: new Date('2023-07-15'),
          totalAmount: 250,
          status: 'pending',
          notes: 'Cart item 1 notes'
        },
        {
          _id: 'booking2',
          customerId: 'mockUserId',
          serviceId: 'service2',
          lawyerId: 'lawyer2',
          bookingDate: new Date('2023-07-16'),
          totalAmount: 400,
          status: 'pending',
          notes: 'Cart item 2 notes'
        }
      ];
      
      Cart.find = jest.fn().mockReturnThis();
      Cart.populate = jest.fn().mockReturnThis();
      Cart.populate.mockResolvedValue(mockCartItems);
      Booking.prototype.save = jest.fn()
        .mockResolvedValueOnce(mockBookings[0])
        .mockResolvedValueOnce(mockBookings[1]);
      Cart.deleteMany = jest.fn().mockResolvedValue({});
      
      // Execute
      await bookingController.createBookingFromCart(req, res, next);
      
      // Assert
      expect(Cart.find).toHaveBeenCalledWith({ userId: 'mockUserId' });
      expect(Booking.prototype.save).toHaveBeenCalledTimes(2);
      expect(Cart.deleteMany).toHaveBeenCalledWith({ userId: 'mockUserId' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Bookings created successfully',
        bookings: expect.any(Array),
        totalAmount: 650
      });
    });
    
    it('should return 400 if cart is empty', async () => {
      // Setup
      req.body = {
        paymentMethod: 'credit_card'
      };
      
      Cart.find = jest.fn().mockReturnThis();
      Cart.populate = jest.fn().mockReturnThis();
      Cart.populate.mockResolvedValue([]);
      
      // Execute
      await bookingController.createBookingFromCart(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Your cart is empty'
      });
    });
  });
  
  describe('getUserBookings', () => {
    it('should return user bookings with filtering and pagination', async () => {
      // Setup
      req.query = {
        status: 'confirmed',
        page: '1',
        limit: '10'
      };
      
      const mockBookings = [
        {
          _id: 'booking1',
          customerId: 'mockUserId',
          serviceId: { _id: 'service1', name: 'Service 1' },
          lawyerId: { _id: 'lawyer1', name: 'Lawyer 1' },
          status: 'confirmed',
          bookingDate: new Date('2023-07-15')
        }
      ];
      
      const mockPagination = {
        total: 1,
        pages: 1,
        page: 1,
        limit: 10
      };
      
      Booking.find = jest.fn().mockReturnThis();
      Booking.populate = jest.fn().mockReturnThis();
      Booking.sort = jest.fn().mockReturnThis();
      Booking.skip = jest.fn().mockReturnThis();
      Booking.limit = jest.fn().mockResolvedValue(mockBookings);
      Booking.countDocuments = jest.fn().mockResolvedValue(1);
      
      // Execute
      await bookingController.getUserBookings(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        bookings: mockBookings,
        pagination: expect.any(Object)
      });
    });
    
    it('should call next with error if fetching bookings fails', async () => {
      // Setup
      const mockError = new Error('Database error');
      Booking.find = jest.fn().mockReturnThis();
      Booking.populate = jest.fn().mockReturnThis();
      Booking.sort = jest.fn().mockReturnThis();
      Booking.skip = jest.fn().mockReturnThis();
      Booking.limit = jest.fn().mockRejectedValue(mockError);
      
      // Execute
      await bookingController.getUserBookings(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });
  
  describe('updateBookingStatus', () => {
    it('should update booking status and return 200 status', async () => {
      // Setup
      req.params.id = 'mockBookingId';
      req.body = {
        status: 'confirmed',
        notes: 'Booking confirmed by lawyer'
      };
      
      const mockBooking = {
        _id: 'mockBookingId',
        customerId: 'mockUserId',
        lawyerId: 'mockLawyerId',
        status: 'pending',
        save: jest.fn().mockResolvedValue({
          _id: 'mockBookingId',
          customerId: 'mockUserId',
          lawyerId: 'mockLawyerId',
          status: 'confirmed',
          lawyerNotes: 'Booking confirmed by lawyer'
        })
      };
      
      Booking.findById = jest.fn().mockResolvedValue(mockBooking);
      
      // Execute
      await bookingController.updateBookingStatus(req, res, next);
      
      // Assert
      expect(Booking.findById).toHaveBeenCalledWith('mockBookingId');
      expect(mockBooking.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Booking status updated successfully',
        booking: expect.any(Object)
      });
    });
    
    it('should return 404 if booking is not found', async () => {
      // Setup
      req.params.id = 'nonexistentBookingId';
      req.body = {
        status: 'confirmed'
      };
      
      Booking.findById = jest.fn().mockResolvedValue(null);
      
      // Execute
      await bookingController.updateBookingStatus(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
  });
}); 