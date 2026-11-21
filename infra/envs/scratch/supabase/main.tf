# The throwaway Supabase project. This root uses the same module as the persistent project's root, so
# an import here rehearses that one: key discovery, the first plan, the settings apply, the second
# plan and the destroy refusal are all seen here first. Its state is local and ignored by Git. The
# root is removed once the throwaway project is deleted.
terraform {
  required_version = ">= 1.10"

  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.11"
    }
  }

  backend "local" {}
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
}

output "project_ref" {
  description = "Reference of the imported throwaway project."
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
