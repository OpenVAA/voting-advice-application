variable "project_ref" {
  description = "Reference of the existing project, as the dashboard shows it. The import block of main.tf imports the project by this ref, so a plan of this root never creates a project."
  type        = string
  nullable    = false
}

variable "organization_id" {
  description = "Slug of the Supabase organisation that owns the throwaway project, as an import shows it."
  type        = string
}

variable "project_name" {
  description = "Name of the throwaway project, as an import shows it."
  type        = string
}

variable "region" {
  description = "Region of the throwaway project, as an import shows it."
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
  description = "Whether the send-email hook is switched on. While it is on, the auth service sends no mail of its own. Set in terraform.tfvars: there is no default here, so a root that leaves it out fails at plan instead of taking a value no file shows."
  type        = bool
  nullable    = false
}

variable "auth_rate_limits" {
  description = "Hosted auth rate limits. Any limit left out, or set to null, takes the module's default: the attributes here carry no default of their own, so the module's are the only ones."
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
  description = "Custom SMTP settings for the auth service's own mail, without the user name and the password, which are smtp_user and smtp_password. Null leaves every SMTP setting out of what is sent."
  type = object({
    host        = string
    port        = string
    admin_email = string
    sender_name = string
  })
  default = null
}

variable "smtp_user" {
  description = "SMTP user name, from TF_VAR_smtp_user; for SES, the access key id of the SMTP user, which the dns-mail root's smtp_username output holds. Never written to terraform.tfvars. Used only when smtp is set, and then required: the module refuses a plan with smtp set and no user name."
  type        = string
  sensitive   = true
  default     = null
}

variable "smtp_password" {
  description = "SMTP password, from TF_VAR_smtp_password. Used only when smtp is set, and then required: the module refuses a plan with smtp set and no password."
  type        = string
  sensitive   = true
  default     = null
}

variable "public_project_id" {
  description = "Id of this deployment's project: the same value as the frontend's PUBLIC_PROJECT_ID and the one the bootstrap creates. It is not a secret. Null leaves the Edge Function secrets out."
  type        = string
  default     = null
}
