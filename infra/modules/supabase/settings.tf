# The settings this module sends, built from hosted-settings.json and the variables. This file holds
# only locals, with no resource and no provider reference, so that it can be evaluated on its own
# (infra/scripts/check-settings-types.sh does that with `terraform console`).
#
# hosted-settings.json holds every hosted value that is compared with the local configuration. The
# HCL adds only what depends on the environment: the site address and the redirect allow list built
# from the public origin, the rate limits, and the SMTP settings.
#
# A type trap: a conditional whose other branch is an empty object makes Terraform unify both
# branches into a map of strings, so booleans and numbers arrive as "true" and "100" and still
# validate. Optional groups are therefore filtered key by key with a `for` expression, or are
# `cond ? object : null` inside `merge`, which skips a null argument.

locals {
  hosted = jsondecode(file("${path.module}/hosted-settings.json"))

  # The access-token hook keys, sent only while that hook is switched on.
  auth_hook = { for k, v in local.hosted.auth_hook : k => v if var.enable_access_token_hook }

  # The send-email hook keys, sent only while that hook is switched on: a switch of its own, outside
  # the access-token hook's. While this hook is on, the auth service sends no mail of its own (the
  # hook's function takes every mail and sends none; the application's own function sends the mails),
  # so the SMTP settings and the mail rate limit below govern no mail the auth service sends.
  auth_send_email_hook = { for k, v in local.hosted.auth_send_email_hook : k => v if var.enable_send_email_hook }

  # The rate limits. The mail limit applies to mail the auth service sends itself, so it is sent only
  # together with the SMTP settings.
  auth_rate_limits = {
    for k, v in var.auth_rate_limits : k => v
    if var.smtp != null || k != "rate_limit_email_sent"
  }

  # The site address and the redirect allow list, both derived from the public origin.
  auth_origin = {
    site_url       = var.public_origin
    uri_allow_list = join(",", [for p in local.hosted.redirect_callback_paths : "${var.public_origin}${p}"])
  }

  # The SMTP settings without the password, which a settings resource of its own sends.
  auth_smtp = var.smtp == null ? null : {
    smtp_host        = var.smtp.host
    smtp_port        = var.smtp.port
    smtp_user        = var.smtp.user
    smtp_admin_email = var.smtp.admin_email
    smtp_sender_name = var.smtp.sender_name
  }

  auth = merge(
    local.hosted.auth,
    local.auth_hook,
    local.auth_send_email_hook,
    local.auth_rate_limits,
    local.auth_origin,
    local.auth_smtp,
  )

  api = local.hosted.api
}
