# Tracked on purpose: the public record of this root's inputs. Nothing secret belongs here. The budget
# alert address is not set here: it is given per session as TF_VAR_alert_email.
aws_account_id = "471112560111"
aws_region     = "eu-north-1"
name_prefix    = "openvaa"
iam_path       = "/openvaa/"

# Must equal the bucket named in backend.tf and in every other root's backend block.
state_bucket_name = "openvaa-tfstate-471112560111"
registry_name     = "openvaa-frontend"

# The standing monthly limit. A first apply may override it on the command line, for example
# -var budget_limit_usd=1, to see an alert arrive, and is then applied again with this value.
budget_limit_usd = 100

deploy_environment = "staging"
plan_subjects      = ["repo:OpenVAA/voting-advice-application:pull_request"]
deploy_subjects    = ["repo:OpenVAA/voting-advice-application:environment:staging"]

# The dns-mail root's zone (its zone_id output) and the AWS root's domain, for the frontend's records.
deploy_hosted_zone_id = "Z02494181MAM7OCUAIPKC"
deploy_domain         = "staging.openvaa.org"

# Must equal the backend key of infra/envs/staging/aws: the deploy role may reach this key only.
pipeline_state_key = "pipeline/staging/aws/terraform.tfstate"

# The environment whose frontend task uses the execution role. The role reads the parameters under
# /openvaa/staging/frontend/ and nothing else.
frontend_environment = "staging"
