const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { auth, authorize } = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');

// Validation schemas
const processPaymentValidation = [
  body('bookingId').isMongoId().withMessage('Valid booking ID is required'),
  body('paymentMethod')
    .isIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'other'])
    .withMessage('Valid payment method is required')
];

const refundValidation = [
  body('paymentId').isMongoId().withMessage('Valid payment ID is required'),
  body('refundReason').notEmpty().withMessage('Refund reason is required'),
  body('refundAmount').optional().isNumeric().withMessage('Refund amount must be a number')
];

// Routes
router.post('/process', auth, processPaymentValidation, validate, paymentController.processPayment);
router.get('/', auth, paymentController.getUserPayments);
router.get('/:id', auth, paymentController.getPaymentById);
router.post('/refund', auth, refundValidation, validate, paymentController.processRefund);

module.exports = router; 