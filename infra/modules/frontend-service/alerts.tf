# A rollout of this service that ECS marks as failed mails the operator.

# Not encrypted at rest: EventBridge cannot publish to a topic under the AWS-managed SNS key, and the
# topic carries only the deployment events, no secret.
resource "aws_sns_topic" "deployments" {
  name = "${local.name}-frontend-deployments"
}

# The rule names this service's ARN, so a failed rollout of another service does not mail.
resource "aws_cloudwatch_event_rule" "deployment_failed" {
  name        = "${local.name}-frontend-deployment-failed"
  description = "A failed rollout of the ${local.name} frontend service."

  event_pattern = jsonencode({
    source        = ["aws.ecs"]
    "detail-type" = ["ECS Deployment State Change"]
    resources     = [aws_ecs_service.app.id]
    detail = {
      eventName = ["SERVICE_DEPLOYMENT_FAILED"]
    }
  })
}

resource "aws_cloudwatch_event_target" "deployment_failed" {
  rule      = aws_cloudwatch_event_rule.deployment_failed.name
  target_id = "deployments-topic"
  arn       = aws_sns_topic.deployments.arn
}

# A resource policy on the topic: only the rule above may publish to it.
resource "aws_sns_topic_policy" "deployments" {
  arn = aws_sns_topic.deployments.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DeploymentFailedRule"
        Effect    = "Allow"
        Principal = { Service = "events.amazonaws.com" }
        Action    = "sns:Publish"
        Resource  = aws_sns_topic.deployments.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_cloudwatch_event_rule.deployment_failed.arn
          }
        }
      },
    ]
  })
}

# The subscription stays pending until the owner of the address confirms it from the mail AWS
# sends, and every re-creation of the topic or the subscription sends a new confirmation.
resource "aws_sns_topic_subscription" "operator" {
  topic_arn = aws_sns_topic.deployments.arn
  protocol  = "email"
  endpoint  = var.alert_email
}
