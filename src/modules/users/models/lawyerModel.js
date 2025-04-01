const mongoose = require('mongoose');

const lawyerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  qualifications: [{
    degree: {
      type: String,
      required: true
    },
    institution: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      required: true
    }
  }],
  experience: [{
    organization: {
      type: String,
      required: true
    },
    position: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date
    },
    isCurrent: {
      type: Boolean,
      default: false
    }
  }],
  areasOfExpertise: [{
    type: String,
    required: true
  }],
  licenseNumber: {
    type: String,
    required: true
  },
  licenseIssuedBy: {
    type: String,
    required: true
  },
  licenseExpiryDate: {
    type: Date,
    required: true
  },
  bio: {
    type: String
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numberOfRatings: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  documentsVerified: {
    type: Boolean,
    default: false
  },
  documentsUploadedAt: {
    type: Date
  },
  hourlyRate: {
    type: Number
  },
  languages: [{
    type: String
  }]
}, {
  timestamps: true
});

// Virtual field for average rating
lawyerSchema.virtual('averageRating').get(function() {
  return this.numberOfRatings > 0 ? this.rating / this.numberOfRatings : 0;
});

// Method to update lawyer rating
lawyerSchema.methods.updateRating = function(newRating) {
  this.rating = ((this.rating * this.numberOfRatings) + newRating) / (this.numberOfRatings + 1);
  this.numberOfRatings += 1;
  return this.save();
};

const Lawyer = mongoose.model('Lawyer', lawyerSchema);

module.exports = Lawyer; 