variable "aws_account_id" {
  description = "The AWS account this root may act on. The provider refuses credentials for any other account."
  type        = string
}

variable "aws_region" {
  description = "The AWS region of the resources of this root."
  type        = string
}

variable "environment" {
  description = "The environment name, applied to every resource as the Environment tag."
  type        = string
}

variable "name_prefix" {
  description = "Prefix of every resource name, joined with the environment name."
  type        = string
}

variable "domain" {
  description = "The domain the deployment serves, the name of the public hosted zone of the dns-mail root. The origin is served at origin.<domain>."
  type        = string
}

variable "registry_url" {
  description = "URL of the image repository the bootstrap root creates, without a tag."
  type        = string
}

variable "image_digest" {
  description = "Digest of the image the service runs. Given per plan as -var image_digest=, never written to terraform.tfvars: the pipeline passes the digest it pushed, a hand plan the digest the service runs now."
  type        = string
}

variable "execution_role_arn" {
  description = "ARN of the frontend's execution role, which the bootstrap root creates and outputs as frontend_execution_role_arn."
  type        = string
}

variable "parameter_path" {
  description = "Path in the parameter store under which the task reads the entries of the module's task-environment.json whose source is \"parameter\"."
  type        = string
}

variable "environment_values" {
  description = "The value of every entry of the module's task-environment.json whose source is \"value\", by name."
  type        = map(string)
}

variable "environment_overrides" {
  description = "Values that replace entries of environment_values for one observation. Given on the command line for that apply and never in terraform.tfvars."
  type        = map(string)
  default     = {}
}

variable "omit_environment" {
  description = "Names of task-environment.json entries the task does not receive, for one observation of a rollout with a variable missing. Given on the command line for that apply and never in terraform.tfvars."
  type        = list(string)
  default     = []
}

variable "identity_provider_type" {
  description = "The identity provider of bank authentication, signicat-ftn or idura-ftn, or null, the default, for none. Set, the task receives the entries of the module's task-environment.json that name it: their values in environment_values, and their parameters created under parameter_path before the apply. The Supabase root of the same deployment then sets identity_provider with the same values."
  type        = string
  default     = null
}

variable "task_cpu" {
  description = "CPU units of one task."
  type        = number
}

variable "task_memory" {
  description = "Memory of one task, in MiB."
  type        = number
}

variable "task_floor" {
  description = "Number of tasks the service starts with."
  type        = number
}

variable "log_retention_days" {
  description = "Days the task's log lines are kept."
  type        = number
}

variable "debug_ingress_cidrs" {
  description = "Single IPv4 addresses, as /32 blocks, that may reach the load balancer directly during one observation from outside the CDN. Given on the command line for that apply and never in terraform.tfvars."
  type        = list(string)
  default     = []
}

variable "task_ceiling" {
  description = "Most tasks the service's scaling may run."
  type        = number
}

variable "relay_rate_limit" {
  description = "Opt-in rate rule on /api/usage at the CDN, as limit requests per window_seconds per viewer address. Null, the default, creates no web ACL; what switching it on needs and costs is stated on the frontend-service module's variable of the same name."
  type = object({
    limit          = number
    window_seconds = number
  })
  default  = null
  nullable = true
}

variable "stop_timeout_seconds" {
  description = "Seconds between the stop signal and the kill of the container. The bound it must meet, relative to SHUTDOWN_TIMEOUT, is stated on the frontend-service module's variable of the same name."
  type        = number
  default     = 30
}

variable "scheduled_floor_changes" {
  description = "Timed changes of the scaling bounds, one scheduled action each. Given on the command line for a timed observation, or written in terraform.tfvars ahead of a known peak."
  type = list(object({
    name         = string
    schedule     = string
    min_capacity = number
    max_capacity = number
  }))
  default = []
}

variable "alert_email" {
  description = "Address the deployment alert is mailed to. Given as TF_VAR_alert_email, and never in terraform.tfvars unless it is a role address that may be public."
  type        = string
  sensitive   = true
}
