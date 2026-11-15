# Offline tests of the module's policy documents. The provider is the real one, with fake keys and
# every account call skipped, so the documents are rendered locally and nothing reaches an account.
#
# A rendered document gives a single action or resource as a string and several as a list, so every
# Action and Resource is read through flatten([...]).

provider "aws" {
  region                      = "eu-north-1"
  access_key                  = "AKIAFAKEFAKEFAKEFAKE"
  secret_key                  = "fake-secret-key-for-offline-tests-only"
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true
  skip_region_validation      = true
}

variables {
  name_prefix                 = "openvaa"
  environment                 = "staging"
  plan_subjects               = ["repo:OpenVAA/voting-advice-application:pull_request"]
  deploy_subjects             = ["repo:OpenVAA/voting-advice-application:environment:staging"]
  state_bucket_arn            = "arn:aws:s3:::openvaa-tfstate-000000000000"
  pipeline_state_key          = "pipeline/staging/aws/terraform.tfstate"
  registry_arn                = "arn:aws:ecr:eu-north-1:000000000000:repository/openvaa-frontend"
  aws_account_id              = "000000000000"
  aws_region                  = "eu-north-1"
  frontend_execution_role_arn = "arn:aws:iam::000000000000:role/openvaa/openvaa-staging-frontend-execution"
  hosted_zone_id              = "Z00000000000000000001"
  domain                      = "staging.openvaa.org"
}

run "alert_policy" {
  command = plan

  assert {
    condition = (
      flatten([for s in jsondecode(aws_iam_policy.deploy_alert.policy).Statement : flatten([s.Action])])
      == ["sns:Publish"]
    )
    error_message = "The alert policy must grant sns:Publish and no other action."
  }

  assert {
    condition = (
      flatten([for s in jsondecode(aws_iam_policy.deploy_alert.policy).Statement : flatten([s.Resource])])
      == ["arn:aws:sns:eu-north-1:000000000000:openvaa-staging-frontend-deployments"]
    )
    error_message = "The alert policy must name the deployment topic and no other resource."
  }

  assert {
    condition     = length(replace(aws_iam_policy.deploy_alert.policy, "/\\s/", "")) <= 6144
    error_message = "The alert policy exceeds 6,144 characters with white space not counted."
  }
}
