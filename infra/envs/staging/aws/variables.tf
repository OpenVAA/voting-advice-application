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

variable "image_tag" {
  description = "Tag of the image the service runs: the full commit SHA the image was built from."
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
