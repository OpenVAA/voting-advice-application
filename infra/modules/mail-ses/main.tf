terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.60"
    }
  }
}

locals {
  mail_from_domain = "${var.mail_from_label}.${var.domain}"
  record_ttl       = 300
}

# Easy DKIM with a 2048-bit key for the new key, so every key the identity rotates to has that length.
resource "aws_sesv2_email_identity" "this" {
  email_identity = var.domain

  dkim_signing_attributes {
    next_signing_key_length = "RSA_2048_BIT"
  }
}

# Easy DKIM issues three tokens. They are unknown until the identity exists, so the records are counted
# rather than keyed by token. The target zone is a variable because AWS states that it varies; whether
# the default is the zone SES assigns to this identity has not been observed.
resource "aws_route53_record" "dkim" {
  count = 3

  zone_id = var.zone_id
  name    = "${aws_sesv2_email_identity.this.dkim_signing_attributes[0].tokens[count.index]}._domainkey.${var.domain}"
  type    = "CNAME"
  ttl     = local.record_ttl
  records = ["${aws_sesv2_email_identity.this.dkim_signing_attributes[0].tokens[count.index]}.${var.dkim_signing_hosted_zone}"]
}

# With REJECT_MESSAGE a broken MAIL FROM stops sending instead of falling back to the SES default
# domain, where it would go unnoticed because DKIM alone still passes DMARC.
resource "aws_sesv2_email_identity_mail_from_attributes" "this" {
  email_identity         = aws_sesv2_email_identity.this.email_identity
  mail_from_domain       = local.mail_from_domain
  behavior_on_mx_failure = "REJECT_MESSAGE"
}

# SES requires exactly one MX record on the MAIL FROM domain.
resource "aws_route53_record" "mail_from_mx" {
  zone_id = var.zone_id
  name    = local.mail_from_domain
  type    = "MX"
  ttl     = local.record_ttl
  records = ["10 feedback-smtp.${var.aws_region}.amazonses.com"]
}

resource "aws_route53_record" "mail_from_spf" {
  zone_id = var.zone_id
  name    = local.mail_from_domain
  type    = "TXT"
  ttl     = local.record_ttl
  records = ["v=spf1 include:amazonses.com ~all"]
}

# The record takes the place of any policy the parent domain publishes for this subdomain. SPF is left in
# relaxed alignment, the default, which is what the SES MAIL FROM subdomain needs. That mail from this
# identity passes DMARC alignment is expected and has not been observed in a received header.
resource "aws_route53_record" "dmarc" {
  zone_id = var.zone_id
  name    = "_dmarc.${var.domain}"
  type    = "TXT"
  ttl     = local.record_ttl
  records = ["v=DMARC1; p=${var.dmarc_policy}${var.dmarc_report_address == null ? "" : "; rua=mailto:${var.dmarc_report_address}"}"]
}

# This setting is account-wide in the region, not tied to the identity, which is why it can be switched
# off when something else in the account owns it.
resource "aws_sesv2_account_suppression_attributes" "this" {
  count = var.manage_account_suppression ? 1 : 0

  suppressed_reasons = ["BOUNCE", "COMPLAINT"]
}
