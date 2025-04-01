const User = require('../models/userModel');
const Lawyer = require('../models/lawyerModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Register new user
 */
exports.registerUser = async (userData) => {
  try {
    const { name, email, password, phone, role } = userData;
    
    // Check if user with email already exists
    let user = await User.findOne({ email });
    if (user) {
      throw new Error('User with this email already exists');
    }
    
    // Create new user
    user = new User({
      name,
      email,
      password,
      phone,
      role: role || 'customer'
    });
    
    // Save user
    await user.save();
    
    // Create lawyer profile if role is lawyer
    if (user.role === 'lawyer') {
      const lawyer = new Lawyer({
        userId: user._id,
        areasOfExpertise: userData.areasOfExpertise || [],
        education: userData.education || [],
        experience: userData.experience || [],
        bio: userData.bio || '',
        hourlyRate: userData.hourlyRate || 0
      });
      
      await lawyer.save();
    }
    
    // Generate token
    const token = generateToken(user);
    
    return { user, token };
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

/**
 * Login user
 */
exports.loginUser = async (email, password) => {
  try {
    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Remove password from response
    user.password = undefined;
    
    return { user, token };
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
};

/**
 * Get user profile
 */
exports.getUserProfile = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // If user is a lawyer, get lawyer profile
    if (user.role === 'lawyer') {
      const lawyer = await Lawyer.findOne({ userId });
      return { user, lawyer };
    }
    
    return { user };
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
exports.updateUserProfile = async (userId, updateData) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Update basic user fields
    const userFieldsToUpdate = ['name', 'phone', 'address', 'profilePicture'];
    
    userFieldsToUpdate.forEach(field => {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field];
      }
    });
    
    await user.save();
    
    // If user is a lawyer and lawyer data is provided, update lawyer profile
    if (user.role === 'lawyer' && (
      updateData.bio || 
      updateData.hourlyRate || 
      updateData.areasOfExpertise || 
      updateData.education || 
      updateData.experience || 
      updateData.availability
    )) {
      let lawyer = await Lawyer.findOne({ userId });
      
      if (!lawyer) {
        lawyer = new Lawyer({
          userId,
          areasOfExpertise: [],
          education: [],
          experience: []
        });
      }
      
      // Update lawyer fields
      const lawyerFieldsToUpdate = [
        'bio', 'hourlyRate', 'areasOfExpertise', 
        'education', 'experience', 'availability'
      ];
      
      lawyerFieldsToUpdate.forEach(field => {
        if (updateData[field] !== undefined) {
          lawyer[field] = updateData[field];
        }
      });
      
      await lawyer.save();
      
      return { user, lawyer };
    }
    
    return { user };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Update user password
 */
exports.updatePassword = async (userId, currentPassword, newPassword) => {
  try {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    return { success: true };
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

/**
 * Get lawyers with filtering
 */
exports.getLawyers = async (filters, pagination) => {
  try {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;
    
    // Start with base lawyer query
    let lawyerQuery = {};
    
    // Filter by expertise
    if (filters.expertise) {
      lawyerQuery.areasOfExpertise = { $in: [filters.expertise] };
    }
    
    // Filter by hourly rate range
    if (filters.minRate || filters.maxRate) {
      lawyerQuery.hourlyRate = {};
      if (filters.minRate) lawyerQuery.hourlyRate.$gte = Number(filters.minRate);
      if (filters.maxRate) lawyerQuery.hourlyRate.$lte = Number(filters.maxRate);
    }
    
    // Filter by rating
    if (filters.minRating) {
      lawyerQuery.rating = { $gte: Number(filters.minRating) };
    }
    
    // Find lawyers with pagination
    const lawyers = await Lawyer.find(lawyerQuery)
      .populate('userId', 'name email phone profilePicture')
      .sort({ rating: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Lawyer.countDocuments(lawyerQuery);
    
    return {
      lawyers,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    };
  } catch (error) {
    console.error('Error getting lawyers:', error);
    throw error;
  }
};

/**
 * Generate JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '7d' }
  );
} 