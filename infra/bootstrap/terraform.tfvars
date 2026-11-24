# Tracked on purpose: the public record of this root's inputs. Nothing secret belongs here. The budget alert address is not set here: it is given per session as TF_VAR_alert_email.
aws_account_id = "471112560111"
aws_region     = "eu-north-1"
name_prefix    = "openvaa"
iam_path       = "/openvaa/"

# Must equal the bucket named in backend.tf and in every other root's backend block.
state_bucket_name = "openvaa-tfstate-471112560111"
registry_name     = "openvaa-frontend"

# The standing monthly limit. A first apply may override it on the command line, for example -var budget_limit_usd=1, to see an alert arrive, and is then applied again with this value.
budget_limit_usd = 100

# The subjects are name-based (repo:OWNER/REPO:...): a rename or transfer of the repository, or an opt-in to the id-bearing subject form, stops both roles being assumable until the subjects are changed and this root is applied again.
deploy_environment = "staging"
plan_subjects      = ["repo:OpenVAA/voting-advice-application:pull_request"]

# The second subject is the destroy workflow's environment, which holds no secret.
deploy_subjects = [
  "repo:OpenVAA/voting-advice-application:environment:staging",
  "repo:OpenVAA/voting-advice-application:environment:staging-destroy",
]

# The numeric ids of OpenVAA/voting-advice-application and of its owner, read from the GitHub API. With them both trusts refuse a token from a repository recreated under the same name, and unlike the subjects above the ids stay the same through a rename or a transfer.
github_repository_id       = "546467466"
github_repository_owner_id = "115159211"

# The dns-mail root's zone (its zone_id output) and the AWS root's domain, for the frontend's records.
deploy_hosted_zone_id = "Z02494181MAM7OCUAIPKC"
deploy_domain         = "staging.openvaa.org"

# Must equal the backend key of infra/envs/staging/aws: the deploy role may reach this key only.
pipeline_state_key = "pipeline/staging/aws/terraform.tfstate"

# The environment whose frontend task uses the execution role. The role reads the parameters under /openvaa/staging/frontend/ and nothing else.
frontend_environment = "staging"
