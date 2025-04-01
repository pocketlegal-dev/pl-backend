const User = require('../models/userModel');
const Lawyer = require('../models/lawyerModel');
const ErrorHandler = require('../../../utils/errorHandler');

// Register a new user
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: role || 'customer',
      phone
    });

    await user.save();

    // Create lawyer profile if role is lawyer
    if (user.role === 'lawyer') {
      const lawyer = new Lawyer({
        userId: user._id
      });

      await lawyer.save();
    }

    // Generate token
    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check if password is correct
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Generate token
    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    let profileData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profilePicture: user.profilePicture,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    };

    // If user is a lawyer, get lawyer profile
    if (user.role === 'lawyer') {
      const lawyer = await Lawyer.findOne({ userId: user._id });
      if (lawyer) {
        profileData.lawyer = lawyer;
      }
    }

    res.status(200).json({
      success: true,
      user: profileData
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateUserProfile = async (req, res, next) => {
  try {
    const { name, phone, profilePicture } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, profilePicture, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// Update password
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if current password is correct
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Update password
    user.password = newPassword;
    user.updatedAt = Date.now();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Handle social auth callback (Google, Facebook, LinkedIn)
exports.socialAuthCallback = async (req, res, next) => {
  try {
    // At this point, the user is already authenticated via passport
    // and the user profile should be available in req.user
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication failed' 
      });
    }

    // Generate authentication token
    const token = req.user.generateAuthToken();

    // Redirect to frontend with token
    // This URL should be configurable via environment variables
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (error) {
    next(error);
  }
}; 