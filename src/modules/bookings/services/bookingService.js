const Booking = require('../models/bookingModel');
const Service = require('../../services/models/serviceModel');
const Lawyer = require('../../users/models/lawyerModel');
const User = require('../../users/models/userModel');
const notificationService = require('../../notifications/services/notificationService');

/**
 * Create a new booking
 */
exports.createBooking = async (bookingData) => {
  try {
    const booking = new Booking(bookingData);
    await booking.save();
    
    // Send notification
    await notificationService.sendBookingNotification(booking, 'created');
    
    return booking;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

/**
 * Get booking by ID with population
 */
exports.getBookingById = async (bookingId, populate = true) => {
  try {
    let query = Booking.findById(bookingId);
    
    if (populate) {
      query = query.populate('serviceId', 'name description image basePrice')
        .populate({
          path: 'lawyerId',
          select: 'userId hourlyRate areasOfExpertise',
          populate: {
            path: 'userId',
            select: 'name email phone profilePicture'
          }
        })
        .populate('customerId', 'name email phone profilePicture');
    }
    
    const booking = await query;
    return booking;
  } catch (error) {
    console.error('Error getting booking:', error);
    throw error;
  }
};

/**
 * Update booking status
 */
exports.updateBookingStatus = async (bookingId, status, notes, userId, userRole) => {
  try {
    const booking = await this.getBookingById(bookingId);
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    // Update booking
    booking.status = status;
    
    if (notes) {
      if (booking.customerId._id.toString() === userId) {
        booking.customerNotes = notes;
      } else {
        booking.lawyerNotes = notes;
      }
    }
    
    // Set cancellation info if applicable
    if (status === 'cancelled') {
      booking.cancelledBy = booking.customerId._id.toString() === userId ? 'customer' : 'lawyer';
      booking.cancelledAt = Date.now();
    }
    
    await booking.save();
    
    // Send notification
    await notificationService.sendBookingNotification(booking, status);
    
    return booking;
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
};

/**
 * Reschedule booking
 */
exports.rescheduleBooking = async (bookingId, newSchedule) => {
  try {
    const booking = await this.getBookingById(bookingId);
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    // Cannot reschedule completed or cancelled bookings
    if (['completed', 'cancelled', 'rejected'].includes(booking.status)) {
      throw new Error(`Cannot reschedule a ${booking.status} booking`);
    }
    
    // Update schedule
    if (newSchedule.bookingDate) booking.bookingDate = new Date(newSchedule.bookingDate);
    if (newSchedule.startTime) booking.startTime = new Date(newSchedule.startTime);
    if (newSchedule.endTime) booking.endTime = new Date(newSchedule.endTime);
    if (newSchedule.notes) booking.notes = newSchedule.notes;
    
    // Set rescheduled flag
    booking.rescheduled = true;
    booking.rescheduledAt = Date.now();
    
    await booking.save();
    
    // Send notification
    await notificationService.sendBookingNotification(booking, 'rescheduled');
    
    return booking;
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    throw error;
  }
};

/**
 * Get bookings with filtering
 */
exports.getBookings = async (filters, pagination) => {
  try {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;
    
    const query = {};
    
    // Add filters
    if (filters.customerId) query.customerId = filters.customerId;
    if (filters.lawyerId) query.lawyerId = filters.lawyerId;
    if (filters.status) query.status = filters.status;
    
    // Date range
    if (filters.startDate || filters.endDate) {
      query.bookingDate = {};
      if (filters.startDate) query.bookingDate.$gte = new Date(filters.startDate);
      if (filters.endDate) query.bookingDate.$lte = new Date(filters.endDate);
    }
    
    // Get bookings with pagination
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
      .populate('customerId', 'name email phone profilePicture')
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Booking.countDocuments(query);
    
    return {
      bookings,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    };
  } catch (error) {
    console.error('Error getting bookings:', error);
    throw error;
  }
}; 