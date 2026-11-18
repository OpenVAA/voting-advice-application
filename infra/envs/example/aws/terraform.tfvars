# Tracked on purpose: the public record of this root's inputs, with stand-in values. Nothing secret
# belongs here.
#
# The two values the task reads from the parameter store, the Supabase anon key and the PostHog key,
# are named in the module's task-environment.json and created under parameter_path in the parameter
# store, never here. environment_overrides, omit_environment and debug_ingress_cidrs are given on the
# command line for one observation and never in this file. alert_email is given as
# TF_VAR_alert_email from the shell that runs the apply. The image's digest is given per plan as
# -var image_digest= and is never written here.

# A stand-in. The provider refuses credentials for any account other than this one, so the root
# cannot be applied until this value is replaced with your own account id.
aws_account_id = "000000000000"
aws_region     = "eu-north-1"
environment    = "example"

name_prefix = "openvaa"

# A stand-in. Replace with the domain your deployment serves, the name of the public hosted zone of
# your dns-mail root.
domain = "vaa.example.org"

# A stand-in. Replace with the URL of the image repository your bootstrap root creates, without a tag.
registry_url = "000000000000.dkr.ecr.eu-north-1.amazonaws.com/openvaa-frontend"

# A stand-in. Replace with the frontend_execution_role_arn output of your bootstrap root.
execution_role_arn = "arn:aws:iam::000000000000:role/openvaa/openvaa-example-frontend-execution"

parameter_path = "/openvaa/example/frontend"

# Production-shaped: a floor of two keeps one task in each of the two availability zones.
task_cpu           = 512
task_memory        = 1024
task_floor         = 2
task_ceiling       = 4
log_retention_days = 90

# One line per entry of task-environment.json whose source is "value".
environment_values = {
  # A stand-in. Replace with the API URL of your Supabase project.
  PUBLIC_SUPABASE_URL = "https://REPLACE-ME.supabase.co"
  PUBLIC_PROJECT_ID   = "00000000-0000-0000-0000-000000000001"
  # A stand-in. Replace with https:// and the domain above.
  ORIGIN         = "https://vaa.example.org"
  ADDRESS_HEADER = "x-forwarded-for"
  # Two proxies stand in front of the server, CloudFront and then the load balancer, and each appends
  # the address it received the request from.
  XFF_DEPTH                   = "2"
  KEEP_ALIVE_TIMEOUT          = "65"
  HEADERS_TIMEOUT             = "66"
  SHUTDOWN_TIMEOUT            = "25"
  PUBLIC_LOG_LEVEL            = "warn"
  ANALYTICS_PROVIDER          = "none"
  ANALYTICS_CONSENT_MODE      = "gated"
  ANALYTICS_VISIT_ID_MODE     = "memory"
  ANALYTICS_POSTHOG_HOST      = "https://eu.i.posthog.com"
  ANALYTICS_FLUSH_INTERVAL_MS = "2000"
  DEPLOYMENT_DIAGNOSTICS      = "false"
}
