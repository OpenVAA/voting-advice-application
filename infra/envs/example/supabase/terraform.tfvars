# Production-shaped inputs of a forker's Supabase root, with stand-in values. This file is tracked and public. Replace each stand-in with the value an import of your project shows.
#
# The SMTP user name (TF_VAR_smtp_user), the SMTP password (TF_VAR_smtp_password), the database password (TF_VAR_database_password) and the access token (SUPABASE_ACCESS_TOKEN) are given as environment variables in the operator's shell and are never written to this file. For SES the SMTP user name is the access key id of the SMTP user, half of the mail credential. Because this file sets smtp, a plan without TF_VAR_smtp_user and TF_VAR_smtp_password fails.

# The ref of the project you created by hand. The root imports the project by this ref, so a plan never creates one, and a ref that names no project fails the plan.
project_ref     = "replace-with-your-project-ref"
organization_id = "replace-with-your-organisation-slug"
project_name    = "openvaa-production"
region          = "eu-north-1"

# An https origin with no path, no query and no trailing slash. The auth site address is this origin, and each allowed redirect is this origin followed by one of the app's callback paths.
public_origin = "https://vaa.example.org"

enable_access_token_hook = true
enable_send_email_hook   = true

# All seven hosted auth limits, set explicitly. The values shown are the module's defaults. A production deployment sizes the sign-in (rate_limit_otp) and verification (rate_limit_verify) limits from its own measurement of how many requests arrive from one address, because the frontend's server-side calls all arrive from the addresses of the app's own servers.
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
  # The port that works from the hosted service is measured per deployment and is not known in advance. The hosted API takes it as a string.
  port        = "587"
  admin_email = "noreply@vaa.example.org"
  sender_name = "OpenVAA"
}

# The id of the project the bootstrap creates by default. The frontend's PUBLIC_PROJECT_ID must equal it. It is sent to the Edge Functions as PUBLIC_PROJECT_ID, with SITE_URL and the SMTP settings above.
public_project_id = "00000000-0000-0000-0000-000000000001"

# Bank authentication is off while identity_provider is unset. To turn it on, uncomment the block and give the same values as the AWS root's identity_provider_type and environment_values, and export TF_VAR_identity_provider_decryption_jwks and TF_VAR_identity_callback_server_secret in the shell that plans, with the same values as the AWS root's parameters of those names. A plan with identity_provider set and either secret missing fails.
# ```hcl
# identity_provider = {
#   type      = "signicat-ftn"
#   client_id = "replace-with-your-client-id"
#   jwks_uri  = "https://example.signicat.com/auth/open/.well-known/openid-configuration/jwks"
#   issuer    = "https://example.signicat.com/auth/open"
# }
# ```
