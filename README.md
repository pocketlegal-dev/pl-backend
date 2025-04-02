# Pocket Legal API

A comprehensive backend API system for the Pocket Legal application, providing legal services and document management.

## Features

- **User Management**: Authentication, registration, SSO integration
- **Document Management**: Upload, version control, sharing capabilities
- **Payment Processing**: Secure payment gateway integration
- **Notification System**: Real-time alerts and email notifications
- **API Documentation**: Swagger UI integrated documentation
- **Security**: Rate limiting, JWT authentication, data validation

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Caching**: Redis
- **Authentication**: JWT, OAuth (Google, Facebook, LinkedIn)
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker, Docker Compose
- **Testing**: Jest

## Getting Started

### Prerequisites

- Node.js v16 or higher
- Docker and Docker Compose
- MongoDB (local or remote)
- Redis (for rate limiting and caching)

### Installation

#### Option 1: Local Development

```bash
# Clone the repository
git clone https://github.com/your-org/pocketlegal-backend.git
cd pocketlegal-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env file with your configuration

# Start development server
npm run dev
```

#### Option 2: Docker Development

```bash
# Clone the repository
git clone https://github.com/your-org/pocketlegal-backend.git
cd pocketlegal-backend

# Set up environment variables
cp .env.example .env
# Edit .env file with your configuration

# Start services with Docker Compose
docker-compose --profile dev up -d
```

### API Documentation

Once the server is running, access the API documentation at:

```
http://localhost:5000/api-docs
```

## Deployment

### Production Deployment with Docker

```bash
# Clone the repository
git clone https://github.com/your-org/pocketlegal-backend.git
cd pocketlegal-backend

# Set up environment variables
cp .env.example .env
# Edit .env file with production values

# Deploy with Docker Compose
docker-compose up -d
```

### Health Check

Test if the application is running correctly:

```bash
curl http://localhost:5000/health
```

## Scripts

- `npm run dev`: Start development server with hot reload
- `npm start`: Start production server
- `npm test`: Run all tests
- `npm run test:watch`: Run tests in watch mode
- `npm run seed`: Seed the database with initial data
- `npm run lint`: Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Documentation

Detailed documentation for developers can be found in [DEVELOPER_DOCS.md](DEVELOPER_DOCS.md). 


<!-- hiii -->