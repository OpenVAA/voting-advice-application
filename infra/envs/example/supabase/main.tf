# A template Supabase root that a forker copies to start a deployment of their own. CI validates
# it; nothing applies it. It has the same wiring as the staging root and differs only in its backend
# and its variable file. In a deployment, the project is created by hand and imported; a plan that
# shows a destroy or a replacement is never applied, and the root is applied by hand from an
# operator's shell with its state key under the hand/ prefix.
terraform {
  required_version = ">= 1.10"

  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.11"
    }
  }

  # Replace the bucket with your own state bucket. The name here is never read, because validation
  # initialises with -backend=false. The S3 backend reads AWS credentials from the operator's shell
  # by itself, so this root declares no AWS provider.
  backend "s3" {
    bucket       = "REPLACE-ME-tfstate"
    key          = "hand/example/supabase/terraform.tfstate"
    region       = "eu-north-1"
    encrypt      = true
    use_lockfile = true
  }
}

# The provider reads SUPABASE_ACCESS_TOKEN from the environment of the operator's shell.
provider "supabase" {}

module "supabase" {
  source = "../../../modules/supabase"

  organization_id          = var.organization_id
  project_name             = var.project_name
  region                   = var.region
  database_password        = var.database_password
  public_origin            = var.public_origin
  enable_access_token_hook = var.enable_access_token_hook
  enable_send_email_hook   = var.enable_send_email_hook
  auth_rate_limits         = var.auth_rate_limits
  smtp                     = var.smtp
  smtp_password            = var.smtp_password
}

output "project_ref" {
  description = "Reference of the imported project."
  value       = module.supabase.project_ref
}

output "managed_auth_keys" {
  description = "Names of the auth settings the module sends, sorted."
  value       = module.supabase.managed_auth_keys
}

output "managed_api_keys" {
  description = "Names of the API settings the module sends, sorted."
  value       = module.supabase.managed_api_keys
}
