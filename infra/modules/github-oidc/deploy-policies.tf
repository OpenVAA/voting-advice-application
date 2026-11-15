# The deploy role's permissions for the one root the pipeline applies: one customer-managed policy per
# concern, under var.iam_path, each attached to the deploy role by its own role attachment. The
# resource names are derived from name_prefix and environment exactly as the frontend-service module
# derives them, so every scope below names that module's resources and nothing else.

locals {
  frontend_name     = "${var.name_prefix}-${var.environment}"
  deployments_topic = "arn:aws:sns:${var.aws_region}:${var.aws_account_id}:${local.frontend_name}-frontend-deployments"
}

# The pipeline's own failure alert goes to the topic the rollout alert uses, so both reach the one
# confirmed subscription.
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
