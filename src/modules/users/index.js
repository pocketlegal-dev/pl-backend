const userController = require('./controllers/userController');
const lawyerController = require('./controllers/lawyerController');
const cartController = require('./controllers/cartController');
const wishlistController = require('./controllers/wishlistController');
const userRoutes = require('./routes/userRoutes');
const userService = require('./services/userService');
const cartService = require('./services/cartService');
const wishlistService = require('./services/wishlistService');
const User = require('./models/userModel');
const Lawyer = require('./models/lawyerModel');
const Cart = require('./models/cartModel');
const Wishlist = require('./models/wishlistModel');
const Testimonial = require('./models/testimonialModel');

module.exports = {
  userController,
  lawyerController,
  cartController,
  wishlistController,
  userRoutes,
  userService,
  cartService,
  wishlistService,
  User,
  Lawyer,
  Cart,
  Wishlist,
  Testimonial
}; 