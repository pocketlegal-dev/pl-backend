const Cart = require('../models/cartModel');
const Service = require('../../services/models/serviceModel');
const Lawyer = require('../models/lawyerModel');
const ErrorHandler = require('../../../utils/errorHandler');

// Add item to cart
exports.addToCart = async (req, res, next) => {
  try {
    const { serviceId, lawyerId, quantity = 1, preferredDate, preferredTimeSlot, notes } = req.body;

    // Check if service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check if lawyer exists if specified
    if (lawyerId) {
      const lawyer = await Lawyer.findById(lawyerId);
      if (!lawyer) {
        return res.status(404).json({
          success: false,
          message: 'Lawyer not found'
        });
      }

      // Check if lawyer offers this service
      if (!service.lawyers.includes(lawyerId)) {
        return res.status(400).json({
          success: false,
          message: 'Selected lawyer does not offer this service'
        });
      }
    }

    // Check if item already in cart
    let cartItem = await Cart.findOne({ 
      userId: req.user.id, 
      serviceId,
      lawyerId: lawyerId || null
    });

    if (cartItem) {
      // Update existing cart item
      cartItem.quantity = quantity;
      if (preferredDate) cartItem.preferredDate = preferredDate;
      if (preferredTimeSlot) cartItem.preferredTimeSlot = preferredTimeSlot;
      if (notes) cartItem.notes = notes;
      await cartItem.save();
    } else {
      // Create new cart item
      cartItem = new Cart({
        userId: req.user.id,
        serviceId,
        lawyerId: lawyerId || null,
        quantity,
        preferredDate,
        preferredTimeSlot,
        notes
      });
      await cartItem.save();
    }

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      cartItem
    });
  } catch (error) {
    next(error);
  }
};

// Get cart items
exports.getCartItems = async (req, res, next) => {
  try {
    const cartItems = await Cart.find({ userId: req.user.id })
      .populate('serviceId', 'name description basePrice image')
      .populate({
        path: 'lawyerId',
        select: 'userId hourlyRate',
        populate: {
          path: 'userId',
          select: 'name profilePicture'
        }
      });

    // Calculate total
    let total = 0;
    cartItems.forEach(item => {
      const servicePrice = item.serviceId.basePrice;
      const lawyerRate = item.lawyerId ? item.lawyerId.hourlyRate || 0 : 0;
      total += (servicePrice + lawyerRate) * item.quantity;
    });

    res.status(200).json({
      success: true,
      count: cartItems.length,
      total,
      cartItems
    });
  } catch (error) {
    next(error);
  }
};

// Update cart item
exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity, preferredDate, preferredTimeSlot, notes } = req.body;

    const cartItem = await Cart.findOne({ 
      _id: req.params.id,
      userId: req.user.id 
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Update fields
    if (quantity) cartItem.quantity = quantity;
    if (preferredDate) cartItem.preferredDate = preferredDate;
    if (preferredTimeSlot) cartItem.preferredTimeSlot = preferredTimeSlot;
    if (notes !== undefined) cartItem.notes = notes;

    await cartItem.save();

    res.status(200).json({
      success: true,
      message: 'Cart item updated',
      cartItem
    });
  } catch (error) {
    next(error);
  }
};

// Remove cart item
exports.removeCartItem = async (req, res, next) => {
  try {
    const cartItem = await Cart.findOneAndDelete({ 
      _id: req.params.id,
      userId: req.user.id 
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    next(error);
  }
};

// Clear cart
exports.clearCart = async (req, res, next) => {
  try {
    await Cart.deleteMany({ userId: req.user.id });

    res.status(200).json({
      success: true,
      message: 'Cart cleared'
    });
  } catch (error) {
    next(error);
  }
}; 