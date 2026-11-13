variable "name_prefix" {
  description = "Prefix of every role and policy name the module creates."
  type        = string
}

variable "iam_path" {
  description = "IAM path of the roles and the customer-managed policies."
  type        = string
  default     = "/openvaa/"
}

variable "environment" {
  description = "Name of the GitHub Environment the deploy role is bound to. It also names the deploy role and its state policy."
  type        = string
}

variable "plan_subjects" {
  description = "Exact OIDC subjects allowed to assume the plan role, for example \"repo:OWNER/REPO:pull_request\". Wildcards are refused."
  type        = list(string)

  validation {
    condition = length(var.plan_subjects) > 0 && alltrue([
      for s in var.plan_subjects : startswith(s, "repo:") && !strcontains(s, "*") && !strcontains(s, "?")
    ])
    error_message = "plan_subjects must hold at least one subject, every subject must start with \"repo:\", and none may contain \"*\" or \"?\"."
  }
}

variable "deploy_subjects" {
  description = "Exact OIDC subjects allowed to assume the deploy role, for example \"repo:OWNER/REPO:environment:staging\". Wildcards are refused."
  type        = list(string)

  validation {
    condition = length(var.deploy_subjects) > 0 && alltrue([
      for s in var.deploy_subjects : startswith(s, "repo:") && !strcontains(s, "*") && !strcontains(s, "?")
    ])
    error_message = "deploy_subjects must hold at least one subject, every subject must start with \"repo:\", and none may contain \"*\" or \"?\"."
  }
}

variable "github_repository_id" {
  description = "Numeric id of the GitHub repository. When set, both trust policies also require an exact match on the token's repository_id claim, which survives a rename."
  type        = string
  default     = null
}

variable "github_repository_owner_id" {
  description = "Numeric id of the GitHub repository's owner. When set, both trust policies also require an exact match on the token's repository_owner_id claim."
  type        = string
  default     = null
}

variable "state_bucket_arn" {
  description = "ARN of the bucket that holds the Terraform state of every root."
  type        = string
}

variable "pipeline_state_key" {
  description = "State key of the one root the pipeline applies, for example \"pipeline/staging/aws/terraform.tfstate\". The deploy role reaches this key and its lock object and no other."
  type        = string
}

variable "hand_state_prefix" {
  description = "Key prefix under which every hand-applied root keeps its state. The plan role is denied reading any object under it."
  type        = string
  default     = "hand/"
}

variable "registry_arn" {
  description = "ARN of the image repository the deploy role pushes to."
  type        = string
}
