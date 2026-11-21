terraform {
  required_version = ">= 1.10"

  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.11"
    }
  }
}

# The project is created by hand and imported; this module never creates it. Each value comes from
# what the import shows. Neither the instance size nor the deprecated legacy-keys switch is declared:
# a declared instance size that differs from the imported one would plan a compute change.
#
# An import leaves no database password in state, because the provider never reads it back. Without
# the ignore below, the first apply after an import would send whatever value the shell exported to
# the password-update endpoint. The variable is still required by the provider's schema, and it is
# never sent.
#
# `prevent_destroy` is not recorded in state: it protects the project only while this block exists.
# A rename of the block needs a `moved` block, and a removal needs a `removed` block that does not
# destroy; without either, the plan would delete the project with no protection.
resource "supabase_project" "this" {
  organization_id   = var.organization_id
  name              = var.project_name
  region            = var.region
  database_password = var.database_password

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [database_password]
  }
}

# The hosted API and auth settings. The provider sends only the keys named here and keeps only those
# in state; a destroy of this resource changes nothing on the project. This resource is the only
# writer of these settings.
resource "supabase_settings" "this" {
  project_ref = supabase_project.this.id
  api         = jsonencode(local.api)
  auth        = jsonencode(local.auth)
}

# The SMTP password alone, in a settings resource of its own. The provider does not mark `auth`
# sensitive, so a sensitive value inside the main resource's JSON would hide its whole diff; kept
# apart, the main diff stays readable and the password is masked. Two settings resources for one
# project are untried: each is expected to pick only its own keys, but that has not been observed.
# While `smtp` is null the count is zero and nothing about SMTP is sent.
resource "supabase_settings" "smtp_secret" {
  count = var.smtp == null ? 0 : 1

  project_ref = supabase_project.this.id
  auth        = jsonencode({ smtp_pass = var.smtp_password })
}
