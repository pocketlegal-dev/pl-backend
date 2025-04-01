const Review = require('../models/reviewModel');
const Service = require('../models/serviceModel');
const Lawyer = require('../../users/models/lawyerModel');
const Booking = require('../../bookings/models/bookingModel');
const notificationService = require('../../notifications/services/notificationService');

/**
 * Create a new review
 */
exports.createReview = async (userId, reviewData) => {
  try {
    const { bookingId, serviceId, lawyerId, rating, comment } = reviewData;
    
    // Validate booking if provided
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      // Check if user is the customer
      if (booking.customerId.toString() !== userId) {
        throw new Error('You can only review your own bookings');
      }
      
      // Check if booking is completed
      if (booking.status !== 'completed') {
        throw new Error('You can only review completed bookings');
      }
      
      // Check if already reviewed
      const existingReview = await Review.findOne({ bookingId });
      if (existingReview) {
        throw new Error('This booking has already been reviewed');
      }
    }
    
    // Create review
    const review = new Review({
      userId,
      bookingId,
      serviceId,
      lawyerId,
      rating,
      comment,
      isPublished: true
    });
    
    await review.save();
    
    // Update service rating
    if (serviceId) {
      const service = await Service.findById(serviceId);
      if (service) {
        const allReviews = await Review.find({ serviceId });
        const totalRating = allReviews.reduce((sum, item) => sum + item.rating, 0);
        service.rating = allReviews.length > 0 ? totalRating / allReviews.length : 0;
        service.numberOfRatings = allReviews.length;
        await service.save();
      }
    }
    
    // Update lawyer rating
    if (lawyerId) {
      const lawyer = await Lawyer.findById(lawyerId);
      if (lawyer) {
        const allReviews = await Review.find({ lawyerId });
        const totalRating = allReviews.reduce((sum, item) => sum + item.rating, 0);
        lawyer.rating = allReviews.length > 0 ? totalRating / allReviews.length : 0;
        lawyer.numberOfRatings = allReviews.length;
        await lawyer.save();
        
        // Send notification to lawyer
        await notificationService.sendReviewNotification(review);
      }
    }
    
    // Update booking if provided
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (booking) {
        booking.isReviewed = true;
        booking.reviewId = review._id;
        await booking.save();
      }
    }
    
    return review;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

/**
 * Get reviews by service ID
 */
exports.getServiceReviews = async (serviceId, pagination) => {
  try {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;
    
    const reviews = await Review.find({
      serviceId,
      isPublished: true
    })
      .populate('userId', 'name profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Review.countDocuments({
      serviceId,
      isPublished: true
    });
    
    return {
      reviews,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      },
      avgRating: reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0
    };
  } catch (error) {
    console.error('Error getting service reviews:', error);
    throw error;
  }
};

/**
 * Get reviews by lawyer ID
 */
exports.getLawyerReviews = async (lawyerId, pagination) => {
  try {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;
    
    const reviews = await Review.find({
      lawyerId,
      isPublished: true
    })
      .populate('userId', 'name profilePicture')
      .populate('serviceId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Review.countDocuments({
      lawyerId,
      isPublished: true
    });
    
    return {
      reviews,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      },
      avgRating: reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0
    };
  } catch (error) {
    console.error('Error getting lawyer reviews:', error);
    throw error;
  }
};

/**
 * Get user's own reviews
 */
exports.getUserReviews = async (userId) => {
  try {
    const reviews = await Review.find({ userId })
      .populate('serviceId', 'name')
      .populate({
        path: 'lawyerId',
        select: 'userId',
        populate: {
          path: 'userId',
          select: 'name profilePicture'
        }
      })
      .sort({ createdAt: -1 });
    
    return {
      reviews,
      count: reviews.length
    };
  } catch (error) {
    console.error('Error getting user reviews:', error);
    throw error;
  }
};

/**
 * Update review
 */
exports.updateReview = async (userId, reviewId, updateData) => {
  try {
    const { rating, comment } = updateData;
    
    // Find review
    const review = await Review.findOne({
      _id: reviewId,
      userId
    });
    
    if (!review) {
      throw new Error('Review not found');
    }
    
    // Update review fields
    review.rating = rating || review.rating;
    review.comment = comment !== undefined ? comment : review.comment;
    
    await review.save();
    
    // Update service rating
    if (review.serviceId) {
      const service = await Service.findById(review.serviceId);
      if (service) {
        const allReviews = await Review.find({ serviceId: review.serviceId });
        const totalRating = allReviews.reduce((sum, item) => sum + item.rating, 0);
        service.rating = allReviews.length > 0 ? totalRating / allReviews.length : 0;
        service.numberOfRatings = allReviews.length;
        await service.save();
      }
    }
    
    // Update lawyer rating
    if (review.lawyerId) {
      const lawyer = await Lawyer.findById(review.lawyerId);
      if (lawyer) {
        const allReviews = await Review.find({ lawyerId: review.lawyerId });
        const totalRating = allReviews.reduce((sum, item) => sum + item.rating, 0);
        lawyer.rating = allReviews.length > 0 ? totalRating / allReviews.length : 0;
        lawyer.numberOfRatings = allReviews.length;
        await lawyer.save();
      }
    }
    
    return review;
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
};

/**
 * Delete review
 */
exports.deleteReview = async (userId, reviewId) => {
  try {
    const review = await Review.findOne({
      _id: reviewId,
      userId
    });
    
    if (!review) {
      throw new Error('Review not found');
    }
    
    const { serviceId, lawyerId, bookingId } = review;
    
    await review.remove();
    
    // Update service rating
    if (serviceId) {
      const service = await Service.findById(serviceId);
      if (service) {
        const allReviews = await Review.find({ serviceId });
        const totalRating = allReviews.reduce((sum, item) => sum + item.rating, 0);
        service.rating = allReviews.length > 0 ? totalRating / allReviews.length : 0;
        service.numberOfRatings = allReviews.length;
        await service.save();
      }
    }
    
    // Update lawyer rating
    if (lawyerId) {
      const lawyer = await Lawyer.findById(lawyerId);
      if (lawyer) {
        const allReviews = await Review.find({ lawyerId });
        const totalRating = allReviews.reduce((sum, item) => sum + item.rating, 0);
        lawyer.rating = allReviews.length > 0 ? totalRating / allReviews.length : 0;
        lawyer.numberOfRatings = allReviews.length;
        await lawyer.save();
      }
    }
    
    // Update booking if exists
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (booking) {
        booking.isReviewed = false;
        booking.reviewId = null;
        await booking.save();
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
}; 