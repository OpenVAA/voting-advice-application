# Production-shaped inputs of a forker's Supabase root, with stand-in values. This file is tracked
# and public. Replace each stand-in with the value an import of your project shows.
#
# The SMTP password (TF_VAR_smtp_password), the database password (TF_VAR_database_password) and the
# access token (SUPABASE_ACCESS_TOKEN) are given as environment variables in the operator's shell and
# are never written to this file.

organization_id = "replace-with-your-organisation-slug"
project_name    = "openvaa-production"
region          = "eu-north-1"

# An https origin with no path, no query and no trailing slash. The auth site address is this origin,
# and each allowed redirect is this origin followed by one of the app's callback paths.
public_origin = "https://vaa.example.org"

enable_access_token_hook = true
enable_send_email_hook   = true

# All seven hosted auth limits, set explicitly. The values shown are the module's defaults. A
# production deployment sizes the sign-in (rate_limit_otp) and verification (rate_limit_verify)
# limits from its own measurement of how many requests arrive from one address, because the
# frontend's server-side calls all arrive from the addresses of the app's own servers.
auth_rate_limits = {
  rate_limit_otp             = 30
  rate_limit_verify          = 30
  rate_limit_token_refresh   = 150
  rate_limit_anonymous_users = 30
  rate_limit_sms_sent        = 30
  rate_limit_web3            = 30
  rate_limit_email_sent      = 100
}

smtp = {
  host = "email-smtp.eu-north-1.amazonaws.com"
  # The port that works from the hosted service is measured per deployment and is not known in
  # advance. The hosted API takes it as a string.
  port        = "587"
  user        = "REPLACE-ME"
  admin_email = "noreply@vaa.example.org"
  sender_name = "OpenVAA"
}
