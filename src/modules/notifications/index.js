const notificationController = require('./controllers/notificationController');
const notificationService = require('./services/notificationService');
const notificationRoutes = require('./routes/notificationRoutes');
const Notification = require('./models/notification');

module.exports = {
  notificationController,
  notificationService,
  notificationRoutes,
  Notification
};