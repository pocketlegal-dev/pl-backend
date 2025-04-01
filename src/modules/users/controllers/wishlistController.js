const Wishlist = require('../models/wishlistModel');
const Service = require('../../services/models/serviceModel');
const Lawyer = require('../models/lawyerModel');
const ErrorHandler = require('../../../utils/errorHandler');

// Add to Wishlist
exports.addToWishlist = async (req, res, next) => {
  try {
    const { serviceId, lawyerId } = req.body;

    // Ensure at least one ID is provided
    if (!serviceId && !lawyerId) {
      return res.status(400).json({
        success: false,
        message: 'Either service ID or lawyer ID must be provided'
      });
    }

    // Check if the item exists
    if (serviceId) {
      const service = await Service.findById(serviceId);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }
    }

    if (lawyerId) {
      const lawyer = await Lawyer.findById(lawyerId);
      if (!lawyer) {
        return res.status(404).json({
          success: false,
          message: 'Lawyer not found'
        });
      }
    }

    // Check if already in wishlist
    let wishlistItem;
    if (serviceId) {
      wishlistItem = await Wishlist.findOne({ userId: req.user.id, serviceId });
    } else {
      wishlistItem = await Wishlist.findOne({ userId: req.user.id, lawyerId });
    }

    if (wishlistItem) {
      return res.status(400).json({
        success: false,
        message: 'Item is already in your wishlist'
      });
    }

    // Create new wishlist item
    wishlistItem = new Wishlist({
      userId: req.user.id,
      serviceId: serviceId || null,
      lawyerId: lawyerId || null
    });

    await wishlistItem.save();

    res.status(201).json({
      success: true,
      message: 'Item added to wishlist',
      wishlistItem
    });
  } catch (error) {
    next(error);
  }
};

// Get Wishlist
exports.getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.find({ userId: req.user.id })
      .populate('serviceId', 'name description basePrice image')
      .populate({
        path: 'lawyerId',
        select: 'userId hourlyRate areasOfExpertise',
        populate: {
          path: 'userId',
          select: 'name profilePicture'
        }
      });

    res.status(200).json({
      success: true,
      count: wishlist.length,
      wishlist
    });
  } catch (error) {
    next(error);
  }
};

// Remove from Wishlist
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const wishlistItem = await Wishlist.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!wishlistItem) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item removed from wishlist'
    });
  } catch (error) {
    next(error);
  }
};

// Clear Wishlist
exports.clearWishlist = async (req, res, next) => {
  try {
    await Wishlist.deleteMany({ userId: req.user.id });

    res.status(200).json({
      success: true,
      message: 'Wishlist cleared'
    });
  } catch (error) {
    next(error);
  }
}; 