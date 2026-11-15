# The origin behind the CDN: a load balancer that answers 403 to every request that does not carry
# the origin secret, and forwards the rest to the tasks.

# The zone is read by name, so that it stays with the root that owns it.
data "aws_route53_zone" "this" {
  name         = var.domain
  private_zone = false
}

# The load balancer's certificate, in the region of the load balancer.
resource "aws_acm_certificate" "origin" {
  domain_name       = local.origin_domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# One validation record per name of the certificate. The records are keyed by those names, which are
# known before the certificate exists, and read their contents from its validation options.
locals {
  origin_validation_options = {
    for o in aws_acm_certificate.origin.domain_validation_options : o.domain_name => o
  }
}

resource "aws_route53_record" "origin_validation" {
  for_each = toset([local.origin_domain])

  zone_id         = data.aws_route53_zone.this.zone_id
  name            = local.origin_validation_options[each.key].resource_record_name
  type            = local.origin_validation_options[each.key].resource_record_type
  records         = [local.origin_validation_options[each.key].resource_record_value]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "origin" {
  certificate_arn         = aws_acm_certificate.origin.arn
  validation_record_fqdns = [for r in aws_route53_record.origin_validation : r.fqdn]
}

# The secret CloudFront sends as the origin header. The load balancer matches header values without
# regard to case and reads `*` and `?` as wildcards, so the value has letters and digits only.
resource "random_password" "origin_verify" {
  length  = 48
  special = false
}

# Deletion protection is off so that the root can be destroyed and created again.
resource "aws_lb" "this" {
  name                       = local.name
  load_balancer_type         = "application"
  internal                   = false
  ip_address_type            = "ipv4"
  subnets                    = aws_subnet.public[*].id
  security_groups            = [aws_security_group.load_balancer.id]
  idle_timeout               = 60
  drop_invalid_header_fields = true
  enable_deletion_protection = false
}

# A task receives traffic only while /api/health answers 200; a task that stops receiving it gets the
# deregistration delay to finish the requests it holds.
resource "aws_lb_target_group" "app" {
  name                 = "${local.name}-frontend"
  port                 = local.container_port
  protocol             = "HTTP"
  target_type          = "ip"
  vpc_id               = aws_vpc.this.id
  deregistration_delay = var.deregistration_delay_seconds

  health_check {
    path                = "/api/health"
    matcher             = "200"
    interval            = 15
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

# Without the origin secret every request is answered 403 by the load balancer itself.
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.this.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.origin.certificate_arn

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      status_code  = "403"
    }
  }
}

# Only a request carrying the origin secret reaches the tasks.
resource "aws_lb_listener_rule" "from_cloudfront" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 1

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  condition {
    http_header {
      http_header_name = local.origin_header_name
      values           = [random_password.origin_verify.result]
    }
  }
}

# Plain HTTP is only ever redirected to HTTPS.
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_route53_record" "origin" {
  zone_id = data.aws_route53_zone.this.zone_id
  name    = local.origin_domain
  type    = "A"

  alias {
    name                   = aws_lb.this.dns_name
    zone_id                = aws_lb.this.zone_id
    evaluate_target_health = true
  }
}
