variable "repository_name" {
  description = "Name of the image repository."
  type        = string
}

variable "untagged_expiry_days" {
  description = "Untagged images older than this many days are expired."
  type        = number
  default     = 7
}

variable "max_images" {
  description = "Number of newest images kept. Older images are expired and can no longer be deployed, so this bounds how far back a rollback can reach."
  type        = number
  default     = 50
}
