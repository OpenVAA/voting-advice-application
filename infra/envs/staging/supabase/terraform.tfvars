# Non-secret inputs of the persistent staging project's root. This file is tracked and public.
#
# The organisation slug, the project name and the region are written here from the import of the
# persistent project. Until then they are given as TF_VAR_organization_id, TF_VAR_project_name and
# TF_VAR_region in the operator's shell, because a value in this file takes precedence over a
# TF_VAR_ value.
#
# The smtp object is added once the SMTP port that works from the hosted service has been measured.
#
# The access token (SUPABASE_ACCESS_TOKEN), the database password (TF_VAR_database_password) and the
# SMTP password (TF_VAR_smtp_password) are never written to this file.

public_origin            = "https://staging.openvaa.org"
enable_access_token_hook = true
enable_send_email_hook   = true
