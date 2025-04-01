provider "aws" {
  region = var.aws_region
}

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }

  backend "s3" {
    bucket         = "pocketlegal-terraform-state"
    key            = "pocketlegal/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "pocketlegal-terraform-locks"
  }
}

# Create VPC for EKS cluster
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 3.0"

  name = "${var.project_name}-vpc"
  cidr = var.vpc_cidr

  azs             = var.availability_zones
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets

  enable_nat_gateway     = true
  single_nat_gateway     = var.environment == "production" ? false : true
  one_nat_gateway_per_az = var.environment == "production" ? true : false
  enable_vpn_gateway     = false

  # Required for EKS
  enable_dns_hostnames = true
  enable_dns_support   = true

  # Tag subnets for EKS
  private_subnet_tags = {
    "kubernetes.io/cluster/${var.project_name}-${var.environment}" = "shared"
    "kubernetes.io/role/internal-elb"                              = "1"
  }

  public_subnet_tags = {
    "kubernetes.io/cluster/${var.project_name}-${var.environment}" = "shared"
    "kubernetes.io/role/elb"                                       = "1"
  }

  tags = var.common_tags
}

# Create EKS cluster
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 18.0"

  cluster_name    = "${var.project_name}-${var.environment}"
  cluster_version = var.kubernetes_version

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  # Worker nodes configuration
  eks_managed_node_groups = {
    main = {
      desired_size = var.node_group_desired_size
      min_size     = var.node_group_min_size
      max_size     = var.node_group_max_size

      instance_types = var.node_group_instance_types
      capacity_type  = var.node_group_capacity_type

      disk_size = 50

      labels = {
        Environment = var.environment
      }

      tags = var.common_tags
    }
  }

  # Enable OIDC provider for AWS IAM roles for service accounts
  enable_irsa = true

  tags = var.common_tags
}

# Set up Amazon DocumentDB (MongoDB-compatible)
resource "aws_docdb_cluster" "pocketlegal_db" {
  cluster_identifier      = "${var.project_name}-${var.environment}-db"
  engine                  = "docdb"
  master_username         = var.db_username
  master_password         = var.db_password
  backup_retention_period = var.environment == "production" ? 7 : 1
  preferred_backup_window = "07:00-09:00"
  skip_final_snapshot     = var.environment == "production" ? false : true
  db_subnet_group_name    = aws_docdb_subnet_group.pocketlegal.name
  vpc_security_group_ids  = [aws_security_group.docdb.id]

  tags = var.common_tags
}

resource "aws_docdb_cluster_instance" "pocketlegal_db_instances" {
  count              = var.db_instance_count
  identifier         = "${var.project_name}-${var.environment}-db-${count.index}"
  cluster_identifier = aws_docdb_cluster.pocketlegal_db.id
  instance_class     = var.db_instance_class

  tags = var.common_tags
}

resource "aws_docdb_subnet_group" "pocketlegal" {
  name       = "${var.project_name}-${var.environment}-db-subnet-group"
  subnet_ids = module.vpc.private_subnets

  tags = var.common_tags
}

resource "aws_security_group" "docdb" {
  name        = "${var.project_name}-${var.environment}-docdb-sg"
  description = "Allow inbound traffic to DocumentDB from EKS cluster"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "Allow traffic from EKS nodes"
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = var.common_tags
}

# Create S3 bucket for file storage
resource "aws_s3_bucket" "pocketlegal_files" {
  bucket = "${var.project_name}-${var.environment}-files"

  tags = var.common_tags
}

resource "aws_s3_bucket_acl" "pocketlegal_files_acl" {
  bucket = aws_s3_bucket.pocketlegal_files.id
  acl    = "private"
}

resource "aws_s3_bucket_versioning" "pocketlegal_files_versioning" {
  bucket = aws_s3_bucket.pocketlegal_files.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "pocketlegal_files_encryption" {
  bucket = aws_s3_bucket.pocketlegal_files.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# IAM role for EKS pods to access S3
module "s3_access_iam_role" {
  source = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"

  role_name = "${var.project_name}-${var.environment}-s3-access"

  oidc_providers = {
    one = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["default:pocketlegal-backend", "default:pocketlegal-backend-sa"]
    }
  }

  role_policy_arns = {
    s3 = aws_iam_policy.s3_access.arn
  }

  tags = var.common_tags
}

resource "aws_iam_policy" "s3_access" {
  name        = "${var.project_name}-${var.environment}-s3-access-policy"
  description = "Policy allowing access to S3 bucket for PocketLegal files"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = [
          aws_s3_bucket.pocketlegal_files.arn,
          "${aws_s3_bucket.pocketlegal_files.arn}/*"
        ]
      }
    ]
  })
}

# Route53 and ACM for DNS and SSL
resource "aws_route53_zone" "pocketlegal" {
  count = var.create_route53_zone ? 1 : 0
  name  = var.domain_name

  tags = var.common_tags
}

resource "aws_acm_certificate" "cert" {
  domain_name       = "api.${var.domain_name}"
  validation_method = "DNS"

  subject_alternative_names = ["*.${var.domain_name}"]

  lifecycle {
    create_before_destroy = true
  }

  tags = var.common_tags
}

# Only create DNS validation records if we're managing the Route53 zone
resource "aws_route53_record" "cert_validation" {
  for_each = var.create_route53_zone ? {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.pocketlegal[0].zone_id
}

# Wait for certificate validation
resource "aws_acm_certificate_validation" "cert" {
  count                   = var.create_route53_zone ? 1 : 0
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# Output important values
output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_id" {
  description = "EKS cluster ID"
  value       = module.eks.cluster_id
}

output "mongodb_connection_string" {
  description = "MongoDB connection string (without credentials)"
  value       = "mongodb://${aws_docdb_cluster.pocketlegal_db.endpoint}:27017/pocketlegal"
  sensitive   = true
}

output "s3_bucket_name" {
  description = "S3 bucket name for file storage"
  value       = aws_s3_bucket.pocketlegal_files.id
}

output "acm_certificate_arn" {
  description = "ARN of the ACM certificate for SSL"
  value       = aws_acm_certificate.cert.arn
} 