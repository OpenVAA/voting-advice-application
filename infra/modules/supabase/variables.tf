variable "organization_id" {
  description = "Slug of the Supabase organisation that owns the project. Use the value an import of the project shows. A wrong value never plans a replacement of the project: the provider refuses the update, so the apply fails."
  type        = string
}

variable "project_name" {
  description = "Name of the Supabase project. Use the value an import of the project shows. A wrong value never plans a replacement; it plans a rename, so read the plan before applying it."
  type        = string
}

variable "region" {
  description = "Region of the Supabase project. Use the value an import of the project shows. A wrong value never plans a replacement of the project: the provider refuses the update, so the apply fails."
  type        = string
}

variable "database_password" {
  description = "Database password of the project. Required by the provider's schema and taken from TF_VAR_database_password in the operator's shell. It is never sent: the project resource ignores changes to it, so an import followed by an apply leaves the live password alone."
  type        = string
  sensitive   = true
}

variable "public_origin" {
  description = "Public origin of the frontend that signs users in through this project, for example https://staging.example.org. The auth site address is this origin, and each allowed redirect is this origin followed by one of the callback paths in hosted-settings.json."
  type        = string

  validation {
    condition     = can(regex("^https://[^/?#\\s]+$", var.public_origin))
    error_message = "public_origin must start with https:// and hold only a host (and an optional port): no path, no query and no trailing slash."
  }
}

variable "enable_access_token_hook" {
  description = "Whether the custom access token hook is switched on and pointed at its database function. When false, the hook keys are left out of the settings that are sent, and the hosted value stays as it is."
  type        = bool
  default     = true
  nullable    = false
}

variable "enable_send_email_hook" {
  description = "Whether the send-email hook is switched on and pointed at its database function, which takes every mail the auth service would send and sends none; the application's own function sends the mails. While it is on, the auth service sends no mail of its own, so the auth service's SMTP settings, the SMTP user name and password, and the mail rate limit are not sent to it (their hosted values stay as they are), while smtp, smtp_user and smtp_password still configure the Edge Functions' mail. When false, the hook keys are left out of the settings that are sent (the hosted value stays as it is), and the auth service's SMTP settings are sent whenever smtp is set. Independent of enable_access_token_hook."
  type        = bool
  default     = true
  nullable    = false
}

variable "auth_rate_limits" {
  description = "Hosted auth rate limits. The numbers are design values for staging: each is the platform default except the mail limit, which is raised from the default of 2 an hour because that is unusable once custom SMTP sends the auth service's mail. The mail limit is sent only together with the auth service's SMTP settings, that is while smtp is set and enable_send_email_hook is false; otherwise it is left out. These limits are not compared with the local configuration, whose limits serve the test suite."
  type = object({
    rate_limit_otp             = optional(number, 30)
    rate_limit_verify          = optional(number, 30)
    rate_limit_token_refresh   = optional(number, 150)
    rate_limit_anonymous_users = optional(number, 30)
    rate_limit_sms_sent        = optional(number, 30)
    rate_limit_web3            = optional(number, 30)
    rate_limit_email_sent      = optional(number, 100)
  })
  default  = {}
  nullable = false
}

variable "smtp" {
  description = "Custom SMTP settings. They are sent to the Edge Functions as their SMTP_HOST, SMTP_PORT and SMTP_FROM secrets, and to the auth service's own SMTP settings only while enable_send_email_hook is false: with the hook on, the auth service sends no mail of its own. Null leaves every SMTP setting, the functions' SMTP secrets and the mail rate limit out of what is sent. The port is a string because the hosted API takes it as one. The user name and the password are the separate smtp_user and smtp_password variables."
  type = object({
    host        = string
    port        = string
    admin_email = string
    sender_name = string
  })
  default = null
}

variable "smtp_user" {
  description = "SMTP user name, taken from TF_VAR_smtp_user in the operator's shell and never written to a tracked file. For SES it is the access key id of the SMTP user, half of the mail credential. Used only when smtp is set, and then required. It is sent to the Edge Functions as SMTP_USER and, only while enable_send_email_hook is false, to the auth service with the password through the settings resource of its own, so it appears in no plan diff and in no tracked file."
  type        = string
  sensitive   = true
  default     = null

  validation {
    condition     = var.smtp == null || (var.smtp_user != null && var.smtp_user != "")
    error_message = "smtp is set, so smtp_user must be set too: export TF_VAR_smtp_user in the shell that plans."
  }
}

variable "smtp_password" {
  description = "SMTP password, taken from TF_VAR_smtp_password in the operator's shell and never written to a tracked file. Used only when smtp is set, and then required: a plan with smtp set and no password fails. It is sent to the Edge Functions as SMTP_PASS and, only while enable_send_email_hook is false, to the auth service through a settings resource of its own so that the main auth diff stays readable."
  type        = string
  sensitive   = true
  default     = null

  # The plan masks the value, so a missing password would otherwise be sent as null unseen.
  validation {
    condition     = var.smtp == null || (var.smtp_password != null && var.smtp_password != "")
    error_message = "smtp is set, so smtp_password must be set too: export TF_VAR_smtp_password in the shell that plans."
  }
}

variable "public_project_id" {
  description = "Id of the project the bootstrap creates, which the Edge Functions and the frontend are scoped to. It is sent to the functions as PUBLIC_PROJECT_ID."
  type        = string
  nullable    = false

  validation {
    condition     = can(regex("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", var.public_project_id))
    error_message = "public_project_id must be a lower-case canonical uuid, such as 00000000-0000-0000-0000-000000000001."
  }
}

variable "identity_provider" {
  description = "The non-secret settings of bank authentication, which identity-callback reads: the provider type, signicat-ftn or idura-ftn, the client id the token's audience must be, the URL of the provider's signing key set and its issuer, the last two verbatim from its live openid-configuration. Sent to the function as IDENTITY_PROVIDER_TYPE, IDENTITY_PROVIDER_CLIENT_ID, IDENTITY_PROVIDER_JWKS_URI and IDENTITY_PROVIDER_ISSUER, with the two secrets identity_provider_decryption_jwks and identity_callback_server_secret. Each must equal the frontend task's value of the same name, PUBLIC_IDENTITY_PROVIDER_TYPE and PUBLIC_IDENTITY_PROVIDER_CLIENT_ID for the first two. Null, the default, sends no identity-provider secret, and identity-callback refuses every call."
  type = object({
    type      = string
    client_id = string
    jwks_uri  = string
    issuer    = string
  })
  default = null

  validation {
    condition     = var.identity_provider == null || contains(["signicat-ftn", "idura-ftn"], try(var.identity_provider.type, ""))
    error_message = "identity_provider.type must be signicat-ftn or idura-ftn."
  }

  validation {
    condition     = var.identity_provider == null || (startswith(try(var.identity_provider.jwks_uri, ""), "https://") && startswith(try(var.identity_provider.issuer, ""), "https://") && try(var.identity_provider.client_id, "") != "")
    error_message = "identity_provider needs a client_id, and a jwks_uri and an issuer that start with https://."
  }
}

variable "identity_provider_decryption_jwks" {
  description = "The private key set, a JSON array, that decrypts the identity provider's encrypted ID tokens, taken from TF_VAR_identity_provider_decryption_jwks in the operator's shell and never written to a tracked file. Used only when identity_provider is set, and then required. Sent to identity-callback as IDENTITY_PROVIDER_DECRYPTION_JWKS; the frontend task reads the same value from its parameter of that name."
  type        = string
  sensitive   = true
  default     = null

  validation {
    condition     = var.identity_provider == null || (var.identity_provider_decryption_jwks != null && var.identity_provider_decryption_jwks != "")
    error_message = "identity_provider is set, so identity_provider_decryption_jwks must be set too: export TF_VAR_identity_provider_decryption_jwks in the shell that plans."
  }
}

variable "identity_callback_server_secret" {
  description = "The secret the frontend server sends to identity-callback, taken from TF_VAR_identity_callback_server_secret in the operator's shell and never written to a tracked file. Used only when identity_provider is set, and then required. Sent to the function as IDENTITY_CALLBACK_SERVER_SECRET. The operator generates it once (for example openssl rand -hex 32), stores it as the frontend task's IDENTITY_CALLBACK_SERVER_SECRET parameter, and passes the same value here: no root reads the other's."
  type        = string
  sensitive   = true
  default     = null

  validation {
    condition     = var.identity_provider == null || (var.identity_callback_server_secret != null && length(coalesce(var.identity_callback_server_secret, "")) >= 32)
    error_message = "identity_provider is set, so identity_callback_server_secret must be set too, at least 32 characters: export TF_VAR_identity_callback_server_secret in the shell that plans."
  }
}
