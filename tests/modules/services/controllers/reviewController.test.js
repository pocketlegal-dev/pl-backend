const reviewController = require('../../../../src/modules/services/controllers/reviewController');
const Review = require('../../../../src/modules/services/models/reviewModel');
const Service = require('../../../../src/modules/services/models/serviceModel');
const Booking = require('../../../../src/modules/bookings/models/bookingModel');
const Lawyer = require('../../../../src/modules/users/models/lawyerModel');
const ErrorHandler = require('../../../../src/utils/errorHandler');

// Mock the models
jest.mock('../../../../src/modules/services/models/reviewModel');
jest.mock('../../../../src/modules/services/models/serviceModel');
jest.mock('../../../../src/modules/bookings/models/bookingModel');
jest.mock('../../../../src/modules/users/models/lawyerModel');

describe('Review Controller', () => {
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
  
  describe('createReview', () => {
    it('should create a review for a completed booking', async () => {
      // Setup
      req.body = {
        bookingId: 'mockBookingId',
        serviceId: 'mockServiceId',
        rating: 5,
        comment: 'Excellent service!'
      };
      
      const mockBooking = {
        _id: 'mockBookingId',
        customerId: 'mockUserId',
        serviceId: 'mockServiceId',
        lawyerId: 'mockLawyerId',
        status: 'completed',
        isReviewed: false,
        save: jest.fn().mockResolvedValue({})
      };
      
      const mockReview = {
        _id: 'mockReviewId',
        userId: 'mockUserId',
        bookingId: 'mockBookingId',
        serviceId: 'mockServiceId',
        lawyerId: 'mockLawyerId',
        rating: 5,
        comment: 'Excellent service!'
      };
      
      const mockService = {
        _id: 'mockServiceId',
        updateRating: jest.fn().mockResolvedValue({})
      };
      
      const mockLawyer = {
        _id: 'mockLawyerId',
        updateRating: jest.fn().mockResolvedValue({})
      };
      
      Booking.findOne = jest.fn().mockResolvedValue(mockBooking);
      Review.findOne = jest.fn().mockResolvedValue(null);
      Review.prototype.save = jest.fn().mockResolvedValue(mockReview);
      Service.findById = jest.fn().mockResolvedValue(mockService);
      Lawyer.findById = jest.fn().mockResolvedValue(mockLawyer);
      
      // Execute
      await reviewController.createReview(req, res, next);
      
      // Assert
      expect(Booking.findOne).toHaveBeenCalledWith({
        _id: 'mockBookingId',
        customerId: 'mockUserId',
        status: 'completed'
      });
      expect(Review.findOne).toHaveBeenCalledWith({ bookingId: 'mockBookingId' });
      expect(Review.prototype.save).toHaveBeenCalled();
      expect(mockService.updateRating).toHaveBeenCalledWith(5);
      expect(mockLawyer.updateRating).toHaveBeenCalledWith(5);
      expect(mockBooking.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Review submitted successfully',
        review: mockReview
      });
    });
    
    it('should return 400 if neither serviceId nor lawyerId is provided', async () => {
      // Setup
      req.body = {
        bookingId: 'mockBookingId',
        rating: 5,
        comment: 'Excellent service!'
      };
      
      // Execute
      await reviewController.createReview(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Either lawyer ID or service ID must be provided'
      });
    });
    
    it('should return 404 if booking is not found or not completed', async () => {
      // Setup
      req.body = {
        bookingId: 'mockBookingId',
        serviceId: 'mockServiceId',
        rating: 5,
        comment: 'Excellent service!'
      };
      
      Booking.findOne = jest.fn().mockResolvedValue(null);
      
      // Execute
      await reviewController.createReview(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Booking not found or not completed'
      });
    });
    
    it('should return 400 if review already exists for the booking', async () => {
      // Setup
      req.body = {
        bookingId: 'mockBookingId',
        serviceId: 'mockServiceId',
        rating: 5,
        comment: 'Excellent service!'
      };
      
      const mockBooking = {
        _id: 'mockBookingId',
        customerId: 'mockUserId',
        serviceId: 'mockServiceId',
        status: 'completed'
      };
      
      const existingReview = {
        _id: 'existingReviewId',
        bookingId: 'mockBookingId'
      };
      
      Booking.findOne = jest.fn().mockResolvedValue(mockBooking);
      Review.findOne = jest.fn().mockResolvedValue(existingReview);
      
      // Execute
      await reviewController.createReview(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Review already exists for this booking'
      });
    });
  });
  
  describe('getServiceReviews', () => {
    it('should return reviews for a service with pagination', async () => {
      // Setup
      req.params.id = 'mockServiceId';
      req.query = {
        page: '1',
        limit: '10'
      };
      
      const mockReviews = [
        {
          _id: 'review1',
          userId: 'user1',
          serviceId: 'mockServiceId',
          rating: 5,
          comment: 'Great service!'
        },
        {
          _id: 'review2',
          userId: 'user2',
          serviceId: 'mockServiceId',
          rating: 4,
          comment: 'Good service'
        }
      ];
      
      const mockTotal = 2;
      
      Review.find = jest.fn().mockReturnThis();
      Review.populate = jest.fn().mockReturnThis();
      Review.sort = jest.fn().mockReturnThis();
      Review.skip = jest.fn().mockReturnThis();
      Review.limit = jest.fn().mockResolvedValue(mockReviews);
      Review.countDocuments = jest.fn().mockResolvedValue(mockTotal);
      
      // Execute
      await reviewController.getServiceReviews(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: mockReviews.length,
        totalPages: 1,
        currentPage: 1,
        reviews: mockReviews
      });
    });
    
    it('should call next with error if fetching reviews fails', async () => {
      // Setup
      req.params.id = 'mockServiceId';
      
      const mockError = new Error('Database error');
      Review.find = jest.fn().mockReturnThis();
      Review.populate = jest.fn().mockReturnThis();
      Review.sort = jest.fn().mockReturnThis();
      Review.skip = jest.fn().mockReturnThis();
      Review.limit = jest.fn().mockRejectedValue(mockError);
      
      // Execute
      await reviewController.getServiceReviews(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });
  
  describe('getUserReviews', () => {
    it('should return reviews by the current user', async () => {
      // Setup
      const mockReviews = [
        {
          _id: 'review1',
          userId: 'mockUserId',
          serviceId: 'service1',
          rating: 5,
          comment: 'Great service!'
        },
        {
          _id: 'review2',
          userId: 'mockUserId',
          serviceId: 'service2',
          rating: 4,
          comment: 'Good service'
        }
      ];
      
      Review.find = jest.fn().mockReturnThis();
      Review.populate = jest.fn().mockReturnThis();
      Review.sort = jest.fn().mockResolvedValue(mockReviews);
      
      // Execute
      await reviewController.getUserReviews(req, res, next);
      
      // Assert
      expect(Review.find).toHaveBeenCalledWith({ userId: 'mockUserId' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: mockReviews.length,
        reviews: mockReviews
      });
    });
    
    it('should call next with error if fetching user reviews fails', async () => {
      // Setup
      const mockError = new Error('Database error');
      Review.find = jest.fn().mockReturnThis();
      Review.populate = jest.fn().mockReturnThis();
      Review.sort = jest.fn().mockRejectedValue(mockError);
      
      // Execute
      await reviewController.getUserReviews(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });
  
  describe('updateReview', () => {
    it('should update a review', async () => {
      // Setup
      req.params.id = 'mockReviewId';
      req.body = {
        rating: 4,
        comment: 'Updated comment'
      };
      
      const mockReview = {
        _id: 'mockReviewId',
        userId: 'mockUserId',
        serviceId: 'mockServiceId',
        rating: 5,
        comment: 'Original comment',
        save: jest.fn().mockResolvedValue({
          _id: 'mockReviewId',
          userId: 'mockUserId',
          serviceId: 'mockServiceId',
          rating: 4,
          comment: 'Updated comment'
        })
      };
      
      const mockService = {
        _id: 'mockServiceId',
        save: jest.fn().mockResolvedValue({})
      };
      
      Review.findOne = jest.fn().mockResolvedValue(mockReview);
      Review.find = jest.fn().mockResolvedValue([mockReview]);
      Service.findById = jest.fn().mockResolvedValue(mockService);
      
      // Execute
      await reviewController.updateReview(req, res, next);
      
      // Assert
      expect(Review.findOne).toHaveBeenCalledWith({
        _id: 'mockReviewId',
        userId: 'mockUserId'
      });
      expect(mockReview.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Review updated successfully',
        review: expect.any(Object)
      });
    });
    
    it('should return 404 if review is not found', async () => {
      // Setup
      req.params.id = 'nonexistentReviewId';
      req.body = {
        rating: 4,
        comment: 'Updated comment'
      };
      
      Review.findOne = jest.fn().mockResolvedValue(null);
      
      // Execute
      await reviewController.updateReview(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Review not found'
      });
    });
  });
}); 