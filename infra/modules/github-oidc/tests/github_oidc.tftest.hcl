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

run "policy_sizes" {
  command = plan

  assert {
    condition = alltrue([
      for p in [
        aws_iam_policy.deploy_network.policy,
        aws_iam_policy.deploy_load_balancing.policy,
        aws_iam_policy.deploy_ecs.policy,
        aws_iam_policy.deploy_pass_role.policy,
        aws_iam_policy.deploy_edge.policy,
        aws_iam_policy.deploy_dns.policy,
        aws_iam_policy.deploy_observability.policy,
        aws_iam_policy.deploy_scaling.policy,
        aws_iam_policy.deploy_alert.policy,
      ] : length(replace(p, "/\\s/", "")) <= 6144
    ])
    error_message = "A deploy policy exceeds 6,144 characters with white space not counted."
  }

  assert {
    condition = alltrue([
      for p in [
        aws_iam_policy.deploy_network,
        aws_iam_policy.deploy_load_balancing,
        aws_iam_policy.deploy_ecs,
        aws_iam_policy.deploy_pass_role,
        aws_iam_policy.deploy_edge,
        aws_iam_policy.deploy_dns,
        aws_iam_policy.deploy_observability,
        aws_iam_policy.deploy_scaling,
        aws_iam_policy.deploy_alert,
      ] : p.path == "/openvaa/" && startswith(p.name, "openvaa-deploy-")
    ])
    error_message = "Every deploy policy must lie under /openvaa/ and be named openvaa-deploy-<concern>."
  }
}

run "ecr_describe_images" {
  command = plan

  assert {
    condition = contains(
      flatten([for s in jsondecode(aws_iam_policy.ecr_push.policy).Statement : flatten([s.Action])]),
      "ecr:DescribeImages",
    )
    error_message = "The image push policy must allow ecr:DescribeImages, which the build step uses to find an existing tag."
  }

  assert {
    condition = alltrue([
      for s in jsondecode(aws_iam_policy.ecr_push.policy).Statement :
      flatten([s.Resource]) == ["arn:aws:ecr:eu-north-1:000000000000:repository/openvaa-frontend"]
      if contains(flatten([s.Action]), "ecr:DescribeImages")
    ])
    error_message = "ecr:DescribeImages must be scoped to the one image repository."
  }
}

run "iam_actions_are_pass_role_only" {
  command = plan

  assert {
    condition = toset([
      for a in flatten([
        for p in [
          aws_iam_policy.deploy_network.policy,
          aws_iam_policy.deploy_load_balancing.policy,
          aws_iam_policy.deploy_ecs.policy,
          aws_iam_policy.deploy_pass_role.policy,
          aws_iam_policy.deploy_edge.policy,
          aws_iam_policy.deploy_dns.policy,
          aws_iam_policy.deploy_observability.policy,
          aws_iam_policy.deploy_scaling.policy,
          aws_iam_policy.deploy_alert.policy,
        ] : [for s in jsondecode(p).Statement : flatten([s.Action])]
      ]) : a if startswith(a, "iam:")
    ]) == toset(["iam:PassRole"])
    error_message = "iam:PassRole must be the only IAM action of the deploy policies."
  }
}

run "pass_role_scope" {
  command = plan

  assert {
    condition = alltrue([
      for s in jsondecode(aws_iam_policy.deploy_pass_role.policy).Statement :
      flatten([s.Resource]) == ["arn:aws:iam::000000000000:role/openvaa/openvaa-staging-frontend-execution"]
      && flatten([s.Condition.StringEquals["iam:PassedToService"]]) == ["ecs-tasks.amazonaws.com"]
      && keys(s.Condition) == ["StringEquals"]
      && flatten([s.Action]) == ["iam:PassRole"]
    ])
    error_message = "iam:PassRole must name the frontend execution role only, and only for ECS tasks."
  }
}

run "dns_scope" {
  command = plan

  assert {
    condition = alltrue([
      for s in jsondecode(aws_iam_policy.deploy_dns.policy).Statement :
      flatten([s.Resource]) == ["arn:aws:route53:::hostedzone/Z00000000000000000001"]
      && toset(flatten([s.Condition["ForAllValues:StringEquals"]["route53:ChangeResourceRecordSetsRecordTypes"]])) == toset(["A", "AAAA", "CNAME"])
      && toset(flatten([s.Condition["ForAllValues:StringLike"]["route53:ChangeResourceRecordSetsNormalizedRecordNames"]])) == toset(["staging.openvaa.org", "origin.staging.openvaa.org", "_*.staging.openvaa.org"])
      if contains(flatten([s.Action]), "route53:ChangeResourceRecordSets")
    ])
    error_message = "Record changes must be limited to the one zone, the types A, AAAA and CNAME, and the frontend's names."
  }

  assert {
    condition = length([
      for s in jsondecode(aws_iam_policy.deploy_dns.policy).Statement : s
      if contains(flatten([s.Action]), "route53:ChangeResourceRecordSets")
    ]) == 1
    error_message = "Exactly one statement may allow route53:ChangeResourceRecordSets."
  }

  assert {
    condition = !contains(flatten([
      for p in [
        aws_iam_policy.deploy_network.policy,
        aws_iam_policy.deploy_load_balancing.policy,
        aws_iam_policy.deploy_ecs.policy,
        aws_iam_policy.deploy_pass_role.policy,
        aws_iam_policy.deploy_edge.policy,
        aws_iam_policy.deploy_observability.policy,
        aws_iam_policy.deploy_scaling.policy,
        aws_iam_policy.deploy_alert.policy,
      ] : [for s in jsondecode(p).Statement : flatten([s.Action])]
    ]), "route53:ChangeResourceRecordSets")
    error_message = "No deploy policy but the DNS one may allow route53:ChangeResourceRecordSets."
  }
}

run "no_state_or_secret_reads" {
  command = plan

  assert {
    condition = length([
      for a in flatten([
        for p in [
          aws_iam_policy.deploy_network.policy,
          aws_iam_policy.deploy_load_balancing.policy,
          aws_iam_policy.deploy_ecs.policy,
          aws_iam_policy.deploy_pass_role.policy,
          aws_iam_policy.deploy_edge.policy,
          aws_iam_policy.deploy_dns.policy,
          aws_iam_policy.deploy_observability.policy,
          aws_iam_policy.deploy_scaling.policy,
          aws_iam_policy.deploy_alert.policy,
        ] : [for s in jsondecode(p).Statement : flatten([s.Action])]
      ]) : a
      if startswith(a, "s3:") || startswith(a, "ssm:") || startswith(a, "secretsmanager:") || startswith(a, "kms:")
      || contains(["logs:GetLogEvents", "logs:FilterLogEvents", "logs:StartQuery"], a)
      || a == "*" || startswith(a, "logs:Get") || startswith(a, "logs:*")
    ]) == 0
    error_message = "No deploy policy may grant an S3, SSM, Secrets Manager or KMS action, or a read of log events."
  }
}

run "creates_carry_request_tags" {
  command = plan

  # The calls that create a resource the root tags. A statement holding any of them must require the
  # root's Project and Root tags on the request, except the one that grants them on the parent VPC or
  # security group, which network_parent_scope checks.
  variables {
    tagged_creates = [
      "ec2:CreateVpc",
      "ec2:CreateInternetGateway",
      "ec2:CreateSubnet",
      "ec2:CreateRouteTable",
      "ec2:CreateSecurityGroup",
      "ec2:AuthorizeSecurityGroupIngress",
      "ec2:AuthorizeSecurityGroupEgress",
      "elasticloadbalancing:CreateLoadBalancer",
      "elasticloadbalancing:CreateTargetGroup",
      "cloudfront:CreateDistribution",
      "cloudfront:CreateDistributionWithTags",
      "acm:RequestCertificate",
    ]
  }

  assert {
    condition = alltrue([
      for s in flatten([
        for p in [
          aws_iam_policy.deploy_network.policy,
          aws_iam_policy.deploy_load_balancing.policy,
          aws_iam_policy.deploy_edge.policy,
        ] : jsondecode(p).Statement
      ]) :
      contains(flatten([for op, kv in s.Condition : try(flatten([kv["aws:RequestTag/Project"]]), [])]), "openvaa")
      && contains(flatten([for op, kv in s.Condition : try(flatten([kv["aws:RequestTag/Root"]]), [])]), "aws")
      if length(setintersection(toset(flatten([s.Action])), toset(var.tagged_creates))) > 0 && s.Sid != "CreateInTaggedParent"
    ])
    error_message = "Every statement that creates a tagged network, load-balancing, edge or certificate resource must require the request tags Project=openvaa and Root=aws."
  }

  assert {
    condition = length(setsubtract(toset(var.tagged_creates), toset(flatten([
      for p in [
        aws_iam_policy.deploy_network.policy,
        aws_iam_policy.deploy_load_balancing.policy,
        aws_iam_policy.deploy_edge.policy,
      ] : [for s in jsondecode(p).Statement : flatten([s.Action])]
    ])))) == 0
    error_message = "Every tagged create the root makes must be granted, or the check above examines nothing."
  }
}

run "network_parent_scope" {
  command = plan

  # EC2 evaluates the parent of a create, the VPC of a subnet, route table or security group and the
  # security group of a rule, with the parent's own tags as aws:ResourceTag and no aws:RequestTag, so
  # the statement that grants a create on the parent tests resource tags alone.
  assert {
    condition = alltrue([
      for s in jsondecode(aws_iam_policy.deploy_network.policy).Statement :
      contains(flatten([for op, kv in s.Condition : try(flatten([kv["aws:ResourceTag/Project"]]), [])]), "openvaa")
      && contains(flatten([for op, kv in s.Condition : try(flatten([kv["aws:ResourceTag/Root"]]), [])]), "aws")
      && length(flatten([for op, kv in s.Condition : [for k in keys(kv) : k if startswith(k, "aws:RequestTag/")]])) == 0
      && toset(flatten([s.Resource])) == toset([
        "arn:aws:ec2:eu-north-1:000000000000:vpc/*",
        "arn:aws:ec2:eu-north-1:000000000000:security-group/*",
      ])
      if s.Sid == "CreateInTaggedParent"
    ])
    error_message = "The create on a parent VPC or security group must require the parent's Project and Root tags and test no request tag."
  }

  assert {
    condition = length([
      for s in jsondecode(aws_iam_policy.deploy_network.policy).Statement : s if s.Sid == "CreateInTaggedParent"
    ]) == 1
    error_message = "The network policy must hold one CreateInTaggedParent statement, or the check above examines nothing."
  }
}

run "edge_tag_scope" {
  command = plan

  # CloudFront and ACM have no key that limits a tag call to a create, so a tag call that tested the
  # request's tags alone would let the role put the root's tags on any distribution or certificate
  # and then change or delete it. Every tag call of the edge is allowed only on a resource that
  # already carries the root's tags, or is created with them, which aws:ResourceTag covers.
  variables {
    edge_tag_calls = ["cloudfront:TagResource", "acm:AddTagsToCertificate"]
  }

  assert {
    condition = alltrue([
      for s in jsondecode(aws_iam_policy.deploy_edge.policy).Statement :
      contains(flatten([for op, kv in s.Condition : try(flatten([kv["aws:ResourceTag/Project"]]), [])]), "openvaa")
      && contains(flatten([for op, kv in s.Condition : try(flatten([kv["aws:ResourceTag/Root"]]), [])]), "aws")
      if length(setintersection(toset(flatten([s.Action])), toset(var.edge_tag_calls))) > 0
    ])
    error_message = "Every edge statement that allows cloudfront:TagResource or acm:AddTagsToCertificate must require the resource tags Project=openvaa and Root=aws."
  }

  assert {
    condition = length(setsubtract(toset(var.edge_tag_calls), toset(flatten([
      for s in jsondecode(aws_iam_policy.deploy_edge.policy).Statement : flatten([s.Action])
    ])))) == 0
    error_message = "Both edge tag calls must be granted, or the check above examines nothing."
  }

  # CloudFront's developer guide gives CreateDistribution the resource "*", since a distribution's
  # ARN does not exist before it is created.
  assert {
    condition = alltrue([
      for s in jsondecode(aws_iam_policy.deploy_edge.policy).Statement :
      flatten([s.Resource]) == ["*"]
      if contains(flatten([s.Action]), "cloudfront:CreateDistribution")
    ])
    error_message = "cloudfront:CreateDistribution must be granted on the resource \"*\"."
  }

  assert {
    condition = alltrue([
      for s in jsondecode(aws_iam_policy.deploy_edge.policy).Statement :
      toset(flatten([s.Condition["ForAllValues:StringEquals"]["acm:DomainNames"]])) == toset(["staging.openvaa.org", "origin.staging.openvaa.org"])
      && toset(flatten([s.Condition["StringEquals"]["aws:RequestedRegion"]])) == toset(["eu-north-1", "us-east-1"])
      if contains(flatten([s.Action]), "acm:RequestCertificate")
    ])
    error_message = "acm:RequestCertificate must be limited to the frontend's two names and to the root's region and us-east-1."
  }
}

run "scaling_scope" {
  command = plan

  # Application Auto Scaling scopes its scalable-target ARNs by an id, not by the service, so the
  # writes that support them are held to ECS services' desired count by the two condition keys.
  # Tagging supports neither key and stays on the ARN pattern alone.
  variables {
    scaling_writes = [
      "application-autoscaling:RegisterScalableTarget",
      "application-autoscaling:DeregisterScalableTarget",
      "application-autoscaling:PutScalingPolicy",
      "application-autoscaling:DeleteScalingPolicy",
      "application-autoscaling:PutScheduledAction",
      "application-autoscaling:DeleteScheduledAction",
    ]
  }

  assert {
    condition = alltrue([
      for s in jsondecode(aws_iam_policy.deploy_scaling.policy).Statement :
      flatten([s.Condition["StringEquals"]["application-autoscaling:service-namespace"]]) == ["ecs"]
      && flatten([s.Condition["StringEquals"]["application-autoscaling:scalable-dimension"]]) == ["ecs:service:DesiredCount"]
      if length(setintersection(toset(flatten([s.Action])), toset(var.scaling_writes))) > 0
    ])
    error_message = "Every scaling write must be held to the ecs namespace and the ecs:service:DesiredCount dimension."
  }

  assert {
    condition = length(setsubtract(toset(var.scaling_writes), toset(flatten([
      for s in jsondecode(aws_iam_policy.deploy_scaling.policy).Statement : flatten([s.Action])
    ])))) == 0
    error_message = "Every scaling write must be granted, or the check above examines nothing."
  }
}
