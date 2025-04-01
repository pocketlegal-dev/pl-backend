const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const { auth, authorize } = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');

// Validation schemas
const createBookingValidation = [
  body('lawyerId').isMongoId().withMessage('Valid lawyer ID is required'),
  body('serviceId').isMongoId().withMessage('Valid service ID is required'),
  body('bookingDate').isISO8601().withMessage('Valid booking date is required'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required')
];

const statusUpdateValidation = [
  body('status')
    .isIn(['pending', 'confirmed', 'completed', 'cancelled', 'rejected'])
    .withMessage('Invalid status value')
];

const rescheduleValidation = [
  body('bookingDate').isISO8601().withMessage('Valid booking date is required'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required')
];

// Routes
// Create booking from cart
router.post('/checkout', auth, bookingController.createBookingFromCart);

// Create single booking
router.post('/', auth, createBookingValidation, validate, bookingController.createBooking);

// Get user's bookings
router.get('/', auth, bookingController.getUserBookings);

// Get lawyer's bookings
router.get('/lawyer', auth, authorize('lawyer'), bookingController.getLawyerBookings);

// Get booking by ID
router.get('/:id', auth, bookingController.getBookingById);

// Update booking status
router.put('/:id/status', auth, statusUpdateValidation, validate, bookingController.updateBookingStatus);

// Reschedule booking
router.post('/:id/reschedule', auth, rescheduleValidation, validate, bookingController.rescheduleBooking);

module.exports = router; 