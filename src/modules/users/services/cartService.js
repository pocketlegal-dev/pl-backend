const Cart = require('../models/cartModel');
const Service = require('../../services/models/serviceModel');
const Lawyer = require('../models/lawyerModel');

/**
 * Add item to cart
 */
exports.addToCart = async (userId, cartItem) => {
  try {
    const { serviceId, lawyerId, quantity, notes, preferredDate } = cartItem;
    
    // Validate service
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }
    
    // Validate lawyer if provided
    if (lawyerId) {
      const lawyer = await Lawyer.findById(lawyerId);
      if (!lawyer) {
        throw new Error('Lawyer not found');
      }
      
      // Check if lawyer offers this service
      if (!service.lawyers.includes(lawyerId)) {
        throw new Error('Selected lawyer does not offer this service');
      }
    }
    
    // Check if item already exists in cart
    let existingItem = await Cart.findOne({
      userId,
      serviceId,
      lawyerId: lawyerId || null
    });
    
    if (existingItem) {
      // Update existing item
      existingItem.quantity = quantity || existingItem.quantity + 1;
      if (notes) existingItem.notes = notes;
      if (preferredDate) existingItem.preferredDate = preferredDate;
      
      await existingItem.save();
      return existingItem;
    } else {
      // Create new cart item
      const newCartItem = new Cart({
        userId,
        serviceId,
        lawyerId: lawyerId || null,
        quantity: quantity || 1,
        notes,
        preferredDate
      });
      
      await newCartItem.save();
      return newCartItem;
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

/**
 * Get user's cart
 */
exports.getCart = async (userId) => {
  try {
    const cartItems = await Cart.find({ userId })
      .populate('serviceId', 'name description image basePrice')
      .populate({
        path: 'lawyerId',
        select: 'userId hourlyRate',
        populate: {
          path: 'userId',
          select: 'name profilePicture'
        }
      });
    
    // Calculate total amount
    let totalAmount = 0;
    for (const item of cartItems) {
      const servicePrice = item.serviceId.basePrice;
      const lawyerRate = item.lawyerId ? item.lawyerId.hourlyRate || 0 : 0;
      totalAmount += (servicePrice + lawyerRate) * item.quantity;
    }
    
    return {
      cartItems,
      totalAmount,
      itemCount: cartItems.length
    };
  } catch (error) {
    console.error('Error getting cart:', error);
    throw error;
  }
};

/**
 * Update cart item
 */
exports.updateCartItem = async (userId, itemId, updateData) => {
  try {
    const cartItem = await Cart.findOne({
      _id: itemId,
      userId
    });
    
    if (!cartItem) {
      throw new Error('Cart item not found');
    }
    
    // Update fields
    if (updateData.quantity) cartItem.quantity = updateData.quantity;
    if (updateData.notes) cartItem.notes = updateData.notes;
    if (updateData.preferredDate) cartItem.preferredDate = updateData.preferredDate;
    
    // Update lawyer if provided
    if (updateData.lawyerId) {
      // Validate lawyer
      const lawyer = await Lawyer.findById(updateData.lawyerId);
      if (!lawyer) {
        throw new Error('Lawyer not found');
      }
      
      // Check if lawyer offers this service
      const service = await Service.findById(cartItem.serviceId);
      if (!service.lawyers.includes(updateData.lawyerId)) {
        throw new Error('Selected lawyer does not offer this service');
      }
      
      cartItem.lawyerId = updateData.lawyerId;
    }
    
    await cartItem.save();
    
    return cartItem;
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
};

/**
 * Remove item from cart
 */
exports.removeCartItem = async (userId, itemId) => {
  try {
    const result = await Cart.deleteOne({
      _id: itemId,
      userId
    });
    
    if (result.deletedCount === 0) {
      throw new Error('Cart item not found');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error removing cart item:', error);
    throw error;
  }
};

/**
 * Clear cart
 */
exports.clearCart = async (userId) => {
  try {
    await Cart.deleteMany({ userId });
    return { success: true };
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
}; 