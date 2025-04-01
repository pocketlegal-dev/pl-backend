const Service = require('../models/serviceModel');
const Category = require('../models/categoryModel');
const Lawyer = require('../../users/models/lawyerModel');
const ErrorHandler = require('../../../utils/errorHandler');

// Get all services with filtering
exports.getServices = async (req, res, next) => {
  try {
    let query = { isActive: true };
    
    // Filter by category
    if (req.query.category) {
      query.categoryId = req.query.category;
    }
    
    // Filter by search term in name or description
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ];
    }
    
    // Filter by price range
    if (req.query.minPrice || req.query.maxPrice) {
      query.basePrice = {};
      if (req.query.minPrice) query.basePrice.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.basePrice.$lte = Number(req.query.maxPrice);
    }
    
    // Filter by featured
    if (req.query.featured === 'true') {
      query.featured = true;
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Sort options
    let sort = {};
    if (req.query.sortBy) {
      if (req.query.sortBy === 'price') {
        sort.basePrice = req.query.sortOrder === 'desc' ? -1 : 1;
      } else if (req.query.sortBy === 'rating') {
        sort.rating = -1;
      } else if (req.query.sortBy === 'popularity') {
        sort.popularityScore = -1;
      }
    } else {
      sort = { popularityScore: -1, rating: -1 };
    }
    
    const services = await Service.find(query)
      .populate('categoryId', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await Service.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: services.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      services
    });
  } catch (error) {
    next(error);
  }
};

// Get service by ID
exports.getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('categoryId', 'name description')
      .populate({
        path: 'lawyers',
        select: 'userId hourlyRate rating numberOfRatings',
        populate: {
          path: 'userId',
          select: 'name profilePicture'
        }
      });
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    // Increment popularity score for analytics
    await Service.findByIdAndUpdate(req.params.id, {
      $inc: { popularityScore: 1 }
    });
    
    res.status(200).json({
      success: true,
      service
    });
  } catch (error) {
    next(error);
  }
};

// Create new service (admin only)
exports.createService = async (req, res, next) => {
  try {
    const {
      name,
      description,
      shortDescription,
      categoryId,
      basePrice,
      duration,
      image,
      requiresConsultation,
      tags,
      benefits,
      requirements,
      faq,
      featured
    } = req.body;
    
    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    const service = new Service({
      name,
      description,
      shortDescription,
      categoryId,
      basePrice,
      duration,
      image,
      requiresConsultation: requiresConsultation !== undefined ? requiresConsultation : true,
      tags: tags || [],
      benefits: benefits || [],
      requirements: requirements || [],
      faq: faq || [],
      featured: featured || false
    });
    
    await service.save();
    
    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    next(error);
  }
};

// Update service (admin only)
exports.updateService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    const {
      name,
      description,
      shortDescription,
      categoryId,
      basePrice,
      duration,
      image,
      isActive,
      requiresConsultation,
      tags,
      benefits,
      requirements,
      faq,
      featured
    } = req.body;
    
    // Check if category exists if changing category
    if (categoryId && categoryId !== service.categoryId.toString()) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
    }
    
    // Update fields
    if (name) service.name = name;
    if (description) service.description = description;
    if (shortDescription) service.shortDescription = shortDescription;
    if (categoryId) service.categoryId = categoryId;
    if (basePrice) service.basePrice = basePrice;
    if (duration) service.duration = duration;
    if (image) service.image = image;
    if (isActive !== undefined) service.isActive = isActive;
    if (requiresConsultation !== undefined) service.requiresConsultation = requiresConsultation;
    if (tags) service.tags = tags;
    if (benefits) service.benefits = benefits;
    if (requirements) service.requirements = requirements;
    if (faq) service.faq = faq;
    if (featured !== undefined) service.featured = featured;
    
    await service.save();
    
    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    next(error);
  }
};

// Delete service (admin only)
exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    await service.remove();
    
    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Add or remove lawyer from service
exports.updateServiceLawyers = async (req, res, next) => {
  try {
    const { lawyerId, action } = req.body;
    
    if (!['add', 'remove'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "add" or "remove"'
      });
    }
    
    // Check if service exists
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    // Check if lawyer exists
    const lawyer = await Lawyer.findById(lawyerId);
    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: 'Lawyer not found'
      });
    }
    
    if (action === 'add') {
      // Add lawyer if not already in the list
      if (!service.lawyers.includes(lawyerId)) {
        service.lawyers.push(lawyerId);
      }
    } else {
      // Remove lawyer from the list
      service.lawyers = service.lawyers.filter(id => id.toString() !== lawyerId);
    }
    
    await service.save();
    
    res.status(200).json({
      success: true,
      message: `Lawyer ${action === 'add' ? 'added to' : 'removed from'} service successfully`,
      service
    });
  } catch (error) {
    next(error);
  }
}; 