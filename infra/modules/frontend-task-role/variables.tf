variable "name_prefix" {
  description = "Prefix of the names of the role and the policy this module creates."
  type        = string
}

variable "iam_path" {
  description = "IAM path of the role and the customer-managed policy."
  type        = string
}

variable "environment" {
  description = "Name of the environment whose frontend task uses the role. The role reads the parameters under /openvaa/<environment>/frontend only."
  type        = string
}

variable "aws_account_id" {
  description = "The AWS account that holds the frontend's parameters, used in their ARN."
  type        = string
}

variable "aws_region" {
  description = "The AWS region that holds the frontend's parameters, used in their ARN and in the condition that limits decryption to calls made through SSM."
  type        = string
}
