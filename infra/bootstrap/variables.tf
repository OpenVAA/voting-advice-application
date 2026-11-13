variable "aws_account_id" {
  description = "The AWS account this root may act on. The provider refuses credentials for any other account."
  type        = string
}

variable "aws_region" {
  description = "The AWS region of the resources of this root."
  type        = string
}

variable "name_prefix" {
  description = "Prefix of the names of the budget, the roles and the policies this root creates."
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

variable "registry_name" {
  description = "Name of the image repository the frontend image is pushed to."
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

variable "deploy_environment" {
  description = "Name of the GitHub Environment the deploy role is bound to."
  type        = string
}

variable "plan_subjects" {
  description = "Exact OIDC subjects allowed to assume the read-only plan role."
  type        = list(string)
}

variable "deploy_subjects" {
  description = "Exact OIDC subjects allowed to assume the deploy role."
  type        = list(string)
}

variable "github_repository_id" {
  description = "Numeric id of the GitHub repository. When set, both trust policies also require it, which survives a rename."
  type        = string
  default     = null
}

variable "github_repository_owner_id" {
  description = "Numeric id of the GitHub repository's owner. When set, both trust policies also require it."
  type        = string
  default     = null
}

variable "pipeline_state_key" {
  description = "State key of the one root the pipeline applies. It must equal the key in that root's backend block, because the deploy role's access to the state bucket is limited to this key."
  type        = string
}
