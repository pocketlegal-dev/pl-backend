const Notification = require('../models/notification');
const User = require('../../users/models/userModel');
const ErrorHandler = require('../../../utils/errorHandler');

// Create notification (internal)
exports.createNotification = async (userId, title, message, type, relatedId, relatedModel, priority = 'medium', actionUrl, icon) => {
  try {
    const notification = new Notification({
      userId,
      title,
      message,
      type,
      relatedId,
      relatedModel,
      priority,
      actionUrl,
      icon
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Get user notifications
exports.getUserNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    let query = { userId: req.user.id };
    
    // Filter by read status
    if (req.query.read === 'true') {
      query.read = true;
    } else if (req.query.read === 'false') {
      query.read = false;
    }
    
    // Filter by type
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    // Filter by priority
    if (req.query.priority) {
      query.priority = req.query.priority;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId: req.user.id, read: false });
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      unreadCount,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    notification.read = true;
    notification.readAt = Date.now();
    await notification.save();
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true, readAt: Date.now() }
    );
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// Delete notification
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    await notification.remove();
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Clear all notifications
exports.clearAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ userId: req.user.id });
    
    res.status(200).json({
      success: true,
      message: 'All notifications cleared'
    });
  } catch (error) {
    next(error);
  }
}; 