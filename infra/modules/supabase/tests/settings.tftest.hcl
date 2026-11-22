# The settings the module sends keep their types, and what they hold is hosted-settings.json.
#
# A conditional whose other branch is an empty object makes Terraform unify both branches into a map of strings: booleans and numbers then arrive as "true" and "3600", `validate` still passes, and the hosted API refuses or misreads the value. The assertions compare the decoded settings with `==`, which is type-strict, so a quoted value fails them. The provider is mocked: no run needs credentials, state or network beyond `init`.
#
# The SMTP runs cover both sides of the send-email hook: with the hook on, `smtp` configures only the Edge Functions' mail, and no SMTP key, credential or mail rate limit reaches the auth settings; with it off, the auth service's SMTP settings are sent too, the user name and the password through their own settings resource.
#
# The identity-provider runs cover both sides of `identity_provider`: null sends no identity-provider secret, and set sends the six `identity-callback` reads, each with its variable's value.
#
# Run with `terraform -chdir=infra/modules/supabase init -backend=false -lockfile=readonly` and then `terraform -chdir=infra/modules/supabase test`.

mock_provider "supabase" {}

variables {
  organization_id   = "example-org"
  project_name      = "example-project"
  region            = "eu-north-1"
  database_password = "unused-placeholder"
  public_origin     = "https://staging.example.org"
  public_project_id = "00000000-0000-0000-0000-000000000001"
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
    condition     = jsondecode(supabase_settings.this.auth).hook_custom_access_token_enabled == true && jsondecode(supabase_settings.this.auth).hook_send_email_enabled == true
    error_message = "An enabled key of a hook is missing or is not a bare true."
  }

  assert {
    condition     = try(jsondecode(supabase_settings.this.auth).jwt_exp == tonumber(jsondecode(supabase_settings.this.auth).jwt_exp), false)
    error_message = "jwt_exp is missing or is not a bare number."
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
    condition     = length(supabase_settings.smtp_secret) == 0 && sort([for s in supabase_edge_function_secrets.this.secrets : s.name]) == sort(["PUBLIC_PROJECT_ID", "SITE_URL"])
    error_message = "An SMTP credential or an SMTP function secret is sent although smtp is null."
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

  assert {
    condition = length(setintersection(
      keys(jsondecode(supabase_settings.this.auth)),
      ["rate_limit_email_sent", "smtp_host", "smtp_port", "smtp_user", "smtp_admin_email", "smtp_sender_name", "smtp_pass"],
    )) == 0 && length(supabase_settings.smtp_secret) == 0
    error_message = "The mail rate limit or an SMTP key is sent although smtp is null."
  }
}

run "smtp_with_send_email_hook" {
  command = plan

  variables {
    smtp = {
      host        = "smtp.example.org"
      port        = "587"
      admin_email = "noreply@example.org"
      sender_name = "Example"
    }
    smtp_user     = "example-user"
    smtp_password = "unused-placeholder"
  }

  assert {
    condition = length([
      for k, v in jsondecode(supabase_settings.this.auth) : k
      if try(v == tostring(v), false) && can(regex("^(true|false|-?[0-9]+(\\.[0-9]+)?)$", v))
    ]) == 0
    error_message = "An auth setting holds a quoted boolean or number."
  }

  assert {
    condition     = jsondecode(supabase_settings.this.auth).hook_send_email_enabled == true
    error_message = "The send-email hook is not switched on."
  }

  assert {
    condition = length(setintersection(
      keys(jsondecode(supabase_settings.this.auth)),
      ["rate_limit_email_sent", "smtp_host", "smtp_port", "smtp_user", "smtp_admin_email", "smtp_sender_name", "smtp_pass"],
    )) == 0
    error_message = "The mail rate limit or an auth SMTP key is sent although the send-email hook is on."
  }

  assert {
    condition     = length(supabase_settings.smtp_secret) == 0
    error_message = "The SMTP credential is sent to the auth settings although the send-email hook is on."
  }

  assert {
    condition     = sort([for s in supabase_edge_function_secrets.this.secrets : s.name]) == sort(["PUBLIC_PROJECT_ID", "SITE_URL", "SMTP_HOST", "SMTP_PORT", "SMTP_FROM", "SMTP_USER", "SMTP_PASS"])
    error_message = "The Edge Function secrets are not the project id, the site address and the five SMTP secrets."
  }

  assert {
    condition     = output.managed_function_secret_names == sort([for s in supabase_edge_function_secrets.this.secrets : s.name])
    error_message = "managed_function_secret_names does not name the function secrets that are sent."
  }

  assert {
    condition = alltrue([
      for s in supabase_edge_function_secrets.this.secrets :
      nonsensitive(s.value) == lookup({
        PUBLIC_PROJECT_ID = "00000000-0000-0000-0000-000000000001"
        SITE_URL          = "https://staging.example.org"
        SMTP_HOST         = "smtp.example.org"
        SMTP_PORT         = "587"
        SMTP_FROM         = "noreply@example.org"
        SMTP_USER         = "example-user"
        SMTP_PASS         = "unused-placeholder"
      }, s.name, null)
    ])
    error_message = "A function secret does not hold its variable's value."
  }
}

run "smtp_without_send_email_hook" {
  command = plan

  variables {
    enable_send_email_hook = false
    smtp = {
      host        = "smtp.example.org"
      port        = "587"
      admin_email = "noreply@example.org"
      sender_name = "Example"
    }
    smtp_user     = "example-user"
    smtp_password = "unused-placeholder"
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
    condition = (
      try(jsondecode(supabase_settings.this.auth).smtp_host, null) == "smtp.example.org" &&
      try(jsondecode(supabase_settings.this.auth).smtp_admin_email, null) == "noreply@example.org" &&
      try(jsondecode(supabase_settings.this.auth).smtp_sender_name, null) == "Example"
    )
    error_message = "An SMTP key is missing or does not hold the smtp object's value."
  }

  assert {
    condition     = try(jsondecode(supabase_settings.this.auth).smtp_port, null) == "587"
    error_message = "smtp_port is missing or is not the string the hosted API takes."
  }

  assert {
    condition = length(setintersection(
      keys(jsondecode(supabase_settings.this.auth)),
      ["smtp_user", "smtp_pass"],
    )) == 0
    error_message = "smtp_user or smtp_pass is sent in the main auth settings."
  }

  assert {
    condition     = length(supabase_settings.smtp_secret) == 1
    error_message = "The SMTP credential's settings resource is not planned although smtp is set and the send-email hook is off."
  }

  assert {
    condition     = nonsensitive(jsondecode(supabase_settings.smtp_secret[0].auth)) == { smtp_user = "example-user", smtp_pass = "unused-placeholder" }
    error_message = "The SMTP credential's settings resource does not send exactly smtp_user and smtp_pass."
  }
}

run "identity_provider_set" {
  command = plan

  variables {
    identity_provider = {
      type      = "signicat-ftn"
      client_id = "example-client"
      jwks_uri  = "https://example.signicat.com/auth/open/.well-known/openid-configuration/jwks"
      issuer    = "https://example.signicat.com/auth/open"
    }
    identity_provider_decryption_jwks = "[{\"kty\":\"RSA\"}]"
    identity_callback_server_secret   = "0123456789abcdef0123456789abcdef"
  }

  assert {
    condition     = sort([for s in supabase_edge_function_secrets.this.secrets : s.name]) == sort(["PUBLIC_PROJECT_ID", "SITE_URL", "IDENTITY_PROVIDER_TYPE", "IDENTITY_PROVIDER_CLIENT_ID", "IDENTITY_PROVIDER_JWKS_URI", "IDENTITY_PROVIDER_ISSUER", "IDENTITY_PROVIDER_DECRYPTION_JWKS", "IDENTITY_CALLBACK_SERVER_SECRET"])
    error_message = "The Edge Function secrets are not the project id, the site address and the six identity-provider secrets."
  }

  assert {
    condition     = output.managed_function_secret_names == sort([for s in supabase_edge_function_secrets.this.secrets : s.name])
    error_message = "managed_function_secret_names does not name the function secrets that are sent."
  }

  assert {
    condition = alltrue([
      for s in supabase_edge_function_secrets.this.secrets :
      nonsensitive(s.value) == lookup({
        PUBLIC_PROJECT_ID                 = "00000000-0000-0000-0000-000000000001"
        SITE_URL                          = "https://staging.example.org"
        IDENTITY_PROVIDER_TYPE            = "signicat-ftn"
        IDENTITY_PROVIDER_CLIENT_ID       = "example-client"
        IDENTITY_PROVIDER_JWKS_URI        = "https://example.signicat.com/auth/open/.well-known/openid-configuration/jwks"
        IDENTITY_PROVIDER_ISSUER          = "https://example.signicat.com/auth/open"
        IDENTITY_PROVIDER_DECRYPTION_JWKS = "[{\"kty\":\"RSA\"}]"
        IDENTITY_CALLBACK_SERVER_SECRET   = "0123456789abcdef0123456789abcdef"
      }, s.name, null)
    ])
    error_message = "A function secret does not hold its variable's value."
  }
}

run "identity_provider_null_sends_no_identity_provider_secret" {
  command = plan

  variables {
    identity_provider_decryption_jwks = "[{\"kty\":\"RSA\"}]"
    identity_callback_server_secret   = "0123456789abcdef0123456789abcdef"
  }

  assert {
    condition     = length([for s in supabase_edge_function_secrets.this.secrets : s.name if startswith(s.name, "IDENTITY_")]) == 0
    error_message = "An identity-provider secret is sent although identity_provider is null."
  }
}

run "identity_provider_without_its_secrets_fails" {
  command = plan

  variables {
    identity_provider = {
      type      = "idura-ftn"
      client_id = "urn:example:client"
      jwks_uri  = "https://example.idura.broker/.well-known/jwks"
      issuer    = "https://example.idura.broker"
    }
    identity_callback_server_secret = "too-short"
  }

  expect_failures = [var.identity_provider_decryption_jwks, var.identity_callback_server_secret]
}

run "identity_provider_refuses_an_unknown_type" {
  command = plan

  variables {
    identity_provider = {
      type      = "bankid"
      client_id = "example-client"
      jwks_uri  = "https://example.org/jwks"
      issuer    = "https://example.org"
    }
    identity_provider_decryption_jwks = "[]"
    identity_callback_server_secret   = "0123456789abcdef0123456789abcdef"
  }

  expect_failures = [var.identity_provider]
}
