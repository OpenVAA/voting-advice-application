output "identity_arn" {
  description = "ARN of the SES domain identity."
  value       = aws_sesv2_email_identity.this.arn
}

output "dkim_tokens" {
  description = "The three Easy DKIM tokens of the identity."
  value       = aws_sesv2_email_identity.this.dkim_signing_attributes[0].tokens
}

output "mail_from_domain" {
  description = "The custom MAIL FROM domain."
  value       = aws_sesv2_email_identity_mail_from_attributes.this.mail_from_domain
}

output "sender_address" {
  description = "The only From address the SMTP user may send as."
  value       = "${var.sender_local_part}@${var.domain}"
}

output "smtp_endpoint" {
  description = "The SES SMTP endpoint of the region. It accepts encrypted connections only."
  value       = "email-smtp.${var.aws_region}.amazonaws.com"
}

output "smtp_username" {
  description = "SMTP user name: the access key id of the SMTP user."
  value       = aws_iam_access_key.smtp.id
  sensitive   = true
}

output "smtp_password" {
  description = "SMTP password derived from the access key's secret. The provider derives it with its own region, so the root calling this module must run in the region the mail is sent from; the password is valid for that region's SMTP endpoint only."
  value       = aws_iam_access_key.smtp.ses_smtp_password_v4
  sensitive   = true
}
