variable "aws_account_id" {
  description = "The AWS account this root may act on. The provider refuses credentials for any other account."
  type        = string
}

variable "aws_region" {
  description = "The AWS region of the resources of this root."
  type        = string
}

variable "name_prefix" {
  description = "Prefix of the names of the budget, the roles and the policies this root creates. A deployment's registry and IAM names derive from it unless its entry sets registry_name or iam_name_prefix."
  type        = string
}

variable "iam_path" {
  description = "IAM path of the roles and the customer-managed policies."
  type        = string
}

variable "state_bucket_name" {
  description = "Name of the bucket that holds the Terraform state of every root. It must equal the bucket named in each root's backend block, including this root's own backend.tf."
  type        = string
}


variable "budget_limit_usd" {
  description = "Monthly cost limit of the account in US dollars."
  type        = number
}

variable "alert_email" {
  description = "Address the budget alerts are mailed to. Give it per session as TF_VAR_alert_email; it is never written to a file, because the repository is public."
  type        = string
  sensitive   = true
}

variable "deployments" {
  description = "The deployments this account hosts, keyed by deployment name. The key is the name of the deployment's GitHub Environment when it has one, its directory infra/envs/<key>/, the segment of its pipeline state key pipeline/<key>/aws/terraform.tfstate, its parameter path /openvaa/<key>/ and its Environment tag. Each entry names the repository that deploys it by numeric id, the exact OIDC subjects its plan and deploy roles trust, in the name-based form repo:OWNER/REPO:... or the id-bearing form repo:OWNER@<owner id>/REPO@<repository id>:..., copied exactly from the token, the branches that deploy it, and its hosted zone and domain. registry_name and iam_name_prefix override the derived names <name_prefix>-<key>-frontend and <name_prefix>-<key>. The file deployments.auto.tfvars.json sets this variable, and a repository acts only on the entries whose github_repository_id is its own."
  type = map(object({
    github_repository_id       = string
    github_repository_owner_id = string
    plan_subjects              = list(string)
    deploy_subjects            = list(string)
    deploy_branches            = list(string)
    hosted_zone_id             = string
    domain                     = string
    environment                = optional(string)
    destroy_environment        = optional(string)
    registry_name              = optional(string)
    iam_name_prefix            = optional(string)
  }))

  validation {
    condition     = length(var.deployments) > 0
    error_message = "deployments must hold at least one entry."
  }

  validation {
    condition = alltrue([
      for k in keys(var.deployments) : can(regex("^[a-z][a-z0-9-]*$", k)) && length("${var.name_prefix}-${k}-frontend") <= 32
    ])
    error_message = "Every key of deployments must start with a lower-case letter, hold only lower-case letters, digits and hyphens, and keep <name_prefix>-<key>-frontend within 32 characters."
  }

  validation {
    condition = alltrue([
      for d in values(var.deployments) : can(regex("^[0-9]+$", d.github_repository_id)) && can(regex("^[0-9]+$", d.github_repository_owner_id))
    ])
    error_message = "Every entry of deployments must give github_repository_id and github_repository_owner_id as digits only."
  }

  validation {
    condition = alltrue([
      for d in values(var.deployments) : length(d.plan_subjects) > 0 && length(d.deploy_subjects) > 0 && alltrue([
        for s in concat(d.plan_subjects, d.deploy_subjects) : startswith(s, "repo:") && !strcontains(s, "*") && !strcontains(s, "?")
      ])
    ])
    error_message = "Every entry of deployments must hold at least one plan subject and one deploy subject, each starting with \"repo:\" and containing no \"*\" or \"?\"."
  }

  validation {
    condition = alltrue([
      for d in values(var.deployments) : length(d.deploy_branches) > 0 && alltrue([
        for b in d.deploy_branches : b != "" && (!strcontains(b, "*") || (endswith(b, "/*") && length(regexall("[*]", b)) == 1))
      ])
    ])
    error_message = "Every entry of deployments must hold at least one deploy branch, each either free of \"*\" or ending in \"/*\" with no other \"*\"."
  }

  validation {
    condition = alltrue([
      for d in values(var.deployments) : (d.registry_name == null || can(regex("^[a-z][a-z0-9-]*$", d.registry_name))) && (d.iam_name_prefix == null || can(regex("^[a-z][a-z0-9-]*$", d.iam_name_prefix)))
    ])
    error_message = "registry_name and iam_name_prefix of an entry of deployments, when set, must start with a lower-case letter and hold only lower-case letters, digits and hyphens."
  }

  validation {
    condition     = length(distinct([for d in values(var.deployments) : d.domain])) == length(var.deployments)
    error_message = "No two entries of deployments may share a domain."
  }

  validation {
    condition = (
      length(distinct([for k, d in var.deployments : coalesce(d.registry_name, "${var.name_prefix}-${k}-frontend")])) == length(var.deployments)
      && length(distinct([for k, d in var.deployments : coalesce(d.iam_name_prefix, "${var.name_prefix}-${k}")])) == length(var.deployments)
    )
    error_message = "No two entries of deployments may share a registry name or an IAM name prefix, the derived names included."
  }

  validation {
    condition = (
      length(distinct(flatten([for d in values(var.deployments) : concat(d.plan_subjects, d.deploy_subjects)])))
      == length(flatten([for d in values(var.deployments) : concat(d.plan_subjects, d.deploy_subjects)]))
    )
    error_message = "No OIDC subject may appear twice in deployments, within one entry or across entries."
  }

  validation {
    condition = alltrue([
      for d in values(var.deployments) : alltrue([
        for b in d.deploy_branches : !strcontains(b, "*") && anytrue([for s in d.deploy_subjects : endswith(s, ":ref:refs/heads/${b}")])
      ]) if d.environment == null
    ])
    error_message = "An entry of deployments without environment must list only deploy branches free of \"*\", and for each a deploy subject ending in :ref:refs/heads/<branch>."
  }

  validation {
    condition = alltrue(concat(
      [for d in values(var.deployments) : anytrue([for s in d.deploy_subjects : endswith(s, ":environment:${d.environment}")]) if d.environment != null],
      [for d in values(var.deployments) : anytrue([for s in d.deploy_subjects : endswith(s, ":environment:${d.destroy_environment}")]) if d.destroy_environment != null],
    ))
    error_message = "An entry of deployments that sets environment or destroy_environment must list, for each, a deploy subject ending in :environment:<that name>."
  }
}
