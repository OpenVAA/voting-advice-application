variable "name" {
  description = "Name of the budget."
  type        = string
}

variable "limit_usd" {
  description = "Monthly cost limit in US dollars."
  type        = number
}

variable "alert_email" {
  description = "Address the budget alerts are mailed to. Give it per session as TF_VAR_alert_email; it is never written to a tracked file, because the repository is public."
  type        = string
  sensitive   = true
}

variable "include_credits" {
  description = "Whether credits and refunds are netted against cost. Off by default, so that the alerts follow usage on an account that runs on credits."
  type        = bool
  default     = false
}
