# The Edge Functions' secrets. This resource is the only writer of them: on apply the provider deletes
# a remote secret that is in its state but no longer listed here, and leaves alone one it never
# managed, so a secret set by any other means is neither tracked nor removed.
#
# The functions' SMTP host, port and sender come from the same `smtp` object as the auth settings, and
# their user name and password from the same variables, so one value configures both. No
# identity-provider secret is set, so `identity-callback` refuses every call until a deployment sets
# them. The values are stored in state in plain text, which is why the persistent root keeps its state
# in the encrypted bucket. While `public_project_id` is null the count is zero and no secret is sent.

locals {
  # The names only, built from literals and the same condition as the secrets, so they carry no
  # sensitive mark and can be output.
  function_secret_names = concat(
    ["PUBLIC_PROJECT_ID", "SITE_URL"],
    var.smtp == null ? [] : ["SMTP_HOST", "SMTP_PORT", "SMTP_FROM", "SMTP_USER", "SMTP_PASS"],
  )
}

resource "supabase_edge_function_secrets" "this" {
  count = var.public_project_id == null ? 0 : 1

  project_ref = supabase_project.this.id
  secrets = concat(
    [
      { name = "PUBLIC_PROJECT_ID", value = var.public_project_id },
      { name = "SITE_URL", value = var.public_origin },
    ],
    var.smtp == null ? [] : [
      { name = "SMTP_HOST", value = var.smtp.host },
      { name = "SMTP_PORT", value = var.smtp.port },
      { name = "SMTP_FROM", value = var.smtp.admin_email },
      { name = "SMTP_USER", value = var.smtp_user },
      { name = "SMTP_PASS", value = var.smtp_password },
    ],
  )
}
