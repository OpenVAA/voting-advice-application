# These blocks map each deployment-scoped address onto its key in var.deployments, and the OIDC provider onto the account-wide module that holds it.

moved {
  from = module.github_oidc.aws_iam_openid_connect_provider.github
  to   = module.github_oidc_provider.aws_iam_openid_connect_provider.github
}

moved {
  from = module.github_oidc
  to   = module.github_oidc["staging"]
}

moved {
  from = module.frontend_task_role
  to   = module.frontend_task_role["staging"]
}

moved {
  from = module.registry
  to   = module.registry["staging"]
}
