# Pocket Legal API Developer Documentation

## Project Overview

Pocket Legal is a platform connecting users with legal services and lawyers. This backend API provides the core functionality including user authentication (including SSO), lawyer profiles, service booking, payments, and notifications.

## Development History & Implementation Decisions

The Pocket Legal backend was built incrementally with a focus on modular design and maintainability:

1. **Initial Setup & Core Architecture**:
   - Established a modular structure to separate different business domains
   - Created the base Express.js application with middleware configuration
   - Set up error handling, logging, and basic security features

2. **User Authentication System**:
   - Implemented JWT-based authentication with bcrypt for password hashing
   - Added role-based authorization (customer, lawyer, admin)
   - Later expanded with SSO integration (Google, Facebook, LinkedIn)

3. **Legal Service Module**:
   - Created models for legal services with categorization
   - Implemented search and filtering capabilities
   - Added relationship between services and lawyers

4. **Booking & Payment System**:
   - Built booking flow with appointment scheduling
   - Integrated Stripe for payment processing
   - Implemented cart and checkout functionality

5. **Notification System**:
   - Created a flexible notification system supporting multiple types
   - Added read/unread status tracking
   - Implemented priority levels and filtering capabilities

6. **API Documentation**:
   - Added comprehensive Swagger documentation
   - Ensured all endpoints are properly documented with examples

### Key Technical Decisions

1. **Modular Architecture**: We opted for a domain-driven, modular architecture to improve maintainability and separation of concerns. Each module (users, services, etc.) contains its own models, controllers, and routes.

2. **MongoDB with Mongoose**: MongoDB was chosen for its flexibility with evolving schemas and Mongoose provides strong typing, validation, and query capabilities.

3. **JWT Authentication**: JWT tokens provide stateless authentication that scales well and works seamlessly with frontend applications.

4. **SSO Implementation**: We used Passport.js for social authentication to leverage industry-standard OAuth 2.0 flows and simplify the integration with multiple providers.

5. **Error Handling**: Centralized error handling middleware to ensure consistent error responses across the API.

6. **Validation**: Express-validator is used for input validation to ensure data integrity and security.

7. **Logging**: Winston logger is implemented for structured logging that can be directed to multiple outputs (console, files, external services).

## Production Readiness Checklist

Before deploying to production, ensure that the following items have been addressed:

### Security
- [ ] Secrets and credentials are stored securely (not in version control)
- [ ] JWT secrets are strong and environment-specific
- [ ] Password hashing is implemented properly with bcrypt
- [ ] Rate limiting is configured for authentication endpoints
- [ ] CORS is properly configured for production domains
- [ ] Content Security Policy (CSP) headers are set
- [ ] Security headers (X-Frame-Options, X-XSS-Protection, etc.) are configured
- [ ] OAuth callback URLs are properly configured for production
- [ ] Input validation is implemented on all endpoints
- [ ] SQL/NoSQL injection protections are in place
- [ ] Authentication middleware is applied to all protected routes
- [ ] HTTPS is enforced in production

### Performance & Scalability
- [ ] Database indexes are created for frequently queried fields
- [ ] Query performance has been tested with realistic data volumes
- [ ] Connection pooling is properly configured
- [ ] Pagination is implemented for list endpoints
- [ ] Resource limits are set for container deployments
- [ ] Horizontal scaling strategy is defined
- [ ] Database scaling strategy is defined
- [ ] Caching strategy is implemented where appropriate

### Reliability
- [ ] Health check endpoints are implemented
- [ ] Graceful shutdown handling is implemented
- [ ] Error handling covers all expected error scenarios
- [ ] Proper HTTP status codes are used throughout the API
- [ ] Circuit breaker patterns are used for external service calls
- [ ] Retry mechanisms are implemented for transient failures
- [ ] Database backups are configured
- [ ] Disaster recovery plan is documented

### Monitoring & Observability
- [ ] Logging is comprehensive and structured
- [ ] Log levels are properly used (error, warn, info, debug)
- [ ] Request IDs are included in logs for traceability
- [ ] Monitoring is set up for server metrics (CPU, memory, disk)
- [ ] API metrics are collected (request rates, error rates, latency)
- [ ] Alerting is configured for critical failures
- [ ] Dashboards are created for key metrics
- [ ] Error tracking service is integrated (e.g., Sentry)

### DevOps & Deployment
- [ ] CI/CD pipeline is fully configured and tested
- [ ] Deployment strategy minimizes downtime (rolling updates)
- [ ] Database migrations have a clear process
- [ ] Infrastructure as Code (IaC) is used for all environments
- [ ] Environment-specific configurations are properly managed
- [ ] Secrets management solution is implemented
- [ ] Container security scanning is set up
- [ ] Resource cleanup strategies are implemented

### Documentation
- [ ] API documentation is complete and accurate
- [ ] Environment variables are fully documented
- [ ] Deployment process is documented
- [ ] Database schema and relationships are documented
- [ ] Troubleshooting guide is available
- [ ] Development onboarding documentation is available

### Testing
- [ ] Unit tests cover core business logic
- [ ] Integration tests verify API behavior
- [ ] Test coverage meets defined targets
- [ ] Performance/load testing has been conducted
- [ ] Security testing/scanning has been performed
- [ ] Test environment mirrors production configuration

### Compliance & Legal
- [ ] Terms of service are documented
- [ ] Privacy policy is in place
- [ ] GDPR compliance has been reviewed (if applicable)
- [ ] Data retention policies are defined
- [ ] Audit logging is implemented for sensitive operations
- [ ] Personal data handling complies with relevant regulations

## Architecture Approach

The application follows a modular architecture with clear separation of concerns:

- **Modules**: Core business domains are separated into modules (users, services, etc.)
- **MVC Pattern**: Each module follows Controller-Model-Route separation
- **Middleware**: Authentication, validation, and error handling are implemented as middleware

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB
- OAuth credentials (Google, Facebook, LinkedIn) for SSO features

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy the environment variables file and configure it:
   ```
   cp .env.example .env
   ```
4. Configure the environment variables in `.env` with your OAuth credentials and MongoDB connection string

### Running the Application

- Development mode:
  ```
  npm run dev
  ```
- Production mode:
  ```
  npm start
  ```
- Database seeding:
  ```
  npm run seed
  ```

## Testing

### Unit Tests

Run the Jest test suite:
```
npm test
```

Options:
- Watch mode: `npm run test:watch`
- Coverage report: `npm run test:coverage`

### API Testing with Postman

1. Import the Postman collection from the `postman` directory (if available)
2. Set up environment variables in Postman:
   - `baseUrl`: `http://localhost:5000/api`
   - `token`: Store the JWT token after login

### Swagger Documentation

API documentation is available at `/api-docs` when the server is running. This provides interactive documentation for all endpoints.

## Key Features Implemented

### 1. Authentication System

- **Local Authentication**: Email/password registration and login
- **Single Sign-On (SSO)**: Integration with Google, Facebook, and LinkedIn
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Different access levels for customers, lawyers, and admins

### 2. User Management

- User registration and profile management
- Lawyer profiles with specialized fields (qualifications, expertise, rates)
- Password reset functionality

### 3. Notifications System

- User notification creation and management
- Support for different notification types and priorities
- Read status tracking

### 4. API Documentation

- Comprehensive Swagger documentation
- Interactive API testing interface

## Code Structure

```
src/
├── config/              # Configuration files
│   ├── database.js      # MongoDB connection
│   ├── passport.js      # SSO configuration
│   └── swagger.js       # API documentation setup
├── middleware/          # Express middleware
│   ├── auth.js          # Authentication middleware
│   └── validate.js      # Request validation
├── modules/             # Business domain modules
│   ├── users/           # User management
│   ├── services/        # Legal services
│   ├── bookings/        # Appointment booking
│   ├── payments/        # Payment processing
│   └── notifications/   # User notifications
├── utils/               # Utility functions
│   ├── errorHandler.js  # Error handling
│   └── logger.js        # Winston logger
├── app.js               # Express application setup
└── server.js            # Server entry point
```

## Implementation Details

### Notification System

The notification system provides real-time updates to users about various events in the application. It's designed to be flexible and extensible to support different notification types and delivery methods.

#### Notification Model

The `notificationModel.js` includes:

- **userId**: The recipient of the notification
- **title**: Short notification title
- **message**: Detailed notification message
- **type**: Type of notification (e.g., 'booking', 'payment', 'system', 'message')
- **read**: Boolean indicating read status
- **priority**: Priority level ('low', 'medium', 'high')
- **relatedId**: Reference to related entity (e.g., booking ID)
- **relatedModel**: Type of related entity (e.g., 'Booking', 'Payment')
- **actionUrl**: Optional URL for action button
- **icon**: Optional icon identifier

#### Notification Controller Functions

- **createNotification**: Creates a new notification for a user
- **getUserNotifications**: Retrieves notifications for logged-in user with filtering options
- **markAsRead**: Marks a specific notification as read
- **markAllAsRead**: Marks all user notifications as read
- **deleteNotification**: Deletes a specific notification
- **clearAllNotifications**: Clears all notifications for the user

#### Testing the Notification System

1. **Unit Testing**:
   ```
   npm test -- --testPathPattern=notifications
   ```

2. **Manual Testing in Postman**:
   - Create notification: POST `/api/notifications`
   - Get notifications: GET `/api/notifications`
   - Mark as read: PUT `/api/notifications/:id/read`
   - Mark all as read: PUT `/api/notifications/read-all`
   - Delete notification: DELETE `/api/notifications/:id`
   - Clear all: DELETE `/api/notifications`

3. **Testing Different Notification Types**:
   - Booking confirmations
   - Payment receipts
   - System announcements
   - Message notifications

4. **Integration Testing**:
   Verify that notifications are automatically created when:
   - A booking is made
   - A payment is completed
   - A message is received
   - System events occur

### SSO Implementation

The SSO implementation uses Passport.js with the following strategies:
- Google OAuth 2.0
- Facebook OAuth
- LinkedIn OAuth

The integration follows these steps:
1. User initiates authentication via social provider
2. Provider redirects to our callback URL with auth code
3. Our server exchanges code for profile information
4. We create or link user account based on email
5. JWT token is generated and sent to frontend

#### SSO Configuration Setup

1. **Environment Variables**:
   ```
   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   # Facebook OAuth
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   
   # LinkedIn OAuth
   LINKEDIN_CLIENT_ID=your_linkedin_client_id
   LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
   
   # Base URLs
   BASE_URL=http://localhost:5000
   FRONTEND_URL=http://localhost:3000
   ```

2. **Passport Configuration** (`src/config/passport.js`):
   - The application uses a unified approach for all providers through the `findOrCreateUser` helper function
   - This strategy checks for existing users by provider ID or email
   - If a user with the same email exists, the social account is linked to that user
   - If no user exists, a new account is created

3. **User Model SSO Fields**:
   - `googleId`, `facebookId`, `linkedinId`: Store provider-specific IDs
   - `authProvider`: Tracks the authentication source (local, google, facebook, linkedin)
   - Password is optional for social users

4. **Routes**:
   - Authentication initiation: `/api/users/auth/[provider]`
   - Callback endpoints: `/api/users/auth/[provider]/callback`
   - These endpoints are documented in Swagger

#### Testing SSO Integration

1. **Local Testing**:
   - Create OAuth applications in Google, Facebook, and LinkedIn developer consoles
   - Set callback URLs to `http://localhost:5000/api/users/auth/[provider]/callback`
   - Add test users to your social apps if needed (especially for Facebook)

2. **Testing Flow**:
   - Start the application with proper environment variables
   - Visit `/api/users/auth/google` (or facebook/linkedin) in a browser
   - Complete the authentication flow
   - You should be redirected to the frontend with a JWT token

3. **Common Issues**:
   - Callback URL mismatch: Ensure the URLs in your social app settings match exactly
   - Missing permissions: Ensure you've requested the right scopes
   - Email not provided: Some providers may not return email without specific permissions

4. **Debugging**:
   - Set `NODE_ENV=development` to see detailed logs
   - Check network requests in the browser dev tools
   - Verify the token after redirection with JWT debugging tools

### Database Schema

Key models include:
- User: Core user information and authentication
- Lawyer: Extended profile for lawyer users
- Service: Legal services offered
- Booking: Appointments between users and lawyers
- Notification: User notification system

### Error Handling

The application implements a centralized error handling approach with:
- Custom error classes
- Middleware for catching and formatting errors
- Proper HTTP status codes
- Structured error responses

## Deployment Considerations

- Set appropriate environment variables in production
- Ensure MongoDB connection is secure
- Configure proper CORS settings for production
- Use HTTPS in production
- Set up proper OAuth callback URLs

## Future Enhancements

Potential areas for improvement:
- Implement refresh tokens for improved security
- Add email verification flow
- Enhance test coverage
- Add caching layer for high-traffic endpoints
- Implement WebSockets for real-time notifications

## Debugging Tips

- Use Morgan logging in development to see HTTP requests
- Check Winston logs for detailed error information
- Use the `debug` npm package for component-specific debugging
- Test SSO flows with valid credentials in development

## API Security

The API implements several security measures:
- JWT token validation
- Password hashing with bcrypt
- Role-based access control
- Input validation with express-validator
- Protection against common web vulnerabilities

## Contributing Guidelines

When contributing to this project:
1. Follow the established module pattern
2. Write tests for new features
3. Document API endpoints with Swagger annotations
4. Follow the error handling pattern
5. Use async/await for asynchronous operations

## Docker and Deployment

### Docker Setup

The application is containerized using Docker to ensure consistent environments across development, testing, and production. The containerization setup includes:

- **Dockerfile**: Multi-stage build for optimized production images
- **docker-compose.yml**: Orchestrates the application services (API, MongoDB, Redis)
- **.dockerignore**: Excludes unnecessary files from the Docker build context

#### Building and Running with Docker

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# Build specific service
docker-compose build api

# View logs
docker-compose logs -f api
```

#### Docker Environments

The Docker setup supports different environments through profiles:

```bash
# Run development environment with MongoDB Express
docker-compose --profile dev up

# Run production environment
docker-compose up
```

### Production Deployment

#### Prerequisites

Before deploying to production, ensure:

1. All environment variables are properly configured in your deployment environment
2. Security measures are in place (firewall, HTTPS, etc.)
3. Data backup strategies are implemented
4. Monitoring and logging solutions are set up

#### Deployment Options

##### Option 1: Docker Compose (Single Server)

For simple deployments on a single server:

```bash
# Clone the repository
git clone https://github.com/your-org/pocketlegal-backend.git
cd pocketlegal-backend

# Create and configure .env file
cp .env.example .env
nano .env  # Edit with your production values

# Build and start in production mode
docker-compose up -d
```

##### Option 2: Kubernetes (Scalable)

For larger, scalable deployments:

1. Build and push Docker images to a container registry
2. Apply Kubernetes manifests from the `/k8s` directory
3. Set up an ingress controller for traffic routing
4. Configure horizontal pod autoscaling as needed

```bash
# Example commands for Kubernetes deployment
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

##### Option 3: Platform as a Service (PaaS)

For managed deployments without infrastructure overhead:

1. Configure platform-specific deployment settings
2. Set environment variables in the platform's dashboard
3. Connect to managed database services
4. Set up continuous deployment from your repository

#### Health Checks and Monitoring

The application includes built-in health checks accessible at `/health`. This endpoint returns the current status of the application and its dependencies.

Configure your infrastructure to monitor this endpoint and set up alerts for any failures.

#### Backup Strategy

Implement regular database backups:

```bash
# MongoDB backup script example
mongodump --uri="mongodb://username:password@host:port/database" --out=/backup/mongodb/$(date +%Y-%m-%d)

# Set up a cron job for regular backups
0 2 * * * /path/to/backup-script.sh
``` 