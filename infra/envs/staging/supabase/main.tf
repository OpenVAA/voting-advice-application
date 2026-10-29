# The persistent staging Supabase project. The project is created by hand and imported into this
# root; Terraform never creates or deletes it. A plan of this root that shows a destroy or a
# replacement is never applied. This root is applied by hand from an operator's shell, and its state
# key sits under the hand/ prefix, which the pipeline's roles cannot read.
terraform {
  required_version = ">= 1.10"

  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.11"
    }
  }

  # Literal on purpose: no variable, no partial configuration and no -backend-config, so that this
  # root can never be paired with another root's state key. The S3 backend reads AWS credentials
  # from the operator's shell by itself, so this root declares no AWS provider.
  backend "s3" {
    bucket       = "openvaa-tfstate-471112560111"
    key          = "hand/staging/supabase/terraform.tfstate"
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
  description = "Reference of the imported staging project."
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
