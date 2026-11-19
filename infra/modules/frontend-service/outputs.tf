output "vpc_id" {
  description = "Id of the network."
  value       = aws_vpc.this.id
}

output "public_subnet_ids" {
  description = "Ids of the two public subnets, one per availability zone."
  value       = aws_subnet.public[*].id
}

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer, the target of the origin record."
  value       = aws_lb.this.dns_name
}

output "load_balancer_security_group_id" {
  description = "Id of the load balancer's security group."
  value       = aws_security_group.load_balancer.id
}

output "task_security_group_id" {
  description = "Id of the tasks' security group."
  value       = aws_security_group.task.id
}

output "origin_domain" {
  description = "The name the CDN reaches the load balancer at, covered by the load balancer's certificate."
  value       = local.origin_domain
}

output "cluster_name" {
  description = "Name of the ECS cluster."
  value       = aws_ecs_cluster.this.name
}

output "service_name" {
  description = "Name of the ECS service."
  value       = aws_ecs_service.app.name
}

output "log_group_name" {
  description = "Name of the log group the tasks write to."
  value       = aws_cloudwatch_log_group.app.name
}

output "task_definition_arn" {
  description = "ARN of the task definition revision the service runs."
  value       = aws_ecs_task_definition.app.arn
}

output "container_stop_timeout_seconds" {
  description = "Seconds the task definition gives its container between the stop signal and the kill, as written in the container definition."
  value       = jsondecode(aws_ecs_task_definition.app.container_definitions)[0].stopTimeout
}

output "task_environment_names" {
  description = "Names of the variables the task receives, as values and from the parameter store, after omit_environment."
  value       = [for v in local.kept : v.name]
}

output "origin_verify_header_name" {
  description = "Name of the header that carries the origin secret from the CDN to the load balancer."
  value       = local.origin_header_name
}

output "origin_verify_header_value" {
  description = "The origin secret. Without it the load balancer answers 403."
  value       = random_password.origin_verify.result
  sensitive   = true
}

output "url" {
  description = "The site's public address."
  value       = "https://${var.domain}"
}

output "distribution_id" {
  description = "Id of the CloudFront distribution."
  value       = aws_cloudfront_distribution.this.id
}

output "distribution_domain_name" {
  description = "CloudFront's own name for the distribution, the target of the site's records."
  value       = aws_cloudfront_distribution.this.domain_name
}

output "relay_web_acl_arn" {
  description = "ARN of the relay rate rule's web ACL, aws_wafv2_web_acl.relay; null when relay_rate_limit is unset and no web ACL exists."
  value       = one(aws_wafv2_web_acl.relay[*].arn)
}

output "distribution_web_acl_id" {
  description = "The web ACL the distribution names; null when it names none."
  value       = aws_cloudfront_distribution.this.web_acl_id
}

output "viewer_certificate_arn" {
  description = "ARN of the viewer certificate, in us-east-1."
  value       = aws_acm_certificate_validation.viewer.certificate_arn
}

output "origin_certificate_arn" {
  description = "ARN of the load balancer's certificate, in the root's region."
  value       = aws_acm_certificate_validation.origin.certificate_arn
}

output "deployment_alert_topic_arn" {
  description = "ARN of the topic a failed rollout of the service is published to."
  value       = aws_sns_topic.deployments.arn
}
