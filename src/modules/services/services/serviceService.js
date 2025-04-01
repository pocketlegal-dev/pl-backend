const Service = require('../models/serviceModel');
const Category = require('../models/categoryModel');
const Review = require('../models/reviewModel');
const Like = require('../models/likeModel');

/**
 * Get services with filtering, sorting, and pagination
 */
exports.getServices = async (filters, sort, pagination) => {
  try {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;
    
    // Build query
    let query = { isActive: true };
    
    // Category filter
    if (filters.category) {
      query.categoryId = filters.category;
    }
    
    // Search filter
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ];
    }
    
    // Price range filter
    if (filters.minPrice || filters.maxPrice) {
      query.basePrice = {};
      if (filters.minPrice) query.basePrice.$gte = Number(filters.minPrice);
      if (filters.maxPrice) query.basePrice.$lte = Number(filters.maxPrice);
    }
    
    // Featured filter
    if (filters.featured === 'true') {
      query.featured = true;
    }
    
    // Build sort options
    let sortOptions = {};
    if (sort) {
      if (sort.by === 'price') {
        sortOptions.basePrice = sort.order === 'desc' ? -1 : 1;
      } else if (sort.by === 'rating') {
        sortOptions.rating = -1;
      } else if (sort.by === 'popularity') {
        sortOptions.popularityScore = -1;
      }
    } else {
      sortOptions = { popularityScore: -1, rating: -1 };
    }
    
    // Get services
    const services = await Service.find(query)
      .populate('categoryId', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);
    
    const total = await Service.countDocuments(query);
    
    return {
      services,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    };
  } catch (error) {
    console.error('Error getting services:', error);
    throw error;
  }
};

/**
 * Get service by ID
 */
exports.getServiceById = async (serviceId, incrementPopularity = true) => {
  try {
    const service = await Service.findById(serviceId)
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
      throw new Error('Service not found');
    }
    
    // Increment popularity score if requested
    if (incrementPopularity) {
      await Service.findByIdAndUpdate(serviceId, {
        $inc: { popularityScore: 1 }
      });
    }
    
    return service;
  } catch (error) {
    console.error('Error getting service by ID:', error);
    throw error;
  }
};

/**
 * Create new service
 */
exports.createService = async (serviceData) => {
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
    } = serviceData;
    
    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }
    
    // Create service
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
    return service;
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
};

/**
 * Update service
 */
exports.updateService = async (serviceId, updateData) => {
  try {
    const service = await Service.findById(serviceId);
    
    if (!service) {
      throw new Error('Service not found');
    }
    
    // Check if category exists if changing category
    if (updateData.categoryId && updateData.categoryId !== service.categoryId.toString()) {
      const category = await Category.findById(updateData.categoryId);
      if (!category) {
        throw new Error('Category not found');
      }
    }
    
    // Update fields
    const fieldsToUpdate = [
      'name', 'description', 'shortDescription', 'categoryId', 
      'basePrice', 'duration', 'image', 'isActive', 
      'requiresConsultation', 'tags', 'benefits', 
      'requirements', 'faq', 'featured'
    ];
    
    fieldsToUpdate.forEach(field => {
      if (updateData[field] !== undefined) {
        service[field] = updateData[field];
      }
    });
    
    await service.save();
    return service;
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

/**
 * Delete service
 */
exports.deleteService = async (serviceId) => {
  try {
    const service = await Service.findById(serviceId);
    
    if (!service) {
      throw new Error('Service not found');
    }
    
    await service.remove();
    return { success: true };
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};

/**
 * Update service lawyers (add or remove)
 */
exports.updateServiceLawyers = async (serviceId, lawyerId, action) => {
  try {
    if (!['add', 'remove'].includes(action)) {
      throw new Error('Action must be either "add" or "remove"');
    }
    
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
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
    return service;
  } catch (error) {
    console.error('Error updating service lawyers:', error);
    throw error;
  }
}; 