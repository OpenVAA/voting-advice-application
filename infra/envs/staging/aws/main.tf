terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.60"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.9"
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

# The CDN's certificate must be in us-east-1. The alias repeats the account guard and the tags, so that
# the certificate is guarded and tagged like everything else in this root.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

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

# The serving path of the frontend. The zone it adds records to belongs to the dns-mail root and is
# read by name; the execution role belongs to the bootstrap root and is given by its ARN.
module "frontend" {
  source = "../../../modules/frontend-service"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  name_prefix             = var.name_prefix
  environment             = var.environment
  domain                  = var.domain
  aws_account_id          = var.aws_account_id
  aws_region              = var.aws_region
  registry_url            = var.registry_url
  image_tag               = var.image_tag
  execution_role_arn      = var.execution_role_arn
  parameter_path          = var.parameter_path
  environment_values      = var.environment_values
  environment_overrides   = var.environment_overrides
  omit_environment        = var.omit_environment
  task_cpu                = var.task_cpu
  task_memory             = var.task_memory
  task_floor              = var.task_floor
  task_ceiling            = var.task_ceiling
  scheduled_floor_changes = var.scheduled_floor_changes
  log_retention_days      = var.log_retention_days
  debug_ingress_cidrs     = var.debug_ingress_cidrs
  alert_email             = var.alert_email
}
