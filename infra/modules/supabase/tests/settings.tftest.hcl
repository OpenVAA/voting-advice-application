# The settings the module sends keep their types, and what they hold is hosted-settings.json.
#
# A conditional whose other branch is an empty object makes Terraform unify both branches into a map
# of strings: booleans and numbers then arrive as "true" and "3600", `validate` still passes, and the
# hosted API refuses or misreads the value. The assertions compare the decoded settings with `==`,
# which is type-strict, so a quoted value fails them. The provider is mocked: no run needs
# credentials, state or network beyond `init`.
#
# Run with `terraform -chdir=infra/modules/supabase init -backend=false` and then
# `terraform -chdir=infra/modules/supabase test`.

mock_provider "supabase" {}

variables {
  organization_id   = "example-org"
  project_name      = "example-project"
  region            = "eu-north-1"
  database_password = "unused-placeholder"
  public_origin     = "https://staging.example.org"
}

run "defaults" {
  command = plan

  assert {
    condition = length([
      for k, v in jsondecode(supabase_settings.this.auth) : k
      if try(v == tostring(v), false) && can(regex("^(true|false|-?[0-9]+(\\.[0-9]+)?)$", v))
    ]) == 0
    error_message = "An auth setting holds a quoted boolean or number."
  }

  assert {
    condition = length([
      for k, v in jsondecode(supabase_settings.this.api) : k
      if try(v == tostring(v), false) && can(regex("^(true|false|-?[0-9]+(\\.[0-9]+)?)$", v))
    ]) == 0
    error_message = "An API setting holds a quoted boolean or number."
  }

  assert {
    condition = alltrue([
      for k in ["rate_limit_otp", "rate_limit_verify", "rate_limit_token_refresh", "rate_limit_anonymous_users", "rate_limit_sms_sent", "rate_limit_web3"] :
      try(jsondecode(supabase_settings.this.auth)[k] == tonumber(jsondecode(supabase_settings.this.auth)[k]), false)
    ])
    error_message = "A rate limit is missing or is not a bare number."
  }

  assert {
    condition = length(setintersection(
      keys(jsondecode(supabase_settings.this.auth)),
      ["rate_limit_email_sent", "smtp_host", "smtp_port", "smtp_user", "smtp_admin_email", "smtp_sender_name", "smtp_pass"],
    )) == 0
    error_message = "The mail rate limit or an SMTP key is sent although smtp is null."
  }

  assert {
    condition = alltrue([
      for group in ["auth", "auth_hook", "auth_send_email_hook"] :
      { for k, v in jsondecode(file("${path.module}/hosted-settings.json"))[group] : k => try(jsondecode(supabase_settings.this.auth)[k], null) } == jsondecode(file("${path.module}/hosted-settings.json"))[group]
    ])
    error_message = "A key of the JSON's auth, auth_hook or auth_send_email_hook group is missing from the auth settings or encoded with another value or type."
  }

  assert {
    condition     = jsondecode(supabase_settings.this.api) == jsondecode(file("${path.module}/hosted-settings.json")).api
    error_message = "The API settings are not the JSON's api group, with its values and types."
  }

  assert {
    condition     = jsondecode(supabase_settings.this.auth).site_url == var.public_origin
    error_message = "site_url is not the public origin."
  }

  assert {
    condition     = length(jsondecode(file("${path.module}/hosted-settings.json")).redirect_callback_paths) > 0
    error_message = "The JSON holds no redirect path."
  }

  assert {
    condition = jsondecode(supabase_settings.this.auth).uri_allow_list == join(",", [
      for p in jsondecode(file("${path.module}/hosted-settings.json")).redirect_callback_paths : "${var.public_origin}${p}"
    ])
    error_message = "uri_allow_list is not the public origin joined with each redirect path of the JSON."
  }
}

run "hook_off" {
  command = plan

  variables {
    enable_access_token_hook = false
  }

  assert {
    condition = length([
      for k, v in jsondecode(supabase_settings.this.auth) : k
      if try(v == tostring(v), false) && can(regex("^(true|false|-?[0-9]+(\\.[0-9]+)?)$", v))
    ]) == 0
    error_message = "An auth setting holds a quoted boolean or number."
  }

  assert {
    condition = length(setintersection(
      keys(jsondecode(supabase_settings.this.auth)),
      ["hook_custom_access_token_enabled", "hook_custom_access_token_uri"],
    )) == 0
    error_message = "An access-token hook key is sent although that hook is off."
  }

  assert {
    condition     = jsondecode(supabase_settings.this.auth).hook_send_email_enabled == true && can(jsondecode(supabase_settings.this.auth).hook_send_email_uri)
    error_message = "The send-email hook keys are missing, or its enabled key is not a bare true."
  }
}

run "send_email_hook_off" {
  command = plan

  variables {
    enable_send_email_hook = false
  }

  assert {
    condition = length([
      for k, v in jsondecode(supabase_settings.this.auth) : k
      if try(v == tostring(v), false) && can(regex("^(true|false|-?[0-9]+(\\.[0-9]+)?)$", v))
    ]) == 0
    error_message = "An auth setting holds a quoted boolean or number."
  }

  assert {
    condition = length(setintersection(
      keys(jsondecode(supabase_settings.this.auth)),
      ["hook_send_email_enabled", "hook_send_email_uri"],
    )) == 0
    error_message = "A send-email hook key is sent although that hook is off."
  }

  assert {
    condition     = jsondecode(supabase_settings.this.auth).hook_custom_access_token_enabled == true && can(jsondecode(supabase_settings.this.auth).hook_custom_access_token_uri)
    error_message = "The access-token hook keys are missing, or its enabled key is not a bare true."
  }
}

run "smtp" {
  command = plan

  variables {
    smtp = {
      host        = "smtp.example.org"
      port        = "587"
      user        = "example-user"
      admin_email = "noreply@example.org"
      sender_name = "Example"
    }
  }

  assert {
    condition = length([
      for k, v in jsondecode(supabase_settings.this.auth) : k
      if k != "smtp_port" && try(v == tostring(v), false) && can(regex("^(true|false|-?[0-9]+(\\.[0-9]+)?)$", v))
    ]) == 0
    error_message = "An auth setting other than smtp_port holds a quoted boolean or number."
  }

  assert {
    condition     = try(jsondecode(supabase_settings.this.auth).rate_limit_email_sent == tonumber(jsondecode(supabase_settings.this.auth).rate_limit_email_sent), false)
    error_message = "The mail rate limit is missing or is not a bare number."
  }

  assert {
    condition = alltrue([
      for k in ["smtp_host", "smtp_user", "smtp_admin_email", "smtp_sender_name"] :
      can(jsondecode(supabase_settings.this.auth)[k])
    ])
    error_message = "An SMTP key is missing."
  }

  assert {
    condition     = jsondecode(supabase_settings.this.auth).smtp_port == "587"
    error_message = "smtp_port is missing or is not the string the hosted API takes."
  }

  assert {
    condition     = !contains(keys(jsondecode(supabase_settings.this.auth)), "smtp_pass")
    error_message = "smtp_pass is sent in the main auth settings."
  }
}
