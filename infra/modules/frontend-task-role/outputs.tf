output "execution_role_arn" {
  description = "ARN of the frontend task's execution role, which the task definition names as its execution role."
  value       = aws_iam_role.execution.arn
}

output "execution_role_name" {
  description = "Name of the frontend task's execution role."
  value       = aws_iam_role.execution.name
}

output "parameter_path" {
  description = "The parameter path the execution role may read, without a trailing slash."
  value       = local.parameter_path
}
