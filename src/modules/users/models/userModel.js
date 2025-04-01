const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please enter your email'],
    unique: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: function() {
      // Only require password if not using social auth
      return !this.googleId && !this.facebookId && !this.linkedinId;
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  phone: {
    type: String,
    match: [
      /^(\+\d{1,3}[- ]?)?\d{10}$/,
      'Please enter a valid phone number'
    ]
  },
  role: {
    type: String,
    enum: ['customer', 'lawyer', 'admin'],
    default: 'customer'
  },
  profilePicture: {
    type: String,
    default: 'default.jpg'
  },
  address: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    select: false
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    select: false
  },
  // SSO fields
  googleId: {
    type: String,
    sparse: true,
    index: true
  },
  facebookId: {
    type: String,
    sparse: true,
    index: true
  },
  linkedinId: {
    type: String,
    sparse: true,
    index: true 
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'facebook', 'linkedin'],
    default: 'local'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for faster lookups
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ facebookId: 1 }, { sparse: true });
userSchema.index({ linkedinId: 1 }, { sparse: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // If password wasn't modified, don't hash it again
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '7d' }
  );
};

const User = mongoose.model('User', userSchema);

module.exports = User; 