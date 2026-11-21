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
  description = "Whether the custom access token hook is switched on."
  type        = bool
  default     = true
}

variable "enable_send_email_hook" {
  description = "Whether the send-email hook is switched on. While it is on, the auth service sends no mail of its own."
  type        = bool
  default     = true
}
