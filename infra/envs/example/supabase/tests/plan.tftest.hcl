# Plans the whole template root offline. The provider is a mock, so no access token is read, and no backend is read. The test loads the root's own terraform.tfvars, so the assert checks values a forker copies.

mock_provider "supabase" {}

# A mock provider cannot import, and the root imports the project, so the project's id is given here.
override_resource {
  target = module.supabase.supabase_project.this
  values = {
    id = "abcdefghijklmnopqrst"
  }
}

# Stand-ins for the sensitive inputs that the operator's shell gives. None is a real secret.
variables {
  database_password = "stand-in-password-0000"
  smtp_user         = "stand-in-user"
  smtp_password     = "stand-in-password-0000"
}

run "example_supabase_plans" {
  command = plan

  assert {
    condition = (
      contains(output.managed_function_secret_names, "PUBLIC_PROJECT_ID")
      && contains(output.managed_function_secret_names, "SMTP_HOST")
    )
    error_message = "With public_project_id and smtp set, the Edge Function secrets must include the project id and the SMTP settings."
  }

  assert {
    condition     = !contains(output.managed_auth_keys, "smtp_host") && !contains(output.managed_auth_keys, "rate_limit_email_sent")
    error_message = "With the send-email hook on, the auth settings must hold no SMTP key and no mail rate limit: the hook sends the mail."
  }
}
