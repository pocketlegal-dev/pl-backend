const userController = require('../../../../src/modules/users/controllers/userController');
const userService = require('../../../../src/modules/users/services/userService');
const ErrorHandler = require('../../../../src/utils/errorHandler');

// Mock the userService and response objects
jest.mock('../../../../src/modules/users/services/userService');

describe('User Controller', () => {
  let req, res, next;
  
  // Setup mocks before each test
  beforeEach(() => {
    req = {
      body: {},
      params: {},
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
  
  describe('register', () => {
    it('should register a new user and return 201 status with token and user', async () => {
      // Setup
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'customer'
      };
      
      req.body = userData;
      
      const mockUser = {
        _id: 'mockUserId',
        name: userData.name,
        email: userData.email,
        role: userData.role
      };
      
      const mockToken = 'mockJwtToken';
      
      userService.registerUser.mockResolvedValue({
        user: mockUser,
        token: mockToken
      });
      
      // Execute
      await userController.register(req, res, next);
      
      // Assert
      expect(userService.registerUser).toHaveBeenCalledWith(userData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        token: mockToken,
        user: mockUser
      });
    });
    
    it('should call next with error if registration fails', async () => {
      // Setup
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      
      const mockError = new Error('Registration failed');
      userService.registerUser.mockRejectedValue(mockError);
      
      // Execute
      await userController.register(req, res, next);
      
      // Assert
      expect(userService.registerUser).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
  
  describe('login', () => {
    it('should login user and return 200 status with token and user', async () => {
      // Setup
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      req.body = loginData;
      
      const mockUser = {
        _id: 'mockUserId',
        name: 'Test User',
        email: loginData.email,
        role: 'customer'
      };
      
      const mockToken = 'mockJwtToken';
      
      userService.loginUser.mockResolvedValue({
        user: mockUser,
        token: mockToken
      });
      
      // Execute
      await userController.login(req, res, next);
      
      // Assert
      expect(userService.loginUser).toHaveBeenCalledWith(
        loginData.email,
        loginData.password
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        token: mockToken,
        user: mockUser
      });
    });
    
    it('should call next with error if login fails', async () => {
      // Setup
      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      const mockError = new Error('Invalid credentials');
      userService.loginUser.mockRejectedValue(mockError);
      
      // Execute
      await userController.login(req, res, next);
      
      // Assert
      expect(userService.loginUser).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
  
  describe('getUserProfile', () => {
    it('should return 200 status with user profile', async () => {
      // Setup
      const mockUser = {
        _id: 'mockUserId',
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer'
      };
      
      userService.getUserById.mockResolvedValue(mockUser);
      
      // Execute
      await userController.getUserProfile(req, res, next);
      
      // Assert
      expect(userService.getUserById).toHaveBeenCalledWith('mockUserId');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        user: mockUser
      });
    });
    
    it('should call next with error if fetching profile fails', async () => {
      // Setup
      const mockError = new Error('User not found');
      userService.getUserById.mockRejectedValue(mockError);
      
      // Execute
      await userController.getUserProfile(req, res, next);
      
      // Assert
      expect(userService.getUserById).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
}); 