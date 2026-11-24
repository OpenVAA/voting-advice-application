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
  description = "Name of the deployment environment, for example \"staging\". It names the deploy role and its state policy, and the frontend resources and log group the deploy policies are scoped to. It is not a GitHub Environment: the GitHub Environments trusted to assume the deploy role are the subjects in deploy_subjects."
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

  validation {
    condition     = var.github_repository_id == null || can(regex("^[0-9]+$", var.github_repository_id))
    error_message = "github_repository_id must be null or the repository's numeric id, digits only."
  }
}

variable "github_repository_owner_id" {
  description = "Numeric id of the GitHub repository's owner. When set, both trust policies also require an exact match on the token's repository_owner_id claim."
  type        = string
  default     = null

  validation {
    condition     = var.github_repository_owner_id == null || can(regex("^[0-9]+$", var.github_repository_owner_id))
    error_message = "github_repository_owner_id must be null or the owner's numeric id, digits only."
  }
}

variable "state_bucket_arn" {
  description = "ARN of the bucket that holds the Terraform state of every root."
  type        = string
}

variable "pipeline_state_key" {
  description = "State key of the one root the pipeline applies, for example \"pipeline/staging/aws/terraform.tfstate\". The deploy role reaches this key and its lock object and no other. It must lie outside hand_state_prefix and outside the workspace prefix \"env:/\"."
  type        = string

  validation {
    condition = (
      endswith(var.pipeline_state_key, "/terraform.tfstate")
      && !startswith(var.pipeline_state_key, var.hand_state_prefix)
      && !startswith(var.pipeline_state_key, "env:/")
    )
    error_message = "pipeline_state_key must name a terraform.tfstate object outside hand_state_prefix and outside \"env:/\", whose state the plan role is denied."
  }
}

variable "hand_state_prefix" {
  description = "Key prefix under which every hand-applied root keeps its state. The plan role is denied reading any object under it."
  type        = string
  default     = "hand/"

  validation {
    condition     = can(regex("^([A-Za-z0-9_-]+/)+$", var.hand_state_prefix))
    error_message = "hand_state_prefix must be one or more path segments, each followed by a slash, for example \"hand/\"."
  }
}

variable "registry_arn" {
  description = "ARN of the image repository the deploy role pushes to."
  type        = string
}

variable "aws_account_id" {
  description = "The AWS account of the pipeline root's resources, used to build the ARNs the deploy policies name."
  type        = string

  validation {
    condition     = can(regex("^[0-9]{12}$", var.aws_account_id))
    error_message = "aws_account_id must be a 12-digit AWS account id."
  }
}

variable "aws_region" {
  description = "The AWS region of the pipeline root's regional resources, for example \"eu-north-1\"."
  type        = string

  validation {
    condition     = can(regex("^[a-z]{2}(-[a-z]+)+-[0-9]$", var.aws_region))
    error_message = "aws_region must be an AWS region name such as \"eu-north-1\"."
  }
}

variable "frontend_execution_role_arn" {
  description = "ARN of the frontend task's execution role, the one role the deploy role may pass, and only to ECS tasks."
  type        = string

  validation {
    condition     = can(regex("^arn:aws:iam::${var.aws_account_id}:role/[A-Za-z0-9+=,.@_/-]+$", var.frontend_execution_role_arn))
    error_message = "frontend_execution_role_arn must be the ARN of an IAM role in aws_account_id."
  }
}

variable "hosted_zone_id" {
  description = "Id of the hosted zone the deploy role may change the frontend's records in."
  type        = string

  validation {
    condition     = can(regex("^Z[A-Z0-9]+$", var.hosted_zone_id))
    error_message = "hosted_zone_id must be a Route 53 hosted zone id such as \"Z0123456789ABCDEFGHIJ\"."
  }
}

variable "domain" {
  description = "The domain the deployed frontend serves. The deploy role may change only the records at this name, at origin.<domain> and the certificate validation records under it."
  type        = string

  validation {
    condition     = can(regex("^([a-z0-9]([a-z0-9-]*[a-z0-9])?\\.)+[a-z]{2,}$", var.domain))
    error_message = "domain must be a lower-case DNS name without a trailing dot, such as \"staging.example.org\"."
  }
}
