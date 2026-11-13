# The SMTP user holds a long-lived access key, because SES derives the SMTP password from a secret key and
# temporary credentials cannot be used for that. The key's secret and the derived password are written to
# the state of the root that calls this module.
resource "aws_iam_user" "smtp" {
  name = "${var.name_prefix}-ses-smtp"
  path = var.iam_path
}

resource "aws_iam_access_key" "smtp" {
  user = aws_iam_user.smtp.name
}

# The only permission: send raw mail through this identity, as the one From address. That SES authorises
# an SMTP send against the identity's ARN with this condition has not been observed; if the first real
# send is refused, the fallback is the same statement on every resource with the condition kept.
data "aws_iam_policy_document" "ses_send" {
  statement {
    effect    = "Allow"
    actions   = ["ses:SendRawEmail"]
    resources = [aws_sesv2_email_identity.this.arn]

    condition {
      test     = "StringEquals"
      variable = "ses:FromAddress"
      values   = ["${var.sender_local_part}@${var.domain}"]
    }
  }
}

resource "aws_iam_policy" "ses_send" {
  name        = "${var.name_prefix}-ses-send"
  path        = var.iam_path
  description = "Send mail through the SES identity ${var.domain} as ${var.sender_local_part}@${var.domain} only."
  policy      = data.aws_iam_policy_document.ses_send.json
}

resource "aws_iam_user_policy_attachment" "ses_send" {
  user       = aws_iam_user.smtp.name
  policy_arn = aws_iam_policy.ses_send.arn
}

# With an empty list, the next apply removes any inline policy someone adds to the user by hand.
resource "aws_iam_user_policies_exclusive" "smtp" {
  user_name    = aws_iam_user.smtp.name
  policy_names = []
}
