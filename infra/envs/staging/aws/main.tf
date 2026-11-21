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
    bucket       = "openvaa-tfstate-471112560111"
    key          = "pipeline/staging/aws/terraform.tfstate"
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
