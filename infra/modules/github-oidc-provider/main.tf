# The GitHub OIDC provider of one AWS account. AWS allows one provider per issuer URL in an account, so the account's bootstrap root calls this module once and passes the provider's ARN to every deployment's github-oidc call.

terraform {
  required_version = "~> 1.16"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.60"
    }
  }
}

# No thumbprint list: for GitHub, AWS validates the provider against its own library of trusted certificate authorities and ignores any configured thumbprint.
resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}
