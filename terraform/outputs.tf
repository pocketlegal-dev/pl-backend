output "eks_cluster_endpoint" {
  description = "Endpoint for the EKS cluster"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_id" {
  description = "EKS cluster ID"
  value       = module.eks.cluster_id
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "eks_cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnets" {
  description = "List of private subnet IDs"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of public subnet IDs"
  value       = module.vpc.public_subnets
}

output "docdb_endpoint" {
  description = "DocumentDB cluster endpoint"
  value       = aws_docdb_cluster.pocketlegal_db.endpoint
}

output "docdb_port" {
  description = "DocumentDB port"
  value       = 27017
}

output "docdb_connection_string_template" {
  description = "DocumentDB connection string (without credentials)"
  value       = "mongodb://<username>:<password>@${aws_docdb_cluster.pocketlegal_db.endpoint}:27017/pocketlegal"
}

output "s3_bucket_name" {
  description = "S3 bucket name for file storage"
  value       = aws_s3_bucket.pocketlegal_files.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.pocketlegal_files.arn
}

output "acm_certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = aws_acm_certificate.cert.arn
}

output "kubernetes_namespace" {
  description = "Kubernetes namespace for the application"
  value       = "${var.project_name}-${var.environment}"
}

output "route53_name_servers" {
  description = "Name servers for the Route53 zone"
  value       = var.create_route53_zone ? aws_route53_zone.pocketlegal[0].name_servers : null
} 