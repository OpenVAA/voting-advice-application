# The CDN in front of the whole site: <domain> resolves to the distribution, and the distribution's
# only origin is the load balancer at origin.<domain>, reached over HTTPS with the origin secret.

# CloudFront reads its viewer certificate from us-east-1 only, so this certificate and its validation
# are made through the us-east-1 provider. Everything else in the module is in the root's region.
resource "aws_acm_certificate" "viewer" {
  provider = aws.us_east_1

  domain_name       = var.domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

locals {
  viewer_validation_options = {
    for o in aws_acm_certificate.viewer.domain_validation_options : o.domain_name => o
  }
}

resource "aws_route53_record" "viewer_validation" {
  for_each = toset([var.domain])

  zone_id         = data.aws_route53_zone.this.zone_id
  name            = local.viewer_validation_options[each.key].resource_record_name
  type            = local.viewer_validation_options[each.key].resource_record_type
  records         = [local.viewer_validation_options[each.key].resource_record_value]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "viewer" {
  provider = aws.us_east_1

  certificate_arn         = aws_acm_certificate.viewer.arn
  validation_record_fqdns = [for r in aws_route53_record.viewer_validation : r.fqdn]
}

# The managed policies, read by name. Their documented ids are the fallback should a name not match:
# CachingOptimized 658327ea-f89d-4fab-a63d-7e88639e58f6, CachingDisabled
# 4135ea2d-6df8-44a3-9df3-4b5a84be39ad, AllViewerExceptHostHeader b689b0a8-53d0-40ab-baf2-68738e2966ac.
data "aws_cloudfront_cache_policy" "optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

locals {
  cdn_origin_id = "load-balancer"

  # Every status CloudFront lets a custom error response name. CloudFront holds an error response
  # for ten seconds unless told otherwise; with a minimum of 0 no rendered error page is held.
  uncached_error_codes = [400, 403, 404, 405, 414, 416, 500, 501, 502, 503, 504]
}

resource "aws_cloudfront_distribution" "this" {
  enabled             = true
  is_ipv6_enabled     = true
  http_version        = "http2and3"
  aliases             = [var.domain]
  price_class         = var.price_class
  wait_for_deployment = true
  web_acl_id          = one(aws_wafv2_web_acl.relay[*].arn)

  # CloudFront replaces a header of the same name sent by the viewer with this value, so a viewer
  # cannot supply the secret itself.
  origin {
    origin_id   = local.cdn_origin_id
    domain_name = local.origin_domain

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    custom_header {
      name  = local.origin_header_name
      value = random_password.origin_verify.result
    }
  }

  # The build's hashed assets never change under a name, and the server marks them immutable for a
  # year, so they are the only responses the edge keeps.
  ordered_cache_behavior {
    path_pattern           = "/_app/immutable/*"
    target_origin_id       = local.cdn_origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = data.aws_cloudfront_cache_policy.optimized.id
  }

  # Pages, form posts, /api/* and /_app/version.json: nothing is cached, and the viewer's headers,
  # cookies and query strings reach the origin. The viewer's Host is not forwarded, because the origin
  # certificate names the origin host; the application's public origin is fixed by ORIGIN instead.
  default_cache_behavior {
    target_origin_id         = local.cdn_origin_id
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods           = ["GET", "HEAD"]
    compress                 = true
    cache_policy_id          = data.aws_cloudfront_cache_policy.disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
  }

  dynamic "custom_error_response" {
    for_each = local.uncached_error_codes

    content {
      error_code            = custom_error_response.value
      error_caching_min_ttl = 0
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.viewer.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}

# The site's name, for IPv4 and IPv6 viewers alike.
resource "aws_route53_record" "apex" {
  for_each = toset(["A", "AAAA"])

  zone_id = data.aws_route53_zone.this.zone_id
  name    = var.domain
  type    = each.key

  alias {
    name                   = aws_cloudfront_distribution.this.domain_name
    zone_id                = aws_cloudfront_distribution.this.hosted_zone_id
    evaluate_target_health = false
  }
}
