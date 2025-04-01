const Booking = require('../models/bookingModel');
const Service = require('../../services/models/serviceModel');
const Lawyer = require('../../users/models/lawyerModel');
const User = require('../../users/models/userModel');
const Cart = require('../../users/models/cartModel');
const ErrorHandler = require('../../../utils/errorHandler');

// Create booking from cart checkout
exports.createBookingFromCart = async (req, res, next) => {
  try {
    const { paymentMethod } = req.body;
    
    // Get all cart items
    const cartItems = await Cart.find({ userId: req.user.id })
      .populate('serviceId', 'name basePrice')
      .populate('lawyerId', 'hourlyRate');
    
    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty'
      });
    }
    
    // Create bookings from cart items
    const bookings = [];
    let totalAmount = 0;
    
    for (const item of cartItems) {
      // Calculate amount
      const servicePrice = item.serviceId.basePrice;
      const lawyerRate = item.lawyerId ? item.lawyerId.hourlyRate || 0 : 0;
      const itemTotalAmount = (servicePrice + lawyerRate) * item.quantity;
      totalAmount += itemTotalAmount;
      
      // Get lawyer ID (required)
      let lawyerId = item.lawyerId;
      if (!lawyerId) {
        // If no specific lawyer was selected, assign a lawyer who offers this service
        const service = await Service.findById(item.serviceId._id);
        if (service.lawyers.length > 0) {
          lawyerId = service.lawyers[0]; // Assign first available lawyer
        } else {
          return res.status(400).json({
            success: false,
            message: `No lawyers available for service: ${item.serviceId.name}`
          });
        }
      }
      
      // Calculate booking times
      const bookingDate = item.preferredDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default to 1 week from now
      const startTime = new Date(bookingDate);
      startTime.setHours(9, 0, 0, 0); // Default 9 AM
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 1); // Default 1-hour appointment
      
      // Create booking
      const booking = new Booking({
        customerId: req.user.id,
        lawyerId,
        serviceId: item.serviceId._id,
        bookingDate,
        startTime,
        endTime,
        totalAmount: itemTotalAmount,
        paymentStatus: 'pending',
        notes: item.notes
      });
      
      await booking.save();
      bookings.push(booking);
    }
    
    // TODO: In a real application, integrate with payment gateway here
    
    // Clear cart after successful booking
    await Cart.deleteMany({ userId: req.user.id });
    
    res.status(201).json({
      success: true,
      message: 'Bookings created successfully',
      totalAmount,
      bookingCount: bookings.length,
      bookings
    });
  } catch (error) {
    next(error);
  }
};

// Create single booking
exports.createBooking = async (req, res, next) => {
  try {
    const {
      lawyerId,
      serviceId,
      bookingDate,
      startTime,
      endTime,
      notes
    } = req.body;
    
    // Check if service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    // Check if lawyer exists
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
    
    // Calculate total amount
    const totalAmount = service.basePrice + (lawyer.hourlyRate || 0);
    
    // Create booking
    const booking = new Booking({
      customerId: req.user.id,
      lawyerId,
      serviceId,
      bookingDate: new Date(bookingDate),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      totalAmount,
      notes
    });
    
    await booking.save();
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    next(error);
  }
};

// Get user's bookings
exports.getUserBookings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    let query = { customerId: req.user.id };
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.bookingDate = {};
      if (req.query.startDate) {
        query.bookingDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.bookingDate.$lte = new Date(req.query.endDate);
      }
    }
    
    const bookings = await Booking.find(query)
      .populate('serviceId', 'name description image')
      .populate({
        path: 'lawyerId',
        select: 'userId hourlyRate',
        populate: {
          path: 'userId',
          select: 'name profilePicture'
        }
      })
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Booking.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      bookings
    });
  } catch (error) {
    next(error);
  }
};

// Get lawyer's bookings
exports.getLawyerBookings = async (req, res, next) => {
  try {
    // Check if current user is the lawyer
    const lawyer = await Lawyer.findOne({ userId: req.user.id });
    if (!lawyer) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    let query = { lawyerId: lawyer._id };
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.bookingDate = {};
      if (req.query.startDate) {
        query.bookingDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.bookingDate.$lte = new Date(req.query.endDate);
      }
    }
    
    const bookings = await Booking.find(query)
      .populate('serviceId', 'name description')
      .populate({
        path: 'customerId',
        select: 'name email phone profilePicture'
      })
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Booking.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      bookings
    });
  } catch (error) {
    next(error);
  }
};

// Get booking by ID
exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('serviceId', 'name description image basePrice')
      .populate({
        path: 'lawyerId',
        select: 'userId hourlyRate areasOfExpertise',
        populate: {
          path: 'userId',
          select: 'name email phone profilePicture'
        }
      })
      .populate('customerId', 'name email phone profilePicture');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Verify that the current user is either the customer, the lawyer, or an admin
    if (
      req.user.role !== 'admin' &&
      booking.customerId._id.toString() !== req.user.id &&
      !await Lawyer.findOne({ userId: req.user.id, _id: booking.lawyerId._id })
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    next(error);
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user has permission to update status
    const isCustomer = booking.customerId.toString() === req.user.id;
    const isLawyer = await Lawyer.findOne({ userId: req.user.id, _id: booking.lawyerId });
    const isAdmin = req.user.role === 'admin';
    
    if (!isCustomer && !isLawyer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Validate status change based on user role
    if (isCustomer) {
      // Customers can only cancel bookings
      if (status !== 'cancelled') {
        return res.status(403).json({
          success: false,
          message: 'Customers can only cancel bookings'
        });
      }
      
      // Cannot cancel completed bookings
      if (booking.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel a completed booking'
        });
      }
      
      booking.cancelledBy = 'customer';
      booking.cancelledAt = Date.now();
    } else if (isLawyer) {
      // Lawyers can confirm, complete, or reject bookings
      if (!['confirmed', 'completed', 'rejected'].includes(status)) {
        return res.status(403).json({
          success: false,
          message: 'Lawyers can only confirm, complete, or reject bookings'
        });
      }
      
      if (status === 'rejected') {
        booking.cancelledBy = 'lawyer';
        booking.cancelledAt = Date.now();
      }
    }
    
    // Update booking
    booking.status = status;
    if (notes) {
      if (isCustomer) {
        booking.customerNotes = notes;
      } else if (isLawyer) {
        booking.lawyerNotes = notes;
      } else {
        booking.notes = notes;
      }
    }
    
    await booking.save();
    
    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    next(error);
  }
};

// Reschedule booking
exports.rescheduleBooking = async (req, res, next) => {
  try {
    const { bookingDate, startTime, endTime, notes } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user has permission to reschedule
    const isCustomer = booking.customerId.toString() === req.user.id;
    const isLawyer = await Lawyer.findOne({ userId: req.user.id, _id: booking.lawyerId });
    const isAdmin = req.user.role === 'admin';
    
    if (!isCustomer && !isLawyer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Cannot reschedule completed or cancelled bookings
    if (['completed', 'cancelled', 'rejected'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule a ${booking.status} booking`
      });
    }
    
    // Create new booking record
    const newBooking = new Booking({
      customerId: booking.customerId,
      lawyerId: booking.lawyerId,
      serviceId: booking.serviceId,
      status: 'pending',
      bookingDate: new Date(bookingDate),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      totalAmount: booking.totalAmount,
      paymentStatus: booking.paymentStatus,
      paymentId: booking.paymentId,
      notes: notes || booking.notes,
      customerNotes: isCustomer ? notes : booking.customerNotes,
      lawyerNotes: isLawyer ? notes : booking.lawyerNotes,
      isRescheduled: true,
      originalBookingId: booking._id
    });
    
    await newBooking.save();
    
    // Update original booking status
    booking.status = 'cancelled';
    booking.cancellationReason = 'Rescheduled';
    booking.cancelledBy = isCustomer ? 'customer' : isLawyer ? 'lawyer' : 'admin';
    booking.cancelledAt = Date.now();
    await booking.save();
    
    res.status(200).json({
      success: true,
      message: 'Booking rescheduled successfully',
      originalBooking: booking,
      newBooking
    });
  } catch (error) {
    next(error);
  }
}; 