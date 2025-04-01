const Review = require('../models/reviewModel');
const Service = require('../models/serviceModel');
const Lawyer = require('../../users/models/lawyerModel');
const Booking = require('../../bookings/models/bookingModel');
const ErrorHandler = require('../../../utils/errorHandler');

// Create a review
exports.createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment, lawyerId, serviceId } = req.body;
    
    // Make sure either lawyer or service is provided
    if (!lawyerId && !serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Either lawyer ID or service ID must be provided'
      });
    }
    
    // Check if booking exists and belongs to user
    const booking = await Booking.findOne({
      _id: bookingId,
      customerId: req.user.id,
      status: 'completed'
    });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not completed'
      });
    }
    
    // Check if review already exists for this booking
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this booking'
      });
    }
    
    // Create the review
    const review = new Review({
      userId: req.user.id,
      bookingId,
      lawyerId: lawyerId || booking.lawyerId,
      serviceId: serviceId || booking.serviceId,
      rating,
      comment
    });
    
    await review.save();
    
    // Update service/lawyer rating
    if (review.serviceId) {
      const service = await Service.findById(review.serviceId);
      if (service) {
        await service.updateRating(rating);
      }
    }
    
    if (review.lawyerId) {
      const lawyer = await Lawyer.findById(review.lawyerId);
      if (lawyer) {
        await lawyer.updateRating(rating);
      }
    }
    
    // Update booking to mark as reviewed
    booking.isReviewed = true;
    await booking.save();
    
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    next(error);
  }
};

// Get reviews by service ID
exports.getServiceReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    const reviews = await Review.find({
      serviceId: req.params.id,
      isPublished: true
    })
      .populate('userId', 'name profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Review.countDocuments({
      serviceId: req.params.id,
      isPublished: true
    });
    
    res.status(200).json({
      success: true,
      count: reviews.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

// Get reviews by lawyer ID
exports.getLawyerReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    const reviews = await Review.find({
      lawyerId: req.params.id,
      isPublished: true
    })
      .populate('userId', 'name profilePicture')
      .populate('serviceId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Review.countDocuments({
      lawyerId: req.params.id,
      isPublished: true
    });
    
    res.status(200).json({
      success: true,
      count: reviews.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

// Get user's own reviews
exports.getUserReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ userId: req.user.id })
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
    
    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

// Update review
exports.updateReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    
    // Find review
    const review = await Review.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Update review fields
    review.rating = rating || review.rating;
    review.comment = comment !== undefined ? comment : review.comment;
    
    await review.save();
    
    // Update service/lawyer rating
    if (review.serviceId) {
      const service = await Service.findById(review.serviceId);
      if (service) {
        // Recalculate ratings
        const allReviews = await Review.find({ serviceId: review.serviceId });
        const totalRating = allReviews.reduce((sum, item) => sum + item.rating, 0);
        service.rating = totalRating;
        service.numberOfRatings = allReviews.length;
        await service.save();
      }
    }
    
    if (review.lawyerId) {
      const lawyer = await Lawyer.findById(review.lawyerId);
      if (lawyer) {
        // Recalculate ratings
        const allReviews = await Review.find({ lawyerId: review.lawyerId });
        const totalRating = allReviews.reduce((sum, item) => sum + item.rating, 0);
        lawyer.rating = totalRating;
        lawyer.numberOfRatings = allReviews.length;
        await lawyer.save();
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    next(error);
  }
};

// Delete review
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    const { serviceId, lawyerId } = review;
    
    await review.remove();
    
    // Update service/lawyer rating
    if (serviceId) {
      const service = await Service.findById(serviceId);
      if (service) {
        const allReviews = await Review.find({ serviceId });
        if (allReviews.length > 0) {
          const totalRating = allReviews.reduce((sum, item) => sum + item.rating, 0);
          service.rating = totalRating;
          service.numberOfRatings = allReviews.length;
        } else {
          service.rating = 0;
          service.numberOfRatings = 0;
        }
        await service.save();
      }
    }
    
    if (lawyerId) {
      const lawyer = await Lawyer.findById(lawyerId);
      if (lawyer) {
        const allReviews = await Review.find({ lawyerId });
        if (allReviews.length > 0) {
          const totalRating = allReviews.reduce((sum, item) => sum + item.rating, 0);
          lawyer.rating = totalRating;
          lawyer.numberOfRatings = allReviews.length;
        } else {
          lawyer.rating = 0;
          lawyer.numberOfRatings = 0;
        }
        await lawyer.save();
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}; 