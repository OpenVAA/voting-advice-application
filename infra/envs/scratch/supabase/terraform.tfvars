# Non-secret inputs of the throwaway project's root. This file is tracked and public.
#
# The organisation, the project name and the region are the values the provider read when the project
# was imported, on 2026-10-22 (UTC). The provider refuses a changed organisation or region at apply,
# so these stay the read values. The organisation id it read equals the slug in the dashboard's
# address.
#
# The access token (SUPABASE_ACCESS_TOKEN), the database password (TF_VAR_database_password), the
# SMTP user name (TF_VAR_smtp_user) and the SMTP password (TF_VAR_smtp_password) are given as
# environment variables in the operator's shell and are never written to this file. Because this
# file sets smtp, a plan without TF_VAR_smtp_user and TF_VAR_smtp_password fails.

# The ref of the throwaway project. The root imports the project by this ref, so a plan never creates
# one.
project_ref     = "begckvkapaopoztbreqc"
organization_id = "gulgrbzofwnwepdnrgrl"
project_name    = "openvaa-scratch"
region          = "eu-north-1"

public_origin            = "https://staging.openvaa.org"
enable_access_token_hook = true
enable_send_email_hook   = true

smtp = {
  host = "email-smtp.eu-north-1.amazonaws.com"
  # The first port tried from a hosted function. It stays only if a mail sent through it arrives.
  port        = "2587"
  admin_email = "noreply@staging.openvaa.org"
  sender_name = "OpenVAA"
}

# The id of the project the bootstrap creates by default, the same on the throwaway and the
# persistent project. It is sent to the Edge Functions as PUBLIC_PROJECT_ID.
public_project_id = "00000000-0000-0000-0000-000000000001"
