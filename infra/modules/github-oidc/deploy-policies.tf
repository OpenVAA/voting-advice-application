# The deploy role's permissions for the one root the pipeline applies: one customer-managed policy per concern, under var.iam_path, each attached to the deploy role by its own role attachment. The resource names are derived from name_prefix and environment exactly as the frontend-service module derives them, so every scope below names that module's resources and nothing else.

locals {
  frontend_name     = "${var.name_prefix}-${var.environment}"
  deployments_topic = "arn:aws:sns:${var.aws_region}:${var.aws_account_id}:${local.frontend_name}-frontend-deployments"

  # The prefix of every regional ARN below.
  regional = "${var.aws_region}:${var.aws_account_id}"

  # The tags the root's providers set on every resource they create.
  root_tags = {
    Project = "openvaa"
    Root    = "aws"
  }

  # The network resource types the root creates, by type.
  network_arns = {
    for t in ["vpc", "internet-gateway", "subnet", "route-table", "security-group", "security-group-rule"] :
    t => "arn:aws:ec2:${local.regional}:${t}/*"
  }

  # The calls that create a tagged network resource, as ec2:CreateAction names them.
  network_create_calls = [
    "CreateVpc",
    "CreateInternetGateway",
    "CreateSubnet",
    "CreateRouteTable",
    "CreateSecurityGroup",
    "AuthorizeSecurityGroupIngress",
    "AuthorizeSecurityGroupEgress",
  ]

  load_balancer_arn = "arn:aws:elasticloadbalancing:${local.regional}:loadbalancer/app/${local.frontend_name}/*"
  target_group_arn  = "arn:aws:elasticloadbalancing:${local.regional}:targetgroup/${local.frontend_name}-frontend/*"

  cluster_arn         = "arn:aws:ecs:${local.regional}:cluster/${local.frontend_name}"
  service_arn         = "arn:aws:ecs:${local.regional}:service/${local.frontend_name}/${local.frontend_name}-frontend"
  task_definition_arn = "arn:aws:ecs:${local.regional}:task-definition/${local.frontend_name}-frontend:*"

  # The viewer certificate lives in us-east-1, where CloudFront reads it; the origin certificate in the root's region.
  certificate_arns = distinct([
    "arn:aws:acm:${local.regional}:certificate/*",
    "arn:aws:acm:us-east-1:${var.aws_account_id}:certificate/*",
  ])

  log_group_arn = "arn:aws:logs:${local.regional}:log-group:/openvaa/${var.environment}/frontend"
}

# The pipeline's own failure alert goes to the topic the rollout alert uses, so both reach the one confirmed subscription.
data "aws_iam_policy_document" "deploy_alert" {
  statement {
    sid       = "PublishPipelineAlert"
    effect    = "Allow"
    actions   = ["sns:Publish"]
    resources = [local.deployments_topic]
  }
}

resource "aws_iam_policy" "deploy_alert" {
  name        = "${var.name_prefix}-deploy-alert"
  path        = var.iam_path
  description = "Publish the pipeline's failure alert to the deployment topic."
  policy      = data.aws_iam_policy_document.deploy_alert.json
}

resource "aws_iam_role_policy_attachment" "deploy_alert" {
  role       = aws_iam_role.deploy.name
  policy_arn = aws_iam_policy.deploy_alert.arn
}

# The eight policies below hold the actions that a refresh, a create, an update and a destroy of the pipeline root make. Every scope is a name the root gives its resources, the tags its providers set on them, the one hosted zone it writes to, or the names its certificates are requested for. Reads and creates that the services do not scope to a resource are granted on every resource, a create held by its request's tags. No statement grants an S3, SSM, Secrets Manager or KMS action or a read of log events, so the deploy role reaches no state but the pipeline key and no secret value.

# Network: a create must carry the root's tags, and a change or delete must find them on the resource it touches. A create that names a parent, a subnet, route table or security group in a VPC or a rule in a security group, is allowed only when the parent carries them as well. EC2 evaluates that parent with its own tags as aws:ResourceTag and without the request's tags, so the parent statement tests resource tags alone and the created resource's statement tests request tags.
data "aws_iam_policy_document" "deploy_network" {
  statement {
    sid       = "ReadNetwork"
    effect    = "Allow"
    actions   = ["ec2:Describe*", "ec2:GetManagedPrefixListEntries"]
    resources = ["*"]
  }

  statement {
    sid       = "CreateTaggedVpc"
    effect    = "Allow"
    actions   = ["ec2:CreateVpc", "ec2:CreateInternetGateway"]
    resources = [local.network_arns["vpc"], local.network_arns["internet-gateway"]]

    dynamic "condition" {
      for_each = local.root_tags
      content {
        test     = "StringEquals"
        variable = "aws:RequestTag/${condition.key}"
        values   = [condition.value]
      }
    }
  }

  statement {
    sid    = "CreateTaggedResource"
    effect = "Allow"
    actions = [
      "ec2:CreateSubnet",
      "ec2:CreateRouteTable",
      "ec2:CreateSecurityGroup",
    ]
    resources = [local.network_arns["subnet"], local.network_arns["route-table"], local.network_arns["security-group"]]

    dynamic "condition" {
      for_each = local.root_tags
      content {
        test     = "StringEquals"
        variable = "aws:RequestTag/${condition.key}"
        values   = [condition.value]
      }
    }
  }

  statement {
    sid       = "CreateTaggedRule"
    effect    = "Allow"
    actions   = ["ec2:AuthorizeSecurityGroupIngress", "ec2:AuthorizeSecurityGroupEgress"]
    resources = [local.network_arns["security-group-rule"]]

    dynamic "condition" {
      for_each = local.root_tags
      content {
        test     = "StringEquals"
        variable = "aws:RequestTag/${condition.key}"
        values   = [condition.value]
      }
    }
  }

  statement {
    sid    = "CreateInTaggedParent"
    effect = "Allow"
    actions = [
      "ec2:CreateSubnet",
      "ec2:CreateRouteTable",
      "ec2:CreateSecurityGroup",
      "ec2:AuthorizeSecurityGroupIngress",
      "ec2:AuthorizeSecurityGroupEgress",
    ]
    resources = [local.network_arns["vpc"], local.network_arns["security-group"]]

    dynamic "condition" {
      for_each = local.root_tags
      content {
        test     = "StringEquals"
        variable = "aws:ResourceTag/${condition.key}"
        values   = [condition.value]
      }
    }
  }

  statement {
    sid       = "TagOnCreate"
    effect    = "Allow"
    actions   = ["ec2:CreateTags"]
    resources = values(local.network_arns)

    condition {
      test     = "StringEquals"
      variable = "ec2:CreateAction"
      values   = local.network_create_calls
    }

    dynamic "condition" {
      for_each = local.root_tags
      content {
        test     = "StringEquals"
        variable = "aws:RequestTag/${condition.key}"
        values   = [condition.value]
      }
    }
  }

  statement {
    sid    = "ChangeTaggedNetwork"
    effect = "Allow"
    actions = [
      "ec2:DeleteVpc",
      "ec2:ModifyVpcAttribute",
      "ec2:AttachInternetGateway",
      "ec2:DetachInternetGateway",
      "ec2:DeleteInternetGateway",
      "ec2:DeleteSubnet",
      "ec2:ModifySubnetAttribute",
      "ec2:DeleteRouteTable",
      "ec2:CreateRoute",
      "ec2:ReplaceRoute",
      "ec2:DeleteRoute",
      "ec2:AssociateRouteTable",
      "ec2:DisassociateRouteTable",
      "ec2:DeleteSecurityGroup",
      "ec2:RevokeSecurityGroupIngress",
      "ec2:RevokeSecurityGroupEgress",
      "ec2:ModifySecurityGroupRules",
      "ec2:UpdateSecurityGroupRuleDescriptionsIngress",
      "ec2:UpdateSecurityGroupRuleDescriptionsEgress",
      "ec2:CreateTags",
      "ec2:DeleteTags",
    ]
    resources = values(local.network_arns)

    dynamic "condition" {
      for_each = local.root_tags
      content {
        test     = "StringEquals"
        variable = "aws:ResourceTag/${condition.key}"
        values   = [condition.value]
      }
    }
  }
}

resource "aws_iam_policy" "deploy_network" {
  name        = "${var.name_prefix}-deploy-network"
  path        = var.iam_path
  description = "Create, change and delete the pipeline root's tagged VPC, subnets, routes, gateway and security groups."
  policy      = data.aws_iam_policy_document.deploy_network.json
}

resource "aws_iam_role_policy_attachment" "deploy_network" {
  role       = aws_iam_role.deploy.name
  policy_arn = aws_iam_policy.deploy_network.arn
}

# Load balancing: the load balancer and target group are created with the root's tags; they, their listeners and the listener rules are changed by name.
data "aws_iam_policy_document" "deploy_load_balancing" {
  statement {
    sid       = "ReadLoadBalancing"
    effect    = "Allow"
    actions   = ["elasticloadbalancing:Describe*"]
    resources = ["*"]
  }

  statement {
    sid    = "CreateTaggedLoadBalancing"
    effect = "Allow"
    actions = [
      "elasticloadbalancing:CreateLoadBalancer",
      "elasticloadbalancing:CreateTargetGroup",
      "elasticloadbalancing:AddTags",
    ]
    resources = [local.load_balancer_arn, local.target_group_arn]

    dynamic "condition" {
      for_each = local.root_tags
      content {
        test     = "StringEquals"
        variable = "aws:RequestTag/${condition.key}"
        values   = [condition.value]
      }
    }
  }

  statement {
    sid    = "ChangeLoadBalancing"
    effect = "Allow"
    actions = [
      "elasticloadbalancing:DeleteLoadBalancer",
      "elasticloadbalancing:ModifyLoadBalancerAttributes",
      "elasticloadbalancing:SetSecurityGroups",
      "elasticloadbalancing:SetSubnets",
      "elasticloadbalancing:DeleteTargetGroup",
      "elasticloadbalancing:ModifyTargetGroup",
      "elasticloadbalancing:ModifyTargetGroupAttributes",
      "elasticloadbalancing:CreateListener",
      "elasticloadbalancing:DeleteListener",
      "elasticloadbalancing:ModifyListener",
      "elasticloadbalancing:ModifyListenerAttributes",
      "elasticloadbalancing:CreateRule",
      "elasticloadbalancing:DeleteRule",
      "elasticloadbalancing:ModifyRule",
      "elasticloadbalancing:SetRulePriorities",
      "elasticloadbalancing:AddTags",
      "elasticloadbalancing:RemoveTags",
    ]
    resources = [
      local.load_balancer_arn,
      local.target_group_arn,
      "arn:aws:elasticloadbalancing:${local.regional}:listener/app/${local.frontend_name}/*",
      "arn:aws:elasticloadbalancing:${local.regional}:listener-rule/app/${local.frontend_name}/*",
    ]
  }
}

resource "aws_iam_policy" "deploy_load_balancing" {
  name        = "${var.name_prefix}-deploy-load-balancing"
  path        = var.iam_path
  description = "Create, change and delete the pipeline root's load balancer, target group, listeners and listener rules."
  policy      = data.aws_iam_policy_document.deploy_load_balancing.json
}

resource "aws_iam_role_policy_attachment" "deploy_load_balancing" {
  role       = aws_iam_role.deploy.name
  policy_arn = aws_iam_policy.deploy_load_balancing.arn
}

# ECS: the cluster and the service by name. Task definitions are registered and deregistered on every resource, because ECS scopes neither action to one; their tags are scoped to the family.
data "aws_iam_policy_document" "deploy_ecs" {
  statement {
    sid       = "ReadEcs"
    effect    = "Allow"
    actions   = ["ecs:Describe*", "ecs:List*"]
    resources = ["*"]
  }

  statement {
    sid       = "TaskDefinitions"
    effect    = "Allow"
    actions   = ["ecs:RegisterTaskDefinition", "ecs:DeregisterTaskDefinition"]
    resources = ["*"]
  }

  statement {
    sid       = "Cluster"
    effect    = "Allow"
    actions   = ["ecs:CreateCluster", "ecs:DeleteCluster", "ecs:UpdateCluster"]
    resources = [local.cluster_arn]
  }

  statement {
    sid       = "Service"
    effect    = "Allow"
    actions   = ["ecs:CreateService", "ecs:UpdateService", "ecs:DeleteService"]
    resources = [local.service_arn]
  }

  statement {
    sid       = "Tags"
    effect    = "Allow"
    actions   = ["ecs:TagResource", "ecs:UntagResource"]
    resources = [local.cluster_arn, local.service_arn, local.task_definition_arn]
  }
}

resource "aws_iam_policy" "deploy_ecs" {
  name        = "${var.name_prefix}-deploy-ecs"
  path        = var.iam_path
  description = "Register the frontend's task definitions and create, change and delete its ECS cluster and service."
  policy      = data.aws_iam_policy_document.deploy_ecs.json
}

resource "aws_iam_role_policy_attachment" "deploy_ecs" {
  role       = aws_iam_role.deploy.name
  policy_arn = aws_iam_policy.deploy_ecs.arn
}

# The one IAM action of the deploy role: a task definition names the execution role, and only ECS tasks may receive it.
data "aws_iam_policy_document" "deploy_pass_role" {
  statement {
    sid       = "PassExecutionRole"
    effect    = "Allow"
    actions   = ["iam:PassRole"]
    resources = [var.frontend_execution_role_arn]

    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values   = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "deploy_pass_role" {
  name        = "${var.name_prefix}-deploy-pass-role"
  path        = var.iam_path
  description = "Pass the frontend's execution role to ECS tasks, and no other role to any service."
  policy      = data.aws_iam_policy_document.deploy_pass_role.json
}

resource "aws_iam_role_policy_attachment" "deploy_pass_role" {
  role       = aws_iam_role.deploy.name
  policy_arn = aws_iam_policy.deploy_pass_role.arn
}

# Edge: the distribution and both certificates are created with the root's tags and changed, tagged or deleted only while they carry them. CloudFront and ACM have no condition key that limits a tag call to a create, so no tag call is allowed on the request's tags alone: such a grant could put the root's tags on a distribution or certificate of another owner and so bring it within reach of the change statements. A tag call made as part of a create with tags passes on aws:ResourceTag, which IAM fills from the tags such a request attaches. A distribution's ARN does not exist before it is created, so the create is granted on "*" as CloudFront documents, and a certificate request is held to the frontend's two names and to the regions of the two certificates.
data "aws_iam_policy_document" "deploy_edge" {
  statement {
    sid    = "ReadEdge"
    effect = "Allow"
    actions = [
      "cloudfront:Get*",
      "cloudfront:List*",
      "acm:DescribeCertificate",
      "acm:ListCertificates",
      "acm:ListTagsForCertificate",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "CreateTaggedDistribution"
    effect = "Allow"
    actions = [
      "cloudfront:CreateDistribution",
      "cloudfront:CreateDistributionWithTags",
    ]
    resources = ["*"]

    dynamic "condition" {
      for_each = local.root_tags
      content {
        test     = "StringEquals"
        variable = "aws:RequestTag/${condition.key}"
        values   = [condition.value]
      }
    }
  }

  statement {
    sid    = "ChangeTaggedDistribution"
    effect = "Allow"
    actions = [
      "cloudfront:UpdateDistribution",
      "cloudfront:DeleteDistribution",
      "cloudfront:UntagResource",
    ]
    resources = ["arn:aws:cloudfront::${var.aws_account_id}:distribution/*"]

    dynamic "condition" {
      for_each = local.root_tags
      content {
        test     = "StringEquals"
        variable = "aws:ResourceTag/${condition.key}"
        values   = [condition.value]
      }
    }
  }

  statement {
    sid       = "RequestTaggedCertificate"
    effect    = "Allow"
    actions   = ["acm:RequestCertificate"]
    resources = ["*"]

    condition {
      test     = "ForAllValues:StringEquals"
      variable = "acm:DomainNames"
      values   = [var.domain, "origin.${var.domain}"]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = distinct([var.aws_region, "us-east-1"])
    }

    dynamic "condition" {
      for_each = local.root_tags
      content {
        test     = "StringEquals"
        variable = "aws:RequestTag/${condition.key}"
        values   = [condition.value]
      }
    }
  }

  statement {
    sid    = "ChangeTaggedCertificate"
    effect = "Allow"
    actions = [
      "acm:DeleteCertificate",
      "acm:RemoveTagsFromCertificate",
    ]
    resources = local.certificate_arns

    dynamic "condition" {
      for_each = local.root_tags
      content {
        test     = "StringEquals"
        variable = "aws:ResourceTag/${condition.key}"
        values   = [condition.value]
      }
    }
  }

  statement {
    sid       = "TagOwnedEdge"
    effect    = "Allow"
    actions   = ["cloudfront:TagResource", "acm:AddTagsToCertificate"]
    resources = ["*"]

    dynamic "condition" {
      for_each = local.root_tags
      content {
        test     = "StringEquals"
        variable = "aws:ResourceTag/${condition.key}"
        values   = [condition.value]
      }
    }
  }
}

resource "aws_iam_policy" "deploy_edge" {
  name        = "${var.name_prefix}-deploy-edge"
  path        = var.iam_path
  description = "Create, change and delete the pipeline root's tagged CloudFront distribution and certificates."
  policy      = data.aws_iam_policy_document.deploy_edge.json
}

resource "aws_iam_role_policy_attachment" "deploy_edge" {
  role       = aws_iam_role.deploy.name
  policy_arn = aws_iam_policy.deploy_edge.arn
}

# DNS: record changes in the one zone, of the types A, AAAA and CNAME, at the domain, at its origin name and at the certificate validation names, which begin with an underscore. The zone also holds the mail records of another root: its MX and TXT records are refused by type, and its DKIM records, CNAMEs named <token>._domainkey.<domain>, by name.
data "aws_iam_policy_document" "deploy_dns" {
  statement {
    sid    = "ReadDns"
    effect = "Allow"
    actions = [
      "route53:GetHostedZone",
      "route53:ListHostedZones",
      "route53:ListHostedZonesByName",
      "route53:ListResourceRecordSets",
      "route53:ListTagsForResource",
      "route53:GetChange",
    ]
    resources = ["*"]
  }

  statement {
    sid       = "ChangeFrontendRecords"
    effect    = "Allow"
    actions   = ["route53:ChangeResourceRecordSets"]
    resources = ["arn:aws:route53:::hostedzone/${var.hosted_zone_id}"]

    condition {
      test     = "ForAllValues:StringEquals"
      variable = "route53:ChangeResourceRecordSetsRecordTypes"
      values   = ["A", "AAAA", "CNAME"]
    }

    condition {
      test     = "ForAllValues:StringLike"
      variable = "route53:ChangeResourceRecordSetsNormalizedRecordNames"
      values   = [var.domain, "origin.${var.domain}", "_*.${var.domain}"]
    }
  }
}

resource "aws_iam_policy" "deploy_dns" {
  name        = "${var.name_prefix}-deploy-dns"
  path        = var.iam_path
  description = "Change the frontend's A, AAAA and CNAME records in the staging zone, and no other record."
  policy      = data.aws_iam_policy_document.deploy_dns.json
}

resource "aws_iam_role_policy_attachment" "deploy_dns" {
  role       = aws_iam_role.deploy.name
  policy_arn = aws_iam_policy.deploy_dns.arn
}

# Observability: the frontend's log group, the deployment topic and its subscriptions, and the rule that reports a failed rollout, each by name. The log group's settings are reachable; its events are not.
data "aws_iam_policy_document" "deploy_observability" {
  statement {
    sid       = "ReadLogGroups"
    effect    = "Allow"
    actions   = ["logs:DescribeLogGroups", "logs:ListTagsForResource"]
    resources = ["*"]
  }

  statement {
    sid    = "LogGroup"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:DeleteLogGroup",
      "logs:PutRetentionPolicy",
      "logs:DeleteRetentionPolicy",
      "logs:TagResource",
      "logs:UntagResource",
      "logs:TagLogGroup",
      "logs:ListTagsLogGroup",
    ]
    resources = [local.log_group_arn, "${local.log_group_arn}:*"]
  }

  statement {
    sid    = "DeploymentTopic"
    effect = "Allow"
    actions = [
      "sns:CreateTopic",
      "sns:DeleteTopic",
      "sns:GetTopicAttributes",
      "sns:SetTopicAttributes",
      "sns:Subscribe",
      "sns:Unsubscribe",
      "sns:GetSubscriptionAttributes",
      "sns:ListSubscriptionsByTopic",
      "sns:TagResource",
      "sns:UntagResource",
      "sns:ListTagsForResource",
    ]
    resources = [local.deployments_topic, "${local.deployments_topic}:*"]
  }

  statement {
    sid    = "DeploymentFailedRule"
    effect = "Allow"
    actions = [
      "events:PutRule",
      "events:DeleteRule",
      "events:DescribeRule",
      "events:PutTargets",
      "events:RemoveTargets",
      "events:ListTargetsByRule",
      "events:TagResource",
      "events:UntagResource",
      "events:ListTagsForResource",
    ]
    resources = ["arn:aws:events:${local.regional}:rule/${local.frontend_name}-frontend-deployment-failed"]
  }
}

resource "aws_iam_policy" "deploy_observability" {
  name        = "${var.name_prefix}-deploy-observability"
  path        = var.iam_path
  description = "Create, change and delete the frontend's log group, deployment topic and failed-rollout rule, without reading log events."
  policy      = data.aws_iam_policy_document.deploy_observability.json
}

resource "aws_iam_role_policy_attachment" "deploy_observability" {
  role       = aws_iam_role.deploy.name
  policy_arn = aws_iam_policy.deploy_observability.arn
}

# Scaling: the service's scalable target, its policies and scheduled actions, and the alarms target tracking creates and deletes in the caller's name. A scalable target's ARN carries an id rather than the service, so the writes are held to the desired count of an ECS service by the two condition keys the service authorization reference lists for them; tagging supports neither key.
data "aws_iam_policy_document" "deploy_scaling" {
  statement {
    sid    = "ReadScaling"
    effect = "Allow"
    actions = [
      "application-autoscaling:Describe*",
      "application-autoscaling:ListTagsForResource",
      "cloudwatch:DescribeAlarms",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "ScalableTarget"
    effect = "Allow"
    actions = [
      "application-autoscaling:RegisterScalableTarget",
      "application-autoscaling:DeregisterScalableTarget",
      "application-autoscaling:PutScalingPolicy",
      "application-autoscaling:DeleteScalingPolicy",
      "application-autoscaling:PutScheduledAction",
      "application-autoscaling:DeleteScheduledAction",
    ]
    resources = ["arn:aws:application-autoscaling:${local.regional}:scalable-target/*"]

    condition {
      test     = "StringEquals"
      variable = "application-autoscaling:service-namespace"
      values   = ["ecs"]
    }

    condition {
      test     = "StringEquals"
      variable = "application-autoscaling:scalable-dimension"
      values   = ["ecs:service:DesiredCount"]
    }
  }

  statement {
    sid    = "ScalableTargetTags"
    effect = "Allow"
    actions = [
      "application-autoscaling:TagResource",
      "application-autoscaling:UntagResource",
    ]
    resources = ["arn:aws:application-autoscaling:${local.regional}:scalable-target/*"]
  }

  statement {
    sid       = "TargetTrackingAlarms"
    effect    = "Allow"
    actions   = ["cloudwatch:PutMetricAlarm", "cloudwatch:DeleteAlarms"]
    resources = ["arn:aws:cloudwatch:${local.regional}:alarm:TargetTracking-service/${local.frontend_name}/${local.frontend_name}-frontend-*"]
  }
}

resource "aws_iam_policy" "deploy_scaling" {
  name        = "${var.name_prefix}-deploy-scaling"
  path        = var.iam_path
  description = "Register the frontend service's scalable target, its scaling policy and scheduled actions, and the alarms of target tracking."
  policy      = data.aws_iam_policy_document.deploy_scaling.json
}

resource "aws_iam_role_policy_attachment" "deploy_scaling" {
  role       = aws_iam_role.deploy.name
  policy_arn = aws_iam_policy.deploy_scaling.arn
}
