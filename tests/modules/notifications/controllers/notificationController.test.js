const notificationController = require('../../../../src/modules/notifications/controllers/notificationController');
const Notification = require('../../../../src/modules/notifications/models/notificationModel');
const ErrorHandler = require('../../../../src/utils/errorHandler');

// Mock the Notification model
jest.mock('../../../../src/modules/notifications/models/notificationModel');

describe('Notification Controller', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { _id: 'mockUserId' }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  describe('createNotification', () => {
    it('should create a notification and return the created notification', async () => {
      // Setup
      const notificationData = {
        userId: 'mockUserId',
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'system',
        priority: 'medium'
      };
      
      const mockNotification = {
        _id: 'mockNotificationId',
        ...notificationData,
        isRead: false,
        createdAt: new Date()
      };
      
      Notification.prototype.save = jest.fn().mockResolvedValue(mockNotification);
      
      // Execute
      const result = await notificationController.createNotification(
        notificationData.userId,
        notificationData.title,
        notificationData.message,
        notificationData.type,
        null,
        null,
        notificationData.priority
      );
      
      // Assert
      expect(Notification.prototype.save).toHaveBeenCalled();
      expect(result).toEqual(mockNotification);
    });
    
    it('should return null if creating notification fails', async () => {
      // Setup
      Notification.prototype.save = jest.fn().mockRejectedValue(new Error('Failed to save'));
      
      // Execute
      const result = await notificationController.createNotification(
        'mockUserId',
        'Test Notification',
        'This is a test notification',
        'system',
        null,
        null,
        'medium'
      );
      
      // Assert
      expect(Notification.prototype.save).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
  
  describe('getUserNotifications', () => {
    it('should return user notifications with count and unread count', async () => {
      // Setup
      req.query = {
        page: '1',
        limit: '10',
        type: 'system',
        isRead: 'false'
      };
      
      const mockNotifications = [
        {
          _id: 'notif1',
          userId: 'mockUserId',
          title: 'Test Notification 1',
          message: 'Message 1',
          type: 'system',
          isRead: false
        },
        {
          _id: 'notif2',
          userId: 'mockUserId',
          title: 'Test Notification 2',
          message: 'Message 2',
          type: 'system',
          isRead: false
        }
      ];
      
      const mockCount = 2;
      const mockUnreadCount = 2;
      
      Notification.find = jest.fn().mockReturnThis();
      Notification.sort = jest.fn().mockReturnThis();
      Notification.skip = jest.fn().mockReturnThis();
      Notification.limit = jest.fn().mockResolvedValue(mockNotifications);
      Notification.countDocuments = jest.fn()
        .mockResolvedValueOnce(mockCount)
        .mockResolvedValueOnce(mockUnreadCount);
      
      // Execute
      await notificationController.getUserNotifications(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        notifications: mockNotifications,
        count: mockCount,
        unreadCount: mockUnreadCount,
        page: 1,
        totalPages: 1
      });
    });
    
    it('should call next with error if fetching notifications fails', async () => {
      // Setup
      const mockError = new Error('Database error');
      Notification.find = jest.fn().mockReturnThis();
      Notification.sort = jest.fn().mockReturnThis();
      Notification.skip = jest.fn().mockReturnThis();
      Notification.limit = jest.fn().mockRejectedValue(mockError);
      
      // Execute
      await notificationController.getUserNotifications(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
    });
  });
  
  describe('markAsRead', () => {
    it('should mark notification as read and return success message', async () => {
      // Setup
      req.params.id = 'mockNotificationId';
      
      const mockUpdatedNotification = {
        _id: 'mockNotificationId',
        userId: 'mockUserId',
        isRead: true
      };
      
      Notification.findOneAndUpdate = jest.fn().mockResolvedValue(mockUpdatedNotification);
      
      // Execute
      await notificationController.markAsRead(req, res, next);
      
      // Assert
      expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'mockNotificationId', userId: 'mockUserId' },
        { isRead: true },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Notification marked as read'
      });
    });
    
    it('should return 404 if notification is not found', async () => {
      // Setup
      req.params.id = 'nonExistentId';
      
      Notification.findOneAndUpdate = jest.fn().mockResolvedValue(null);
      
      // Execute
      await notificationController.markAsRead(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
  });
  
  describe('markAllAsRead', () => {
    it('should mark all user notifications as read and return success message', async () => {
      // Setup
      Notification.updateMany = jest.fn().mockResolvedValue({ nModified: 5 });
      
      // Execute
      await notificationController.markAllAsRead(req, res, next);
      
      // Assert
      expect(Notification.updateMany).toHaveBeenCalledWith(
        { userId: 'mockUserId', isRead: false },
        { isRead: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'All notifications marked as read'
      });
    });
    
    it('should call next with error if marking all as read fails', async () => {
      // Setup
      const mockError = new Error('Database error');
      Notification.updateMany = jest.fn().mockRejectedValue(mockError);
      
      // Execute
      await notificationController.markAllAsRead(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
    });
  });
}); 