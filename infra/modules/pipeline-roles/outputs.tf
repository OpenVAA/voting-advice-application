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

output "policy_names" {
  description = "Name of each customer-managed policy the module creates, keyed by its resource name."
  value = {
    tfstate_pipeline      = aws_iam_policy.tfstate_pipeline.name
    ecr_push              = aws_iam_policy.ecr_push.name
    plan_deny             = aws_iam_policy.plan_deny.name
    deploy_alert          = aws_iam_policy.deploy_alert.name
    deploy_network        = aws_iam_policy.deploy_network.name
    deploy_load_balancing = aws_iam_policy.deploy_load_balancing.name
    deploy_ecs            = aws_iam_policy.deploy_ecs.name
    deploy_pass_role      = aws_iam_policy.deploy_pass_role.name
    deploy_edge           = aws_iam_policy.deploy_edge.name
    deploy_dns            = aws_iam_policy.deploy_dns.name
    deploy_observability  = aws_iam_policy.deploy_observability.name
    deploy_scaling        = aws_iam_policy.deploy_scaling.name
  }
}
