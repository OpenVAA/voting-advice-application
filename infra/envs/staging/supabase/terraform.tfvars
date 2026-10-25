# Non-secret inputs of the persistent staging project's root. This file is tracked and public.
#
# The project ref, the organisation slug, the project name and the region are the persistent
# project's, as its import read them. A value in this file takes precedence over a TF_VAR_ value of the same name.
#
# The smtp object is added once the SMTP port that works from the hosted service has been measured.
# From then on, a plan without TF_VAR_smtp_user and TF_VAR_smtp_password fails.
#
# The access token (SUPABASE_ACCESS_TOKEN), the database password (TF_VAR_database_password), the
# SMTP user name (TF_VAR_smtp_user, the access key id of the SES SMTP user) and the SMTP password
# (TF_VAR_smtp_password) are never written to this file.

public_origin            = "https://staging.openvaa.org"
enable_access_token_hook = true
enable_send_email_hook   = true

project_ref     = "cofbsatfrdysyphajsky"
organization_id = "gulgrbzofwnwepdnrgrl"
project_name    = "openvaa-staging"
region          = "eu-north-1"
