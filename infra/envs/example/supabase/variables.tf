variable "project_ref" {
  description = "Reference of the existing project, as the dashboard shows it. The import block of main.tf imports the project by this ref, so a plan of this root never creates a project."
  type        = string
  nullable    = false
}

variable "organization_id" {
  description = "Slug of the Supabase organisation that owns the project, as an import shows it."
  type        = string
}

variable "project_name" {
  description = "Name of the project, as an import shows it."
  type        = string
}

variable "region" {
  description = "Region of the project, as an import shows it."
  type        = string
}

variable "database_password" {
  description = "Database password, from TF_VAR_database_password. Required by the provider's schema and never sent."
  type        = string
  sensitive   = true
}

variable "public_origin" {
  description = "Public origin of the frontend that signs users in through this project."
  type        = string
}

variable "enable_access_token_hook" {
  description = "Whether the custom access token hook is switched on. Set in terraform.tfvars: there is no default here, so a root that leaves it out fails at plan instead of taking a value no file shows."
  type        = bool
  nullable    = false
}

variable "enable_send_email_hook" {
  description = "Whether the send-email hook is switched on. While it is on, the auth service sends no mail of its own, and the module sends it no SMTP setting, no SMTP credential and no mail rate limit. Set in terraform.tfvars: there is no default here, so a root that leaves it out fails at plan instead of taking a value no file shows."
  type        = bool
  nullable    = false
}

variable "auth_rate_limits" {
  description = "Hosted auth rate limits. Any limit left out, or set to null, takes the module's default: the attributes here carry no default of their own, so the module's are the only ones. rate_limit_email_sent is sent only while smtp is set and enable_send_email_hook is false."
  type = object({
    rate_limit_otp             = optional(number)
    rate_limit_verify          = optional(number)
    rate_limit_token_refresh   = optional(number)
    rate_limit_anonymous_users = optional(number)
    rate_limit_sms_sent        = optional(number)
    rate_limit_web3            = optional(number)
    rate_limit_email_sent      = optional(number)
  })
  default  = {}
  nullable = false
}

variable "smtp" {
  description = "Custom SMTP settings, without the user name and the password, which are smtp_user and smtp_password. They feed the Edge Functions' SMTP_HOST, SMTP_PORT and SMTP_FROM secrets, and the auth service's own SMTP settings only while enable_send_email_hook is false. Null leaves every SMTP setting out of what is sent."
  type = object({
    host        = string
    port        = string
    admin_email = string
    sender_name = string
  })
  default = null
}

variable "smtp_user" {
  description = "SMTP user name, from TF_VAR_smtp_user; for SES, the access key id of the SMTP user, which the dns-mail root's smtp_username output holds. Never written to terraform.tfvars. Used only when smtp is set, and then required: the module refuses a plan with smtp set and no user name. Sent to the Edge Functions as SMTP_USER, and to the auth service only while enable_send_email_hook is false."
  type        = string
  sensitive   = true
  default     = null
}

variable "smtp_password" {
  description = "SMTP password, from TF_VAR_smtp_password. Used only when smtp is set, and then required: the module refuses a plan with smtp set and no password. Sent to the Edge Functions as SMTP_PASS, and to the auth service only while enable_send_email_hook is false."
  type        = string
  sensitive   = true
  default     = null
}

variable "public_project_id" {
  description = "Id of this deployment's project: the same value as the frontend's PUBLIC_PROJECT_ID and the one the bootstrap creates. It is not a secret."
  type        = string
  nullable    = false
}

variable "identity_provider" {
  description = "The non-secret settings of bank authentication: the provider type (signicat-ftn or idura-ftn), the client id, and the provider's jwks_uri and issuer, verbatim from its live openid-configuration. Each equals the AWS root's value of the same setting. Null, the default, sends no identity-provider secret, and identity-callback refuses every call."
  type = object({
    type      = string
    client_id = string
    jwks_uri  = string
    issuer    = string
  })
  default = null
}

variable "identity_provider_decryption_jwks" {
  description = "The private key set that decrypts the provider's ID tokens, from TF_VAR_identity_provider_decryption_jwks. Never written to terraform.tfvars. Used only when identity_provider is set, and then required. Sent to identity-callback as IDENTITY_PROVIDER_DECRYPTION_JWKS; the same value is the frontend task's parameter of that name."
  type        = string
  sensitive   = true
  default     = null
}

variable "identity_callback_server_secret" {
  description = "The secret the frontend server sends to identity-callback, from TF_VAR_identity_callback_server_secret. Never written to terraform.tfvars. Used only when identity_provider is set, and then required, at least 32 characters. Sent to the function as IDENTITY_CALLBACK_SERVER_SECRET; the same value is the frontend task's parameter of that name, which the operator stores once and gives to both roots."
  type        = string
  sensitive   = true
  default     = null
}
