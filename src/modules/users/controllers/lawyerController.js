const Lawyer = require('../models/lawyerModel');
const User = require('../models/userModel');
const ErrorHandler = require('../../../utils/errorHandler');

// Complete/Update lawyer profile
exports.updateLawyerProfile = async (req, res, next) => {
  try {
    // Make sure the user is a lawyer
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({
        success: false,
        message: 'Only lawyers can access this resource'
      });
    }

    const {
      qualifications,
      experience,
      areasOfExpertise,
      licenseNumber,
      licenseIssuedBy,
      licenseExpiryDate,
      bio,
      hourlyRate,
      languages
    } = req.body;

    const lawyer = await Lawyer.findOne({ userId: req.user.id });

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: 'Lawyer profile not found'
      });
    }

    // Update fields if provided
    if (qualifications) lawyer.qualifications = qualifications;
    if (experience) lawyer.experience = experience;
    if (areasOfExpertise) lawyer.areasOfExpertise = areasOfExpertise;
    if (licenseNumber) lawyer.licenseNumber = licenseNumber;
    if (licenseIssuedBy) lawyer.licenseIssuedBy = licenseIssuedBy;
    if (licenseExpiryDate) lawyer.licenseExpiryDate = licenseExpiryDate;
    if (bio) lawyer.bio = bio;
    if (hourlyRate) lawyer.hourlyRate = hourlyRate;
    if (languages) lawyer.languages = languages;

    await lawyer.save();

    res.status(200).json({
      success: true,
      message: 'Lawyer profile updated successfully',
      lawyer
    });
  } catch (error) {
    next(error);
  }
};

// Get lawyer profile by ID
exports.getLawyerProfile = async (req, res, next) => {
  try {
    const lawyer = await Lawyer.findById(req.params.id)
      .populate('userId', 'name email profilePicture');

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: 'Lawyer not found'
      });
    }

    res.status(200).json({
      success: true,
      lawyer
    });
  } catch (error) {
    next(error);
  }
};

// Get all lawyers with filtering
exports.getLawyers = async (req, res, next) => {
  try {
    let query = { isActive: true };
    
    // Filter by expertise
    if (req.query.expertise) {
      query.areasOfExpertise = { $in: [req.query.expertise] };
    }
    
    // Filter by minimum rating
    if (req.query.minRating) {
      const minRating = Number(req.query.minRating);
      if (!isNaN(minRating)) {
        query.rating = { $gte: minRating * req.query.numberOfRatings };
        query.numberOfRatings = { $gt: 0 };
      }
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Sort options
    let sort = {};
    if (req.query.sortBy) {
      if (req.query.sortBy === 'rating') {
        sort = { rating: -1, numberOfRatings: -1 };
      } else if (req.query.sortBy === 'experience') {
        sort = { 'experience.startDate': 1 };
      } else if (req.query.sortBy === 'hourlyRate') {
        sort = req.query.sortOrder === 'asc' ? { hourlyRate: 1 } : { hourlyRate: -1 };
      }
    } else {
      sort = { rating: -1 };
    }
    
    const lawyers = await Lawyer.find(query)
      .populate('userId', 'name email profilePicture')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await Lawyer.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: lawyers.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      lawyers
    });
  } catch (error) {
    next(error);
  }
};

// Add or update lawyer documents
exports.updateLawyerDocuments = async (req, res, next) => {
  try {
    // Make sure the user is a lawyer
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({
        success: false,
        message: 'Only lawyers can access this resource'
      });
    }

    const lawyer = await Lawyer.findOne({ userId: req.user.id });

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: 'Lawyer profile not found'
      });
    }

    // Set documents uploaded timestamp
    lawyer.documentsUploadedAt = Date.now();
    await lawyer.save();

    res.status(200).json({
      success: true,
      message: 'Documents uploaded successfully',
      lawyer
    });
  } catch (error) {
    next(error);
  }
};