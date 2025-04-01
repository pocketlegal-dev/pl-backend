const Category = require('../models/categoryModel');
const ErrorHandler = require('../../../utils/errorHandler');

// Get all categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1, name: 1 });
    
    res.status(200).json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    next(error);
  }
};

// Get category by ID
exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.status(200).json({
      success: true,
      category
    });
  } catch (error) {
    next(error);
  }
};

// Create new category (admin only)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, icon, parentCategory, order } = req.body;
    
    // Check if category with same name already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
    
    const category = new Category({
      name,
      description,
      icon,
      parentCategory: parentCategory || null,
      order: order || 0
    });
    
    await category.save();
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    next(error);
  }
};

// Update category (admin only)
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, description, icon, parentCategory, order, isActive } = req.body;
    
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if new name is already taken by another category
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }
    
    // Update fields
    if (name) category.name = name;
    if (description) category.description = description;
    if (icon) category.icon = icon;
    if (parentCategory) category.parentCategory = parentCategory;
    if (order !== undefined) category.order = order;
    if (isActive !== undefined) category.isActive = isActive;
    
    await category.save();
    
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    next(error);
  }
};

// Delete category (admin only)
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    await category.remove();
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}; 