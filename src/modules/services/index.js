const serviceController = require('./controllers/serviceController');
const categoryController = require('./controllers/categoryController');
const reviewController = require('./controllers/reviewController');
const serviceRoutes = require('./routes/serviceRoutes');
const serviceService = require('./services/serviceService');
const reviewService = require('./services/reviewService');
const Service = require('./models/serviceModel');
const Category = require('./models/categoryModel');
const Review = require('./models/reviewModel');
const Like = require('./models/likeModel');

module.exports = {
  serviceController,
  categoryController,
  reviewController,
  serviceRoutes,
  serviceService,
  reviewService,
  Service,
  Category,
  Review,
  Like
}; 