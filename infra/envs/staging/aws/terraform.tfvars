# Tracked on purpose: the public record of this root's inputs. Nothing secret belongs here.
#
# The two values the task reads from the parameter store, the Supabase anon key and the PostHog key,
# are named in the module's task-environment.json and created by the operator under parameter_path,
# never here. environment_overrides, omit_environment and debug_ingress_cidrs are given on the
# command line for one observation and never in this file. alert_email is given as
# TF_VAR_alert_email from the operator's shell. The image's digest is given per plan as
# -var image_digest= and is never written here.
aws_account_id = "471112560111"
aws_region     = "eu-north-1"
environment    = "staging"

name_prefix        = "openvaa"
domain             = "staging.openvaa.org"
registry_url       = "471112560111.dkr.ecr.eu-north-1.amazonaws.com/openvaa-frontend"
execution_role_arn = "arn:aws:iam::471112560111:role/openvaa/openvaa-staging-frontend-execution"
parameter_path     = "/openvaa/staging/frontend"

task_cpu           = 512
task_memory        = 1024
task_floor         = 1
task_ceiling       = 2
log_retention_days = 90

# One line per entry of task-environment.json whose source is "value".
environment_values = {
  PUBLIC_SUPABASE_URL = "https://cofbsatfrdysyphajsky.supabase.co"
  PUBLIC_PROJECT_ID   = "00000000-0000-0000-0000-000000000001"
  ORIGIN              = "https://staging.openvaa.org"
  ADDRESS_HEADER      = "x-forwarded-for"
  # Two proxies stand in front of the server, CloudFront and then the load balancer, and each appends
  # the address it received the request from. The forwarding headers recorded on the running
  # deployment are what confirm this number.
  XFF_DEPTH               = "2"
  KEEP_ALIVE_TIMEOUT      = "65"
  HEADERS_TIMEOUT         = "66"
  SHUTDOWN_TIMEOUT        = "25"
  PUBLIC_LOG_LEVEL        = "warn"
  ANALYTICS_PROVIDER      = "none"
  ANALYTICS_CONSENT_MODE  = "gated"
  ANALYTICS_VISIT_ID_MODE = "memory"
  ANALYTICS_POSTHOG_HOST  = "https://eu.i.posthog.com"
  DEPLOYMENT_DIAGNOSTICS  = "false"
}
