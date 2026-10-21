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
  description = "Whether the custom access token hook is switched on."
  type        = bool
  default     = true
}

variable "enable_send_email_hook" {
  description = "Whether the send-email hook is switched on. While it is on, the auth service sends no mail of its own."
  type        = bool
  default     = true
}

variable "auth_rate_limits" {
  description = "Hosted auth rate limits. Any limit left out takes the module's default."
  type = object({
    rate_limit_otp             = optional(number, 30)
    rate_limit_verify          = optional(number, 30)
    rate_limit_token_refresh   = optional(number, 150)
    rate_limit_anonymous_users = optional(number, 30)
    rate_limit_sms_sent        = optional(number, 30)
    rate_limit_web3            = optional(number, 30)
    rate_limit_email_sent      = optional(number, 100)
  })
  default = {}
}

variable "smtp" {
  description = "Custom SMTP settings for the auth service's own mail. Null leaves every SMTP setting out of what is sent."
  type = object({
    host        = string
    port        = string
    user        = string
    admin_email = string
    sender_name = string
  })
  default = null
}

variable "smtp_password" {
  description = "SMTP password, from TF_VAR_smtp_password. Used only when smtp is set."
  type        = string
  sensitive   = true
  default     = null
}
