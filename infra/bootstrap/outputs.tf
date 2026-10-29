# None of these is a secret. The operator copies them into the repository's variables and into the
# other roots after the apply.

output "state_bucket_name" {
  description = "Name of the bucket that holds the Terraform state of every root."
  value       = module.state_bucket.bucket_name
}

output "registry_url" {
  description = "URL of the image repository, used as the image name when pushing and pulling."
  value       = module.registry.repository_url
}

output "registry_arn" {
  description = "ARN of the image repository."
  value       = module.registry.repository_arn
}

output "oidc_provider_arn" {
  description = "ARN of the GitHub OIDC provider."
  value       = module.github_oidc.oidc_provider_arn
}

output "plan_role_arn" {
  description = "ARN of the read-only plan role."
  value       = module.github_oidc.plan_role_arn
}

output "plan_role_name" {
  description = "Name of the read-only plan role."
  value       = module.github_oidc.plan_role_name
}

output "deploy_role_arn" {
  description = "ARN of the deploy role."
  value       = module.github_oidc.deploy_role_arn
}

output "deploy_role_name" {
  description = "Name of the deploy role."
  value       = module.github_oidc.deploy_role_name
}

output "budget_name" {
  description = "Name of the monthly cost budget."
  value       = module.budget.budget_name
}
