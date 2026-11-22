terraform {
  required_version = "~> 1.16"

  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 6.60"
      configuration_aliases = [aws.us_east_1]
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.9"
    }
  }
}

# The container's environment, built from task-environment.json alone. An entry whose source is "value" takes its value from the root; an entry whose source is "parameter" is read by ECS from the parameter store at task start, under an ARN built here as a string, so this module reads no parameter and holds no secret value.
#
# An entry with an `identity_providers` list belongs to bank authentication and is part of the task only when identity_provider_type is one of the providers it lists; with identity_provider_type null, no such entry is, so the task needs neither its value nor its parameter. PUBLIC_IDENTITY_PROVIDER_TYPE is set from identity_provider_type itself.
#
# The lists are filtered entry by entry with `for` expressions, never with a conditional whose other branch is empty, so that every element keeps the same object type.
locals {
  task_environment = jsondecode(file("${path.module}/task-environment.json")).variables

  active = [
    for v in local.task_environment : v
    if try(v.identity_providers, null) == null || contains(try(v.identity_providers, []), coalesce(var.identity_provider_type, "none"))
  ]

  derived_values = { for t in [var.identity_provider_type] : "PUBLIC_IDENTITY_PROVIDER_TYPE" => t if t != null }

  value_names     = [for v in local.active : v.name if v.source == "value"]
  parameter_names = [for v in local.active : v.name if v.source == "parameter"]
  all_names       = [for v in local.task_environment : v.name]

  root_values        = merge(var.environment_values, var.environment_overrides)
  environment_values = merge(local.root_values, local.derived_values)

  # The SHUTDOWN_TIMEOUT the server runs with: adapter-node's default of 30 when the task does not receive one.
  shutdown_timeout = contains(var.omit_environment, "SHUTDOWN_TIMEOUT") ? "30" : lookup(local.environment_values, "SHUTDOWN_TIMEOUT", "30")

  # The entries the task receives: every active entry except those named in omit_environment.
  kept = [for v in local.active : v if !contains(var.omit_environment, v.name)]

  # A missing value becomes null here, so that the task definition's precondition reports it rather than an index error.
  container_environment = [
    for v in local.kept : { name = v.name, value = lookup(local.environment_values, v.name, null) }
    if v.source == "value"
  ]
  container_secrets = [
    for v in local.kept : {
      name      = v.name
      valueFrom = "arn:aws:ssm:${var.aws_region}:${var.aws_account_id}:parameter${var.parameter_path}/${v.name}"
    }
    if v.source == "parameter"
  ]

  missing_values  = [for n in local.value_names : n if !contains(var.omit_environment, n) && !contains(keys(local.environment_values), n)]
  unknown_values  = [for k in keys(local.root_values) : k if !contains(local.value_names, k) || k == "PUBLIC_IDENTITY_PROVIDER_TYPE"]
  unknown_omitted = [for n in var.omit_environment : n if !contains(local.all_names, n)]

  name               = "${var.name_prefix}-${var.environment}"
  origin_domain      = "origin.${var.domain}"
  origin_header_name = "x-origin-verify"
  container_name     = "frontend"
  container_port     = 3000

  # One entry per debug address and port, so that each rule has a stable key.
  debug_ingress = {
    for pair in setproduct(var.debug_ingress_cidrs, [443, 80]) : "${pair[0]}-${pair[1]}" => {
      cidr = pair[0]
      port = pair[1]
    }
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# A public network with no NAT gateway: the tasks reach the registry, the parameter store, the log store and Supabase through the internet gateway on their own public addresses.
resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = local.name
  }
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = {
    Name = local.name
  }
}

# Two subnets in the first two available zones, so that the load balancer spans two zones.
resource "aws_subnet" "public" {
  count = 2

  vpc_id            = aws_vpc.this.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${local.name}-public-${count.index}"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = {
    Name = "${local.name}-public"
  }
}

resource "aws_route_table_association" "public" {
  count = 2

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Both groups carry no inline rule and so no default egress: every path in or out is one of the rule resources below.
resource "aws_security_group" "load_balancer" {
  name        = "${local.name}-load-balancer"
  description = "The frontend load balancer: 443 from CloudFront, 3000 out to the tasks."
  vpc_id      = aws_vpc.this.id

  tags = {
    Name = "${local.name}-load-balancer"
  }
}

resource "aws_security_group" "task" {
  name        = "${local.name}-task"
  description = "The frontend tasks: 3000 from the load balancer, 443 out."
  vpc_id      = aws_vpc.this.id

  tags = {
    Name = "${local.name}-task"
  }
}

data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

# Only CloudFront's origin-facing addresses reach the load balancer. The list weighs 55 of the group's 60 rules, so this is the only rule that names it, for 443 alone.
resource "aws_vpc_security_group_ingress_rule" "load_balancer_from_cloudfront" {
  security_group_id = aws_security_group.load_balancer.id
  description       = "HTTPS from the CloudFront origin-facing prefix list."
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  prefix_list_id    = data.aws_ec2_managed_prefix_list.cloudfront.id
}

# One address on 443 and 80, only while debug_ingress_cidrs lists it, for an observation made from outside CloudFront.
resource "aws_vpc_security_group_ingress_rule" "load_balancer_debug" {
  for_each = local.debug_ingress

  security_group_id = aws_security_group.load_balancer.id
  description       = "A temporary observation address."
  ip_protocol       = "tcp"
  from_port         = each.value.port
  to_port           = each.value.port
  cidr_ipv4         = each.value.cidr
}

resource "aws_vpc_security_group_egress_rule" "load_balancer_to_task" {
  security_group_id            = aws_security_group.load_balancer.id
  description                  = "Requests and health checks to the tasks."
  ip_protocol                  = "tcp"
  from_port                    = local.container_port
  to_port                      = local.container_port
  referenced_security_group_id = aws_security_group.task.id
}

# The only way into a task.
resource "aws_vpc_security_group_ingress_rule" "task_from_load_balancer" {
  security_group_id            = aws_security_group.task.id
  description                  = "Requests and health checks from the load balancer."
  ip_protocol                  = "tcp"
  from_port                    = local.container_port
  to_port                      = local.container_port
  referenced_security_group_id = aws_security_group.load_balancer.id
}

# The tasks reach the image registry, the parameter store, the log store and Supabase over HTTPS.
resource "aws_vpc_security_group_egress_rule" "task_https" {
  security_group_id = aws_security_group.task.id
  description       = "HTTPS to the registry, the parameter store, the log store and Supabase."
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "0.0.0.0/0"
}
