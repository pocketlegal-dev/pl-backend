const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const serviceController = require('../controllers/serviceController');
const categoryController = require('../controllers/categoryController');
const reviewController = require('../controllers/reviewController');
const { auth, authorize } = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');

// Service routes
router.get('/', serviceController.getServices);
router.get('/:id', serviceController.getServiceById);
router.post('/', auth, authorize('admin'), serviceController.createService);
router.put('/:id', auth, authorize('admin'), serviceController.updateService);
router.delete('/:id', auth, authorize('admin'), serviceController.deleteService);
router.put('/:id/lawyers', auth, authorize('admin'), serviceController.updateServiceLawyers);

// Category routes
router.get('/categories', categoryController.getCategories);
router.get('/categories/:id', categoryController.getCategoryById);
router.post('/categories', auth, authorize('admin'), categoryController.createCategory);
router.put('/categories/:id', auth, authorize('admin'), categoryController.updateCategory);
router.delete('/categories/:id', auth, authorize('admin'), categoryController.deleteCategory);

// Review routes
const reviewValidation = [
  body('bookingId').isMongoId().withMessage('Valid booking ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ min: 2 }).withMessage('Comment must be at least 2 characters')
];

router.post('/reviews', auth, reviewValidation, validate, reviewController.createReview);
router.get('/reviews/user', auth, reviewController.getUserReviews);
router.get('/:id/reviews', reviewController.getServiceReviews);
router.get('/lawyers/:id/reviews', reviewController.getLawyerReviews);
router.put('/reviews/:id', auth, reviewController.updateReview);
router.delete('/reviews/:id', auth, reviewController.deleteReview);

module.exports = router; 