output "zone_id" {
  description = "Id of the hosted zone."
  value       = aws_route53_zone.this.zone_id
}

output "domain" {
  description = "The domain the hosted zone serves."
  value       = aws_route53_zone.this.name
}

output "name_servers" {
  description = "The zone's four name servers. The operator enters each as an NS record for the subdomain at the parent zone's DNS host."
  value       = aws_route53_zone.this.name_servers
}
