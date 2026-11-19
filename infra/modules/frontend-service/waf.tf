# The optional rate rule in front of the analytics relay. It exists only when relay_rate_limit is
# set: then every request to the distribution passes through this web ACL, which allows everything
# except a viewer address that sends more than the limit to /api/usage within the window, and answers
# that address 429 until its count falls back under the limit.

locals {
  # The relay's path after decoding and normalisation, behind at most one leading segment.
  relay_path_pattern = "^/([^/]+/)?api/usage(/|$)"
}

# A web ACL for CloudFront is made in us-east-1 only, like the viewer certificate.
resource "aws_wafv2_web_acl" "relay" {
  count    = var.relay_rate_limit == null ? 0 : 1
  provider = aws.us_east_1

  name  = "${local.name}-relay"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "relay-rate"
    priority = 0

    action {
      block {
        custom_response {
          response_code = 429
        }
      }
    }

    statement {
      rate_based_statement {
        limit                 = var.relay_rate_limit.limit
        evaluation_window_sec = var.relay_rate_limit.window_seconds
        aggregate_key_type    = "IP"

        # Only requests to the relay are counted, and only they are blocked; the rest of the site
        # never meets the rule. The application serves the relay at /api/usage and, because its
        # reroute hook strips one leading locale segment, at /<locale>/api/usage too, and it
        # percent-decodes the path before it matches a route. So the path is decoded and
        # normalised first, and then matched as /api/usage, behind at most one segment of any
        # name, ending there or at a slash.
        scope_down_statement {
          regex_match_statement {
            regex_string = local.relay_path_pattern

            field_to_match {
              uri_path {}
            }

            text_transformation {
              priority = 0
              type     = "URL_DECODE"
            }

            text_transformation {
              priority = 1
              type     = "NORMALIZE_PATH"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "relay-rate"
      sampled_requests_enabled   = false
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name}-relay"
    sampled_requests_enabled   = false
  }
}
