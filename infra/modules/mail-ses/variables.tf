variable "domain" {
  description = "The domain verified as the SES identity and sent from. Its hosted zone holds every mail record."
  type        = string
}

variable "zone_id" {
  description = "Id of the Route 53 hosted zone that serves the domain."
  type        = string
}

variable "aws_region" {
  description = "The region SES sends from. It names the MAIL FROM feedback host and the SMTP endpoint, and must equal the provider's region."
  type        = string
}

variable "name_prefix" {
  description = "Prefix of the names of the SMTP user and its send policy."
  type        = string
}

variable "iam_path" {
  description = "IAM path of the SMTP user and its send policy."
  type        = string
  default     = "/openvaa/"
}

variable "mail_from_label" {
  description = "Label of the custom MAIL FROM subdomain under the domain. It must not be a name that mail is sent from or received on."
  type        = string
  default     = "mail"
}

variable "sender_local_part" {
  description = "Local part of the only From address the SMTP user may send as."
  type        = string
  default     = "noreply"
}

variable "dkim_signing_hosted_zone" {
  description = "Hosted zone that the DKIM CNAME records point into, after the token. AWS states that this zone varies by Region and identity, and the identity resource does not export it. After the first apply, compare this value with the SigningHostedZone field that SES returns for the identity, and correct it here if they differ."
  type        = string
  default     = "dkim.amazonses.com"
}

variable "dmarc_policy" {
  description = "The DMARC policy published for the domain."
  type        = string
  default     = "quarantine"

  validation {
    condition     = contains(["none", "quarantine", "reject"], var.dmarc_policy)
    error_message = "dmarc_policy must be one of none, quarantine or reject."
  }
}

variable "dmarc_report_address" {
  description = "Address that aggregate DMARC reports are sent to. With null the record asks for no reports."
  type        = string
  default     = null

  validation {
    condition     = var.dmarc_report_address == null || can(regex("^[^@;,\\s]+@[^@;,\\s]+$", var.dmarc_report_address))
    error_message = "dmarc_report_address must be null or a single address with no spaces, commas or semicolons."
  }
}

variable "manage_account_suppression" {
  description = "Whether this module owns the account-level suppression list setting of the region. Switch it off if something else in the account owns that setting."
  type        = bool
  default     = true
}
