output "bucket_name" {
  description = "Name of the state bucket."
  value       = aws_s3_bucket.this.bucket
}

output "bucket_arn" {
  description = "ARN of the state bucket."
  value       = aws_s3_bucket.this.arn
}
