# Non-secret inputs of the throwaway project's root. This file is tracked and public.
#
# The organisation slug, the project name and the region are written here once an import has shown
# them. Until then they are given as TF_VAR_organization_id, TF_VAR_project_name and TF_VAR_region in
# the operator's shell. They are left out rather than given stand-in values, because a value in this
# file takes precedence over a TF_VAR_ value.
#
# The access token (SUPABASE_ACCESS_TOKEN) and the database password (TF_VAR_database_password) are
# never written to this file.

public_origin            = "https://staging.openvaa.org"
enable_access_token_hook = true
enable_send_email_hook   = true
