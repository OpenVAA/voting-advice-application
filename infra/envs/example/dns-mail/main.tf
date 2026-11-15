# A template zone and mail root that a forker copies to start a deployment of their own. CI validates
# it; nothing applies it. It has the same wiring as the staging root and differs only in its backend
# and its variable file. Replace the bucket below with your own state bucket and the stand-in values
# in terraform.tfvars with your own before the first apply.
terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.60"
    }
  }

  # Literal on purpose: no variable, no partial configuration and no -backend-config, so that this
  # root can never be paired with another root's state key. The key sits under hand/: this root is
  # applied by hand, never by the pipeline, and its state holds the SMTP secret in clear text.
  backend "s3" {
    bucket       = "REPLACE-ME-tfstate"
    key          = "hand/example/dns-mail/terraform.tfstate"
    region       = "eu-north-1"
    encrypt      = true
    use_lockfile = true
  }
}

# The provider's region is also the region the SMTP password is derived for, so it is the region the
# mail is sent from.
provider "aws" {
  region = var.aws_region

  # A shell signed in to any other account is refused before anything is read or changed.
  allowed_account_ids = [var.aws_account_id]

  default_tags {
    tags = {
      Project     = "openvaa"
      Environment = var.environment
      Root        = "dns-mail"
      ManagedBy   = "terraform"
    }
  }
}

# The zone and the mail identity live in this root so that they outlive any root that is destroyed and
# created again. This root reads no other root's state.
module "dns_zone" {
  source = "../../../modules/dns-zone"

  domain = var.domain
}

module "mail_ses" {
  source = "../../../modules/mail-ses"

  domain                     = var.domain
  zone_id                    = module.dns_zone.zone_id
  aws_region                 = var.aws_region
  name_prefix                = "openvaa-${var.environment}"
  iam_path                   = var.iam_path
  dkim_signing_hosted_zone   = var.dkim_signing_hosted_zone
  dmarc_report_address       = var.dmarc_report_address
  manage_account_suppression = var.manage_account_suppression
}

output "name_servers" {
  description = "The hosted zone's name servers, entered as NS records for the subdomain at the parent zone's DNS host."
  value       = module.dns_zone.name_servers
}

output "zone_id" {
  description = "Id of the hosted zone."
  value       = module.dns_zone.zone_id
}

output "dkim_tokens" {
  description = "The three Easy DKIM tokens of the identity."
  value       = module.mail_ses.dkim_tokens
}

output "sender_address" {
  description = "The From address the SMTP user may send as."
  value       = module.mail_ses.sender_address
}

output "smtp_endpoint" {
  description = "The SES SMTP endpoint of the region."
  value       = module.mail_ses.smtp_endpoint
}

output "smtp_username" {
  description = "SMTP user name. Read it with terraform output -raw in the shell that needs it; never write it to a file."
  value       = module.mail_ses.smtp_username
  sensitive   = true
}

output "smtp_password" {
  description = "SMTP password, valid for this root's region only. Read it with terraform output -raw in the shell that needs it; never write it to a file."
  value       = module.mail_ses.smtp_password
  sensitive   = true
}
