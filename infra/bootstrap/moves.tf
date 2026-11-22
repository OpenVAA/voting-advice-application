# These blocks map each deployment-scoped address onto its key in var.deployments, the OIDC provider onto the account-wide module that holds it, and the roles onto the pipeline_roles module. Terraform chains the two moves of the roles, so a state at module.github_oidc and one at module.github_oidc["staging"] both reach module.pipeline_roles["staging"].

moved {
  from = module.github_oidc.aws_iam_openid_connect_provider.github
  to   = module.github_oidc_provider.aws_iam_openid_connect_provider.github
}

moved {
  from = module.github_oidc
  to   = module.github_oidc["staging"]
}

moved {
  from = module.github_oidc["staging"]
  to   = module.pipeline_roles["staging"]
}

moved {
  from = module.frontend_task_role
  to   = module.frontend_task_role["staging"]
}

moved {
  from = module.registry
  to   = module.registry["staging"]
}
