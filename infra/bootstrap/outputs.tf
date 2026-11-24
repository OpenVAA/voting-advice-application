# None of these is a secret. The operator copies them into the repository's variables and into the other roots after the apply.

output "state_bucket_name" {
  description = "Name of the bucket that holds the Terraform state of every root."
  value       = module.state_bucket.bucket_name
}

output "oidc_provider_arn" {
  description = "ARN of the account's GitHub OIDC provider."
  value       = module.github_oidc_provider.oidc_provider_arn
}

output "budget_name" {
  description = "Name of the monthly cost budget."
  value       = module.budget.budget_name
}

output "deployments" {
  description = "Per deployment, keyed as var.deployments: the plan and deploy roles' ARNs and names, the image repository's URL (the image name when pushing and pulling) and ARN, and the ARN of the frontend task's execution role, the value the deployment's AWS root takes as execution_role_arn."
  value = {
    for k in keys(var.deployments) : k => {
      plan_role_arn               = module.github_oidc[k].plan_role_arn
      plan_role_name              = module.github_oidc[k].plan_role_name
      deploy_role_arn             = module.github_oidc[k].deploy_role_arn
      deploy_role_name            = module.github_oidc[k].deploy_role_name
      registry_url                = module.registry[k].repository_url
      registry_arn                = module.registry[k].repository_arn
      frontend_execution_role_arn = module.frontend_task_role[k].execution_role_arn
    }
  }
}
