# One customer-managed policy per concern, all under var.iam_path, each attached to one role by its own
# role attachment. Two consequences for the roots these roles work on:
# - The plan role is denied secret reads and decryption, so the root it plans must hold no secret value
#   that a refresh has to read; such a root refers to a secret by its ARN.
# - The deploy role gains further permissions only through this module, which is applied by hand, so the
#   pipeline can never widen its own access.

locals {
  pipeline_state_arn = "${var.state_bucket_arn}/${var.pipeline_state_key}"
  pipeline_lock_arn  = "${var.state_bucket_arn}/${var.pipeline_state_key}.tflock"
}

# State access of the deploy role: an allow-list of one state key and its lock object, so the role can
# neither read nor write the state of any hand-applied root.
#
# The list permission follows the S3 backend documentation, which conditions s3:ListBucket on s3:prefix
# equal to the state key. It does not admit the backend's own list call. Read in the Terraform source
# at v1.16.5, internal/backend/remote-state/s3/backend_state.go (function Workspaces) makes one list
# call, ListObjectsV2 with the prefix "env:/" (the default workspace key prefix and a slash); when that
# call is refused with AccessDenied under the default prefix, it logs that it is unable to list
# non-default workspaces and carries on with the default workspace. The state and lock objects are
# reached by head, get, put and delete calls on their exact keys.
data "aws_iam_policy_document" "tfstate_pipeline" {
  statement {
    sid       = "ListStateKey"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [var.state_bucket_arn]

    condition {
      test     = "StringEquals"
      variable = "s3:prefix"
      values   = [var.pipeline_state_key]
    }
  }

  statement {
    sid       = "ReadWriteState"
    effect    = "Allow"
    actions   = ["s3:GetObject", "s3:PutObject"]
    resources = [local.pipeline_state_arn]
  }

  statement {
    sid       = "StateLock"
    effect    = "Allow"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = [local.pipeline_lock_arn]
  }
}

resource "aws_iam_policy" "tfstate_pipeline" {
  name        = "${var.name_prefix}-tfstate-${var.environment}-aws"
  path        = var.iam_path
  description = "Read and write the pipeline root's state key and its lock object, and nothing else in the state bucket."
  policy      = data.aws_iam_policy_document.tfstate_pipeline.json
}

data "aws_iam_policy_document" "ecr_push" {
  statement {
    sid    = "PushToRepository"
    effect = "Allow"
    actions = [
      "ecr:CompleteLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:InitiateLayerUpload",
      "ecr:BatchCheckLayerAvailability",
      "ecr:PutImage",
      "ecr:BatchGetImage",
    ]
    resources = [var.registry_arn]
  }

  # The registry login token is not scoped to a repository.
  statement {
    sid       = "RegistryLogin"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "ecr_push" {
  name        = "${var.name_prefix}-ecr-push"
  path        = var.iam_path
  description = "Push images to the one image repository."
  policy      = data.aws_iam_policy_document.ecr_push.json
}

# Every hand-applied root keeps its state under one prefix, so a root added later is covered by this
# deny without an edit.
data "aws_iam_policy_document" "plan_deny" {
  statement {
    sid       = "DenyHandAppliedState"
    effect    = "Deny"
    actions   = ["s3:GetObject", "s3:GetObjectVersion"]
    resources = ["${var.state_bucket_arn}/${var.hand_state_prefix}*"]
  }

  statement {
    sid    = "DenySecretReads"
    effect = "Deny"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:BatchGetSecretValue",
      "kms:Decrypt",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "plan_deny" {
  name        = "${var.name_prefix}-plan-deny"
  path        = var.iam_path
  description = "Explicit deny for the plan role: the state of hand-applied roots and every secret read."
  policy      = data.aws_iam_policy_document.plan_deny.json
}

# A plan takes the state lock, which the AWS-managed read-only policy does not allow.
data "aws_iam_policy_document" "plan_lock" {
  statement {
    sid       = "StateLock"
    effect    = "Allow"
    actions   = ["s3:PutObject", "s3:DeleteObject"]
    resources = [local.pipeline_lock_arn]
  }
}

resource "aws_iam_policy" "plan_lock" {
  name        = "${var.name_prefix}-plan-lock"
  path        = var.iam_path
  description = "Lets the plan role take and release the pipeline root's state lock."
  policy      = data.aws_iam_policy_document.plan_lock.json
}

# Attachments are per role. The account-wide exclusive attachment form is not used: it would detach a
# policy from every other identity in the account.
resource "aws_iam_role_policy_attachment" "plan_read_only" {
  role       = aws_iam_role.plan.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

resource "aws_iam_role_policy_attachment" "plan_deny" {
  role       = aws_iam_role.plan.name
  policy_arn = aws_iam_policy.plan_deny.arn
}

resource "aws_iam_role_policy_attachment" "plan_lock" {
  role       = aws_iam_role.plan.name
  policy_arn = aws_iam_policy.plan_lock.arn
}

resource "aws_iam_role_policy_attachment" "deploy_tfstate" {
  role       = aws_iam_role.deploy.name
  policy_arn = aws_iam_policy.tfstate_pipeline.arn
}

resource "aws_iam_role_policy_attachment" "deploy_ecr_push" {
  role       = aws_iam_role.deploy.name
  policy_arn = aws_iam_policy.ecr_push.arn
}
