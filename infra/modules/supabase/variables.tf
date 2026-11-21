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
  description = "Whether the send-email hook is switched on and pointed at its database function, which takes every mail the auth service would send and sends none; the application's own function sends the mails. While it is on, the auth service sends no mail of its own, so the SMTP settings and the mail rate limit govern no mail the auth service sends. When false, the hook keys are left out of the settings that are sent, and the hosted value stays as it is. Independent of enable_access_token_hook."
  type        = bool
  default     = true
  nullable    = false
}

variable "auth_rate_limits" {
  description = "Hosted auth rate limits. The numbers are design values for staging: each is the platform default except the mail limit, which is raised from the default of 2 an hour because that is unusable once custom SMTP sends the auth service's mail. The mail limit is sent only together with the SMTP settings; without them it is left out. These limits are not compared with the local configuration, whose limits serve the test suite."
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
  description = "Custom SMTP settings for the auth service's own mail. Null leaves every SMTP setting, and the mail rate limit, out of what is sent. The port is a string because the hosted API takes it as one. The password is the separate smtp_password variable."
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
  description = "SMTP password, taken from TF_VAR_smtp_password in the operator's shell and never written to a tracked file. Used only when smtp is set; it is sent through a settings resource of its own so that the main auth diff stays readable."
  type        = string
  sensitive   = true
  default     = null
}
