const serviceController = require('../../../../src/modules/services/controllers/serviceController');
const Service = require('../../../../src/modules/services/models/serviceModel');
const Category = require('../../../../src/modules/services/models/categoryModel');
const ErrorHandler = require('../../../../src/utils/errorHandler');

// Mock the Service model and Category model
jest.mock('../../../../src/modules/services/models/serviceModel');
jest.mock('../../../../src/modules/services/models/categoryModel');

describe('Service Controller', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { _id: 'mockUserId', role: 'admin' }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  describe('getServices', () => {
    it('should return services with pagination', async () => {
      // Setup
      req.query = {
        page: '1',
        limit: '10',
        category: 'family-law',
        minPrice: '100',
        maxPrice: '500'
      };
      
      const mockServices = [
        {
          _id: 'service1',
          name: 'Family Law Consultation',
          description: 'Consultation for family legal matters',
          basePrice: 200,
          categoryId: 'category1'
        },
        {
          _id: 'service2',
          name: 'Divorce Filing',
          description: 'Legal service for divorce filing',
          basePrice: 350,
          categoryId: 'category1'
        }
      ];
      
      const mockCount = 2;
      
      Service.find = jest.fn().mockReturnThis();
      Service.sort = jest.fn().mockReturnThis();
      Service.skip = jest.fn().mockReturnThis();
      Service.limit = jest.fn().mockResolvedValue(mockServices);
      Service.countDocuments = jest.fn().mockResolvedValue(mockCount);
      
      // Execute
      await serviceController.getServices(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: mockServices.length,
        totalPages: 1,
        currentPage: 1,
        services: mockServices
      });
    });
    
    it('should call next with error if fetching services fails', async () => {
      // Setup
      const mockError = new Error('Database error');
      Service.find = jest.fn().mockReturnThis();
      Service.sort = jest.fn().mockReturnThis();
      Service.skip = jest.fn().mockReturnThis();
      Service.limit = jest.fn().mockRejectedValue(mockError);
      
      // Execute
      await serviceController.getServices(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });
  
  describe('getServiceById', () => {
    it('should return a service by ID', async () => {
      // Setup
      req.params.id = 'service1';
      
      const mockService = {
        _id: 'service1',
        name: 'Family Law Consultation',
        description: 'Consultation for family legal matters',
        basePrice: 200,
        categoryId: 'category1'
      };
      
      Service.findById = jest.fn().mockReturnThis();
      Service.populate = jest.fn().mockResolvedValue(mockService);
      
      // Execute
      await serviceController.getServiceById(req, res, next);
      
      // Assert
      expect(Service.findById).toHaveBeenCalledWith('service1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        service: mockService
      });
    });
    
    it('should return 404 if service is not found', async () => {
      // Setup
      req.params.id = 'nonexistentService';
      
      Service.findById = jest.fn().mockReturnThis();
      Service.populate = jest.fn().mockResolvedValue(null);
      
      // Execute
      await serviceController.getServiceById(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
  });
  
  describe('createService', () => {
    it('should create a new service and return 201 status', async () => {
      // Setup
      const serviceData = {
        name: 'New Legal Service',
        description: 'Description of the service',
        categoryId: 'category1',
        basePrice: 250,
        duration: 60
      };
      
      req.body = serviceData;
      
      const mockService = {
        _id: 'newService',
        ...serviceData
      };
      
      Service.prototype.save = jest.fn().mockResolvedValue(mockService);
      Category.findById = jest.fn().mockResolvedValue({ _id: 'category1', name: 'Family Law' });
      
      // Execute
      await serviceController.createService(req, res, next);
      
      // Assert
      expect(Service.prototype.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Service created successfully',
        service: mockService
      });
    });
    
    it('should return 404 if category does not exist', async () => {
      // Setup
      req.body = {
        name: 'New Legal Service',
        description: 'Description of the service',
        categoryId: 'nonexistentCategory',
        basePrice: 250
      };
      
      Category.findById = jest.fn().mockResolvedValue(null);
      
      // Execute
      await serviceController.createService(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
  });
  
  describe('updateService', () => {
    it('should update a service and return 200 status', async () => {
      // Setup
      req.params.id = 'service1';
      req.body = {
        name: 'Updated Service Name',
        basePrice: 300
      };
      
      const mockService = {
        _id: 'service1',
        name: 'Family Law Consultation',
        description: 'Consultation for family legal matters',
        basePrice: 200,
        categoryId: 'category1'
      };
      
      const updatedService = {
        ...mockService,
        name: 'Updated Service Name',
        basePrice: 300
      };
      
      Service.findById = jest.fn().mockResolvedValue(mockService);
      mockService.save = jest.fn().mockResolvedValue(updatedService);
      
      // Execute
      await serviceController.updateService(req, res, next);
      
      // Assert
      expect(Service.findById).toHaveBeenCalledWith('service1');
      expect(mockService.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Service updated successfully',
        service: updatedService
      });
    });
    
    it('should return 404 if service is not found', async () => {
      // Setup
      req.params.id = 'nonexistentService';
      
      Service.findById = jest.fn().mockResolvedValue(null);
      
      // Execute
      await serviceController.updateService(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
  });
  
  describe('deleteService', () => {
    it('should delete a service and return 200 status', async () => {
      // Setup
      req.params.id = 'service1';
      
      const mockService = {
        _id: 'service1',
        name: 'Family Law Consultation',
        remove: jest.fn().mockResolvedValue({})
      };
      
      Service.findById = jest.fn().mockResolvedValue(mockService);
      
      // Execute
      await serviceController.deleteService(req, res, next);
      
      // Assert
      expect(Service.findById).toHaveBeenCalledWith('service1');
      expect(mockService.remove).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Service deleted successfully'
      });
    });
    
    it('should return 404 if service is not found', async () => {
      // Setup
      req.params.id = 'nonexistentService';
      
      Service.findById = jest.fn().mockResolvedValue(null);
      
      // Execute
      await serviceController.deleteService(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
  });
}); 