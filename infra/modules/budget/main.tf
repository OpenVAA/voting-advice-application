terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.60"
    }
  }
}

resource "aws_budgets_budget" "monthly" {
  name         = var.name
  budget_type  = "COST"
  time_unit    = "MONTHLY"
  limit_amount = tostring(var.limit_usd)
  limit_unit   = "USD"

  # Credits and refunds are left out by default, so that an account running on credits still shows
  # its usage and the alerts follow usage rather than the net bill.
  cost_types {
    include_credit = var.include_credits
    include_refund = var.include_credits
  }

  # Both alerts mail the address directly; there is no SNS topic.
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.alert_email]
  }
}
