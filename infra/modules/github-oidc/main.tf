terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.60"
    }
  }
}

# No thumbprint list: for GitHub, AWS validates the provider against its own library of trusted
# certificate authorities and ignores any configured thumbprint.
resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

# A trust policy is a role's resource policy, so it is outside the repository's rule against an inline
# policy. The subjects are name-based (repo:OWNER/REPO:...): a rename or transfer of the repository, or
# an opt-in to the id-bearing subject format, stops both roles being assumable until the subjects are
# changed and this module's root is applied again. Every condition is an exact match.
data "aws_iam_policy_document" "plan_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = var.plan_subjects
    }

    dynamic "condition" {
      for_each = var.github_repository_id == null ? [] : [var.github_repository_id]
      content {
        test     = "StringEquals"
        variable = "token.actions.githubusercontent.com:repository_id"
        values   = [condition.value]
      }
    }

    dynamic "condition" {
      for_each = var.github_repository_owner_id == null ? [] : [var.github_repository_owner_id]
      content {
        test     = "StringEquals"
        variable = "token.actions.githubusercontent.com:repository_owner_id"
        values   = [condition.value]
      }
    }
  }
}

data "aws_iam_policy_document" "deploy_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = var.deploy_subjects
    }

    dynamic "condition" {
      for_each = var.github_repository_id == null ? [] : [var.github_repository_id]
      content {
        test     = "StringEquals"
        variable = "token.actions.githubusercontent.com:repository_id"
        values   = [condition.value]
      }
    }

    dynamic "condition" {
      for_each = var.github_repository_owner_id == null ? [] : [var.github_repository_owner_id]
      content {
        test     = "StringEquals"
        variable = "token.actions.githubusercontent.com:repository_owner_id"
        values   = [condition.value]
      }
    }
  }
}

# Neither role carries a permission of its own; every permission is a managed policy attached by a
# separate resource in policies.tf.
resource "aws_iam_role" "plan" {
  name               = "${var.name_prefix}-plan"
  path               = var.iam_path
  assume_role_policy = data.aws_iam_policy_document.plan_trust.json
}

resource "aws_iam_role" "deploy" {
  name               = "${var.name_prefix}-${var.environment}-deploy"
  path               = var.iam_path
  assume_role_policy = data.aws_iam_policy_document.deploy_trust.json
}

# With an empty list, the next apply removes any inline policy someone adds to a role by hand.
resource "aws_iam_role_policies_exclusive" "plan" {
  role_name    = aws_iam_role.plan.name
  policy_names = []
}

resource "aws_iam_role_policies_exclusive" "deploy" {
  role_name    = aws_iam_role.deploy.name
  policy_names = []
}
