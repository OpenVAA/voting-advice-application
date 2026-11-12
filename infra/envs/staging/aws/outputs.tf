# Read with terraform output after an apply. Only the origin secret is sensitive; read it with
# terraform output -raw in the shell that needs it and never write it to a file.

output "vpc_id" {
  description = "Id of the network."
  value       = module.frontend.vpc_id
}

output "public_subnet_ids" {
  description = "Ids of the two public subnets, one per availability zone."
  value       = module.frontend.public_subnet_ids
}

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer, the target of the origin record."
  value       = module.frontend.load_balancer_dns_name
}

output "load_balancer_security_group_id" {
  description = "Id of the load balancer's security group."
  value       = module.frontend.load_balancer_security_group_id
}

output "task_security_group_id" {
  description = "Id of the tasks' security group."
  value       = module.frontend.task_security_group_id
}

output "origin_domain" {
  description = "The name the CDN reaches the load balancer at."
  value       = module.frontend.origin_domain
}

output "cluster_name" {
  description = "Name of the ECS cluster."
  value       = module.frontend.cluster_name
}

output "service_name" {
  description = "Name of the ECS service."
  value       = module.frontend.service_name
}

output "log_group_name" {
  description = "Name of the log group the tasks write to."
  value       = module.frontend.log_group_name
}

output "task_definition_arn" {
  description = "ARN of the task definition revision the service runs."
  value       = module.frontend.task_definition_arn
}

output "task_environment_names" {
  description = "Names of the variables the task receives, after omit_environment."
  value       = module.frontend.task_environment_names
}

output "origin_verify_header_name" {
  description = "Name of the header that carries the origin secret from the CDN to the load balancer."
  value       = module.frontend.origin_verify_header_name
}

output "origin_verify_header_value" {
  description = "The origin secret. Without it the load balancer answers 403."
  value       = module.frontend.origin_verify_header_value
  sensitive   = true
}
