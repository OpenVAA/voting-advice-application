# A template pipeline root that a forker copies to start a deployment of their own. CI validates it;
# nothing applies it. It has the same wiring as the staging root and differs only in its backend and
# its variable file. Replace the bucket below with your own state bucket and the stand-in values in
# terraform.tfvars with your own before the first apply.
terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.60"
    }
  }

  # Literal on purpose: no variable, no partial configuration and no -backend-config, so that this
  # root can never be paired with another root's state key.
  backend "s3" {
    bucket       = "REPLACE-ME-tfstate"
    key          = "pipeline/example/aws/terraform.tfstate"
    region       = "eu-north-1"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.aws_region

  # A shell signed in to any other account is refused before anything is read or changed.
  allowed_account_ids = [var.aws_account_id]

  default_tags {
    tags = {
      Project     = "openvaa"
      Environment = var.environment
      Root        = "aws"
      ManagedBy   = "terraform"
    }
  }
}

output "evidence_undeclared_variable" {
  value = var.not_declared_in_this_root
}
