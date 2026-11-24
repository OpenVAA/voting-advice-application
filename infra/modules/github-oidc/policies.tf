# One customer-managed policy per concern, all under var.iam_path, each attached to one role by its own role attachment. The plan role is read-only: it holds the AWS-managed read-only policy and an explicit deny, and no write of any kind, the state lock included, so a plan runs without the lock. Two consequences for the roots these roles work on:
# - The plan role is denied Secrets Manager reads, KMS decryption, every S3 object outside the state bucket's pipeline/ prefix, log event reads, DynamoDB item reads and a few other data reads (the plan_deny document lists them), so the root it plans must hold no secret value that a refresh has to read, and must read no S3 object outside pipeline/, log event or table item; such a root refers to a secret by its ARN. Every other read of the AWS-managed read-only policy stays allowed, data reads included: SSM String parameters, Lambda function and ECS task definition environments, and CloudFormation templates.
# - The deploy role gains further permissions only through this module, which is applied by hand, so the pipeline can never widen its own access.

locals {
  pipeline_state_arn = "${var.state_bucket_arn}/${var.pipeline_state_key}"
  pipeline_lock_arn  = "${var.state_bucket_arn}/${var.pipeline_state_key}.tflock"
}

# State access of the deploy role: an allow-list of one state key and its lock object, so the role can neither read nor write the state of any hand-applied root.
#
# The list permission follows the S3 backend documentation, which conditions s3:ListBucket on s3:prefix equal to the state key. It does not admit the backend's own list call. Read in the Terraform source at v1.16.5, internal/backend/remote-state/s3/backend_state.go (function Workspaces) makes one list call, ListObjectsV2 with the prefix "env:/" (the default workspace key prefix and a slash); when that call is refused with AccessDenied under the default prefix, it logs that it is unable to list non-default workspaces and carries on with the default workspace. The state and lock objects are reached by head, get, put and delete calls on their exact keys.
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
      "ecr:DescribeImages",
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
  name        = "${var.iam_name_prefix}-ecr-push"
  path        = var.iam_path
  description = "Push images to the one image repository."
  policy      = data.aws_iam_policy_document.ecr_push.json
}

# Every hand-applied root keeps its state under one prefix, so a root added later is covered by this deny without an edit. The S3 backend keeps the state of a non-default workspace under "env:/" (its default workspace key prefix), outside that prefix, so every workspace key is denied as well.
data "aws_iam_policy_document" "plan_deny" {
  statement {
    sid     = "DenyHandAppliedState"
    effect  = "Deny"
    actions = ["s3:GetObject", "s3:GetObjectVersion"]
    resources = [
      "${var.state_bucket_arn}/${var.hand_state_prefix}*",
      "${var.state_bucket_arn}/env:/*",
    ]
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

  # The AWS-managed read-only policy reads the objects of every bucket. A plan reads only the pipeline root's state, so no object outside the state bucket's pipeline/ prefix is readable.
  statement {
    sid           = "DenyObjectReadsOutsidePipeline"
    effect        = "Deny"
    actions       = ["s3:GetObject", "s3:GetObjectVersion"]
    not_resources = ["${var.state_bucket_arn}/pipeline/*"]
  }

  # Reads of stored data that no refresh of a resource or data source makes: table items, log events, stream records and queue messages.
  statement {
    sid    = "DenyDataPlaneReads"
    effect = "Deny"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:BatchGetItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:PartiQLSelect",
      "dynamodb:GetRecords",
      "logs:GetLogEvents",
      "logs:FilterLogEvents",
      "logs:GetLogRecord",
      "logs:StartQuery",
      "logs:GetQueryResults",
      "logs:StartLiveTail",
      "logs:Unmask",
      "kinesis:GetRecords",
      "sqs:ReceiveMessage",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "plan_deny" {
  name        = "${var.iam_name_prefix}-plan-deny"
  path        = var.iam_path
  description = "Explicit deny for the plan role: the state of hand-applied roots, Secrets Manager reads, KMS decryption, and DynamoDB, log, stream and queue data reads."
  policy      = data.aws_iam_policy_document.plan_deny.json
}

# Attachments are per role. The account-wide exclusive attachment form is not used: it would detach a policy from every other identity in the account. The plan role's two attachments are all it holds, so it can neither take nor delete the pipeline's state lock.
resource "aws_iam_role_policy_attachment" "plan_read_only" {
  role       = aws_iam_role.plan.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

resource "aws_iam_role_policy_attachment" "plan_deny" {
  role       = aws_iam_role.plan.name
  policy_arn = aws_iam_policy.plan_deny.arn
}

resource "aws_iam_role_policy_attachment" "deploy_tfstate" {
  role       = aws_iam_role.deploy.name
  policy_arn = aws_iam_policy.tfstate_pipeline.arn
}

resource "aws_iam_role_policy_attachment" "deploy_ecr_push" {
  role       = aws_iam_role.deploy.name
  policy_arn = aws_iam_policy.ecr_push.arn
}
