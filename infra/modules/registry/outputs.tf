output "repository_name" {
  description = "Name of the image repository."
  value       = aws_ecr_repository.frontend.name
}

output "repository_arn" {
  description = "ARN of the image repository."
  value       = aws_ecr_repository.frontend.arn
}

output "repository_url" {
  description = "URL of the image repository, used as the image name when pushing and pulling."
  value       = aws_ecr_repository.frontend.repository_url
}
