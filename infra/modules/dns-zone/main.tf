terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.60"
    }
  }
}

# The zone serves the delegated subdomain only; the parent zone stays at its present DNS host, which
# points at this zone with one NS record per name server. Neither side is signed, so the module declares
# no DNSSEC resource and no DS record exists at the parent.
resource "aws_route53_zone" "this" {
  name    = var.domain
  comment = "Managed by Terraform"

  # A zone created again gets four new name servers, and the delegation at the parent's DNS host would
  # then have to be entered again by hand.
  lifecycle {
    prevent_destroy = true
  }
}
