variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "pocketlegal"
}

variable "environment" {
  description = "Environment (development, staging, production)"
  type        = string
  default     = "development"
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones to use"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "private_subnets" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnets" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.24"
}

variable "node_group_desired_size" {
  description = "Desired size of node group"
  type        = number
  default     = 2
}

variable "node_group_min_size" {
  description = "Minimum size of node group"
  type        = number
  default     = 1
}

variable "node_group_max_size" {
  description = "Maximum size of node group"
  type        = number
  default     = 5
}

variable "node_group_instance_types" {
  description = "EC2 instance types for node group"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_group_capacity_type" {
  description = "Capacity type for node group (ON_DEMAND or SPOT)"
  type        = string
  default     = "ON_DEMAND"
  validation {
    condition     = contains(["ON_DEMAND", "SPOT"], var.node_group_capacity_type)
    error_message = "Capacity type must be either ON_DEMAND or SPOT."
  }
}

variable "db_username" {
  description = "Username for DocumentDB"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Password for DocumentDB"
  type        = string
  sensitive   = true
}

variable "db_instance_count" {
  description = "Number of DocumentDB instances"
  type        = number
  default     = 1
}

variable "db_instance_class" {
  description = "Instance class for DocumentDB"
  type        = string
  default     = "db.t3.medium"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "pocketlegal.com"
}

variable "create_route53_zone" {
  description = "Whether to create Route53 zone or use existing one"
  type        = bool
  default     = false
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "PocketLegal"
    ManagedBy   = "Terraform"
    Application = "Backend API"
  }
} 