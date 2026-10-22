# Deferred items: phase 183

## Local `init -backend=false` fails in a root the operator has initialised (found in 183-17, 2026-10-22)

- **What happens:** once the operator has run `terraform init` with the S3 backend in a root, the
  root's `.terraform/terraform.tfstate` records that backend. A later executor-side
  `terraform init -backend=false` in the same checkout then tries to reach the backend and fails
  without a credential (`No valid credential sources found`).
- **What 183-17 changed:** its own verify commands now give init and validate a throwaway
  `TF_DATA_DIR`.
- **Still to check:** plans 183-21, 183-23, 183-24, 183-25 and 183-27 also run
  `init -backend=false`. Any of them that runs against a root the operator has already initialised
  (`infra/bootstrap`, `infra/envs/staging/dns-mail`, or a later one) needs the same change.
