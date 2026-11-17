terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.60"
    }
  }
}

# The execution role of the frontend's ECS task: the identity the ECS agent uses to pull the image,
# write the container's logs and read the task's secret parameters. The task itself gets no task role,
# because the container calls no AWS API.

locals {
  parameter_path = "/openvaa/${var.environment}/frontend"
}

# A trust policy is a role's resource policy, so it is outside the repository's rule against an inline
# policy. Only the ECS task service may assume the role.
data "aws_iam_policy_document" "trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# The role carries no permission of its own; every permission is a managed policy attached by a
# separate resource.
resource "aws_iam_role" "execution" {
  name               = "${var.name_prefix}-${var.environment}-frontend-execution"
  path               = var.iam_path
  assume_role_policy = data.aws_iam_policy_document.trust.json
}

# With an empty list, the next apply removes any inline policy someone adds to the role by hand.
resource "aws_iam_role_policies_exclusive" "execution" {
  role_name    = aws_iam_role.execution.name
  policy_names = []
}

# Pulling the image from the registry and writing the container's log streams.
resource "aws_iam_role_policy_attachment" "managed" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# The AWS-managed key that encrypts SecureString parameters by default. AWS creates it the first time a
# SecureString parameter uses it, so this read fails until one does.
data "aws_kms_alias" "ssm" {
  name = "alias/aws/ssm"
}

# The role reads the parameters under one environment's frontend path and nothing else. Decryption is
# allowed only on the SSM key and only when SSM makes the call on the role's behalf; the key's own
# policy already admits that call, and this statement keeps the grant explicit and no wider.
data "aws_iam_policy_document" "parameters" {
  statement {
    sid       = "ReadFrontendParameters"
    effect    = "Allow"
    actions   = ["ssm:GetParameters"]
    resources = ["arn:aws:ssm:${var.aws_region}:${var.aws_account_id}:parameter${local.parameter_path}/*"]
  }

  statement {
    sid       = "DecryptFrontendParameters"
    effect    = "Allow"
    actions   = ["kms:Decrypt"]
    resources = [data.aws_kms_alias.ssm.target_key_arn]

    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["ssm.${var.aws_region}.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "parameters" {
  name        = "${var.name_prefix}-${var.environment}-frontend-parameters"
  path        = var.iam_path
  description = "Read the frontend's parameters under ${local.parameter_path}/ and decrypt them through SSM only."
  policy      = data.aws_iam_policy_document.parameters.json
}

resource "aws_iam_role_policy_attachment" "parameters" {
  role       = aws_iam_role.execution.name
  policy_arn = aws_iam_policy.parameters.arn
}
