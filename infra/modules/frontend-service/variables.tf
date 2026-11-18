variable "name_prefix" {
  description = "Prefix of every resource name, joined with the environment name."
  type        = string
}

variable "environment" {
  description = "The environment name, part of every resource name and of the log group's name."
  type        = string
}

variable "domain" {
  description = "The domain the deployment serves, the name of a public hosted zone in this account. The origin is served at origin.<domain>."
  type        = string
}

variable "aws_account_id" {
  description = "The AWS account of the resources, used to build the ARNs of the parameters the task reads."
  type        = string

  validation {
    condition     = can(regex("^[0-9]{12}$", var.aws_account_id))
    error_message = "aws_account_id must be a 12-digit AWS account id."
  }
}

variable "aws_region" {
  description = "The AWS region of the resources, used to build the ARNs of the parameters the task reads and as the region of its logs."
  type        = string
}

variable "registry_url" {
  description = "URL of the image repository, without a tag or a digest. The task's image is this URL, @ and image_digest."
  type        = string

  validation {
    condition     = length(var.registry_url) > 0 && !strcontains(var.registry_url, ":") && !strcontains(var.registry_url, "@")
    error_message = "registry_url must be the repository URL alone, with no tag and no digest."
  }
}

variable "image_digest" {
  description = "Digest of the image the task runs, as the registry reports it: sha256 and 64 lower-case hexadecimal characters. The image's tag and its BUILD_SHA are the commit id it was built from."
  type        = string

  validation {
    condition     = can(regex("^sha256:[0-9a-f]{64}$", var.image_digest))
    error_message = "image_digest must be sha256: followed by 64 lower-case hexadecimal characters."
  }
}

variable "execution_role_arn" {
  description = "ARN of the role ECS uses to pull the image, read the parameters and write the logs. The role is created outside this module."
  type        = string

  validation {
    condition     = startswith(var.execution_role_arn, "arn:aws:iam::")
    error_message = "execution_role_arn must be an IAM role ARN, beginning with arn:aws:iam::."
  }
}

variable "parameter_path" {
  description = "Path in the parameter store under which every entry of task-environment.json whose source is \"parameter\" is read, as <parameter_path>/<NAME>."
  type        = string

  validation {
    condition     = startswith(var.parameter_path, "/") && !endswith(var.parameter_path, "/")
    error_message = "parameter_path must begin with / and must not end with /."
  }
}

variable "environment_values" {
  description = "The value of every entry of task-environment.json whose source is \"value\", by name."
  type        = map(string)
}

variable "environment_overrides" {
  description = "Values that replace entries of environment_values for one apply, by name."
  type        = map(string)
  default     = {}
}

variable "omit_environment" {
  description = "Names of task-environment.json entries the task does not receive, so that a rollout with a variable missing can be observed."
  type        = list(string)
  default     = []
}

variable "task_cpu" {
  description = "CPU units of one task."
  type        = number
  default     = 512
}

variable "task_memory" {
  description = "Memory of one task, in MiB."
  type        = number
  default     = 1024
}

variable "cpu_architecture" {
  description = "CPU architecture of the task, which must match the image's: ARM64 or X86_64."
  type        = string
  default     = "ARM64"

  validation {
    condition     = contains(["ARM64", "X86_64"], var.cpu_architecture)
    error_message = "cpu_architecture must be ARM64 or X86_64."
  }
}

variable "task_floor" {
  description = "Number of tasks the service starts with. After the first apply the count belongs to the service's scaling, and a change here does not alter it."
  type        = number
  default     = 1

  validation {
    condition     = var.task_floor >= 1 && floor(var.task_floor) == var.task_floor
    error_message = "task_floor must be a whole number of at least 1."
  }
}

variable "health_check_grace_period_seconds" {
  description = "Seconds after a task starts during which failed health checks do not count against it, both the load balancer's and the container's own."
  type        = number
  default     = 60
}

variable "deregistration_delay_seconds" {
  description = "Seconds the load balancer keeps sending a stopping task's open requests to it before the task is signalled to stop."
  type        = number
  default     = 30
}

variable "stop_timeout_seconds" {
  description = "Seconds between the stop signal and the kill of the container. It must exceed the server's SHUTDOWN_TIMEOUT by at least the analytics forward timeout of 10 seconds plus a margin of 5, so that the shutdown flush of a queue of up to one slice reaches a responsive PostHog before the kill. The flush sends its slices one after another, so a full queue against an unresponsive PostHog can still be cut off."
  type        = number
  default     = 30

  validation {
    condition     = var.stop_timeout_seconds >= 2 && var.stop_timeout_seconds <= 120
    error_message = "stop_timeout_seconds must be between 2 and 120, the range Fargate accepts."
  }
}

variable "log_retention_days" {
  description = "Days the task's log lines are kept. Only a retention CloudWatch Logs offers is accepted, and logs are never kept forever."
  type        = number
  default     = 90

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1096, 1827, 2192, 2557, 2922, 3288, 3653], var.log_retention_days)
    error_message = "log_retention_days must be a retention CloudWatch Logs offers: 1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1096, 1827, 2192, 2557, 2922, 3288 or 3653."
  }
}

variable "debug_ingress_cidrs" {
  description = "Single IPv4 addresses, as /32 blocks, that may reach the load balancer directly on 443 and 80 while an observation is made from outside the CDN. Empty otherwise."
  type        = list(string)
  default     = []

  validation {
    condition = alltrue([
      for c in var.debug_ingress_cidrs :
      can(regex("^[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}/32$", c)) && can(cidrhost(c, 0))
    ])
    error_message = "Every entry of debug_ingress_cidrs must be a single IPv4 address as a /32 block."
  }
}

variable "vpc_cidr" {
  description = "Address block of the network. The two public subnets are its first two blocks eight bits longer, a /24 each of the default /16."
  type        = string
  default     = "10.40.0.0/16"

  validation {
    condition     = can(cidrsubnet(var.vpc_cidr, 8, 1))
    error_message = "vpc_cidr must be an address block with a prefix of /24 or shorter, so that two subnets eight bits longer fit in it."
  }
}

variable "price_class" {
  description = "The CDN's price class, which sets the edge locations it serves from."
  type        = string
  default     = "PriceClass_100"

  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.price_class)
    error_message = "price_class must be PriceClass_100, PriceClass_200 or PriceClass_All."
  }
}

variable "relay_rate_limit" {
  description = "Requests per window_seconds per viewer address that /api/usage admits before CloudFront answers 429. Null, the default, creates no web ACL. Switching it on needs wafv2 actions on the deploy role first, and costs about 6 US dollars a month plus 0.60 per million requests, every request to the distribution being inspected."
  type = object({
    limit          = number
    window_seconds = number
  })
  default  = null
  nullable = true

  validation {
    condition = var.relay_rate_limit == null ? true : (
      contains([60, 120, 300, 600], var.relay_rate_limit.window_seconds)
      && var.relay_rate_limit.limit >= 10
      && var.relay_rate_limit.limit <= 2000000000
      && floor(var.relay_rate_limit.limit) == var.relay_rate_limit.limit
    )
    error_message = "relay_rate_limit needs window_seconds of 60, 120, 300 or 600 and an integer limit from 10 to 2000000000."
  }
}

variable "task_ceiling" {
  description = "Most tasks the service's scaling may run. Not below task_floor."
  type        = number
  default     = 2

  validation {
    condition     = var.task_ceiling >= var.task_floor && floor(var.task_ceiling) == var.task_ceiling
    error_message = "task_ceiling must be a whole number no lower than task_floor."
  }
}

variable "cpu_target_percent" {
  description = "The tasks' average CPU, in percent, that target tracking holds the service at."
  type        = number
  default     = 60

  validation {
    condition     = var.cpu_target_percent > 0 && var.cpu_target_percent <= 100
    error_message = "cpu_target_percent must be above 0 and at most 100."
  }
}

variable "scheduled_floor_changes" {
  description = "Timed changes of the scaling bounds, one scheduled action each. name keys the action, schedule is an at(), cron() or rate() expression read in schedule_timezone, and min_capacity and max_capacity are the bounds from that time on."
  type = list(object({
    name         = string
    schedule     = string
    min_capacity = number
    max_capacity = number
  }))
  default = []

  validation {
    condition     = alltrue([for c in var.scheduled_floor_changes : c.min_capacity >= 1 && c.min_capacity <= c.max_capacity])
    error_message = "Every scheduled change must have 1 <= min_capacity <= max_capacity."
  }

  validation {
    condition = (
      length(distinct([for c in var.scheduled_floor_changes : c.name])) == length(var.scheduled_floor_changes)
      && alltrue([for c in var.scheduled_floor_changes : can(regex("^[A-Za-z0-9-]+$", c.name))])
    )
    error_message = "Every scheduled change must have a name of its own, of letters, digits and hyphens."
  }
}

variable "schedule_timezone" {
  description = "Time zone the schedules of scheduled_floor_changes are read in, as an IANA name."
  type        = string
  default     = "UTC"
}

variable "alert_email" {
  description = "Address the deployment alert is mailed to. Its owner confirms the subscription before any alert arrives."
  type        = string
  sensitive   = true

  validation {
    condition     = can(regex("^[^@[:space:]]+@[^@[:space:]]+\\.[^@[:space:]]+$", var.alert_email))
    error_message = "alert_email must be an email address."
  }
}
