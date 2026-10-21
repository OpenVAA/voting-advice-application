variable "aws_account_id" {
  description = "The AWS account this root may act on. The provider refuses credentials for any other account."
  type        = string
}

variable "aws_region" {
  description = "The AWS region of the resources of this root, and the region SES sends from."
  type        = string
}

variable "environment" {
  description = "The environment name, applied to every resource as the Environment tag."
  type        = string
}

variable "domain" {
  description = "The subdomain delegated to the hosted zone and verified as the SES identity."
  type        = string
}

variable "iam_path" {
  description = "IAM path of the SMTP user and its send policy."
  type        = string
  default     = "/openvaa/"
}

variable "dkim_signing_hosted_zone" {
  description = "Hosted zone the DKIM CNAME records point into. Compared with the identity's SigningHostedZone after the first apply."
  type        = string
}

variable "dmarc_report_address" {
  description = "Address that aggregate DMARC reports are sent to, or null for none."
  type        = string
  default     = null
}

variable "manage_account_suppression" {
  description = "Whether this root owns the region's account-level SES suppression list setting."
  type        = bool
  default     = true
}
