# Example account inputs for a fork. Terraform never loads this file by itself (it loads terraform.tfvars and *.auto.tfvars only): copy the values into terraform.tfvars and replace every stand-in.
#
# The budget alert address is not set in any file: give it per session as TF_VAR_alert_email.
#
# A fork's deployment entries go in deployments.auto.tfvars.json, shaped like example-deployments.json.
aws_account_id = "000000000000"
aws_region     = "eu-north-1"
name_prefix    = "openvaa"
iam_path       = "/openvaa/"

# Must equal the bucket named in backend.tf and in every other root's backend block.
state_bucket_name = "openvaa-tfstate-000000000000"

budget_limit_usd = 100
