terraform {
  required_version = "~> 1.16"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.60"
    }
  }

  # The backend is in backend.tf, kept apart so that the first apply can run with local state.
}

provider "aws" {
  region = var.aws_region

  # A shell signed in to any other account is refused before anything is read or changed.
  allowed_account_ids = [var.aws_account_id]

  default_tags {
    tags = {
      Project     = "openvaa"
      Environment = "shared"
      Root        = "bootstrap"
      ManagedBy   = "terraform"
    }
  }
}

# The account-level root. Its account-wide part is what every other root rests on: the bucket their state lives in, the monthly cost budget and the account's GitHub OIDC provider. Its per-deployment part comes from var.deployments: for each entry, the image registry, the execution role of the frontend's ECS task, and the plan and deploy roles GitHub Actions assumes. Every IAM resource of this layer comes from the github_oidc_provider, github_oidc and frontend_task_role modules, and this root is applied by hand only, so no workflow role can create or change IAM. The root declares no resource of its own and reads no other root's state.

locals {
  registry_names      = { for k, d in var.deployments : k => coalesce(d.registry_name, "${var.name_prefix}-${k}-frontend") }
  iam_name_prefixes   = { for k, d in var.deployments : k => coalesce(d.iam_name_prefix, "${var.name_prefix}-${k}") }
  pipeline_state_keys = { for k in keys(var.deployments) : k => "pipeline/${k}/aws/terraform.tfstate" }
}

module "state_bucket" {
  source = "../modules/state-bucket"

  bucket_name = var.state_bucket_name
}

module "budget" {
  source = "../modules/budget"

  name        = "${var.name_prefix}-monthly"
  limit_usd   = var.budget_limit_usd
  alert_email = var.alert_email
}

module "github_oidc_provider" {
  source = "../modules/github-oidc-provider"
}

module "registry" {
  source   = "../modules/registry"
  for_each = var.deployments

  repository_name = local.registry_names[each.key]
}

module "frontend_task_role" {
  source   = "../modules/frontend-task-role"
  for_each = var.deployments

  name_prefix    = var.name_prefix
  iam_path       = var.iam_path
  environment    = each.key
  aws_account_id = var.aws_account_id
  aws_region     = var.aws_region
}

module "github_oidc" {
  source   = "../modules/github-oidc"
  for_each = var.deployments

  name_prefix                = var.name_prefix
  iam_name_prefix            = local.iam_name_prefixes[each.key]
  iam_path                   = var.iam_path
  environment                = each.key
  oidc_provider_arn          = module.github_oidc_provider.oidc_provider_arn
  plan_subjects              = each.value.plan_subjects
  deploy_subjects            = each.value.deploy_subjects
  github_repository_id       = each.value.github_repository_id
  github_repository_owner_id = each.value.github_repository_owner_id
  pipeline_state_key         = local.pipeline_state_keys[each.key]
  state_bucket_arn           = module.state_bucket.bucket_arn
  registry_arn               = module.registry[each.key].repository_arn

  aws_account_id              = var.aws_account_id
  aws_region                  = var.aws_region
  frontend_execution_role_arn = module.frontend_task_role[each.key].execution_role_arn
  hosted_zone_id              = each.value.hosted_zone_id
  domain                      = each.value.domain
}
