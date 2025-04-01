# Pocket Legal Backend Deployment Guide

This document provides instructions for deploying the Pocket Legal backend application in various environments.

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Docker Deployment](#docker-deployment)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [AWS Deployment with Terraform](#aws-deployment-with-terraform)
5. [CI/CD Pipeline Integration](#cicd-pipeline-integration)
6. [Environment Configuration](#environment-configuration)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Troubleshooting](#troubleshooting)

## Local Development Setup

### Prerequisites

- Node.js (v14+)
- MongoDB
- npm or yarn

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/pocketlegal-backend.git
   cd pocketlegal-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env file with your local configuration
   ```

4. Start MongoDB (if not already running):
   ```bash
   mongod --dbpath /path/to/data/directory
   ```

5. Run the application in development mode:
   ```bash
   npm run dev
   ```

## Docker Deployment

### Prerequisites

- Docker
- Docker Compose

### Steps

1. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

2. To view logs:
   ```bash
   docker-compose logs -f api
   ```

3. To stop the application:
   ```bash
   docker-compose down
   ```

4. To rebuild after code changes:
   ```bash
   docker-compose up -d --build
   ```

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (e.g., Minikube, EKS, GKE)
- kubectl configured to access your cluster
- Docker registry for storing images

### Steps

1. Create Kubernetes secrets (don't commit these to version control):
   ```bash
   # Create a file with actual values based on kubernetes/secrets.yaml template
   kubectl create -f path/to/actual-secrets.yaml
   ```

2. Create ConfigMap:
   ```bash
   kubectl apply -f kubernetes/configmap.yaml
   ```

3. Deploy the application:
   ```bash
   kubectl apply -f kubernetes/deployment.yaml
   kubectl apply -f kubernetes/service.yaml
   ```

4. Set up Ingress (if needed):
   ```bash
   kubectl apply -f kubernetes/ingress.yaml
   ```

5. Verify the deployment:
   ```bash
   kubectl get pods
   kubectl get services
   kubectl get ingress
   ```

## AWS Deployment with Terraform

### Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform (v1.0+)
- S3 bucket for Terraform state (optional but recommended)
- DynamoDB table for state locking (optional but recommended)

### Steps

1. Initialize Terraform:
   ```bash
   cd terraform
   terraform init
   ```

2. Create a `terraform.tfvars` file with your specific configuration:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your configuration
   ```

3. Plan the deployment:
   ```bash
   terraform plan -out=tfplan
   ```

4. Apply the configuration:
   ```bash
   terraform apply tfplan
   ```

5. Set up Kubernetes resources after infrastructure is created:
   ```bash
   aws eks update-kubeconfig --region <aws-region> --name <cluster-name>
   kubectl apply -f kubernetes/configmap.yaml
   kubectl apply -f path/to/actual-secrets.yaml
   kubectl apply -f kubernetes/deployment.yaml
   kubectl apply -f kubernetes/service.yaml
   kubectl apply -f kubernetes/ingress.yaml
   ```

6. To destroy the infrastructure when no longer needed:
   ```bash
   terraform destroy
   ```

## CI/CD Pipeline Integration

### GitHub Actions

The project includes a GitHub Actions workflow configuration in `.github/workflows/ci.yml`.

To set it up:

1. Add the following secrets to your GitHub repository:
   - `DOCKERHUB_USERNAME`: Your Docker Hub username
   - `DOCKERHUB_TOKEN`: Docker Hub API token
   - `AWS_ACCESS_KEY_ID`: AWS access key with EKS permissions
   - `AWS_SECRET_ACCESS_KEY`: AWS secret key
   - `AWS_REGION`: The AWS region where your EKS cluster is located

2. Push to the relevant branches to trigger CI/CD:
   - `develop` branch: Deploys to the development environment
   - `main` branch: Deploys to production after testing

### Jenkins

If using Jenkins instead of GitHub Actions:

1. Import the `Jenkinsfile` into your Jenkins instance
2. Configure the necessary credentials in Jenkins
3. Set up a pipeline job pointing to your repository

## Environment Configuration

The application uses environment variables for configuration. Key variables include:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment type | `production`, `development`, `test` |
| `PORT` | API server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://user:pass@host:port/db` |
| `JWT_SECRET` | Secret key for JWT tokens | (random string) |
| `JWT_EXPIRE` | JWT token expiration | `30d` |
| `BASE_URL` | Base URL for the API | `https://api.pocketlegal.com` |
| `FRONTEND_URL` | Frontend application URL | `https://app.pocketlegal.com` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | (from Google Developer Console) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | (from Google Developer Console) |
| `FACEBOOK_APP_ID` | Facebook OAuth app ID | (from Facebook Developer Portal) |
| `FACEBOOK_APP_SECRET` | Facebook OAuth app secret | (from Facebook Developer Portal) |
| `LINKEDIN_CLIENT_ID` | LinkedIn OAuth client ID | (from LinkedIn Developer Portal) |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth client secret | (from LinkedIn Developer Portal) |
| `STRIPE_SECRET_KEY` | Stripe API secret key | (from Stripe Dashboard) |

## Post-Deployment Verification

After deployment, verify the application by:

1. Checking the health endpoint:
   ```bash
   curl https://api.pocketlegal.com/health
   ```

2. Accessing Swagger documentation:
   ```
   https://api.pocketlegal.com/api-docs
   ```

3. Testing authentication:
   ```bash
   curl -X POST https://api.pocketlegal.com/api/users/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}'
   ```

4. Monitoring logs:
   - Kubernetes: `kubectl logs deployment/pocketlegal-backend`
   - Docker: `docker-compose logs -f api`
   - AWS CloudWatch (if configured)

## Troubleshooting

### Common Issues

1. **Database Connection Problems**:
   - Verify network connectivity
   - Check MongoDB credentials
   - Ensure MongoDB is running and accessible

2. **OAuth Integration Issues**:
   - Verify OAuth credentials
   - Check callback URLs match exactly what's configured in provider dashboards
   - Ensure proper scopes are configured

3. **Kubernetes Pod Failures**:
   - Check pod status: `kubectl get pods`
   - View pod logs: `kubectl logs pod-name`
   - Describe pod for events: `kubectl describe pod pod-name`

4. **SSL/TLS Certificate Issues**:
   - Verify certificate generation in ACM
   - Check DNS validation records
   - Ensure Ingress is configured properly

5. **API Access Issues**:
   - Verify CORS settings
   - Check security group/network policies
   - Ensure proper JWT token is being used for authentication 