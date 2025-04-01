const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Service description is required']
  },
  shortDescription: {
    type: String,
    maxlength: [250, 'Short description cannot exceed 250 characters']
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required']
  },
  duration: {
    type: Number,
    comment: 'Duration in minutes'
  },
  image: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  requiresConsultation: {
    type: Boolean,
    default: true
  },
  lawyers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer'
  }],
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
  tags: [{
    type: String
  }],
  benefits: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String
    }
  }],
  requirements: [{
    type: String
  }],
  faq: [{
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    }
  }],
  featured: {
    type: Boolean,
    default: false
  },
  popularityScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create indexes for faster lookups
serviceSchema.index({ name: 1 });
serviceSchema.index({ categoryId: 1 });
serviceSchema.index({ featured: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ popularityScore: -1 });

// Virtual field for average rating
serviceSchema.virtual('averageRating').get(function() {
  return this.numberOfRatings > 0 ? this.rating / this.numberOfRatings : 0;
});

// Method to update service rating
serviceSchema.methods.updateRating = function(newRating) {
  this.rating = ((this.rating * this.numberOfRatings) + newRating) / (this.numberOfRatings + 1);
  this.numberOfRatings += 1;
  return this.save();
};

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service; 