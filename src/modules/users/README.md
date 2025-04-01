# Users Module

This module handles all user-related functionality for the Pocket Legal application, including authentication, profile management, lawyer profiles, cart, and wishlist.

## Features

- User authentication (register, login)
- User profile management
- Lawyer profile management
- Shopping cart functionality
- Wishlist functionality
- Testimonials management

## API Endpoints

### Authentication & User Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | /api/users/register | Register a new user | No |
| POST | /api/users/login | Login user | No |
| GET | /api/users/profile | Get user profile | Yes |
| PUT | /api/users/profile | Update user profile | Yes |
| PUT | /api/users/password | Update password | Yes |

### Lawyer Profiles

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | /api/users/lawyers | Get all lawyers with filtering | No |
| GET | /api/users/lawyers/:id | Get lawyer profile by ID | No |
| PUT | /api/users/lawyer/profile | Update lawyer profile | Yes (Lawyers only) |
| PUT | /api/users/lawyer/documents | Upload lawyer documents | Yes (Lawyers only) |

### Cart Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | /api/users/cart | Add item to cart | Yes |
| GET | /api/users/cart | Get cart items | Yes |
| PUT | /api/users/cart/:id | Update cart item | Yes |
| DELETE | /api/users/cart/:id | Remove cart item | Yes |
| DELETE | /api/users/cart | Clear cart | Yes |

### Wishlist Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | /api/users/wishlist | Add to wishlist | Yes |
| GET | /api/users/wishlist | Get wishlist | Yes |
| DELETE | /api/users/wishlist/:id | Remove from wishlist | Yes |
| DELETE | /api/users/wishlist | Clear wishlist | Yes |

## User Roles

- `customer`: Regular users who can book services
- `lawyer`: Legal professionals who provide services
- `admin`: System administrators

## Models

- **User**: Core user information and authentication
- **Lawyer**: Extended information for lawyer profiles
- **Cart**: Shopping cart items
- **Wishlist**: Saved items for future reference
- **Testimonial**: User testimonials about lawyers

## Usage Examples

```javascript
// Import the module
const usersModule = require('../users');

// Authentication
const { token, user } = await usersModule.userController.login(email, password);

// Get lawyer profiles
const lawyers = await usersModule.lawyerController.getLawyers({ expertise: 'Family Law' });

// Add to cart
await usersModule.cartController.addToCart(userId, { serviceId, lawyerId, quantity });
``` 