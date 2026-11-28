# The number of tasks between applies belongs to Application Auto Scaling: it holds the service between the floor and the ceiling and follows the tasks' average CPU.
resource "aws_appautoscaling_target" "service" {
  service_namespace  = "ecs"
  scalable_dimension = "ecs:service:DesiredCount"
  resource_id        = "service/${aws_ecs_cluster.this.name}/${aws_ecs_service.app.name}"
  min_capacity       = var.task_floor
  max_capacity       = var.task_ceiling
}

# Target tracking adds tasks quickly and removes them slowly.
resource "aws_appautoscaling_policy" "cpu" {
  name               = "${local.name}-frontend-cpu"
  policy_type        = "TargetTrackingScaling"
  service_namespace  = aws_appautoscaling_target.service.service_namespace
  scalable_dimension = aws_appautoscaling_target.service.scalable_dimension
  resource_id        = aws_appautoscaling_target.service.resource_id

  target_tracking_scaling_policy_configuration {
    target_value       = var.cpu_target_percent
    scale_in_cooldown  = 300
    scale_out_cooldown = 60

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}

# One action per timed change of the bounds, such as a raised floor ahead of a known peak and its lowering afterwards. An action changes the scalable target's bounds outside Terraform, so a plan made between a raising and a lowering action shows the minimum as drift, and no apply is made inside such a window.
resource "aws_appautoscaling_scheduled_action" "floor" {
  for_each = { for c in var.scheduled_floor_changes : c.name => c }

  name               = "${local.name}-frontend-${each.key}"
  service_namespace  = aws_appautoscaling_target.service.service_namespace
  scalable_dimension = aws_appautoscaling_target.service.scalable_dimension
  resource_id        = aws_appautoscaling_target.service.resource_id
  schedule           = each.value.schedule
  timezone           = var.schedule_timezone

  scalable_target_action {
    min_capacity = each.value.min_capacity
    max_capacity = each.value.max_capacity
  }
}
