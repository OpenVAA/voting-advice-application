# Settings faults for the conformance probe's red run. This file exists only in the throwaway project's root. It plants faults only when `-var fault_set=...` is given on the command line, never from terraform.tfvars; with the default, `none`, it plans nothing.
#
# `redirect` plants the site address and the redirect list alone, so the account-access function's refusal of a redirect can be seen while sign-up stays closed. `all` plants every settings fault.
#
# The revert is an apply with `fault_set` back to `none` and the module's settings resource replaced (`-replace=module.supabase.supabase_settings.this`): destroying the resource below changes nothing on the project, so only the replaced module resource sends the correct values again.

variable "fault_set" {
  description = "Which settings faults to plant on the throwaway project: none, redirect or all. Given on the command line only."
  type        = string
  default     = "none"
  nullable    = false

  validation {
    condition     = contains(["none", "redirect", "all"], var.fault_set)
    error_message = "fault_set must be none, redirect or all."
  }
}

# Each value keeps its JSON type: numbers and booleans are bare, and each object is encoded on its own before a conditional picks between the encoded strings.
locals {
  fault_auth_redirect = {
    site_url       = "https://planted.invalid"
    uri_allow_list = "https://planted.invalid/api/auth/callback"
  }

  fault_auth_all = {
    site_url                         = "https://planted.invalid"
    uri_allow_list                   = "https://planted.invalid/api/auth/callback"
    hook_custom_access_token_enabled = false
    hook_send_email_enabled          = false
    disable_signup                   = false
    mailer_autoconfirm               = true
    smtp_port                        = "2465"
    # The hosted API refuses the two OAuth server flags without the authorization path.
    oauth_server_enabled                    = true
    oauth_server_allow_dynamic_registration = true
    oauth_server_authorization_path         = "/oauth/consent"
    password_min_length                     = 12
  }

  fault_api_all = {
    max_rows  = 500
    db_schema = "public"
  }
}

resource "supabase_settings" "faults" {
  count      = var.fault_set == "none" ? 0 : 1
  depends_on = [module.supabase]

  project_ref = module.supabase.project_ref
  auth        = var.fault_set == "all" ? jsonencode(local.fault_auth_all) : jsonencode(local.fault_auth_redirect)
  api         = var.fault_set == "all" ? jsonencode(local.fault_api_all) : null
}
