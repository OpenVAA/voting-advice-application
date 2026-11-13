variable "bucket_name" {
  description = "Name of the state bucket. S3 bucket names are global across all accounts, so the name carries the account id to stay unique."
  type        = string
}
