# Plans the whole template root offline. The provider is a mock because the root's stand-in account
# makes the real provider refuse every credential, and no backend is read. The test loads the root's
# own terraform.tfvars, so the assert checks a value a forker copies.

mock_provider "aws" {
  # The mail module refuses a plan whose aws_region differs from the provider's region, and a mock's
  # region would otherwise be a random string.
  mock_data "aws_region" {
    defaults = {
      region = "eu-north-1"
      name   = "eu-north-1"
    }
  }
}

run "example_dns_mail_plans" {
  command = plan

  assert {
    condition     = module.dns_zone.domain == var.domain
    error_message = "The hosted zone must be planned for the root's domain."
  }
}
