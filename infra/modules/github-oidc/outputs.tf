output "oidc_provider_arn" {
  description = "ARN of the GitHub OIDC provider."
  value       = aws_iam_openid_connect_provider.github.arn
}

output "plan_role_arn" {
  description = "ARN of the read-only plan role."
  value       = aws_iam_role.plan.arn
}

output "plan_role_name" {
  description = "Name of the read-only plan role."
  value       = aws_iam_role.plan.name
}

output "deploy_role_arn" {
  description = "ARN of the deploy role."
  value       = aws_iam_role.deploy.arn
}

output "deploy_role_name" {
  description = "Name of the deploy role."
  value       = aws_iam_role.deploy.name
}
