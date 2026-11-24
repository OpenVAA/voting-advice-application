# Plans the bootstrap root offline against a mock AWS provider, to hold each deployment's names apart from every other's and staging's names unchanged. No backend is read. Mocks never report a replacement, so the proof that the per-deployment layout replaces nothing is infra/scripts/check-bootstrap-moves.sh, not this file.

# A run that sets deployments replaces the whole map that deployments.auto.tfvars.json loads, so every such run writes staging's entry verbatim beside the stand-in. The stand-in has no environment and trusts its deploy branch by ref subject.

# The mocks' generated values are random strings. The provider checks some of the arguments that receive them, so the policy documents, the SSM key alias and the resources whose ARNs feed such an argument get values of the right form.
mock_provider "aws" {
  mock_data "aws_iam_policy_document" {
    defaults = {
      json = "{\"Version\":\"2012-10-17\",\"Statement\":[]}"
    }
  }

  mock_data "aws_kms_alias" {
    defaults = {
      target_key_arn = "arn:aws:kms:eu-north-1:471112560111:key/00000000-0000-0000-0000-000000000000"
    }
  }

  mock_resource "aws_iam_policy" {
    defaults = {
      arn = "arn:aws:iam::471112560111:policy/openvaa/mock"
    }
  }

  mock_resource "aws_iam_role" {
    defaults = {
      arn = "arn:aws:iam::471112560111:role/openvaa/mock"
    }
  }

  mock_resource "aws_iam_openid_connect_provider" {
    defaults = {
      arn = "arn:aws:iam::471112560111:oidc-provider/token.actions.githubusercontent.com"
    }
  }

  mock_resource "aws_s3_bucket" {
    defaults = {
      arn = "arn:aws:s3:::openvaa-tfstate-471112560111"
    }
  }

  mock_resource "aws_ecr_repository" {
    defaults = {
      arn = "arn:aws:ecr:eu-north-1:471112560111:repository/openvaa-frontend"
    }
  }
}

variables {
  alert_email = "alerts@example.org"
}

run "staging_names" {
  command = plan

  assert {
    condition     = module.github_oidc["staging"].plan_role_name == "openvaa-plan"
    error_message = "Staging's plan role must be named openvaa-plan."
  }

  assert {
    condition     = module.github_oidc["staging"].deploy_role_name == "openvaa-staging-deploy"
    error_message = "Staging's deploy role must be named openvaa-staging-deploy."
  }

  assert {
    condition = module.github_oidc["staging"].policy_names == {
      tfstate_pipeline      = "openvaa-tfstate-staging-aws"
      ecr_push              = "openvaa-ecr-push"
      plan_deny             = "openvaa-plan-deny"
      deploy_alert          = "openvaa-deploy-alert"
      deploy_network        = "openvaa-deploy-network"
      deploy_load_balancing = "openvaa-deploy-load-balancing"
      deploy_ecs            = "openvaa-deploy-ecs"
      deploy_pass_role      = "openvaa-deploy-pass-role"
      deploy_edge           = "openvaa-deploy-edge"
      deploy_dns            = "openvaa-deploy-dns"
      deploy_observability  = "openvaa-deploy-observability"
      deploy_scaling        = "openvaa-deploy-scaling"
    }
    error_message = "Every policy of staging must keep its name."
  }

  assert {
    condition     = module.frontend_task_role["staging"].execution_role_name == "openvaa-staging-frontend-execution"
    error_message = "Staging's execution role must be named openvaa-staging-frontend-execution."
  }

  assert {
    condition     = module.registry["staging"].repository_name == "openvaa-frontend"
    error_message = "Staging's image repository must be named openvaa-frontend."
  }

  assert {
    condition     = module.budget.budget_name == "openvaa-monthly"
    error_message = "The account's budget must be named openvaa-monthly."
  }

  assert {
    condition     = keys(output.deployments) == ["staging"]
    error_message = "The committed map must hold staging as its only deployment."
  }
}

run "second_entry_is_apart" {
  command = plan

  variables {
    deployments = {
      staging = {
        github_repository_id       = "546467466"
        github_repository_owner_id = "115159211"
        plan_subjects              = ["repo:OpenVAA/voting-advice-application:pull_request"]
        deploy_subjects = [
          "repo:OpenVAA/voting-advice-application:environment:staging",
          "repo:OpenVAA/voting-advice-application:environment:staging-destroy",
        ]
        deploy_branches     = ["deploy/staging", "deploy-evidence/*"]
        hosted_zone_id      = "Z02494181MAM7OCUAIPKC"
        domain              = "staging.openvaa.org"
        environment         = "staging"
        destroy_environment = "staging-destroy"
        registry_name       = "openvaa-frontend"
        iam_name_prefix     = "openvaa"
      }
      "nuorten-2027" = {
        github_repository_id       = "7654321"
        github_repository_owner_id = "1234567"
        plan_subjects              = ["repo:EXAMPLE-ORG@1234567/EXAMPLE-REPO@7654321:pull_request"]
        deploy_subjects            = ["repo:EXAMPLE-ORG@1234567/EXAMPLE-REPO@7654321:ref:refs/heads/deploy/nuorten-2027"]
        deploy_branches            = ["deploy/nuorten-2027"]
        hosted_zone_id             = "Z00000000000000000000"
        domain                     = "vaa.example.org"
      }
    }
  }

  assert {
    condition     = module.github_oidc["staging"].plan_role_name == "openvaa-plan"
    error_message = "Staging's plan role must be named openvaa-plan."
  }

  assert {
    condition     = module.github_oidc["staging"].deploy_role_name == "openvaa-staging-deploy"
    error_message = "Staging's deploy role must be named openvaa-staging-deploy."
  }

  assert {
    condition = module.github_oidc["staging"].policy_names == {
      tfstate_pipeline      = "openvaa-tfstate-staging-aws"
      ecr_push              = "openvaa-ecr-push"
      plan_deny             = "openvaa-plan-deny"
      deploy_alert          = "openvaa-deploy-alert"
      deploy_network        = "openvaa-deploy-network"
      deploy_load_balancing = "openvaa-deploy-load-balancing"
      deploy_ecs            = "openvaa-deploy-ecs"
      deploy_pass_role      = "openvaa-deploy-pass-role"
      deploy_edge           = "openvaa-deploy-edge"
      deploy_dns            = "openvaa-deploy-dns"
      deploy_observability  = "openvaa-deploy-observability"
      deploy_scaling        = "openvaa-deploy-scaling"
    }
    error_message = "Every policy of staging must keep its name."
  }

  assert {
    condition     = module.frontend_task_role["staging"].execution_role_name == "openvaa-staging-frontend-execution"
    error_message = "Staging's execution role must be named openvaa-staging-frontend-execution."
  }

  assert {
    condition     = module.registry["staging"].repository_name == "openvaa-frontend"
    error_message = "Staging's image repository must be named openvaa-frontend."
  }

  assert {
    condition     = module.budget.budget_name == "openvaa-monthly"
    error_message = "The account's budget must be named openvaa-monthly."
  }

  assert {
    condition     = module.github_oidc["nuorten-2027"].plan_role_name == "openvaa-nuorten-2027-plan"
    error_message = "The second deployment's plan role must be named openvaa-nuorten-2027-plan."
  }

  assert {
    condition     = module.github_oidc["nuorten-2027"].deploy_role_name == "openvaa-nuorten-2027-deploy"
    error_message = "The second deployment's deploy role must be named openvaa-nuorten-2027-deploy."
  }

  assert {
    condition = alltrue([
      for k, n in module.github_oidc["nuorten-2027"].policy_names : startswith(n, "openvaa-nuorten-2027-") if k != "tfstate_pipeline"
    ])
    error_message = "Every policy of the second deployment but its state policy must take the prefix openvaa-nuorten-2027-."
  }

  assert {
    condition     = module.github_oidc["nuorten-2027"].policy_names.tfstate_pipeline == "openvaa-tfstate-nuorten-2027-aws"
    error_message = "The second deployment's state policy must be named openvaa-tfstate-nuorten-2027-aws."
  }

  assert {
    condition     = module.frontend_task_role["nuorten-2027"].execution_role_name == "openvaa-nuorten-2027-frontend-execution"
    error_message = "The second deployment's execution role must be named openvaa-nuorten-2027-frontend-execution."
  }

  assert {
    condition     = module.registry["nuorten-2027"].repository_name == "openvaa-nuorten-2027-frontend"
    error_message = "The second deployment's image repository must be named openvaa-nuorten-2027-frontend."
  }

  assert {
    condition = length(distinct(flatten([
      for k in ["staging", "nuorten-2027"] : concat(
        [module.github_oidc[k].plan_role_name, module.github_oidc[k].deploy_role_name, module.frontend_task_role[k].execution_role_name],
        values(module.github_oidc[k].policy_names),
      )
    ]))) == 2 * (3 + 12)
    error_message = "No role or policy name may belong to both deployments."
  }

  assert {
    condition     = module.registry["staging"].repository_name != module.registry["nuorten-2027"].repository_name
    error_message = "The two deployments must have image repositories of their own."
  }

  assert {
    condition     = toset(keys(output.deployments)) == toset(["staging", "nuorten-2027"])
    error_message = "The deployments output must hold both entries."
  }
}

run "refuses_a_key_over_fifteen_characters" {
  command = plan

  variables {
    deployments = {
      staging = {
        github_repository_id       = "546467466"
        github_repository_owner_id = "115159211"
        plan_subjects              = ["repo:OpenVAA/voting-advice-application:pull_request"]
        deploy_subjects = [
          "repo:OpenVAA/voting-advice-application:environment:staging",
          "repo:OpenVAA/voting-advice-application:environment:staging-destroy",
        ]
        deploy_branches     = ["deploy/staging", "deploy-evidence/*"]
        hosted_zone_id      = "Z02494181MAM7OCUAIPKC"
        domain              = "staging.openvaa.org"
        environment         = "staging"
        destroy_environment = "staging-destroy"
        registry_name       = "openvaa-frontend"
        iam_name_prefix     = "openvaa"
      }
      "nuorten-20270000" = {
        github_repository_id       = "7654321"
        github_repository_owner_id = "1234567"
        plan_subjects              = ["repo:EXAMPLE-ORG@1234567/EXAMPLE-REPO@7654321:pull_request"]
        deploy_subjects            = ["repo:EXAMPLE-ORG@1234567/EXAMPLE-REPO@7654321:ref:refs/heads/deploy/nuorten-2027"]
        deploy_branches            = ["deploy/nuorten-2027"]
        hosted_zone_id             = "Z00000000000000000000"
        domain                     = "vaa.example.org"
      }
    }
  }

  expect_failures = [var.deployments]
}

run "refuses_a_malformed_key" {
  command = plan

  variables {
    deployments = {
      staging = {
        github_repository_id       = "546467466"
        github_repository_owner_id = "115159211"
        plan_subjects              = ["repo:OpenVAA/voting-advice-application:pull_request"]
        deploy_subjects = [
          "repo:OpenVAA/voting-advice-application:environment:staging",
          "repo:OpenVAA/voting-advice-application:environment:staging-destroy",
        ]
        deploy_branches     = ["deploy/staging", "deploy-evidence/*"]
        hosted_zone_id      = "Z02494181MAM7OCUAIPKC"
        domain              = "staging.openvaa.org"
        environment         = "staging"
        destroy_environment = "staging-destroy"
        registry_name       = "openvaa-frontend"
        iam_name_prefix     = "openvaa"
      }
      "Nuorten_2027" = {
        github_repository_id       = "7654321"
        github_repository_owner_id = "1234567"
        plan_subjects              = ["repo:EXAMPLE-ORG@1234567/EXAMPLE-REPO@7654321:pull_request"]
        deploy_subjects            = ["repo:EXAMPLE-ORG@1234567/EXAMPLE-REPO@7654321:ref:refs/heads/deploy/nuorten-2027"]
        deploy_branches            = ["deploy/nuorten-2027"]
        hosted_zone_id             = "Z00000000000000000000"
        domain                     = "vaa.example.org"
      }
    }
  }

  expect_failures = [var.deployments]
}

run "refuses_a_shared_domain" {
  command = plan

  variables {
    deployments = {
      staging = {
        github_repository_id       = "546467466"
        github_repository_owner_id = "115159211"
        plan_subjects              = ["repo:OpenVAA/voting-advice-application:pull_request"]
        deploy_subjects = [
          "repo:OpenVAA/voting-advice-application:environment:staging",
          "repo:OpenVAA/voting-advice-application:environment:staging-destroy",
        ]
        deploy_branches     = ["deploy/staging", "deploy-evidence/*"]
        hosted_zone_id      = "Z02494181MAM7OCUAIPKC"
        domain              = "staging.openvaa.org"
        environment         = "staging"
        destroy_environment = "staging-destroy"
        registry_name       = "openvaa-frontend"
        iam_name_prefix     = "openvaa"
      }
      "nuorten-2027" = {
        github_repository_id       = "7654321"
        github_repository_owner_id = "1234567"
        plan_subjects              = ["repo:EXAMPLE-ORG@1234567/EXAMPLE-REPO@7654321:pull_request"]
        deploy_subjects            = ["repo:EXAMPLE-ORG@1234567/EXAMPLE-REPO@7654321:ref:refs/heads/deploy/nuorten-2027"]
        deploy_branches            = ["deploy/nuorten-2027"]
        hosted_zone_id             = "Z00000000000000000000"
        domain                     = "staging.openvaa.org"
      }
    }
  }

  expect_failures = [var.deployments]
}

run "refuses_a_shared_subject" {
  command = plan

  variables {
    deployments = {
      staging = {
        github_repository_id       = "546467466"
        github_repository_owner_id = "115159211"
        plan_subjects              = ["repo:OpenVAA/voting-advice-application:pull_request"]
        deploy_subjects = [
          "repo:OpenVAA/voting-advice-application:environment:staging",
          "repo:OpenVAA/voting-advice-application:environment:staging-destroy",
        ]
        deploy_branches     = ["deploy/staging", "deploy-evidence/*"]
        hosted_zone_id      = "Z02494181MAM7OCUAIPKC"
        domain              = "staging.openvaa.org"
        environment         = "staging"
        destroy_environment = "staging-destroy"
        registry_name       = "openvaa-frontend"
        iam_name_prefix     = "openvaa"
      }
      "nuorten-2027" = {
        github_repository_id       = "7654321"
        github_repository_owner_id = "1234567"
        plan_subjects              = ["repo:OpenVAA/voting-advice-application:pull_request"]
        deploy_subjects            = ["repo:EXAMPLE-ORG@1234567/EXAMPLE-REPO@7654321:ref:refs/heads/deploy/nuorten-2027"]
        deploy_branches            = ["deploy/nuorten-2027"]
        hosted_zone_id             = "Z00000000000000000000"
        domain                     = "vaa.example.org"
      }
    }
  }

  expect_failures = [var.deployments]
}

run "refuses_a_wildcard_branch_without_environment" {
  command = plan

  variables {
    deployments = {
      staging = {
        github_repository_id       = "546467466"
        github_repository_owner_id = "115159211"
        plan_subjects              = ["repo:OpenVAA/voting-advice-application:pull_request"]
        deploy_subjects = [
          "repo:OpenVAA/voting-advice-application:environment:staging",
          "repo:OpenVAA/voting-advice-application:environment:staging-destroy",
        ]
        deploy_branches     = ["deploy/staging", "deploy-evidence/*"]
        hosted_zone_id      = "Z02494181MAM7OCUAIPKC"
        domain              = "staging.openvaa.org"
        environment         = "staging"
        destroy_environment = "staging-destroy"
        registry_name       = "openvaa-frontend"
        iam_name_prefix     = "openvaa"
      }
      "nuorten-2027" = {
        github_repository_id       = "7654321"
        github_repository_owner_id = "1234567"
        plan_subjects              = ["repo:EXAMPLE-ORG@1234567/EXAMPLE-REPO@7654321:pull_request"]
        deploy_subjects            = ["repo:EXAMPLE-ORG@1234567/EXAMPLE-REPO@7654321:ref:refs/heads/deploy/nuorten-2027"]
        deploy_branches            = ["deploy/*"]
        hosted_zone_id             = "Z00000000000000000000"
        domain                     = "vaa.example.org"
      }
    }
  }

  expect_failures = [var.deployments]
}

run "refuses_a_branch_without_its_ref_subject" {
  command = plan

  variables {
    deployments = {
      staging = {
        github_repository_id       = "546467466"
        github_repository_owner_id = "115159211"
        plan_subjects              = ["repo:OpenVAA/voting-advice-application:pull_request"]
        deploy_subjects = [
          "repo:OpenVAA/voting-advice-application:environment:staging",
          "repo:OpenVAA/voting-advice-application:environment:staging-destroy",
        ]
        deploy_branches     = ["deploy/staging", "deploy-evidence/*"]
        hosted_zone_id      = "Z02494181MAM7OCUAIPKC"
        domain              = "staging.openvaa.org"
        environment         = "staging"
        destroy_environment = "staging-destroy"
        registry_name       = "openvaa-frontend"
        iam_name_prefix     = "openvaa"
      }
      "nuorten-2027" = {
        github_repository_id       = "7654321"
        github_repository_owner_id = "1234567"
        plan_subjects              = ["repo:EXAMPLE-ORG@1234567/EXAMPLE-REPO@7654321:pull_request"]
        deploy_subjects            = ["repo:EXAMPLE-ORG@1234567/EXAMPLE-REPO@7654321:ref:refs/heads/main"]
        deploy_branches            = ["deploy/nuorten-2027"]
        hosted_zone_id             = "Z00000000000000000000"
        domain                     = "vaa.example.org"
      }
    }
  }

  expect_failures = [var.deployments]
}

run "refuses_an_environment_without_its_subject" {
  command = plan

  variables {
    deployments = {
      staging = {
        github_repository_id       = "546467466"
        github_repository_owner_id = "115159211"
        plan_subjects              = ["repo:OpenVAA/voting-advice-application:pull_request"]
        deploy_subjects = [
          "repo:OpenVAA/voting-advice-application:environment:staging",
          "repo:OpenVAA/voting-advice-application:environment:staging-destroy",
        ]
        deploy_branches     = ["deploy/staging", "deploy-evidence/*"]
        hosted_zone_id      = "Z02494181MAM7OCUAIPKC"
        domain              = "staging.openvaa.org"
        environment         = "staging"
        destroy_environment = "staging-destroy"
        registry_name       = "openvaa-frontend"
        iam_name_prefix     = "openvaa"
      }
      "nuorten-2027" = {
        github_repository_id       = "7654321"
        github_repository_owner_id = "1234567"
        plan_subjects              = ["repo:EXAMPLE-ORG@1234567/EXAMPLE-REPO@7654321:pull_request"]
        deploy_subjects            = ["repo:EXAMPLE-ORG@1234567/EXAMPLE-REPO@7654321:ref:refs/heads/deploy/nuorten-2027"]
        deploy_branches            = ["deploy/nuorten-2027"]
        hosted_zone_id             = "Z00000000000000000000"
        domain                     = "vaa.example.org"
        environment                = "nuorten-2027"
      }
    }
  }

  expect_failures = [var.deployments]
}
