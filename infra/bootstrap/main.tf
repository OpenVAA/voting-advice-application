terraform {
  required_version = ">= 1.10"

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

# The account-level root. It holds what every other root rests on: the bucket their state lives in,
# the image registry, the monthly cost budget, and the OIDC trust with the two roles GitHub Actions
# assumes. Every IAM resource of this layer comes from the github_oidc module, and this root is
# applied by hand only, so no workflow role can create or change IAM. The root declares no resource
# of its own and reads no other root's state.

module "state_bucket" {
  source = "../modules/state-bucket"

  bucket_name = var.state_bucket_name
}

module "registry" {
  source = "../modules/registry"

  repository_name = var.registry_name
}

module "budget" {
  source = "../modules/budget"

  name        = "${var.name_prefix}-monthly"
  limit_usd   = var.budget_limit_usd
  alert_email = var.alert_email
}

module "github_oidc" {
  source = "../modules/github-oidc"

  name_prefix                = var.name_prefix
  iam_path                   = var.iam_path
  environment                = var.deploy_environment
  plan_subjects              = var.plan_subjects
  deploy_subjects            = var.deploy_subjects
  github_repository_id       = var.github_repository_id
  github_repository_owner_id = var.github_repository_owner_id
  pipeline_state_key         = var.pipeline_state_key
  state_bucket_arn           = module.state_bucket.bucket_arn
  registry_arn               = module.registry.repository_arn
}
