# Non-secret inputs of the persistent staging project's root. This file is tracked and public.
#
# The project ref, the organisation slug, the project name and the region are the persistent project's, as its import read them. A value in this file takes precedence over a TF_VAR_ value of the same name.
#
# The smtp object is set, with the port measured from a hosted function; with the send-email hook on it configures the Edge Functions' mail only. Because this file sets smtp, a plan without TF_VAR_smtp_user and TF_VAR_smtp_password fails.
#
# The access token (SUPABASE_ACCESS_TOKEN), the database password (TF_VAR_database_password), the SMTP user name (TF_VAR_smtp_user, the access key id of the SES SMTP user) and the SMTP password (TF_VAR_smtp_password) are never written to this file.

public_origin            = "https://staging.openvaa.org"
enable_access_token_hook = true
enable_send_email_hook   = true

project_ref     = "cofbsatfrdysyphajsky"
organization_id = "gulgrbzofwnwepdnrgrl"
project_name    = "openvaa-staging"
region          = "eu-north-1"

smtp = {
  host = "email-smtp.eu-north-1.amazonaws.com"
  # The port a hosted Edge Function can send mail through.
  port        = "2587"
  admin_email = "noreply@staging.openvaa.org"
  sender_name = "OpenVAA"
}

# The id of the project the bootstrap creates by default, the same on the throwaway and the persistent project. It is sent to the Edge Functions as PUBLIC_PROJECT_ID.
public_project_id = "00000000-0000-0000-0000-000000000001"

# Bank authentication through Idura's test environment, the same values as the AWS root's. The decryption keys and the callback secret are TF_VAR_identity_provider_decryption_jwks and TF_VAR_identity_callback_server_secret from the operator's shell, never here.
identity_provider = {
  type      = "idura-ftn"
  client_id = "urn:my:application:identifier:498295"
  jwks_uri  = "https://openvaa.test.idura.broker/.well-known/jwks"
  issuer    = "https://openvaa.test.idura.broker"
}
