# The Edge Functions' secrets. This resource is the only writer of them: on apply the provider deletes a remote secret that is in its state but no longer listed here, and leaves alone one it never managed, so a secret set by any other means is neither tracked nor removed.
#
# The functions' SMTP host, port and sender come from the `smtp` object, and their user name and password from the `smtp_user` and `smtp_password` variables. They are sent whenever `smtp` is set, whichever way the send-email hook is switched: with the hook on, the `send-email` function sends every mail and these are its only SMTP settings; the auth service's own SMTP settings are then not sent (see settings.tf). The six secrets `identity-callback` reads come from the `identity_provider` object and the `identity_provider_decryption_jwks` and `identity_callback_server_secret` variables, and are sent only when `identity_provider` is set; with it null, as by default, no identity-provider secret is sent and the function refuses every call. IDENTITY_CALLBACK_SERVER_SECRET must equal the frontend task's parameter of that name: the operator generates it once and gives it to both roots, neither of which reads the other. The values are stored in state in plain text, which is why the persistent root keeps its state in the encrypted bucket.

locals {
  # The names only, built from literals and the same condition as the secrets, so they carry no sensitive mark and can be output.
  function_secret_names = concat(
    ["PUBLIC_PROJECT_ID", "SITE_URL"],
    var.smtp == null ? [] : ["SMTP_HOST", "SMTP_PORT", "SMTP_FROM", "SMTP_USER", "SMTP_PASS"],
    var.identity_provider == null ? [] : ["IDENTITY_PROVIDER_TYPE", "IDENTITY_PROVIDER_CLIENT_ID", "IDENTITY_PROVIDER_JWKS_URI", "IDENTITY_PROVIDER_ISSUER", "IDENTITY_PROVIDER_DECRYPTION_JWKS", "IDENTITY_CALLBACK_SERVER_SECRET"],
  )
}

resource "supabase_edge_function_secrets" "this" {
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
    var.identity_provider == null ? [] : [
      { name = "IDENTITY_PROVIDER_TYPE", value = var.identity_provider.type },
      { name = "IDENTITY_PROVIDER_CLIENT_ID", value = var.identity_provider.client_id },
      { name = "IDENTITY_PROVIDER_JWKS_URI", value = var.identity_provider.jwks_uri },
      { name = "IDENTITY_PROVIDER_ISSUER", value = var.identity_provider.issuer },
      { name = "IDENTITY_PROVIDER_DECRYPTION_JWKS", value = var.identity_provider_decryption_jwks },
      { name = "IDENTITY_CALLBACK_SERVER_SECRET", value = var.identity_callback_server_secret },
    ],
  )
}

moved {
  from = supabase_edge_function_secrets.this[0]
  to   = supabase_edge_function_secrets.this
}
