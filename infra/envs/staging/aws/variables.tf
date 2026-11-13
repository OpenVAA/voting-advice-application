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
