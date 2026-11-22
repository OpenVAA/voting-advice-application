# Offline tests of the module's logic. Both AWS providers are mocks, so no run reads or changes an account; the random provider is the real one, which needs no credential.

# The mocks' generated values are random strings. The provider checks some of the arguments that receive them, so the resources whose ARNs feed such an argument get ARNs of the right form.
mock_provider "aws" {
  mock_resource "aws_lb" {
    defaults = {
      arn     = "arn:aws:elasticloadbalancing:eu-north-1:000000000000:loadbalancer/app/openvaa-test/0000000000000000"
      zone_id = "Z00000000000000000000"
    }
  }

  mock_resource "aws_lb_target_group" {
    defaults = {
      arn = "arn:aws:elasticloadbalancing:eu-north-1:000000000000:targetgroup/openvaa-test-frontend/0000000000000000"
    }
  }

  mock_resource "aws_lb_listener" {
    defaults = {
      arn = "arn:aws:elasticloadbalancing:eu-north-1:000000000000:listener/app/openvaa-test/0000000000000000/0000000000000000"
    }
  }

  mock_resource "aws_ecs_cluster" {
    defaults = {
      arn = "arn:aws:ecs:eu-north-1:000000000000:cluster/openvaa-test"
      id  = "arn:aws:ecs:eu-north-1:000000000000:cluster/openvaa-test"
    }
  }

  mock_resource "aws_ecs_task_definition" {
    defaults = {
      arn = "arn:aws:ecs:eu-north-1:000000000000:task-definition/openvaa-test-frontend:1"
    }
  }

  # A mock certificate has no validation options, so it gets the one its domain would have.
  mock_resource "aws_acm_certificate" {
    defaults = {
      arn = "arn:aws:acm:eu-north-1:000000000000:certificate/00000000-0000-0000-0000-000000000000"
      domain_validation_options = [
        {
          domain_name           = "origin.test.example.org"
          resource_record_name  = "_0000.origin.test.example.org."
          resource_record_type  = "CNAME"
          resource_record_value = "_0000.acm-validations.aws."
        },
      ]
    }
  }

  mock_resource "aws_acm_certificate_validation" {
    defaults = {
      certificate_arn = "arn:aws:acm:eu-north-1:000000000000:certificate/00000000-0000-0000-0000-000000000000"
    }
  }

  mock_resource "aws_ecs_service" {
    defaults = {
      id = "arn:aws:ecs:eu-north-1:000000000000:service/openvaa-test/openvaa-test-frontend"
    }
  }

  mock_resource "aws_sns_topic" {
    defaults = {
      arn = "arn:aws:sns:eu-north-1:000000000000:openvaa-test-frontend-deployments"
    }
  }

  mock_resource "aws_cloudwatch_event_rule" {
    defaults = {
      arn = "arn:aws:events:eu-north-1:000000000000:rule/openvaa-test-frontend-deployment-failed"
    }
  }

  mock_data "aws_route53_zone" {
    defaults = {
      zone_id = "Z00000000000000000001"
    }
  }
}

mock_provider "aws" {
  alias = "us_east_1"

  mock_resource "aws_acm_certificate" {
    defaults = {
      arn = "arn:aws:acm:us-east-1:000000000000:certificate/00000000-0000-0000-0000-000000000001"
      domain_validation_options = [
        {
          domain_name           = "test.example.org"
          resource_record_name  = "_0001.test.example.org."
          resource_record_type  = "CNAME"
          resource_record_value = "_0001.acm-validations.aws."
        },
      ]
    }
  }

  mock_resource "aws_acm_certificate_validation" {
    defaults = {
      certificate_arn = "arn:aws:acm:us-east-1:000000000000:certificate/00000000-0000-0000-0000-000000000001"
    }
  }

  mock_resource "aws_wafv2_web_acl" {
    defaults = {
      arn = "arn:aws:wafv2:us-east-1:000000000000:global/webacl/openvaa-test-relay/00000000-0000-0000-0000-000000000000"
    }
  }
}

override_data {
  target = data.aws_availability_zones.available
  values = {
    names = ["eu-north-1a", "eu-north-1b"]
  }
}

variables {
  name_prefix        = "openvaa"
  environment        = "test"
  domain             = "test.example.org"
  aws_account_id     = "000000000000"
  aws_region         = "eu-north-1"
  registry_url       = "000000000000.dkr.ecr.eu-north-1.amazonaws.com/openvaa-frontend"
  image_digest       = "sha256:0000000000000000000000000000000000000000000000000000000000000000"
  execution_role_arn = "arn:aws:iam::000000000000:role/openvaa/openvaa-test-frontend-execution"
  parameter_path     = "/openvaa/test/frontend"
  alert_email        = "alerts@example.org"
  environment_values = {
    PUBLIC_SUPABASE_URL         = "https://example.supabase.co"
    PUBLIC_PROJECT_ID           = "00000000-0000-0000-0000-000000000001"
    ORIGIN                      = "https://test.example.org"
    ADDRESS_HEADER              = "x-forwarded-for"
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
}

run "environment_split" {
  command = apply

  assert {
    condition = (
      sort([for e in jsondecode(aws_ecs_task_definition.app.container_definitions)[0].environment : e.name])
      == sort([for v in jsondecode(file("${path.module}/task-environment.json")).variables : v.name if v.source == "value" && try(v.identity_providers, null) == null])
    )
    error_message = "With no identity provider, the container's environment must hold exactly the list's value entries that name no identity provider."
  }

  assert {
    condition = (
      sort([for s in jsondecode(aws_ecs_task_definition.app.container_definitions)[0].secrets : s.name])
      == tolist(["ANALYTICS_POSTHOG_KEY", "PUBLIC_SUPABASE_ANON_KEY"])
    )
    error_message = "The container's secrets must be exactly the anon key and the PostHog key."
  }

  assert {
    condition = one([
      for s in jsondecode(aws_ecs_task_definition.app.container_definitions)[0].secrets : s.valueFrom
      if s.name == "ANALYTICS_POSTHOG_KEY"
    ]) == "arn:aws:ssm:eu-north-1:000000000000:parameter/openvaa/test/frontend/ANALYTICS_POSTHOG_KEY"
    error_message = "A parameter's ARN must be built from the region, the account and the parameter path."
  }

  assert {
    condition = one([
      for e in jsondecode(aws_ecs_task_definition.app.container_definitions)[0].environment : e.value
      if e.name == "XFF_DEPTH"
    ]) == "2"
    error_message = "A value entry must carry the value the root gives it."
  }

  assert {
    condition     = jsondecode(aws_ecs_task_definition.app.container_definitions)[0].image == "000000000000.dkr.ecr.eu-north-1.amazonaws.com/openvaa-frontend@sha256:0000000000000000000000000000000000000000000000000000000000000000"
    error_message = "The image must be the repository URL and the digest."
  }

  assert {
    condition     = length(output.task_environment_names) == 17
    error_message = "With nothing omitted, the task must receive every entry of the list."
  }
}

run "identity_provider_signicat" {
  command = apply

  variables {
    identity_provider_type = "signicat-ftn"
    environment_overrides = {
      PUBLIC_IDENTITY_PROVIDER_CLIENT_ID              = "client"
      IDENTITY_PROVIDER_JWKS_URI                      = "https://example.signicat.com/auth/open/.well-known/openid-configuration/jwks"
      IDENTITY_PROVIDER_ISSUER                        = "https://example.signicat.com/auth/open"
      PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT = "https://example.signicat.com/auth/open/connect/authorize"
      IDENTITY_PROVIDER_TOKEN_ENDPOINT                = "https://example.signicat.com/auth/open/connect/token"
    }
  }

  assert {
    condition = (
      sort([for s in jsondecode(aws_ecs_task_definition.app.container_definitions)[0].secrets : s.name])
      == tolist(["ANALYTICS_POSTHOG_KEY", "IDENTITY_CALLBACK_SERVER_SECRET", "IDENTITY_PROVIDER_CLIENT_SECRET", "IDENTITY_PROVIDER_DECRYPTION_JWKS", "PUBLIC_SUPABASE_ANON_KEY"])
    )
    error_message = "With Signicat, the secrets must add the callback secret, the decryption keys and Signicat's client secret."
  }

  assert {
    condition = one([
      for e in jsondecode(aws_ecs_task_definition.app.container_definitions)[0].environment : e.value
      if e.name == "PUBLIC_IDENTITY_PROVIDER_TYPE"
    ]) == "signicat-ftn"
    error_message = "PUBLIC_IDENTITY_PROVIDER_TYPE must be identity_provider_type."
  }

  assert {
    condition     = length([for n in output.task_environment_names : n if startswith(n, "IDURA_")]) == 0 && length(output.task_environment_names) == 17 + 9
    error_message = "With Signicat, the task must receive the nine entries that name it and no Idura entry."
  }
}

run "identity_provider_idura" {
  command = apply

  variables {
    identity_provider_type = "idura-ftn"
    environment_overrides = {
      PUBLIC_IDENTITY_PROVIDER_CLIENT_ID = "urn:example:client"
      IDENTITY_PROVIDER_JWKS_URI         = "https://example.idura.broker/.well-known/jwks"
      IDENTITY_PROVIDER_ISSUER           = "https://example.idura.broker"
      IDURA_DOMAIN                       = "example.idura.broker"
      IDURA_SIGNING_KEY_KID              = "signing-1"
    }
  }

  assert {
    condition = (
      sort([for s in jsondecode(aws_ecs_task_definition.app.container_definitions)[0].secrets : s.name])
      == tolist(["ANALYTICS_POSTHOG_KEY", "IDENTITY_CALLBACK_SERVER_SECRET", "IDENTITY_PROVIDER_DECRYPTION_JWKS", "IDURA_SIGNING_JWKS", "PUBLIC_SUPABASE_ANON_KEY"])
    )
    error_message = "With Idura, the secrets must add the callback secret, the decryption keys and the signing keys."
  }

  assert {
    condition     = !contains(output.task_environment_names, "PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT") && !contains(output.task_environment_names, "IDENTITY_PROVIDER_CLIENT_SECRET")
    error_message = "With Idura, the task must receive no Signicat entry."
  }
}

run "identity_provider_value_without_provider_fails" {
  command = plan

  variables {
    environment_overrides = {
      PUBLIC_IDENTITY_PROVIDER_CLIENT_ID = "client"
    }
  }

  expect_failures = [aws_ecs_task_definition.app]
}

run "identity_provider_without_its_values_fails" {
  command = plan

  variables {
    identity_provider_type = "signicat-ftn"
  }

  expect_failures = [aws_ecs_task_definition.app]
}

run "identity_provider_type_given_as_a_value_fails" {
  command = plan

  variables {
    identity_provider_type = "idura-ftn"
    environment_overrides = {
      PUBLIC_IDENTITY_PROVIDER_TYPE      = "idura-ftn"
      PUBLIC_IDENTITY_PROVIDER_CLIENT_ID = "urn:example:client"
      IDENTITY_PROVIDER_JWKS_URI         = "https://example.idura.broker/.well-known/jwks"
      IDENTITY_PROVIDER_ISSUER           = "https://example.idura.broker"
      IDURA_DOMAIN                       = "example.idura.broker"
      IDURA_SIGNING_KEY_KID              = "signing-1"
    }
  }

  expect_failures = [aws_ecs_task_definition.app]
}

run "identity_provider_type_refuses_an_unknown_provider" {
  command = plan

  variables {
    identity_provider_type = "bankid"
  }

  expect_failures = [var.identity_provider_type]
}

run "omit_removes_an_entry" {
  command = apply

  variables {
    omit_environment = ["ORIGIN"]
  }

  assert {
    condition     = !contains([for e in jsondecode(aws_ecs_task_definition.app.container_definitions)[0].environment : e.name], "ORIGIN")
    error_message = "An omitted name must not reach the container's environment."
  }

  assert {
    condition     = !contains(output.task_environment_names, "ORIGIN") && length(output.task_environment_names) == 16
    error_message = "An omitted name must be the only one missing from the task's names."
  }
}

run "omit_removes_a_parameter" {
  command = apply

  variables {
    omit_environment = ["ANALYTICS_POSTHOG_KEY"]
  }

  assert {
    condition     = [for s in jsondecode(aws_ecs_task_definition.app.container_definitions)[0].secrets : s.name] == ["PUBLIC_SUPABASE_ANON_KEY"]
    error_message = "An omitted parameter must not reach the container's secrets."
  }
}

run "override_wins" {
  command = apply

  variables {
    environment_overrides = {
      DEPLOYMENT_DIAGNOSTICS = "true"
    }
  }

  assert {
    condition = one([
      for e in jsondecode(aws_ecs_task_definition.app.container_definitions)[0].environment : e.value
      if e.name == "DEPLOYMENT_DIAGNOSTICS"
    ]) == "true"
    error_message = "An override must replace the value of the same name."
  }
}

run "missing_value_fails" {
  command = plan

  variables {
    environment_values = {
      PUBLIC_SUPABASE_URL = "https://example.supabase.co"
    }
  }

  expect_failures = [aws_ecs_task_definition.app]
}

run "unknown_key_fails" {
  command = plan

  variables {
    environment_overrides = {
      PUBLIC_SUPABASE_ANON_KEY = "not-a-value-entry"
    }
  }

  expect_failures = [aws_ecs_task_definition.app]
}

run "unknown_omitted_name_fails" {
  command = plan

  variables {
    omit_environment = ["NOT_IN_THE_LIST"]
  }

  expect_failures = [aws_ecs_task_definition.app]
}

run "omitted_value_needs_no_value" {
  command = plan

  variables {
    omit_environment = ["ORIGIN"]
    environment_values = {
      PUBLIC_SUPABASE_URL         = "https://example.supabase.co"
      PUBLIC_PROJECT_ID           = "00000000-0000-0000-0000-000000000001"
      ADDRESS_HEADER              = "x-forwarded-for"
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
  }

  assert {
    condition     = !contains([for e in jsondecode(aws_ecs_task_definition.app.container_definitions)[0].environment : e.name], "ORIGIN")
    error_message = "An omitted value entry needs no value and must not reach the container."
  }
}

run "image_digest_refuses_a_commit_id" {
  command = plan

  variables {
    image_digest = "0000000000000000000000000000000000000000"
  }

  expect_failures = [var.image_digest]
}

run "image_digest_refuses_empty" {
  command = plan

  variables {
    image_digest = ""
  }

  expect_failures = [var.image_digest]
}

run "image_digest_refuses_upper_case" {
  command = plan

  variables {
    image_digest = "sha256:ABCDEF0000000000000000000000000000000000000000000000000000000000"
  }

  expect_failures = [var.image_digest]
}

run "debug_ingress_refuses_a_range" {
  command = plan

  variables {
    debug_ingress_cidrs = ["10.0.0.0/8"]
  }

  expect_failures = [var.debug_ingress_cidrs]
}

run "debug_ingress_refuses_ipv6" {
  command = plan

  variables {
    debug_ingress_cidrs = ["2001:db8::1/128"]
  }

  expect_failures = [var.debug_ingress_cidrs]
}

run "execution_role_arn_refuses_another_arn" {
  command = plan

  variables {
    execution_role_arn = "arn:aws:s3:::bucket"
  }

  expect_failures = [var.execution_role_arn]
}

run "parameter_path_refuses_a_trailing_slash" {
  command = plan

  variables {
    parameter_path = "/openvaa/test/frontend/"
  }

  expect_failures = [var.parameter_path]
}

run "log_retention_refuses_an_unoffered_value" {
  command = plan

  variables {
    log_retention_days = 100
  }

  expect_failures = [var.log_retention_days]
}

run "stop_timeout_refuses_above_fargate" {
  command = plan

  variables {
    stop_timeout_seconds = 121
  }

  expect_failures = [var.stop_timeout_seconds]
}

run "task_floor_refuses_zero" {
  command = plan

  variables {
    task_floor = 0
  }

  expect_failures = [var.task_floor]
}

run "one_debug_address_opens_two_rules" {
  command = apply

  variables {
    debug_ingress_cidrs = ["203.0.113.7/32"]
  }

  assert {
    condition     = length(aws_vpc_security_group_ingress_rule.load_balancer_debug) == 2
    error_message = "One debug address must give one rule on 443 and one on 80."
  }

  assert {
    condition = sort([for r in aws_vpc_security_group_ingress_rule.load_balancer_debug : tostring(r.from_port)]) == tolist(["443", "80"]) && alltrue([
      for r in aws_vpc_security_group_ingress_rule.load_balancer_debug :
      r.cidr_ipv4 == "203.0.113.7/32" && r.to_port == r.from_port && r.security_group_id == aws_security_group.load_balancer.id
    ])
    error_message = "The debug rules must admit that one address, on 443 and 80, to the load balancer's group only."
  }
}

run "security_groups" {
  command = apply

  assert {
    condition     = length(aws_vpc_security_group_ingress_rule.load_balancer_debug) == 0
    error_message = "With no debug address there must be no debug rule."
  }

  assert {
    condition = (
      aws_vpc_security_group_ingress_rule.load_balancer_from_cloudfront.prefix_list_id == data.aws_ec2_managed_prefix_list.cloudfront.id
      && aws_vpc_security_group_ingress_rule.load_balancer_from_cloudfront.from_port == 443
      && aws_vpc_security_group_ingress_rule.load_balancer_from_cloudfront.to_port == 443
      && aws_vpc_security_group_ingress_rule.load_balancer_from_cloudfront.security_group_id == aws_security_group.load_balancer.id
    )
    error_message = "The load balancer must admit 443 from the CloudFront prefix list."
  }

  assert {
    condition     = data.aws_ec2_managed_prefix_list.cloudfront.name == "com.amazonaws.global.cloudfront.origin-facing"
    error_message = "The prefix list must be CloudFront's origin-facing list."
  }

  assert {
    condition = (
      aws_vpc_security_group_ingress_rule.task_from_load_balancer.security_group_id == aws_security_group.task.id
      && aws_vpc_security_group_ingress_rule.task_from_load_balancer.referenced_security_group_id == aws_security_group.load_balancer.id
      && aws_vpc_security_group_ingress_rule.task_from_load_balancer.from_port == 3000
      && aws_vpc_security_group_ingress_rule.task_from_load_balancer.to_port == 3000
      && aws_vpc_security_group_ingress_rule.task_from_load_balancer.cidr_ipv4 == null
    )
    error_message = "The task's only ingress must be 3000 from the load balancer's group."
  }

  assert {
    condition = (
      aws_vpc_security_group_egress_rule.load_balancer_to_task.referenced_security_group_id == aws_security_group.task.id
      && aws_vpc_security_group_egress_rule.load_balancer_to_task.from_port == 3000
      && aws_vpc_security_group_egress_rule.task_https.security_group_id == aws_security_group.task.id
      && aws_vpc_security_group_egress_rule.task_https.from_port == 443
      && aws_vpc_security_group_egress_rule.task_https.to_port == 443
      && aws_vpc_security_group_egress_rule.task_https.cidr_ipv4 == "0.0.0.0/0"
    )
    error_message = "The load balancer must send 3000 to the task's group, and the task must send 443 out."
  }
}

# EC2 accepts a security group's or a rule's description only when it is shorter than 256 characters and drawn from a-zA-Z0-9, space and ._-:/()#,@[]+=&;{}!$*. It refuses any other one at apply time, after the resources before it have been created, so the mocks would let it through to a real apply.
# A debug address is set so that the debug rules exist and are checked too.
run "descriptions_use_the_ec2_character_set" {
  command = apply

  variables {
    debug_ingress_cidrs = ["203.0.113.7/32"]
  }

  assert {
    condition = alltrue([
      for description in concat(
        [
          aws_security_group.load_balancer.description,
          aws_security_group.task.description,
          aws_vpc_security_group_ingress_rule.load_balancer_from_cloudfront.description,
          aws_vpc_security_group_egress_rule.load_balancer_to_task.description,
          aws_vpc_security_group_ingress_rule.task_from_load_balancer.description,
          aws_vpc_security_group_egress_rule.task_https.description,
        ],
        [for r in aws_vpc_security_group_ingress_rule.load_balancer_debug : r.description],
      ) : can(regex("^[a-zA-Z0-9. _:/()#,@\\[\\]+=&;{}!$*-]{0,255}$", description))
    ])
    error_message = "Every security group and rule description must be under 256 characters of a-zA-Z0-9, space and ._-:/()#,@[]+=&;{}!$*, which EC2 accepts."
  }

  assert {
    condition     = length(aws_vpc_security_group_ingress_rule.load_balancer_debug) == 2
    error_message = "The debug address must open its two rules, so that their descriptions are checked."
  }
}

run "network" {
  command = apply

  assert {
    condition     = [for s in aws_subnet.public : s.availability_zone] == ["eu-north-1a", "eu-north-1b"]
    error_message = "The two subnets must be in the first two available zones."
  }

  assert {
    condition     = [for s in aws_subnet.public : s.cidr_block] == ["10.40.0.0/24", "10.40.1.0/24"]
    error_message = "The subnets must be the first two /24 blocks of the network."
  }

  assert {
    condition     = length(aws_lb.this.subnets) == 2 && aws_lb.this.load_balancer_type == "application"
    error_message = "The load balancer must be an application load balancer across both subnets."
  }

  assert {
    condition     = aws_lb.this.drop_invalid_header_fields && aws_lb.this.idle_timeout == 60 && !aws_lb.this.enable_deletion_protection
    error_message = "The load balancer must drop invalid header fields, keep idle connections 60 seconds and be deletable."
  }
}

run "service" {
  command = apply

  assert {
    condition = (
      aws_ecs_service.app.deployment_circuit_breaker[0].enable
      && aws_ecs_service.app.deployment_circuit_breaker[0].rollback
    )
    error_message = "The service must roll back a rollout the circuit breaker stops."
  }

  assert {
    condition     = aws_ecs_service.app.network_configuration[0].assign_public_ip
    error_message = "With no NAT gateway the task must have a public address."
  }

  assert {
    condition     = aws_ecs_service.app.propagate_tags == "SERVICE" && aws_ecs_service.app.enable_ecs_managed_tags
    error_message = "The service's tags must reach its tasks."
  }

  assert {
    condition = (
      aws_ecs_service.app.deployment_minimum_healthy_percent == 100
      && aws_ecs_service.app.deployment_maximum_percent == 200
      && aws_ecs_service.app.health_check_grace_period_seconds == 60
      && aws_ecs_service.app.wait_for_steady_state
      && aws_ecs_service.app.desired_count == 1
      && aws_ecs_service.app.launch_type == "FARGATE"
    )
    error_message = "The service must start new tasks before stopping old ones, wait for steady state and start with the floor."
  }

  assert {
    condition     = aws_lb_target_group.app.health_check[0].path == "/api/health" && aws_lb_target_group.app.deregistration_delay == "30"
    error_message = "The target group must check /api/health and drain for 30 seconds."
  }

  assert {
    condition     = aws_lb_target_group.app.target_type == "ip" && aws_lb_target_group.app.port == 3000
    error_message = "The target group must address the tasks by IP on 3000."
  }

  assert {
    condition     = jsondecode(aws_ecs_task_definition.app.container_definitions)[0].stopTimeout == 30
    error_message = "The container must have 30 seconds between the stop signal and the kill."
  }

  assert {
    condition = (
      strcontains(join(" ", jsondecode(aws_ecs_task_definition.app.container_definitions)[0].healthCheck.command), "http://127.0.0.1:3000/api/health")
      && jsondecode(aws_ecs_task_definition.app.container_definitions)[0].healthCheck.startPeriod == 60
    )
    error_message = "The container's own health check must fetch /api/health, with the grace period as its start period."
  }

  assert {
    condition = (
      aws_ecs_task_definition.app.cpu == "512"
      && aws_ecs_task_definition.app.memory == "1024"
      && aws_ecs_task_definition.app.runtime_platform[0].cpu_architecture == "ARM64"
      && aws_ecs_task_definition.app.task_role_arn == null
    )
    error_message = "The task must be 512 CPU and 1024 MiB on ARM64, with no task role."
  }

  assert {
    condition     = aws_cloudwatch_log_group.app.name == "/openvaa/test/frontend" && aws_cloudwatch_log_group.app.retention_in_days == 90
    error_message = "The log group must be /openvaa/<environment>/frontend and keep 90 days."
  }
}

run "listeners" {
  command = apply

  assert {
    condition = (
      aws_lb_listener.https.default_action[0].type == "fixed-response"
      && aws_lb_listener.https.default_action[0].fixed_response[0].status_code == "403"
      && aws_lb_listener.https.port == 443
    )
    error_message = "The 443 listener must answer 403 by default."
  }

  assert {
    condition = (
      length(aws_lb_listener_rule.from_cloudfront.condition) == 1
      && one(aws_lb_listener_rule.from_cloudfront.condition).http_header[0].http_header_name == "x-origin-verify"
      && nonsensitive(one(aws_lb_listener_rule.from_cloudfront.condition).http_header[0].values == toset([random_password.origin_verify.result]))
      && aws_lb_listener_rule.from_cloudfront.action[0].type == "forward"
    )
    error_message = "Only a request carrying the origin secret in x-origin-verify must be forwarded."
  }

  assert {
    condition     = nonsensitive(can(regex("^[A-Za-z0-9]{48}$", random_password.origin_verify.result)))
    error_message = "The origin secret must be 48 letters and digits."
  }

  assert {
    condition = (
      aws_lb_listener.http.port == 80
      && aws_lb_listener.http.default_action[0].type == "redirect"
      && aws_lb_listener.http.default_action[0].redirect[0].protocol == "HTTPS"
      && aws_lb_listener.http.default_action[0].redirect[0].port == "443"
      && aws_lb_listener.http.default_action[0].redirect[0].status_code == "HTTP_301"
    )
    error_message = "The 80 listener must redirect to HTTPS with a 301."
  }

  assert {
    condition     = aws_acm_certificate.origin.domain_name == "origin.test.example.org" && aws_route53_record.origin.name == "origin.test.example.org"
    error_message = "The certificate and the record must be for origin.<domain>."
  }

  assert {
    condition     = length(aws_route53_record.origin_validation) == 1
    error_message = "The certificate must have one validation record."
  }
}

run "cdn" {
  command = apply

  assert {
    condition = (
      length(aws_cloudfront_distribution.this.ordered_cache_behavior) == 1
      && aws_cloudfront_distribution.this.ordered_cache_behavior[0].path_pattern == "/_app/immutable/*"
      && aws_cloudfront_distribution.this.ordered_cache_behavior[0].cache_policy_id == data.aws_cloudfront_cache_policy.optimized.id
      && aws_cloudfront_distribution.this.ordered_cache_behavior[0].viewer_protocol_policy == "redirect-to-https"
      && data.aws_cloudfront_cache_policy.optimized.name == "Managed-CachingOptimized"
    )
    error_message = "Only /_app/immutable/* may be cached, with the managed CachingOptimized policy."
  }

  assert {
    condition = (
      aws_cloudfront_distribution.this.default_cache_behavior[0].cache_policy_id == data.aws_cloudfront_cache_policy.disabled.id
      && aws_cloudfront_distribution.this.default_cache_behavior[0].origin_request_policy_id == data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
      && data.aws_cloudfront_cache_policy.disabled.name == "Managed-CachingDisabled"
      && data.aws_cloudfront_origin_request_policy.all_viewer_except_host.name == "Managed-AllViewerExceptHostHeader"
    )
    error_message = "The default behaviour must cache nothing and forward everything but the viewer's Host."
  }

  assert {
    condition = (
      aws_cloudfront_distribution.this.default_cache_behavior[0].allowed_methods == toset(["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"])
      && aws_cloudfront_distribution.this.default_cache_behavior[0].viewer_protocol_policy == "redirect-to-https"
    )
    error_message = "The default behaviour must allow all seven methods and redirect HTTP to HTTPS."
  }

  assert {
    condition = (
      length(aws_cloudfront_distribution.this.origin) == 1
      && one(aws_cloudfront_distribution.this.origin).domain_name == "origin.test.example.org"
      && one(aws_cloudfront_distribution.this.origin).custom_origin_config[0].origin_protocol_policy == "https-only"
      && [for h in one(aws_cloudfront_distribution.this.origin).custom_header : h.name] == ["x-origin-verify"]
      && nonsensitive(alltrue([for h in one(aws_cloudfront_distribution.this.origin).custom_header : h.value == random_password.origin_verify.result]))
    )
    error_message = "The only origin must be origin.<domain> over HTTPS, carrying the origin secret in x-origin-verify."
  }

  assert {
    condition = (
      length(aws_cloudfront_distribution.this.custom_error_response) == 11
      && alltrue([for r in aws_cloudfront_distribution.this.custom_error_response : r.error_caching_min_ttl == 0])
      && sort([for r in aws_cloudfront_distribution.this.custom_error_response : tostring(r.error_code)]) == sort(["400", "403", "404", "405", "414", "416", "500", "501", "502", "503", "504"])
    )
    error_message = "Every error response must have an error-caching minimum TTL of 0."
  }

  assert {
    condition = (
      aws_cloudfront_distribution.this.aliases == toset(["test.example.org"])
      && aws_cloudfront_distribution.this.price_class == "PriceClass_100"
      && aws_cloudfront_distribution.this.viewer_certificate[0].acm_certificate_arn == aws_acm_certificate_validation.viewer.certificate_arn
      && aws_cloudfront_distribution.this.viewer_certificate[0].ssl_support_method == "sni-only"
      && aws_acm_certificate.viewer.domain_name == "test.example.org"
      && length(aws_route53_record.viewer_validation) == 1
    )
    error_message = "The distribution must serve <domain> with the validated viewer certificate for <domain>."
  }

  assert {
    condition = (
      length(aws_route53_record.apex) == 2
      && sort([for r in aws_route53_record.apex : r.type]) == tolist(["A", "AAAA"])
      && alltrue([for r in aws_route53_record.apex : r.name == "test.example.org" && one(r.alias).name == aws_cloudfront_distribution.this.domain_name])
    )
    error_message = "<domain> must be an A and an AAAA alias to the distribution."
  }

  assert {
    condition     = output.url == "https://test.example.org"
    error_message = "The site's address must be https://<domain>."
  }
}

run "relay_rate_limit_off" {
  command = apply

  assert {
    condition     = length(aws_wafv2_web_acl.relay) == 0
    error_message = "With relay_rate_limit unset the module must create no web ACL."
  }

  assert {
    condition     = aws_cloudfront_distribution.this.web_acl_id == null
    error_message = "With relay_rate_limit unset the distribution must name no web ACL."
  }

  assert {
    condition     = output.relay_web_acl_arn == null && output.distribution_web_acl_id == null
    error_message = "With relay_rate_limit unset both web ACL outputs must be null."
  }
}

run "relay_rate_limit_on" {
  command = apply

  variables {
    relay_rate_limit = {
      limit          = 300
      window_seconds = 300
    }
  }

  assert {
    condition = (
      length(aws_wafv2_web_acl.relay) == 1
      && aws_wafv2_web_acl.relay[0].scope == "CLOUDFRONT"
      && aws_wafv2_web_acl.relay[0].name == "openvaa-test-relay"
      && length(aws_wafv2_web_acl.relay[0].default_action[0].allow) == 1
      && length(aws_wafv2_web_acl.relay[0].rule) == 1
    )
    error_message = "With relay_rate_limit set the module must create one CLOUDFRONT web ACL that allows by default and has one rule."
  }

  assert {
    condition = (
      one(aws_wafv2_web_acl.relay[0].rule).statement[0].rate_based_statement[0].limit == 300
      && one(aws_wafv2_web_acl.relay[0].rule).statement[0].rate_based_statement[0].evaluation_window_sec == 300
      && one(aws_wafv2_web_acl.relay[0].rule).statement[0].rate_based_statement[0].aggregate_key_type == "IP"
    )
    error_message = "The rule must count requests per source address with the given limit and window."
  }

  assert {
    condition = (
      length(one(aws_wafv2_web_acl.relay[0].rule).statement[0].rate_based_statement[0].scope_down_statement[0].byte_match_statement) == 0
      && length(one(aws_wafv2_web_acl.relay[0].rule).statement[0].rate_based_statement[0].scope_down_statement[0].regex_match_statement[0].field_to_match[0].uri_path) == 1
      && [for t in one(aws_wafv2_web_acl.relay[0].rule).statement[0].rate_based_statement[0].scope_down_statement[0].regex_match_statement[0].text_transformation : [t.priority, t.type]] == [[0, "URL_DECODE"], [1, "NORMALIZE_PATH"]]
    )
    error_message = "The rule must match the URI path after URL_DECODE and then NORMALIZE_PATH."
  }

  # The paths are given as WAF sees them after its two transformations: decoded and normalised.
  assert {
    condition = alltrue([
      for path in ["/api/usage", "/api/usage/", "/fi/api/usage", "/en/api/usage", "/lb/api/usage", "/FI/api/usage", "/fi/api/usage/"] :
      can(regex(one(aws_wafv2_web_acl.relay[0].rule).statement[0].rate_based_statement[0].scope_down_statement[0].regex_match_statement[0].regex_string, path))
    ])
    error_message = "The rule must count the relay at /api/usage and behind a locale segment."
  }

  assert {
    condition = !anytrue([
      for path in ["/", "/fi", "/fi/questions", "/api/health", "/api/usages", "/api/usage-other", "/fi/sv/api/usage", "/x/api/usagex", "/questions/api"] :
      can(regex(one(aws_wafv2_web_acl.relay[0].rule).statement[0].rate_based_statement[0].scope_down_statement[0].regex_match_statement[0].regex_string, path))
    ])
    error_message = "The rule must not count a path that is not the relay."
  }

  assert {
    condition     = one(aws_wafv2_web_acl.relay[0].rule).action[0].block[0].custom_response[0].response_code == 429
    error_message = "The rule must block with 429."
  }

  assert {
    condition     = aws_cloudfront_distribution.this.web_acl_id == aws_wafv2_web_acl.relay[0].arn
    error_message = "The distribution must name the web ACL."
  }

  assert {
    condition     = output.relay_web_acl_arn == aws_wafv2_web_acl.relay[0].arn && output.distribution_web_acl_id == aws_wafv2_web_acl.relay[0].arn
    error_message = "With relay_rate_limit set both web ACL outputs must be the web ACL's ARN."
  }
}

run "relay_rate_limit_refuses_a_window" {
  command = plan

  variables {
    relay_rate_limit = {
      limit          = 300
      window_seconds = 90
    }
  }

  expect_failures = [var.relay_rate_limit]
}

run "relay_rate_limit_refuses_below_ten" {
  command = plan

  variables {
    relay_rate_limit = {
      limit          = 9
      window_seconds = 300
    }
  }

  expect_failures = [var.relay_rate_limit]
}

run "relay_rate_limit_refuses_a_fraction" {
  command = plan

  variables {
    relay_rate_limit = {
      limit          = 100.5
      window_seconds = 300
    }
  }

  expect_failures = [var.relay_rate_limit]
}

run "price_class_refuses_an_unknown_class" {
  command = plan

  variables {
    price_class = "PriceClass_50"
  }

  expect_failures = [var.price_class]
}

run "scaling" {
  command = apply

  assert {
    condition = (
      aws_appautoscaling_target.service.min_capacity == 1
      && aws_appautoscaling_target.service.max_capacity == 2
      && aws_appautoscaling_target.service.resource_id == "service/openvaa-test/openvaa-test-frontend"
      && aws_appautoscaling_target.service.scalable_dimension == "ecs:service:DesiredCount"
      && aws_appautoscaling_target.service.service_namespace == "ecs"
    )
    error_message = "The service must be held between the floor and the ceiling."
  }

  assert {
    condition = (
      aws_appautoscaling_policy.cpu.policy_type == "TargetTrackingScaling"
      && aws_appautoscaling_policy.cpu.target_tracking_scaling_policy_configuration[0].predefined_metric_specification[0].predefined_metric_type == "ECSServiceAverageCPUUtilization"
      && aws_appautoscaling_policy.cpu.target_tracking_scaling_policy_configuration[0].target_value == 60
    )
    error_message = "Target tracking must hold the tasks' average CPU at 60 %."
  }

  assert {
    condition     = length(aws_appautoscaling_scheduled_action.floor) == 0
    error_message = "With no scheduled change there must be no scheduled action."
  }
}

run "two_scheduled_changes_make_two_actions" {
  command = apply

  variables {
    schedule_timezone = "Europe/Helsinki"
    scheduled_floor_changes = [
      { name = "raise", schedule = "at(2030-01-01T08:00:00)", min_capacity = 2, max_capacity = 2 },
      { name = "lower", schedule = "at(2030-01-01T09:00:00)", min_capacity = 1, max_capacity = 2 },
    ]
  }

  assert {
    condition     = length(aws_appautoscaling_scheduled_action.floor) == 2
    error_message = "Two scheduled changes must give two scheduled actions."
  }

  assert {
    condition = (
      aws_appautoscaling_scheduled_action.floor["raise"].scalable_target_action[0].min_capacity == "2"
      && aws_appautoscaling_scheduled_action.floor["lower"].scalable_target_action[0].min_capacity == "1"
      && aws_appautoscaling_scheduled_action.floor["raise"].schedule == "at(2030-01-01T08:00:00)"
      && alltrue([for a in aws_appautoscaling_scheduled_action.floor : a.timezone == "Europe/Helsinki" && a.resource_id == aws_appautoscaling_target.service.resource_id])
    )
    error_message = "Each scheduled action must carry its change's schedule and bounds, in the given time zone, on the service."
  }
}

run "deployment_alert" {
  command = apply

  assert {
    condition = (
      jsondecode(aws_cloudwatch_event_rule.deployment_failed.event_pattern).detail.eventName == ["SERVICE_DEPLOYMENT_FAILED"]
      && jsondecode(aws_cloudwatch_event_rule.deployment_failed.event_pattern).resources == [aws_ecs_service.app.id]
      && jsondecode(aws_cloudwatch_event_rule.deployment_failed.event_pattern)["detail-type"] == ["ECS Deployment State Change"]
      && jsondecode(aws_cloudwatch_event_rule.deployment_failed.event_pattern).source == ["aws.ecs"]
    )
    error_message = "The rule must match a failed deployment of this service alone."
  }

  assert {
    condition = (
      aws_cloudwatch_event_target.deployment_failed.arn == aws_sns_topic.deployments.arn
      && aws_cloudwatch_event_target.deployment_failed.rule == aws_cloudwatch_event_rule.deployment_failed.name
      && aws_sns_topic.deployments.kms_master_key_id == null
    )
    error_message = "The rule must publish to the unencrypted deployments topic."
  }

  assert {
    condition = (
      length(jsondecode(aws_sns_topic_policy.deployments.policy).Statement) == 1
      && jsondecode(aws_sns_topic_policy.deployments.policy).Statement[0].Principal == { Service = "events.amazonaws.com" }
      && jsondecode(aws_sns_topic_policy.deployments.policy).Statement[0].Action == "sns:Publish"
      && jsondecode(aws_sns_topic_policy.deployments.policy).Statement[0].Condition.ArnEquals["aws:SourceArn"] == aws_cloudwatch_event_rule.deployment_failed.arn
      && aws_sns_topic_policy.deployments.arn == aws_sns_topic.deployments.arn
    )
    error_message = "Only the deployment rule may publish to the topic."
  }

  assert {
    condition = (
      aws_sns_topic_subscription.operator.protocol == "email"
      && aws_sns_topic_subscription.operator.topic_arn == aws_sns_topic.deployments.arn
      && nonsensitive(aws_sns_topic_subscription.operator.endpoint == "alerts@example.org")
    )
    error_message = "The topic must mail alert_email."
  }
}

run "task_ceiling_refuses_below_the_floor" {
  command = plan

  variables {
    task_floor   = 2
    task_ceiling = 1
  }

  expect_failures = [var.task_ceiling]
}

run "scheduled_change_refuses_min_above_max" {
  command = plan

  variables {
    scheduled_floor_changes = [
      { name = "raise", schedule = "at(2030-01-01T08:00:00)", min_capacity = 3, max_capacity = 2 },
    ]
  }

  expect_failures = [var.scheduled_floor_changes]
}

run "scheduled_change_refuses_a_repeated_name" {
  command = plan

  variables {
    scheduled_floor_changes = [
      { name = "raise", schedule = "at(2030-01-01T08:00:00)", min_capacity = 2, max_capacity = 2 },
      { name = "raise", schedule = "at(2030-01-01T09:00:00)", min_capacity = 1, max_capacity = 2 },
    ]
  }

  expect_failures = [var.scheduled_floor_changes]
}

run "alert_email_refuses_a_non_address" {
  command = plan

  variables {
    alert_email = "operator"
  }

  expect_failures = [var.alert_email]
}
