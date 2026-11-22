terraform {
  required_version = "~> 1.16"

  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "= 1.11.0"
    }
  }
}

# The project is created by hand and imported; this module never creates it. Each value comes from what the import shows. Neither the instance size nor the deprecated legacy-keys switch is declared: a declared instance size that differs from the imported one would plan a compute change.
#
# An import leaves no database password in state, because the provider never reads it back. Without the ignore below, the first apply after an import would send whatever value the shell exported to the password-update endpoint. The variable is still required by the provider's schema, and it is never sent.
#
# `prevent_destroy` is not recorded in state: it protects the project only while this block exists.
# A rename of the block needs a `moved` block, and a removal needs a `removed` block that does not destroy; without either, the plan would delete the project with no protection.
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

# The hosted API and auth settings. The provider sends only the keys named here and keeps only those in state; a destroy of this resource changes nothing on the project. This resource is the only writer of these settings.
resource "supabase_settings" "this" {
  project_ref = supabase_project.this.id
  api         = jsonencode(local.api)
  auth        = jsonencode(local.auth)
}

# The SMTP user name and password, in a settings resource of its own. The provider does not mark `auth` sensitive, so a sensitive value inside the main resource's JSON would hide its whole diff; kept apart, the main diff stays readable and both values are masked. Each of the two settings resources of the project writes only its own keys. Both update the same auth configuration, so this one is applied after the main one and never in parallel with it, and the project accepts the first SMTP enablement with the user name and the password arriving from this one.
#
# The resource exists only while the auth service's own SMTP settings are sent, that is while `smtp` is set and the send-email hook is off (`local.auth_smtp_sent` in settings.tf). Otherwise the count is zero and no SMTP credential reaches the auth settings; a destroy of this resource changes nothing on the project, so a value sent earlier stays there unused.
resource "supabase_settings" "smtp_secret" {
  count      = local.auth_smtp_sent ? 1 : 0
  depends_on = [supabase_settings.this]

  project_ref = supabase_project.this.id
  auth = jsonencode({
    smtp_user = var.smtp_user
    smtp_pass = var.smtp_password
  })
}
