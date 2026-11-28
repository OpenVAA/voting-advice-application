# The plan role and one deployment's deploy role, trusted through the account's GitHub OIDC provider. The module is called once per deployment, with the provider's ARN from the account's one github-oidc-provider call.
#
# var.environment names the deployment, from which the deploy role, its state policy and the frontend resources and log group its policies are scoped to take their names. var.iam_name_prefix names the plan role and the policies of the shared concerns, so that two deployments in one account never collide. The GitHub Environments whose jobs may assume the deploy role are a separate list, the subjects in var.deploy_subjects, and need not share the deployment's name.

terraform {
  required_version = "~> 1.16"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.60"
    }
  }
}

# A trust policy is a role's resource policy, so it is outside the repository's rule against an inline policy. Every condition is an exact match on the subjects the caller gives, in either of GitHub's two subject forms. A name-based subject stops matching after a rename or transfer of the repository.
# Both trusts also require the token's numeric repository and owner ids, which survive a rename.
data "aws_iam_policy_document" "plan_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [var.oidc_provider_arn]
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

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:repository_id"
      values   = [var.github_repository_id]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:repository_owner_id"
      values   = [var.github_repository_owner_id]
    }
  }
}

data "aws_iam_policy_document" "deploy_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [var.oidc_provider_arn]
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

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:repository_id"
      values   = [var.github_repository_id]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:repository_owner_id"
      values   = [var.github_repository_owner_id]
    }
  }
}

# Neither role carries a permission of its own; every permission is a managed policy attached by a separate resource in policies.tf.
resource "aws_iam_role" "plan" {
  name               = "${var.iam_name_prefix}-plan"
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
