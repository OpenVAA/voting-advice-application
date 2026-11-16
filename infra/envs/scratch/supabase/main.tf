# The rehearsal root of the staging Supabase root, on a throwaway project. It uses the same module as
# the persistent project's root, so an import here rehearses that one: key discovery, the first plan,
# the settings apply, the second plan and the destroy refusal are all seen here first. Each rehearsal
# creates a new throwaway project by hand and writes its ref, organisation, name and region into
# terraform.tfvars. The state is local and ignored by Git, and a plan against a state that lacks the
# project imports it rather than creating one. When the rehearsal ends, the operator deletes the
# project in the dashboard and removes this root's state, which holds its settings in clear text.
terraform {
  required_version = ">= 1.10"

  required_providers {
    # Exact: the runbook's stop rules on decoding and import rest on a reading of this version's
    # source. Raise it together with a new reading of those paths.
    supabase = {
      source  = "supabase/supabase"
      version = "= 1.11.0"
    }
  }

  backend "local" {}
}

# The provider reads SUPABASE_ACCESS_TOKEN from the environment of the operator's shell.
provider "supabase" {}

# The project already exists and is only ever imported. Against a state that lacks it, this block
# plans an import instead of a creation, and a ref that names no project fails the plan. Once the
# project is in state, the block plans nothing.
import {
  to = module.supabase.supabase_project.this
  id = var.project_ref
}

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
  smtp_user                = var.smtp_user
  smtp_password            = var.smtp_password
  public_project_id        = var.public_project_id
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

output "managed_function_secret_names" {
  description = "Names of the Edge Function secrets the module sets, sorted; names only."
  value       = module.supabase.managed_function_secret_names
}
