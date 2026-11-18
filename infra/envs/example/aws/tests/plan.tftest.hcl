# Plans the whole template root offline. The providers are mocks because the root's stand-in account
# makes the real provider refuse every credential, and no backend is read. The test loads the root's
# own terraform.tfvars, so the asserts check the values a forker copies.

# The mocks' generated values are random strings. The provider checks some of the arguments that
# receive them, so the resources whose ARNs feed such an argument get ARNs of the right form.
mock_provider "aws" {
  mock_resource "aws_lb" {
    defaults = {
      arn     = "arn:aws:elasticloadbalancing:eu-north-1:000000000000:loadbalancer/app/openvaa-example/0000000000000000"
      zone_id = "Z00000000000000000000"
    }
  }

  mock_resource "aws_lb_target_group" {
    defaults = {
      arn = "arn:aws:elasticloadbalancing:eu-north-1:000000000000:targetgroup/openvaa-example-frontend/0000000000000000"
    }
  }

  mock_resource "aws_lb_listener" {
    defaults = {
      arn = "arn:aws:elasticloadbalancing:eu-north-1:000000000000:listener/app/openvaa-example/0000000000000000/0000000000000000"
    }
  }

  mock_resource "aws_ecs_cluster" {
    defaults = {
      arn = "arn:aws:ecs:eu-north-1:000000000000:cluster/openvaa-example"
      id  = "arn:aws:ecs:eu-north-1:000000000000:cluster/openvaa-example"
    }
  }

  mock_resource "aws_ecs_task_definition" {
    defaults = {
      arn = "arn:aws:ecs:eu-north-1:000000000000:task-definition/openvaa-example-frontend:1"
    }
  }

  # A mock certificate has no validation options, so it gets the one its domain would have.
  mock_resource "aws_acm_certificate" {
    defaults = {
      arn = "arn:aws:acm:eu-north-1:000000000000:certificate/00000000-0000-0000-0000-000000000000"
      domain_validation_options = [
        {
          domain_name           = "origin.vaa.example.org"
          resource_record_name  = "_0000.origin.vaa.example.org."
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
      id = "arn:aws:ecs:eu-north-1:000000000000:service/openvaa-example/openvaa-example-frontend"
    }
  }

  mock_resource "aws_sns_topic" {
    defaults = {
      arn = "arn:aws:sns:eu-north-1:000000000000:openvaa-example-frontend-deployments"
    }
  }

  mock_resource "aws_cloudwatch_event_rule" {
    defaults = {
      arn = "arn:aws:events:eu-north-1:000000000000:rule/openvaa-example-frontend-deployment-failed"
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
          domain_name           = "vaa.example.org"
          resource_record_name  = "_0001.vaa.example.org."
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
}

override_data {
  target = module.frontend.data.aws_availability_zones.available
  values = {
    names = ["eu-north-1a", "eu-north-1b"]
  }
}

# Only the inputs terraform.tfvars leaves to the shell that runs the apply.
variables {
  alert_email  = "alerts@example.org"
  image_digest = "sha256:0000000000000000000000000000000000000000000000000000000000000000"
}

run "example_root_plans_production_shaped" {
  command = plan

  assert {
    condition     = var.task_floor == 2
    error_message = "task_floor must be 2, one task in each of the two availability zones."
  }

  assert {
    condition     = var.task_ceiling == 4
    error_message = "task_ceiling must be 4."
  }

  assert {
    condition     = length(module.frontend.public_subnet_ids) == 2
    error_message = "The public subnets must be two, one per availability zone."
  }

  assert {
    condition     = module.frontend.container_stop_timeout_seconds == 40
    error_message = "The container definition's stopTimeout must be 40, from stop_timeout_seconds in terraform.tfvars."
  }
}
