resource "aws_ecs_cluster" "this" {
  name = local.name
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/openvaa/${var.environment}/frontend"
  retention_in_days = var.log_retention_days
}

# The task has an execution role, which pulls the image, reads the parameters and writes the logs, and
# no task role: the container itself calls no AWS API.
resource "aws_ecs_task_definition" "app" {
  family                   = "${local.name}-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = var.execution_role_arn

  runtime_platform {
    cpu_architecture        = var.cpu_architecture
    operating_system_family = "LINUX"
  }

  container_definitions = jsonencode([
    {
      name         = local.container_name
      image        = "${var.registry_url}@${var.image_digest}"
      essential    = true
      portMappings = [{ containerPort = local.container_port, protocol = "tcp" }]
      stopTimeout  = var.stop_timeout_seconds
      environment  = local.container_environment
      secrets      = local.container_secrets

      # The container is unhealthy unless its own server answers /api/health, so a task that starts
      # but does not serve counts as failed.
      healthCheck = {
        command = [
          "CMD",
          "node",
          "-e",
          "fetch('http://127.0.0.1:${local.container_port}/api/health').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))",
        ]
        interval    = 15
        timeout     = 5
        retries     = 3
        startPeriod = var.health_check_grace_period_seconds
      }

      # A log store that is slow to accept lines never blocks the server.
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.app.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "frontend"
          mode                  = "non-blocking"
        }
      }
    },
  ])

  lifecycle {
    precondition {
      condition     = length(local.unknown_values) == 0
      error_message = "Every key of environment_values and environment_overrides must be an entry of task-environment.json whose source is \"value\". Not such an entry: ${join(", ", local.unknown_values)}."
    }

    precondition {
      condition     = length(local.missing_values) == 0
      error_message = "Every entry of task-environment.json whose source is \"value\" needs a value in environment_values or environment_overrides, unless omit_environment names it. Missing: ${join(", ", local.missing_values)}."
    }

    precondition {
      condition     = length(local.unknown_omitted) == 0
      error_message = "Every name in omit_environment must be an entry of task-environment.json. Not an entry: ${join(", ", local.unknown_omitted)}."
    }
  }
}

# A rollout starts the new tasks before it stops the old ones, and a rollout whose tasks do not
# become healthy is rolled back to the last one that completed. The service's tags reach its tasks,
# so that the tasks' cost is attributed by tag.
resource "aws_ecs_service" "app" {
  name                               = "${local.name}-frontend"
  cluster                            = aws_ecs_cluster.this.id
  task_definition                    = aws_ecs_task_definition.app.arn
  launch_type                        = "FARGATE"
  desired_count                      = var.task_floor
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  health_check_grace_period_seconds  = var.health_check_grace_period_seconds
  wait_for_steady_state              = true
  propagate_tags                     = "SERVICE"
  enable_ecs_managed_tags            = true

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  # With no NAT gateway, a task reaches the internet only through a public address of its own.
  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.task.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = local.container_name
    container_port   = local.container_port
  }

  # The number of tasks belongs to the scaling that runs between applies, not to this resource.
  lifecycle {
    ignore_changes = [desired_count]
  }

  depends_on = [aws_lb_listener_rule.from_cloudfront]
}
