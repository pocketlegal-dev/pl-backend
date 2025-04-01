const paymentController = require('./controllers/paymentController');
const paymentRoutes = require('./routes/paymentRoutes');
const paymentService = require('./services/paymentService');
const Payment = require('./models/paymentModel');

module.exports = {
  paymentController,
  paymentRoutes,
  paymentService,
  Payment
}; 