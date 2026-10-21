# The clean fixture root of the no-inline-IAM-policies guard. Every form below must pass: permissions come
# from managed policies attached by separate resources, and trust and resource policies are outside the rule.

data "aws_iam_policy_document" "trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "app" {
  name               = "fixture-app"
  assume_role_policy = data.aws_iam_policy_document.trust.json
}

data "aws_iam_policy_document" "read" {
  statement {
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["arn:aws:s3:::fixture-bucket/*"]
  }
}

resource "aws_iam_policy" "read" {
  name   = "fixture-read"
  policy = data.aws_iam_policy_document.read.json
}

resource "aws_iam_role_policy_attachment" "app_read" {
  role       = aws_iam_role.app.name
  policy_arn = aws_iam_policy.read.arn
}

resource "aws_iam_user" "sender" {
  name = "fixture-sender"
}

resource "aws_iam_user_policy_attachment" "sender_read" {
  user       = aws_iam_user.sender.name
  policy_arn = aws_iam_policy.read.arn
}

resource "aws_iam_group" "readers" {
  name = "fixture-readers"
}

resource "aws_iam_group_policy_attachment" "readers_read" {
  group      = aws_iam_group.readers.name
  policy_arn = aws_iam_policy.read.arn
}

resource "aws_s3_bucket" "data" {
  bucket = "fixture-bucket"
}

data "aws_iam_policy_document" "tls_only" {
  statement {
    effect    = "Deny"
    actions   = ["s3:*"]
    resources = [aws_s3_bucket.data.arn, "${aws_s3_bucket.data.arn}/*"]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "data" {
  bucket = aws_s3_bucket.data.id
  policy = data.aws_iam_policy_document.tls_only.json
}

# Attaches nothing: with an empty list it removes any inline policy added to the role by hand.
resource "aws_iam_role_policies_exclusive" "app" {
  role_name    = aws_iam_role.app.name
  policy_names = []
}
