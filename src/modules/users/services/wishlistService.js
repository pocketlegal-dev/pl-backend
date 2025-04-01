const Wishlist = require('../models/wishlistModel');
const Service = require('../../services/models/serviceModel');
const Lawyer = require('../models/lawyerModel');

/**
 * Add item to wishlist
 */
exports.addToWishlist = async (userId, wishlistItem) => {
  try {
    const { serviceId, lawyerId, notes } = wishlistItem;
    
    // Validate service if provided
    if (serviceId) {
      const service = await Service.findById(serviceId);
      if (!service) {
        throw new Error('Service not found');
      }
    }
    
    // Validate lawyer if provided
    if (lawyerId) {
      const lawyer = await Lawyer.findById(lawyerId);
      if (!lawyer) {
        throw new Error('Lawyer not found');
      }
    }
    
    // At least one of serviceId or lawyerId must be provided
    if (!serviceId && !lawyerId) {
      throw new Error('Either service or lawyer must be specified');
    }
    
    // Check if item already exists in wishlist
    let existingItem = await Wishlist.findOne({
      userId,
      serviceId: serviceId || null,
      lawyerId: lawyerId || null
    });
    
    if (existingItem) {
      // Update existing item
      if (notes) existingItem.notes = notes;
      await existingItem.save();
      
      return existingItem;
    } else {
      // Create new wishlist item
      const newWishlistItem = new Wishlist({
        userId,
        serviceId: serviceId || null,
        lawyerId: lawyerId || null,
        notes
      });
      
      await newWishlistItem.save();
      return newWishlistItem;
    }
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    throw error;
  }
};

/**
 * Get user's wishlist
 */
exports.getWishlist = async (userId) => {
  try {
    const wishlistItems = await Wishlist.find({ userId })
      .populate('serviceId', 'name description image basePrice')
      .populate({
        path: 'lawyerId',
        select: 'userId hourlyRate',
        populate: {
          path: 'userId',
          select: 'name profilePicture'
        }
      });
    
    return {
      wishlistItems,
      itemCount: wishlistItems.length
    };
  } catch (error) {
    console.error('Error getting wishlist:', error);
    throw error;
  }
};

/**
 * Remove item from wishlist
 */
exports.removeWishlistItem = async (userId, itemId) => {
  try {
    const result = await Wishlist.deleteOne({
      _id: itemId,
      userId
    });
    
    if (result.deletedCount === 0) {
      throw new Error('Wishlist item not found');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error removing wishlist item:', error);
    throw error;
  }
};

/**
 * Clear wishlist
 */
exports.clearWishlist = async (userId) => {
  try {
    await Wishlist.deleteMany({ userId });
    return { success: true };
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    throw error;
  }
};

/**
 * Move wishlist item to cart
 */
exports.moveToCart = async (userId, itemId, cartService) => {
  try {
    // Find wishlist item
    const wishlistItem = await Wishlist.findOne({
      _id: itemId,
      userId
    });
    
    if (!wishlistItem) {
      throw new Error('Wishlist item not found');
    }
    
    // Add to cart
    await cartService.addToCart(userId, {
      serviceId: wishlistItem.serviceId,
      lawyerId: wishlistItem.lawyerId,
      notes: wishlistItem.notes
    });
    
    // Remove from wishlist
    await wishlistItem.remove();
    
    return { success: true };
  } catch (error) {
    console.error('Error moving wishlist item to cart:', error);
    throw error;
  }
}; 