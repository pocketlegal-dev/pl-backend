const notificationController = require('../controllers/notificationController');

// Send booking notification
exports.sendBookingNotification = async (booking, type) => {
  try {
    let title, message, userIds = [];
    
    switch (type) {
      case 'created':
        // Notify lawyer
        title = 'New Booking Request';
        message = `You have received a new booking request for ${booking.serviceId.name}`;
        userIds = [booking.lawyerId.userId];
        break;
        
      case 'confirmed':
        // Notify customer
        title = 'Booking Confirmed';
        message = `Your booking for ${booking.serviceId.name} has been confirmed`;
        userIds = [booking.customerId];
        break;
        
      case 'completed':
        // Notify customer
        title = 'Booking Completed';
        message = `Your booking for ${booking.serviceId.name} has been marked as completed. Please leave a review!`;
        userIds = [booking.customerId];
        break;
        
      case 'cancelled':
        // Notify both parties
        title = 'Booking Cancelled';
        message = `A booking for ${booking.serviceId.name} has been cancelled`;
        userIds = [booking.customerId, booking.lawyerId.userId];
        break;
        
      case 'rescheduled':
        // Notify both parties
        title = 'Booking Rescheduled';
        message = `A booking for ${booking.serviceId.name} has been rescheduled`;
        userIds = [booking.customerId, booking.lawyerId.userId];
        break;
    }
    
    // Create notifications for each user
    const promises = userIds.map(userId => 
      notificationController.createNotification(
        userId,
        title,
        message,
        'booking',
        booking._id,
        'Booking',
        'medium',
        `/bookings/${booking._id}`
      )
    );
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error sending booking notification:', error);
  }
};

// Send payment notification
exports.sendPaymentNotification = async (payment, booking, type) => {
  try {
    let title, message, userIds = [];
    
    switch (type) {
      case 'success':
        // Notify both parties
        title = 'Payment Successful';
        message = `Payment for booking #${booking._id} has been processed successfully`;
        userIds = [payment.customerId, payment.lawyerId.userId];
        break;
        
      case 'refunded':
        // Notify customer
        title = 'Payment Refunded';
        message = `Your payment for booking #${booking._id} has been refunded`;
        userIds = [payment.customerId];
        break;
    }
    
    // Create notifications for each user
    const promises = userIds.map(userId => 
      notificationController.createNotification(
        userId,
        title,
        message,
        'payment',
        payment._id,
        'Payment',
        'medium',
        `/payments/${payment._id}`
      )
    );
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error sending payment notification:', error);
  }
};

// Send review notification
exports.sendReviewNotification = async (review, lawyerName) => {
  try {
    // Notify lawyer about the review
    await notificationController.createNotification(
      review.lawyerId.userId,
      'New Review Received',
      `You have received a ${review.rating}-star review`,
      'review',
      review._id,
      'Review',
      'medium',
      `/reviews/${review._id}`
    );
  } catch (error) {
    console.error('Error sending review notification:', error);
  }
}; 