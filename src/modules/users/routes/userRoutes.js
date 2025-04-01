const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const passport = require('passport');
const userController = require('../controllers/userController');
const lawyerController = require('../controllers/lawyerController');
const cartController = require('../controllers/cartController');
const wishlistController = require('../controllers/wishlistController');
const { auth, authorize } = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');

// Validation rules
const registerValidation = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .trim(),
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['customer', 'lawyer']).withMessage('Role must be either customer or lawyer')
];

const loginValidation = [
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

const passwordUpdateValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
];

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the user
 *         name:
 *           type: string
 *           description: The name of the user
 *         email:
 *           type: string
 *           description: The email of the user
 *         phone:
 *           type: string
 *           description: The phone number of the user
 *         role:
 *           type: string
 *           enum: [customer, lawyer, admin]
 *           description: The role of the user
 *         profilePicture:
 *           type: string
 *           description: The URL to the user's profile picture
 *         address:
 *           type: string
 *           description: The user's address
 *         isVerified:
 *           type: boolean
 *           description: Whether the user's email is verified
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the user was last updated
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         token:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [customer, lawyer]
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Email already in use
 */
router.post('/register', registerValidation, validate, userController.register);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginValidation, validate, userController.login);

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get the user's profile
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', auth, userController.getUserProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update the user's profile
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', auth, userController.updateUserProfile);

/**
 * @swagger
 * /users/password:
 *   put:
 *     summary: Update the user's password
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized or incorrect current password
 */
router.put('/password', auth, passwordUpdateValidation, validate, userController.updatePassword);

// Cart routes - Cart documentation is just an example, follow this pattern for other endpoints
/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         serviceId:
 *           type: object
 *         lawyerId:
 *           type: object
 *         quantity:
 *           type: number
 *         notes:
 *           type: string
 *         preferredDate:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /users/cart:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *             properties:
 *               serviceId:
 *                 type: string
 *               lawyerId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               notes:
 *                 type: string
 *               preferredDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Item added to cart
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/cart', auth, cartController.addToCart);

/**
 * @swagger
 * /users/cart:
 *   get:
 *     summary: Get cart items
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of cart items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 cartItems:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CartItem'
 *                 totalAmount:
 *                   type: number
 *                 itemCount:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/cart', auth, cartController.getCartItems);
router.put('/cart/:id', auth, cartController.updateCartItem);
router.delete('/cart/:id', auth, cartController.removeCartItem);
router.delete('/cart', auth, cartController.clearCart);

// Wishlist routes
router.post('/wishlist', auth, wishlistController.addToWishlist);
router.get('/wishlist', auth, wishlistController.getWishlist);
router.delete('/wishlist/:id', auth, wishlistController.removeFromWishlist);
router.delete('/wishlist', auth, wishlistController.clearWishlist);

// Lawyer routes
router.put('/lawyer/profile', auth, authorize('lawyer'), lawyerController.updateLawyerProfile);
router.put('/lawyer/documents', auth, authorize('lawyer'), lawyerController.updateLawyerDocuments);
router.get('/lawyers', lawyerController.getLawyers);
router.get('/lawyers/:id', lawyerController.getLawyerProfile);

/**
 * @swagger
 * /users/auth/google:
 *   get:
 *     summary: Authenticate with Google
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to Google authorization
 */
router.get('/auth/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

/**
 * @swagger
 * /users/auth/google/callback:
 *   get:
 *     summary: Google auth callback
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to frontend with token
 */
router.get('/auth/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  userController.socialAuthCallback
);

/**
 * @swagger
 * /users/auth/facebook:
 *   get:
 *     summary: Authenticate with Facebook
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to Facebook authorization
 */
router.get('/auth/facebook', passport.authenticate('facebook', { 
  scope: ['email', 'public_profile'] 
}));

/**
 * @swagger
 * /users/auth/facebook/callback:
 *   get:
 *     summary: Facebook auth callback
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to frontend with token
 */
router.get('/auth/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
  userController.socialAuthCallback
);

/**
 * @swagger
 * /users/auth/linkedin:
 *   get:
 *     summary: Authenticate with LinkedIn
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to LinkedIn authorization
 */
router.get('/auth/linkedin', passport.authenticate('linkedin', { 
  scope: ['r_emailaddress', 'r_liteprofile'] 
}));

/**
 * @swagger
 * /users/auth/linkedin/callback:
 *   get:
 *     summary: LinkedIn auth callback
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to frontend with token
 */
router.get('/auth/linkedin/callback',
  passport.authenticate('linkedin', { session: false, failureRedirect: '/login' }),
  userController.socialAuthCallback
);

module.exports = router;