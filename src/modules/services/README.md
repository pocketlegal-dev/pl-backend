# Services Module

This module handles all service-related functionality for the Pocket Legal application, including services, categories, reviews, and likes.

## Features

- Service management with filtering, sorting, and pagination
- Category management
- Review system for services and lawyers
- Popularity tracking and featured services
- Service likes functionality

## API Endpoints

### Services

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | /api/services | Get all services with filtering | No |
| GET | /api/services/:id | Get service by ID | No |
| POST | /api/services | Create new service | Yes (Admin only) |
| PUT | /api/services/:id | Update service | Yes (Admin only) |
| DELETE | /api/services/:id | Delete service | Yes (Admin only) |
| PUT | /api/services/:id/lawyers | Add/remove lawyer from service | Yes (Admin only) |

### Categories

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | /api/services/categories | Get all categories | No |
| GET | /api/services/categories/:id | Get category by ID | No |
| POST | /api/services/categories | Create new category | Yes (Admin only) |
| PUT | /api/services/categories/:id | Update category | Yes (Admin only) |
| DELETE | /api/services/categories/:id | Delete category | Yes (Admin only) |

### Reviews

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | /api/services/reviews | Create new review | Yes |
| GET | /api/services/reviews/user | Get user's own reviews | Yes |
| GET | /api/services/:id/reviews | Get reviews by service ID | No |
| GET | /api/services/lawyers/:id/reviews | Get reviews by lawyer ID | No |
| PUT | /api/services/reviews/:id | Update review | Yes |
| DELETE | /api/services/reviews/:id | Delete review | Yes |

## Models

- **Service**: Legal services offered by lawyers
- **Category**: Categories for organizing services
- **Review**: User reviews for services and lawyers
- **Like**: User likes for services and lawyers

## Service Features

Services can include:
- Basic info (name, description, price)
- Benefits and requirements
- FAQ sections
- Associated lawyers
- Tags for better searchability
- Featured status

## Usage Examples

```javascript
// Import the module
const servicesModule = require('../services');

// Get services with filtering
const services = await servicesModule.serviceController.getServices({
  category: 'family-law',
  minPrice: 100,
  maxPrice: 500,
  featured: true
});

// Get service details
const service = await servicesModule.serviceController.getServiceById(serviceId);

// Create review
await servicesModule.reviewController.createReview({
  bookingId,
  serviceId,
  rating: 5,
  comment: 'Excellent service!'
});
``` 