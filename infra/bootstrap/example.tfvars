# Example inputs for a fork. Terraform never loads this file by itself (it loads terraform.tfvars and
# *.auto.tfvars only): copy the values into terraform.tfvars and replace every stand-in.
#
# The budget alert address is not set in any file: give it per session as TF_VAR_alert_email.
aws_account_id = "000000000000"
aws_region     = "eu-north-1"
name_prefix    = "openvaa"
iam_path       = "/openvaa/"

# Must equal the bucket named in backend.tf and in every other root's backend block.
state_bucket_name = "openvaa-tfstate-000000000000"
registry_name     = "openvaa-frontend"

budget_limit_usd = 100

# GitHub issues the OIDC subject in one of two forms. A repository created before 2026-07-15 keeps
# the name-based form, repo:OWNER/REPO:..., until it is renamed, transferred or opted in to the new
# form. A fork is a new repository, so it gets the id-bearing form shown here, with the numeric ids
# of the owner and of the repository after the "@". Copy the exact subject your workflow's token
# carries; a subject that differs by one character is refused.
deploy_environment = "production"
plan_subjects      = ["repo:EXAMPLE-ORG@1234567/EXAMPLE-REPO@7654321:pull_request"]
deploy_subjects    = ["repo:EXAMPLE-ORG@1234567/EXAMPLE-REPO@7654321:environment:production"]

# Optional: pin the trust policies to the numeric ids as well.
# github_repository_id       = "7654321"
# github_repository_owner_id = "1234567"

# Must equal the backend key of the root the pipeline applies.
pipeline_state_key = "pipeline/production/aws/terraform.tfstate"
