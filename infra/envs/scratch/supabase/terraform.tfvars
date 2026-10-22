# Non-secret inputs of the throwaway project's root. This file is tracked and public.
#
# The organisation, the project name and the region are the values the provider read when the project
# was imported, on 2026-10-22 (UTC). The provider refuses a changed organisation or region at apply,
# so these stay the read values. The organisation id it read equals the slug in the dashboard's
# address.
#
# The access token (SUPABASE_ACCESS_TOKEN) and the database password (TF_VAR_database_password) are
# never written to this file.

organization_id = "gulgrbzofwnwepdnrgrl"
project_name    = "openvaa-scratch"
region          = "eu-north-1"

public_origin            = "https://staging.openvaa.org"
enable_access_token_hook = true
enable_send_email_hook   = true
